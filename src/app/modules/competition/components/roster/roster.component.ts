import { t } from '../../../../core/i18n/traduire';
import { TranslateModule } from '@ngx-translate/core';
import {
  Component, EventEmitter, Input, OnInit, Output, inject, signal, computed
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { HttpClient }    from '@angular/common/http';
import { environment } from '../../../../environment';
import { partagerLien, urlApplication } from '../../../../core/utils/partage';
import { AuthService } from '../../../../core/services/auth.service';


interface MembreRoster {
  id:        number;
  joueurId?: number;
  nom:       string;
  prenom?:   string;
  photoUrl?: string;
  numeroDos?: number;
  poste?:    string;
  role:      string;
  statut:    string;
  dateNaissance?: string;
  nationalite?:   string;
  telephone?:     string;
  /** Fiche complète pour la licence ? Sinon, ce qu'il manque. */
  complet?:          boolean;
  champsManquants?:  string[];
  /** Photo d'identité exigée par la compétition et pas encore téléversée */
  photoManquante?:   boolean;
}

interface MembreMy20 {
  id:        number;   // Membre.id
  nom:       string;
  prenom?:   string;
  photoUrl?: string;   // photo de profil : sert à reconnaître le membre dans la liste, JAMAIS à la licence
  numeroDos?: number;
  poste?:    string;
  dateNaissance?: string;
  tel?:      string;
}

interface FormJoueur {
  id:            number | null;   // renseigné en modification
  membreId:      number | null;   // renseigné pour un membre My2-0
  nom:           string;
  prenom:        string;
  dateNaissance: string;          // AAAA-MM-JJ
  nationalite:   string;
  poste:         string;
  numeroDos:     number | null;
  role:          string;
  telephone:     string;
}

const FORM_VIDE: FormJoueur = {
  id: null, membreId: null, nom: '', prenom: '', dateNaissance: '',
  nationalite: '', poste: '', numeroDos: null, role: 'JOUEUR', telephone: ''
};

@Component({
  selector:    'app-roster',
  standalone:  true,
  imports: [TranslateModule, CommonModule, FormsModule],
  templateUrl: './roster.component.html',
  styleUrls:   ['./roster.component.scss']
})
export class RosterComponent implements OnInit {
  @Input() competitionId!: number;
  @Input() participantId!: number;
  @Input() canEdit = false;
  /**
   * Racine des appels « joueurs » : par défaut la gestion connectée, ou /public/equipe/{jeton}
   * pour une équipe gérée par lien sans compte (mêmes routes, mêmes règles).
   */
  @Input() apiBase?: string;
  /** Émis après chaque modification de l'effectif (le tableau de bord de l'équipe se met à jour). */
  @Output() changed = new EventEmitter<void>();

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.apiUrl}/competitions`;

  private racine(): string {
    return this.apiBase ?? `${this.base}/${this.competitionId}/participants/${this.participantId}/joueurs`;
  }

  // ── Signals ───────────────────────────────────────────────
  isGroupe20    = signal(false);   // true si le participant est un groupe My2-0
  roster        = signal<MembreRoster[]>([]);
  membresMy20   = signal<MembreMy20[]>([]);
  /** Groupes 2-0 dans lesquels piocher : celui de l'équipe (si elle en a un) et ceux de la personne connectée. */
  groupesSource = signal<{ id: number; nom: string }[]>([]);
  groupeChoisi  = signal<number | null>(null);
  loading       = signal(true);
  saving        = signal(false);
  showForm      = signal(false);
  mode          = signal<'my20' | 'formulaire' | 'inviter' | 'import' | 'reprise'>('formulaire');
  sourcesReprise = signal<{ participantId: number; competitionNom?: string; nomEquipe: string; nbMembres: number }[]>([]);
  message       = signal<string | null>(null);
  rapport       = signal<{ creees: number; aCompleter: number; rejetees: string[] } | null>(null);
  texteImport   = '';
  searchQuery   = signal('');
  erreur        = signal<string | null>(null);
  photoEnCours  = signal<number | null>(null);   // id du joueur dont la photo est en cours d'envoi

  // Formulaire joueur (ajout, ajout depuis un membre My2-0, modification)
  form: FormJoueur = { ...FORM_VIDE };

  readonly aujourdhui = new Date().toISOString().slice(0, 10);

  // Membres déjà dans le roster → ne pas proposer à nouveau
  dejaDansRoster = computed(() =>
    new Set(this.roster()
      .filter(r => r.joueurId != null)
      .map(r => r.joueurId!))
  );

  membresFiltres = computed(() => {
    const q    = this.searchQuery().toLowerCase();
    const deja = this.dejaDansRoster();
    return this.membresMy20()
      .filter(m => !deja.has(m.id))
      .filter(m =>
        !q ||
        m.nom?.toLowerCase().includes(q) ||
        m.prenom?.toLowerCase().includes(q)
      );
  });

  readonly roles = [
    'JOUEUR', 'GARDIEN', 'CAPITAINE',
    'ENTRAINEUR', 'ASSISTANT_COACH', 'MEDECIN', 'DIRIGEANT'
  ];
  readonly postes = ['GARDIEN', 'DEFENSEUR', 'MILIEU', 'ATTAQUANT'];

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.chargerRoster();
    this.chargerSourcesReprise();
    this.chargerMembresMy20();
  }

  // ── Charger le roster de la compétition ──────────────────
  chargerRoster(): void {
    this.loading.set(true);
    this.http.get<MembreRoster[]>(this.racine()).subscribe({
      next: (r: MembreRoster[]) => { this.roster.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  // ── Membres My2-0 à piocher ────────────────────────────────
  /**
   * Le bouton « Ajouter depuis mon 2-0 » apparaît dès qu'il y a un groupe où piocher : le groupe de l'équipe (si elle
   * est inscrite sous un groupe My2-0) et/ou les groupes de la personne connectée. Une équipe inscrite sous un nom
   * saisi à la main peut donc aussi recruter dans le 2-0 de son responsable.
   */
  chargerMembresMy20(): void {
    if (this.apiBase) return;   // accès par lien : pas de compte, donc pas de liste de membres My2-0

    const groupes: { id: number; nom: string }[] = [];
    const ajouter = (id: number | null | undefined, nom: string) => {
      if (id && !groupes.some(g => g.id === id)) groupes.push({ id, nom });
    };
    try {
      this.auth.getMesGroupesCache().forEach(g => ajouter(g.groupeId, g.nom));
    } catch { /* cache indisponible : on se contente du groupe de l'équipe */ }

    this.http.get<any>(`${environment.apiUrl}/competitions/${this.competitionId}/participants/${this.participantId}`).subscribe({
      next: participant => {
        const clubId = participant?.clubId ?? participant?.groupeId;
        if (clubId) ajouter(clubId, participant.nomEquipe ?? 'Groupe de l\'équipe');
        // le groupe de l'équipe passe en premier
        if (clubId) groupes.sort((a, b) => (a.id === clubId ? -1 : 0) - (b.id === clubId ? -1 : 0));
        this.initialiserGroupes(groupes);
      },
      error: () => this.initialiserGroupes(groupes)
    });
  }

  private initialiserGroupes(groupes: { id: number; nom: string }[]): void {
    this.groupesSource.set(groupes);
    this.isGroupe20.set(groupes.length > 0);
    if (groupes.length) this.choisirGroupe(groupes[0].id);
  }

  choisirGroupe(id: number | null): void {
    if (!id) return;
    this.groupeChoisi.set(id);
    this.membresMy20.set([]);
    this.http.get<any[]>(`${environment.apiUrl}/membres/groupe/${id}`).subscribe({
      next: membres => {
        this.membresMy20.set((membres ?? [])
          .filter((m: any) => m && m.id)
          .map((m: any) => ({
            id:        m.id,
            nom:       m.nom ?? '',
            prenom:    m.prenom,
            // photo de profil : uniquement pour reconnaître la personne dans la liste
            photoUrl:  m.photoUrl ?? m.photo ?? m.user?.profilePhotoUrl,
            numeroDos: m.numeroDos,
            poste:     m.poste,
            dateNaissance: m.dateNaissance,
            tel:       m.tel
          })));
      },
      error: () => this.membresMy20.set([])
    });
  }

  // ── Formulaire ────────────────────────────────────────────
  estJoueurRole(role: string): boolean {
    return ['JOUEUR', 'GARDIEN', 'CAPITAINE'].includes(role);
  }

  ouvrirAjout(): void {
    this.form = { ...FORM_VIDE };
    this.erreur.set(null);
    this.mode.set('formulaire');
    this.showForm.set(true);
  }

  ouvrirListeMembres(): void {
    this.erreur.set(null);
    this.mode.set('my20');
    this.showForm.set(true);
  }

  /** Un membre My2-0 pré-remplit le formulaire ; le reste (nationalité, n° de dos...) se complète. */
  ouvrirDepuisMembre(m: MembreMy20): void {
    this.form = {
      ...FORM_VIDE,
      membreId: m.id,
      nom: m.nom ?? '',
      prenom: m.prenom ?? '',
      dateNaissance: (m.dateNaissance ?? '').slice(0, 10),
      poste: this.normaliserPoste(m.poste),
      telephone: m.tel ?? '',
      numeroDos: m.numeroDos ?? null
    };
    this.erreur.set(null);
    this.mode.set('formulaire');
  }

  ouvrirEdition(r: MembreRoster): void {
    this.form = {
      id: r.id, membreId: null,
      nom: r.nom ?? '', prenom: r.prenom ?? '',
      dateNaissance: (r.dateNaissance ?? '').slice(0, 10),
      nationalite: r.nationalite ?? '',
      poste: r.poste ?? '',
      numeroDos: r.numeroDos ?? null,
      role: r.role,
      telephone: r.telephone ?? ''
    };
    this.erreur.set(null);
    this.mode.set('formulaire');
    this.showForm.set(true);
  }

  fermerForm(): void {
    this.showForm.set(false);
    this.erreur.set(null);
    this.form = { ...FORM_VIDE };
  }

  private normaliserPoste(poste?: string): string {
    const p = (poste ?? '').toUpperCase();
    return this.postes.find(x => p.startsWith(x.slice(0, 4))) ?? '';
  }

  /** Informations encore à renseigner avant de pouvoir enregistrer (affichées sous le formulaire). */
  champsManquants(): string[] {
    const f = this.form;
    const manque: string[] = [];
    if (!f.nom.trim())    manque.push('nom');
    if (!f.prenom.trim()) manque.push('prénom');
    if (this.estJoueurRole(f.role)) {
      if (!f.dateNaissance)       manque.push('date de naissance');
      if (!f.nationalite.trim())  manque.push('nationalité');
      if (!f.poste)               manque.push('poste');
      // le dorsal est facultatif (football amateur) ; s'il est renseigné il doit être valide
      if (f.numeroDos != null && f.numeroDos !== ('' as any) && (f.numeroDos < 1 || f.numeroDos > 99)) manque.push('numéro de dos valide (1 à 99, ou vide)');
    }
    return manque;
  }

  enregistrer(): void {
    if (this.champsManquants().length || this.saving()) return;
    this.saving.set(true);
    this.erreur.set(null);

    const f = this.form;
    const corps: any = {
      nom: f.nom.trim(), prenom: f.prenom.trim(), role: f.role,
      dateNaissance: f.dateNaissance || null,
      nationalite: f.nationalite.trim() || null,
      poste: f.poste || null, numeroDos: f.numeroDos,
      telephone: f.telephone.trim() || null
    };
    const url = this.racine();

    const requete = f.id != null
      ? this.http.patch<MembreRoster>(`${url}/${f.id}`, corps)
      : this.http.post<MembreRoster>(url, { ...corps, membreId: f.membreId });

    requete.subscribe({
      next: r => {
        this.roster.update(list => f.id != null
          ? list.map(x => x.id === r.id ? r : x)
          : [...list, r]);
        this.saving.set(false);
        this.fermerForm();
        this.changed.emit();
      },
      error: err => {
        this.erreur.set(err?.error?.message ?? 'Enregistrement impossible');
        this.saving.set(false);
      }
    });
  }

  // ── Photo d'identité (distincte de la photo de profil) ────
  onPhotoChoisie(event: Event, r: MembreRoster): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    input.value = '';                      // permet de rechoisir le même fichier
    if (!fichier) return;
    if (fichier.size > 5 * 1024 * 1024) { alert(t('ui.ts_la_photo_ne_doit_pas_depasser_5__e18a')); return; }

    this.photoEnCours.set(r.id);
    const donnees = new FormData();
    donnees.append('file', fichier);
    this.http.post<MembreRoster>(`${this.racine()}/${r.id}/photo`, donnees).subscribe({
      next: maj => {
        this.roster.update(list => list.map(x => x.id === maj.id ? maj : x));
        this.photoEnCours.set(null);
        this.changed.emit();
      },
      error: err => {
        alert(err?.error?.message ?? 'Envoi de la photo impossible');
        this.photoEnCours.set(null);
      }
    });
  }

  // ── Retirer du roster ─────────────────────────────────────
  retirer(m: MembreRoster): void {
    if (!confirm(`Retirer ${m.nom} du roster ?`)) return;
    this.http.delete(`${this.racine()}/${m.id}`).subscribe(() => {
      this.roster.update(list => list.filter(r => r.id !== m.id));
      this.changed.emit();
    });
  }

  // ── Modifier statut ───────────────────────────────────────
  changerStatut(m: MembreRoster, statut: string): void {
    this.http.patch(`${this.racine()}/${m.id}`, { statut }).subscribe(() => {
      this.roster.update(list =>
        list.map(r => r.id === m.id ? { ...r, statut } : r)
      );
    });
  }

  // ── Inviter : seulement nom, prénom, téléphone — le joueur complète sa fiche lui-même ──
  ouvrirInvitation(): void {
    this.form = { ...FORM_VIDE };
    this.erreur.set(null);
    this.message.set(null);
    this.mode.set('inviter');
    this.showForm.set(true);
  }

  invitationPossible(): boolean {
    return !!this.form.nom.trim() && !!this.form.prenom.trim();
  }

  envoyerInvitation(): void {
    if (!this.invitationPossible() || this.saving()) return;
    this.saving.set(true);
    this.erreur.set(null);
    const f = this.form;
    this.http.post<MembreRoster>(this.racine(), {
      nom: f.nom.trim(), prenom: f.prenom.trim(), role: f.role,
      telephone: f.telephone.trim() || null, invitation: true
    }).subscribe({
      next: r => {
        this.roster.update(list => [...list, r]);
        this.saving.set(false);
        this.changed.emit();
        this.fermerForm();
        this.inviter(r);   // ouvre directement le partage du lien personnel
      },
      error: err => {
        this.erreur.set(err?.error?.message ?? 'Ajout impossible');
        this.saving.set(false);
      }
    });
  }

  /** Envoie au joueur son lien personnel (WhatsApp, SMS...) pour qu'il complète sa fiche et sa photo. */
  inviter(r: MembreRoster): void {
    this.http.get<{ token: string }>(`${this.racine()}/${r.id}/lien-fiche`).subscribe({
      next: async res => {
        const lien = urlApplication(`/fiche/${res.token}`);
        const prenom = r.prenom ?? r.nom;
        const texte = `Bonjour ${prenom}, complète ta fiche joueur (infos + photo) pour la compétition : `;
        const moyen = await partagerLien('Ma fiche joueur', texte, lien);
        if (moyen === 'copie') this.message.set('Lien copié : collez-le dans un message au joueur.');
      },
      error: err => alert(err?.error?.message ?? 'Lien indisponible')
    });
  }

  // ── Reprise de l'effectif d'une compétition précédente ────
  chargerSourcesReprise(): void {
    if (!this.canEdit) return;
    this.http.get<any[]>(`${this.racine()}/reprise`).subscribe({
      next: s => this.sourcesReprise.set(s),
      error: () => this.sourcesReprise.set([])
    });
  }

  ouvrirReprise(): void {
    this.rapport.set(null);
    this.erreur.set(null);
    this.mode.set('reprise');
    this.showForm.set(true);
  }

  reprendre(sourceId: number): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.erreur.set(null);
    this.http.post<{ creees: number; aCompleter: number; rejetees: string[] }>(
      `${this.racine()}/reprise/${sourceId}`, {}
    ).subscribe({
      next: r => {
        this.rapport.set(r);
        this.saving.set(false);
        this.chargerRoster();
        this.changed.emit();
      },
      error: err => {
        this.erreur.set(err?.error?.message ?? 'Reprise impossible');
        this.saving.set(false);
      }
    });
  }

  // ── Import depuis un tableur (copier-coller) ──────────────
  ouvrirImport(): void {
    this.texteImport = '';
    this.rapport.set(null);
    this.erreur.set(null);
    this.mode.set('import');
    this.showForm.set(true);
  }

  /** Colonnes attendues : nom, prénom, date de naissance, nationalité, poste, n° de dos, téléphone. */
  lignesImport(): any[] {
    const lignes = this.texteImport.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const resultat: any[] = [];
    lignes.forEach((ligne, i) => {
      const sep = ligne.includes('\t') ? '\t' : ligne.includes(';') ? ';' : ',';
      const c = ligne.split(sep).map(x => x.trim());
      if (i === 0 && /^nom/i.test(c[0] ?? '')) return;   // ligne d'en-têtes
      const dos = parseInt(c[5] ?? '', 10);
      resultat.push({
        nom: c[0], prenom: c[1], dateNaissance: c[2], nationalite: c[3], poste: c[4],
        numeroDos: Number.isFinite(dos) ? dos : null, telephone: c[6]
      });
    });
    return resultat;
  }

  importer(): void {
    const lignes = this.lignesImport();
    if (!lignes.length || this.saving()) return;
    this.saving.set(true);
    this.erreur.set(null);
    this.http.post<{ creees: number; aCompleter: number; rejetees: string[] }>(
      `${this.racine()}/import`, { lignes }
    ).subscribe({
      next: r => {
        this.rapport.set(r);
        this.saving.set(false);
        this.chargerRoster();
        this.changed.emit();
      },
      error: err => {
        this.erreur.set(err?.error?.message ?? 'Import impossible');
        this.saving.set(false);
      }
    });
  }

  telechargerModele(): void {
    const csv = 'nom;prenom;date de naissance;nationalite;poste;numero;telephone\r\n'
      + 'Mbarga;Paul;14/03/2001;Camerounaise;MILIEU;8;677000000\r\n';
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'modele-effectif.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = {
      ACTIF:        'Actif',
      SUSPENDU:     'Suspendu',
      BLESSE:       t('competition.match.composition.blesse'),
      NON_CONVOQUE: t('competition.match.composition.nonConvoque')
    };
    return m[s] ?? s;
  }

  statutClass(s: string): string {
    const m: Record<string, string> = {
      ACTIF:        'statut-actif',
      SUSPENDU:     'statut-susp',
      BLESSE:       'statut-blesse',
      NON_CONVOQUE: 'statut-nc'
    };
    return m[s] ?? '';
  }

  initiales(m: { nom: string; prenom?: string }): string {
    return ((m.nom?.[0] ?? '') + (m.prenom?.[0] ?? '')).toUpperCase();
  }

  joueurs()  { return this.roster().filter(r =>
    ['JOUEUR','GARDIEN','CAPITAINE'].includes(r.role)); }
  staff()    { return this.roster().filter(r =>
    !['JOUEUR','GARDIEN','CAPITAINE'].includes(r.role)); }

  /** Nombre de fiches à compléter (information manquante ou photo manquante). */
  nbAcompleter(): number {
    return this.joueurs().filter(j => j.complet === false || j.photoManquante).length;
  }
}
