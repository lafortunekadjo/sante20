import {
  Component, Input, OnInit, OnChanges,
  SimpleChanges, inject, signal, computed
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { HttpClient }      from '@angular/common/http';
import { environment } from '../../../../environment';


interface MembreOption {
  membreId:  number;
  joueurId?: number;
  nom:       string;
  prenom?:   string;
  numeroDos?: number;
  poste?:    string;
  photoUrl?: string;
  suspendu:  boolean;
}

interface JoueurCompo {
  membreId?:    number;
  joueurId?:    number;
  joueurNom:    string;
  joueurPrenom?: string;
  numeroDos?:   number;
  poste?:       string;
  statut:       'TITULAIRE' | 'REMPLACANT';
  capitaine:    boolean;
  suspendu?:    boolean;
  source:       'membre' | 'manuel';
}

@Component({
  selector:    'app-equipe-membres',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './equipe-membres.component.html',
  styleUrls:   ['./equipe-membres.component.scss']
})
export class EquipeMembresComponent implements OnInit, OnChanges {
  @Input() competitionId!: number;
  @Input() participantId!: number;  // CompetitionParticipant.id
  @Input() matchId!:       number;
  @Input() cote!:          'domicile' | 'exterieur';
  @Input() isGroupe20 =    false;   // true si GROUPE_MY20
  @Input() canEdit =       false;

  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ── Signals ───────────────────────────────────────────────
  joueurs        = signal<JoueurCompo[]>([]);
  membreOptions  = signal<MembreOption[]>([]);
  loadingCompo   = signal(true);
  loadingMembres = signal(false);
  saving         = signal(false);
  editMode       = signal(false);
  ajoutMode      = signal<'aucun' | 'liste' | 'manuel'>('aucun');
  searchQuery    = signal('');

  // Membres filtrés par recherche
  membresFiltres = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const deja = new Set(
      this.joueurs()
        .filter(j => j.membreId != null)
        .map(j => j.membreId!)
    );
    return this.membreOptions()
      .filter(m => !deja.has(m.membreId))
      .filter(m =>
        !q ||
        m.nom?.toLowerCase().includes(q) ||
        m.prenom?.toLowerCase().includes(q)
      );
  });

  // Saisie manuelle
  nouveau: Partial<JoueurCompo> = { statut: 'TITULAIRE', capitaine: false, source: 'manuel' };

  // Poste options
  readonly postes = ['GARDIEN', 'DEFENSEUR', 'MILIEU', 'ATTAQUANT'];

  // ── Computed ──────────────────────────────────────────────
  titulaires  = computed(() => this.joueurs().filter(j => j.statut === 'TITULAIRE'));
  remplacants = computed(() => this.joueurs().filter(j => j.statut === 'REMPLACANT'));
  nbTitulaires = computed(() => this.titulaires().length);

  // ── Lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    this.chargerComposition();
    this.chargerMembres(); // roster disponible pour tous les participants
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['matchId'] || ch['participantId']) {
      this.chargerComposition();
    }
  }

  // ── 1. Chargement de la composition existante ─────────────
  chargerComposition(): void {
    this.loadingCompo.set(true);
    this.http.get<any>(
      `${this.base}/competitions/${this.competitionId}/matchs/${this.matchId}`
    ).subscribe({
      next: match => {
        // Le backend retourne getComposition() dans le DTO
        const compo: any[] = match[`composition${this.capitalize(this.cote)}`] ?? [];
        this.joueurs.set(compo
          .filter(c => c.joueurNom || c.joueurId)
          .map(c => ({
            membreId:    c.membreId    ?? undefined,
            joueurId:    c.joueurId    ?? undefined,
            joueurNom:   c.joueurNom   ?? '',
            joueurPrenom: c.joueurPrenom ?? undefined,
            numeroDos:   c.numeroDos   ?? undefined,
            poste:       c.poste       ?? undefined,
            statut:      c.statut      ?? 'TITULAIRE',
            capitaine:   c.capitaine   ?? false,
            suspendu:    c.suspendu    ?? false,
            source:      c.membreId ? 'membre' : 'manuel'
          })));
        this.loadingCompo.set(false);
      },
      error: () => this.loadingCompo.set(false)
    });
  }

  // ── 2. Chargement des joueurs du ROSTER (MembreEquipeCompetition)
  //         = les joueurs inscrits pour cette compétition
  chargerMembres(): void {
    if (!this.participantId) return;
    this.loadingMembres.set(true);
    // GET /competitions/{id}/participants/{partId}/joueurs
    // → retourne uniquement les joueurs (role JOUEUR/GARDIEN/CAPITAINE)
    this.http.get<MembreOption[]>(
      `${this.base}/competitions/${this.competitionId}/participants/${this.participantId}/joueurs/joueurs`
    ).subscribe({
      next: membres => {
        // Mapper MembreEquipeCompetitionDTO → MembreOption
        this.membreOptions.set(membres.map((m: any) => ({
          membreId:  m.id,          // MembreEquipeCompetition.id
          joueurId:  m.joueurId,    // lien vers Membre.id si My2-0
          nom:       m.nom,
          prenom:    m.prenom,
          numeroDos: m.numeroDos,
          poste:     m.poste,
          photoUrl:  m.photoUrl,
          suspendu:  m.statut === 'SUSPENDU'
        })));
        this.loadingMembres.set(false);
      },
      error: () => this.loadingMembres.set(false)
    });
  }

  // ── 3. Ajouter depuis le roster (un clic) ────────────────
  ajouterMembre(m: MembreOption): void {
    if (m.suspendu) return;
    this.joueurs.update(list => [...list, {
      // membreId = MembreEquipeCompetition.id (roster)
      // backend utilise ce champ pour retrouver toutes les infos
      membreId:    m.membreId,
      joueurId:    m.joueurId,
      joueurNom:   m.nom,
      joueurPrenom: m.prenom,
      numeroDos:   m.numeroDos,
      poste:       m.poste,
      statut:      'TITULAIRE',
      capitaine:   false,
      suspendu:    m.suspendu,
      source:      'membre'
    }]);
    this.searchQuery.set('');
  }

  // ── 4. Ajouter manuellement ───────────────────────────────
  ajouterManuel(): void {
    if (!this.nouveau.joueurNom?.trim()) return;
    this.joueurs.update(list => [...list, {
      joueurNom:    this.nouveau.joueurNom!.trim(),
      joueurPrenom: this.nouveau.joueurPrenom?.trim(),
      numeroDos:    this.nouveau.numeroDos,
      poste:        this.nouveau.poste,
      statut:       this.nouveau.statut ?? 'TITULAIRE',
      capitaine:    false,
      source:       'manuel'
    }]);
    this.nouveau = { statut: 'TITULAIRE', capitaine: false, source: 'manuel' };
    this.ajoutMode.set('aucun');
  }

  // ── Actions sur la liste ──────────────────────────────────
  retirer(j: JoueurCompo): void {
    this.joueurs.update(list => list.filter(x => x !== j));
  }

  toggleStatut(j: JoueurCompo): void {
    this.joueurs.update(list => list.map(x =>
      x === j
        ? { ...x, statut: x.statut === 'TITULAIRE' ? 'REMPLACANT' : 'TITULAIRE' }
        : x
    ));
  }

  toggleCapitaine(j: JoueurCompo): void {
    this.joueurs.update(list => list.map(x => ({
      ...x, capitaine: x === j ? !x.capitaine : false
    })));
  }

  // ── 5. Sauvegarder ────────────────────────────────────────
  enregistrer(): void {
    this.saving.set(true);
    const dtos = this.joueurs().map(j => ({
      membreId:        j.membreId    ?? null,
      joueurId:        j.joueurId    ?? null,
      joueurNom:       j.joueurNom,
      joueurPrenom:    j.joueurPrenom ?? null,
      numeroDos:       j.numeroDos   ?? null,
      poste:           j.poste       ?? null,
      statut:          j.statut,
      capitaine:       j.capitaine,
      gardienTitulaire: j.poste === 'GARDIEN' && j.statut === 'TITULAIRE',
    }));

    this.http.post<any[]>(
      `${this.base}/competitions/${this.competitionId}/matchs/${this.matchId}/composition/${this.participantId}`,
      dtos
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.editMode.set(false);
        this.ajoutMode.set('aucun');
        // Recharger depuis le serveur pour confirmer
        this.chargerComposition();
      },
      error: () => this.saving.set(false)
    });
  }

  annulerEdit(): void {
    this.editMode.set(false);
    this.ajoutMode.set('aucun');
    this.chargerComposition(); // reset depuis le serveur
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}