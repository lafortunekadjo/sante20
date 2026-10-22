import { t } from '../../../../core/i18n/traduire';
import { TranslateModule } from '@ngx-translate/core';
import {
  Component, Input, OnInit, inject,
  signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';

interface LicenceDTO {
  id:             number;
  numero:         string;
  nom:            string;
  prenom?:        string;
  categorie?:     string;
  age?:           number;
  dateNaissance?: string;
  photoUrl?:      string;
  statut:         string;
  typeLicence:    string;
  gratuite:       boolean;
  montantPaye?:   number;
  equipeNom?:     string;
  valideeParNom?: string;
  valideeAt?:     string;
  dateExpiration?:string;
  pdfUrl?:        string;
}

interface ConfigLicences {
  licencesActivees:          boolean;
  licencesGratuites:         number;
  montantLicenceSup?:        number;
  blocageFeuilleSansLicence: boolean;
  photoNumerique:            boolean;
  dateFinValiditeLicences?:  string;
  typeLicence:               string;
}

@Component({
  selector:    'app-tab-licences',
  standalone:  true,
  imports: [TranslateModule, CommonModule, FormsModule, MatIconModule],
  templateUrl: './tab-licences.component.html',
  styleUrls:   ['./tab-licences.component.scss']
})
export class TabLicencesComponent implements OnInit {
  @Input() competition!: any;
  @Input() canEdit      = false;
  @Input() canValider   = false;

  private api = inject(CompetitionApiService);

  // ── State ──────────────────────────────────────────────────
  licences         = signal<LicenceDTO[]>([]);
  loading          = signal(true);
  saving           = signal(false);
  generating       = signal(false);

  // Filtres
  filtreEquipe     = signal<string>('');
  filtreStatut     = signal<string>('');
  recherche        = '';

  // Config licences
  config           = signal<ConfigLicences | null>(null);
  editConfig       = signal(false);
  configForm: ConfigLicences = {
    licencesActivees:          false,
    licencesGratuites:         0,
    montantLicenceSup:         undefined,
    blocageFeuilleSansLicence: false,
    photoNumerique:            true,
    dateFinValiditeLicences:   undefined,
    typeLicence:               'INTERNE'
  };

  // Modal ajout
  showAjout        = signal(false);
  ajoutForm = {
    participantId:  null as number | null,
    nom:            '',
    prenom:         '',
    categorie:      '',
    dateNaissance:  '',
    typeLicence:    'INTERNE',
    numeroExterne:  ''
  };

  // Participants pour le select
  participants     = signal<any[]>([]);

  // Messages : joueurs écartés par une opération en masse, erreur de saisie
  rapport          = signal<string[]>([]);
  erreur           = signal<string | null>(null);
  photoEnCours     = signal<number | null>(null);

  // Choix des licences gratuites d'une équipe
  gratuitesEquipe  = signal<string | null>(null);
  gratuitesChoisies = signal<Set<number>>(new Set());
  quotaGratuites   = computed(() => this.config()?.licencesGratuites ?? 0);

  // ── Computed ───────────────────────────────────────────────
  licencesFiltrees = computed(() => {
    let l = this.licences();
    const q = this.recherche.toLowerCase().trim();
    if (q) l = l.filter(x =>
      x.nom.toLowerCase().includes(q)
      || (x.prenom?.toLowerCase().includes(q) ?? false)
      || x.numero.toLowerCase().includes(q)
      || (x.equipeNom?.toLowerCase().includes(q) ?? false)
    );
    if (this.filtreStatut()) l = l.filter(x => x.statut === this.filtreStatut());
    if (this.filtreEquipe()) l = l.filter(x => x.equipeNom === this.filtreEquipe());
    return l;
  });

  statsParStatut = computed(() => {
    const all = this.licences();
    return {
      total:    all.length,
      valide:   all.filter(l => l.statut === 'VALIDE').length,
      attente:  all.filter(l => l.statut === 'ATTENTE').length,
    };
  });

  /** Toutes les équipes engagées (même sans licence : elles ont leur bouton « Générer »), plus celles des licences. */
  equipesDisponibles = computed(() => {
    const set = new Set<string>();
    this.participants()
      .filter(p => p.statutInscription !== 'REJETE' && p.statutInscription !== 'RETIRE')
      .forEach(p => { if (p.nomEquipe) set.add(p.nomEquipe); });
    this.licences().map(l => l.equipeNom).filter(Boolean).forEach(n => set.add(n as string));
    return [...set].sort((a, b) => a.localeCompare(b));
  });

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.charger();
    this.chargerParticipants();
    this.chargerConfig();
  }

  charger(): void {
    this.loading.set(true);
    this.api.getLicences(this.competition.id).subscribe({
      next: l => { this.licences.set(l); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  chargerParticipants(): void {
    this.api.getParticipants(this.competition.id).subscribe({
      next: p => this.participants.set(p)
    });
  }

  chargerConfig(): void {
    this.api.getConfigLicences(this.competition.id).subscribe({
      next: c => {
        this.config.set(c);
        this.configForm = { ...c };
      },
      error: () => {}
    });
  }

  // ── Config ────────────────────────────────────────────────
  ouvrirConfig(): void {
    if (this.config()) this.configForm = { ...this.config()! };
    this.editConfig.set(true);
  }

  sauvegarderConfig(): void {
    this.saving.set(true);
    this.api.updateConfigLicences(this.competition.id, this.configForm).subscribe({
      next: c => {
        this.config.set(c);
        this.editConfig.set(false);
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  // ── Génération en masse ───────────────────────────────────
  // Appelé depuis le template (pas d'arrow function autorisée dans les bindings)
  genererPourEquipeNom(equipeNom: string): void {
    const p = this.participants().find(x => x.nomEquipe === equipeNom);
    if (p) this.genererPourEquipe(p.id);
  }

  getLicencesParEquipe(equipeNom: string): LicenceDTO[] {
    return this.licencesFiltrees().filter(l => l.equipeNom === equipeNom);
  }

  genererPourEquipe(participantId: number): void {
    if (!confirm(t('ui.ts_generer_les_licences_pour_tous_l_3ad9'))) return;
    this.generating.set(true);
    this.api.genererLicencesEquipe(this.competition.id, participantId).subscribe({
      next: (r: any) => { this.rapport.set(r?.ignores ?? []); this.charger(); this.generating.set(false); },
      error: err => { this.rapport.set([err?.error?.message ?? 'Génération impossible']); this.generating.set(false); }
    });
  }

  /**
   * Génère les licences de toutes les équipes, UNE ÉQUIPE APRÈS L'AUTRE : en parallèle, deux équipes pouvaient
   * recevoir le même numéro de licence.
   */
  genererTout(): void {
    if (!confirm(t('ui.ts_generer_les_licences_pour_tous_l_bb29'))) return;
    this.generating.set(true);
    const ignores: string[] = [];
    const equipes = this.participants().filter(p => p.statutInscription !== 'REJETE' && p.statutInscription !== 'RETIRE');
    const suivante = (i: number): void => {
      if (i >= equipes.length) {
        this.rapport.set(ignores);
        this.charger();
        this.generating.set(false);
        return;
      }
      this.api.genererLicencesEquipe(this.competition.id, equipes[i].id).subscribe({
        next: (r: any) => { ignores.push(...(r?.ignores ?? [])); suivante(i + 1); },
        error: err => {
          ignores.push(`${equipes[i].nomEquipe} : ${err?.error?.message ?? 'génération impossible'}`);
          suivante(i + 1);
        }
      });
    };
    suivante(0);
  }

  // ── Ajout manuel ─────────────────────────────────────────
  ajouterLicence(): void {
    if (!this.ajoutForm.nom.trim() || !this.ajoutForm.prenom.trim() || !this.ajoutForm.dateNaissance) return;
    this.saving.set(true);
    this.erreur.set(null);
    this.api.creerLicence(this.competition.id, {
      participantId:  this.ajoutForm.participantId,
      nom:            this.ajoutForm.nom,
      prenom:         this.ajoutForm.prenom,
      categorie:      this.ajoutForm.categorie,
      dateNaissance:  this.ajoutForm.dateNaissance,
      typeLicence:    this.ajoutForm.typeLicence,
      numeroExterne:  this.ajoutForm.typeLicence === 'EXTERNE'
                        ? this.ajoutForm.numeroExterne : undefined
    }).subscribe({
      next: () => {
        this.charger();
        this.showAjout.set(false);
        this.resetAjoutForm();
        this.saving.set(false);
      },
      error: err => {
        this.erreur.set(err?.error?.message ?? 'Création impossible');
        this.saving.set(false);
      }
    });
  }

  resetAjoutForm(): void {
    this.ajoutForm = {
      participantId: null, nom: '', prenom: '',
      categorie: '', dateNaissance: '',
      typeLicence: 'INTERNE', numeroExterne: ''
    };
  }

  // ── Validation ────────────────────────────────────────────
  valider(l: LicenceDTO): void {
    this.api.validerLicence(this.competition.id, l.id).subscribe({
      next: () => this.charger()
    });
  }

  validerToutEquipe(equipeNom: string): void {
    const p = this.participants().find(x => x.nomEquipe === equipeNom);
    if (!p) return;
    this.api.validerToutesLicencesEquipe(this.competition.id, p.id).subscribe({
      next: (r: any) => { this.rapport.set(r?.ignores ?? []); this.charger(); },
      error: err => this.rapport.set([err?.error?.message ?? 'Validation impossible'])
    });
  }

  // ── Licences gratuites : l'organisateur choisit lesquelles, le reste est payant ──
  ouvrirGratuites(equipeNom: string): void {
    const deja = this.licences().filter(l => l.equipeNom === equipeNom && l.gratuite).map(l => l.id);
    this.gratuitesChoisies.set(new Set(deja));
    this.gratuitesEquipe.set(equipeNom);
  }

  basculerGratuite(id: number): void {
    const s = new Set(this.gratuitesChoisies());
    if (s.has(id)) s.delete(id);
    else if (s.size < this.quotaGratuites()) s.add(id);
    this.gratuitesChoisies.set(s);
  }

  enregistrerGratuites(): void {
    const p = this.participants().find(x => x.nomEquipe === this.gratuitesEquipe());
    if (!p) return;
    this.saving.set(true);
    this.api.definirLicencesGratuites(this.competition.id, p.id, [...this.gratuitesChoisies()]).subscribe({
      next: () => { this.saving.set(false); this.gratuitesEquipe.set(null); this.charger(); },
      error: err => {
        this.saving.set(false);
        alert(err?.error?.message ?? 'Enregistrement impossible');
      }
    });
  }

  // ── Photo d'identité de la licence ────────────────────────
  onPhotoChoisie(event: Event, l: LicenceDTO): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    input.value = '';
    if (!fichier) return;
    if (fichier.size > 5 * 1024 * 1024) { alert(t('ui.ts_la_photo_ne_doit_pas_depasser_5__e18a')); return; }
    this.photoEnCours.set(l.id);
    this.api.televerserPhotoLicence(this.competition.id, l.id, fichier).subscribe({
      next: () => { this.photoEnCours.set(null); this.charger(); },
      error: err => {
        this.photoEnCours.set(null);
        alert(err?.error?.message ?? 'Envoi de la photo impossible');
      }
    });
  }

  changerStatut(l: LicenceDTO, statut: string): void {
    this.api.changerStatutLicence(this.competition.id, l.id, statut).subscribe({
      next: () => this.charger()
    });
  }

  // ── PDF ───────────────────────────────────────────────────
  telechargerPdf(l: LicenceDTO): void {
    this.api.getLicencePdf(this.competition.id, l.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `licence-${l.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  telechargerPdfEquipe(equipeNom: string): void {
    const p = this.participants().find(x => x.nomEquipe === equipeNom);
    if (!p) return;
    this.api.getLicencesPdfEquipe(this.competition.id, p.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `licences-${equipeNom}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  statutLabel(s: string): string {
    const m: Record<string, string> = {
      ATTENTE:   'En attente',
      VALIDE:    t('invitation.validated'),
      EXPIREE:   t('invitation.expired'),
      SUSPENDUE: 'Suspendue',
      REVOQUEE:  t('ui.revoquee_fdef')
    };
    return m[s] ?? s;
  }

  statutClass(s: string): string {
    const m: Record<string, string> = {
      ATTENTE:   'badge--warning',
      VALIDE:    'badge--success',
      EXPIREE:   'badge--grey',
      SUSPENDUE: 'badge--danger',
      REVOQUEE:  'badge--dark'
    };
    return m[s] ?? '';
  }

  getInitials(nom: string): string {
    return (nom ?? '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  licencesActivees(): boolean {
    return this.config()?.licencesActivees ?? false;
  }
}