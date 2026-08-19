import {
  Component, Input, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { HttpClient }    from '@angular/common/http';
import { environment } from '../../../../environment';


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
}

interface MembreMy20 {
  id:        number;   // Membre.id
  nom:       string;
  prenom?:   string;
  photoUrl?: string;
  numeroDos?: number;
  poste?:    string;
}

@Component({
  selector:    'app-roster',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './roster.component.html',
  styleUrls:   ['./roster.component.scss']
})
export class RosterComponent implements OnInit {
  @Input() competitionId!: number;
  @Input() participantId!: number;
  @Input() canEdit = false;

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/competitions`;

  // ── Signals ───────────────────────────────────────────────
  isGroupe20    = signal(false);   // true si le participant est un groupe My2-0
  roster        = signal<MembreRoster[]>([]);
  membresMy20   = signal<MembreMy20[]>([]);
  loading       = signal(true);
  saving        = signal(false);
  showForm      = signal(false);
  mode          = signal<'my20' | 'manuel'>('my20');
  searchQuery   = signal('');

  // Membres My2-0 déjà dans le roster → ne pas proposer à nouveau
  // Membres déjà dans le roster (par leur id Membre)
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

  // Formulaire ajout manuel
  nouveau = {
    nom: '', prenom: '', numeroDos: null as number | null,
    poste: '', role: 'JOUEUR', telephone: ''
  };

  readonly roles = [
    'JOUEUR', 'GARDIEN', 'CAPITAINE',
    'ENTRAINEUR', 'ASSISTANT_COACH', 'MEDECIN', 'DIRIGEANT'
  ];
  readonly postes = ['GARDIEN', 'DEFENSEUR', 'MILIEU', 'ATTAQUANT'];

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.chargerRoster();
    // Tenter de charger les membres — le participant déterminera si My2-0
    this.chargerMembresMy20();
  }

  // ── Charger le roster de la compétition ──────────────────
  chargerRoster(): void {
    this.loading.set(true);
    this.http.get<MembreRoster[]>(
      `${this.base}/${this.competitionId}/participants/${this.participantId}/joueurs`
    ).subscribe({
      next: (r: any[]) => {
        console.log('[Roster] roster reçu:', r);
        this.roster.set(r);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('[Roster] Erreur chargement roster:', err);
        this.loading.set(false);
      }
    });
  }

  // ── Charger les membres My2-0 depuis le participant ─────
  // On récupère d'abord le participant pour avoir son clubId (groupeId)
  // puis on charge les membres de ce groupe
  chargerMembresMy20(): void {
    // Étape 1 : récupérer le participant pour avoir son clubId
    this.http.get<any>(
      `${environment.apiUrl}/competitions/${this.competitionId}/participants/${this.participantId}`
    ).subscribe({
      next: participant => {

        const groupeId = participant.clubId ?? participant.groupeId;
        console.log('[Roster] participant:', participant, '| groupeId:', groupeId);

        if (!groupeId) {
          console.warn('[Roster] pas de groupeId → équipe externe');
          this.isGroupe20.set(false);
          return;
        }
        this.isGroupe20.set(true);

        // Étape 2 : charger les membres du groupe
        this.http.get<any[]>(
          `${environment.apiUrl}/membres/groupe/${groupeId}`
        ).subscribe({
          next: membres => {
            console.log('[Roster] membres reçus:', membres);
            this.membresMy20.set(membres
              .filter((m: any) => m && m.id)
              .map((m: any) => ({
                id:        m.id,
                nom:       m.nom ?? '',
                prenom:    m.prenom,
                photoUrl:  m.photoUrl
                           ?? m.photo
                           ?? m.user?.profilePhotoUrl,
                numeroDos: m.numeroDos,
                poste:     m.poste
              })));
          },
          error: (err: any) =>
            console.error('[Roster] Erreur membres:', err)
        });
      },
      error: (err: any) =>
        console.error('[Roster] Erreur participant:', err)
    });
  }

  // ── Ajouter depuis My2-0 (un clic) ───────────────────────
  ajouterMy20(m: MembreMy20): void {
    this.saving.set(true);
    this.http.post<MembreRoster>(
      `${this.base}/${this.competitionId}/participants/${this.participantId}/joueurs`,
      { membreId: m.id }  // backend pré-remplit depuis Membre
    ).subscribe({
      next: r => {
        this.roster.update(list => [...list, r]);
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  // ── Ajouter manuellement ─────────────────────────────────
  ajouterManuel(): void {
    if (!this.nouveau.nom.trim()) return;
    this.saving.set(true);
    this.http.post<MembreRoster>(
      `${this.base}/${this.competitionId}/participants/${this.participantId}/joueurs`,
      { ...this.nouveau, membreId: null }
    ).subscribe({
      next: r => {
        this.roster.update(list => [...list, r]);
        this.nouveau = { nom: '', prenom: '', numeroDos: null, poste: '', role: 'JOUEUR', telephone: '' };
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  // ── Retirer du roster ─────────────────────────────────────
  retirer(m: MembreRoster): void {
    if (!confirm(`Retirer ${m.nom} du roster ?`)) return;
    this.http.delete(
      `${this.base}/${this.competitionId}/participants/${this.participantId}/joueurs/${m.id}`
    ).subscribe(() => {
      this.roster.update(list => list.filter(r => r.id !== m.id));
    });
  }

  // ── Modifier statut ───────────────────────────────────────
  changerStatut(m: MembreRoster, statut: string): void {
    this.http.patch(
      `${this.base}/${this.competitionId}/participants/${this.participantId}/joueurs/${m.id}`,
      { statut }
    ).subscribe(() => {
      this.roster.update(list =>
        list.map(r => r.id === m.id ? { ...r, statut } : r)
      );
    });
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = {
      ACTIF:        'Actif',
      SUSPENDU:     'Suspendu',
      BLESSE:       'Blessé',
      NON_CONVOQUE: 'Non convoqué'
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

  joueurs()  { return this.roster().filter(r =>
    ['JOUEUR','GARDIEN','CAPITAINE'].includes(r.role)); }
  staff()    { return this.roster().filter(r =>
    !['JOUEUR','GARDIEN','CAPITAINE'].includes(r.role)); }
}