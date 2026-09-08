import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { StatutCompetition, TypeCompetition } from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { AuthService } from '../../../../core/services/auth.service';

type RoleCompetition =
  'RESPONSABLE' | 'SECRETAIRE' | 'ARBITRE' | 'MEDECIN' |
  'KINESITHERAPEUTE' | 'COMMISSAIRE' | 'DELEGUE' | 'OBSERVATEUR';

interface MesCompetitionsDTO {
  id:                 number;
  nom:                string;
  description?:       string;
  logoUrl?:           string;
  statut:             StatutCompetition;
  type:               TypeCompetition;
  format?:            string;
  organisateurNom?:   string;
  dateDebut?:         string;
  dateFin?:           string;
  nombreParticipants: number;
  monRole?:           RoleCompetition;
  isCreateur:         boolean;
  nbMatchsAVenir:     number;
  nbMatchsEnCours:    number;
}

@Component({
  selector:    'app-competition-list',
  standalone:  true,
  imports:     [CommonModule, RouterModule, FormsModule,
                MatIconModule, TranslateModule, DatePipe],
  templateUrl: './competition-list.component.html',
  styleUrls:   ['./competition-list.component.scss']
})
export class CompetitionListComponent implements OnInit {

  private api    = inject(CompetitionApiService);
  private auth   = inject(AuthService);
  private router = inject(Router);

  // ── State ──────────────────────────────────────────────────
  competitions  = signal<MesCompetitionsDTO[]>([]);
  loading       = signal(false);
  totalElements = signal(0);
  totalPages    = signal(0);
  page          = signal(0);
  filtreStatut  = signal<string | null>(null);
  filtreType    = signal<string | null>(null);
  searchQuery   = '';

  // ── User info ─────────────────────────────────────────────
  isAdmin       = this.auth.isAdmin?.() ?? false;
  isResponsable = this.auth.isResponsable?.() ?? false;
  canCreate     = computed(() => this.isAdmin || this.isResponsable);

  // ── Filtres ───────────────────────────────────────────────
  statutOptions = [
    { value: StatutCompetition.EN_COURS,            label: 'En cours',       dot: 'green'  },
    { value: StatutCompetition.BROUILLON,           label: 'Brouillon',      dot: 'gray'   },
    { value: StatutCompetition.INSCRIPTION_OUVERTE, label: 'Inscriptions',   dot: 'blue'   },
    { value: StatutCompetition.TERMINE,             label: 'Terminée',       dot: 'muted'  },
  ];

  typeOptions = [
    { value: TypeCompetition.CHAMPIONNAT, label: 'Championnat', icon: 'emoji_events'    },
    { value: TypeCompetition.COUPE,       label: 'Coupe',       icon: 'workspace_premium'},
    { value: TypeCompetition.MIXTE,       label: 'Mixte',       icon: 'account_tree'    },
  ];

  // Compétitions filtrées localement (search)
  competitionsFiltrees = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.competitions();
    return this.competitions().filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.organisateurNom?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  // Stats rapides
  nbEnCours  = computed(() => this.competitions().filter(c => c.statut === StatutCompetition.EN_COURS).length);
  nbAVenir   = computed(() => this.competitions().filter(c => c.statut === StatutCompetition.BROUILLON || c.statut === StatutCompetition.INSCRIPTION_OUVERTE).length);
  nbTermines = computed(() => this.competitions().filter(c => c.statut === StatutCompetition.TERMINE).length);

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.mesCompetitions({
      statut: this.filtreStatut() ?? undefined,
      type:   this.filtreType()   ?? undefined,
      page:   this.page(),
      size:   12
    }).subscribe({
      next: res => {
        this.competitions.set(res.content ?? res);
        this.totalElements.set(res.totalElements ?? res.length ?? 0);
        this.totalPages.set(res.totalPages ?? 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // ── Filtres ───────────────────────────────────────────────
  setFiltreStatut(s: string | null): void {
    this.filtreStatut.set(s);
    this.page.set(0);
    this.load();
  }

  setFiltreType(t: string | null): void {
    this.filtreType.set(t === this.filtreType() ? null : t);
    this.page.set(0);
    this.load();
  }

  setPage(p: number): void {
    if (p < 0 || p >= this.totalPages()) return;
    this.page.set(p);
    this.load();
  }

  // ── Navigation ────────────────────────────────────────────
  ouvrirCompetition(c: MesCompetitionsDTO): void {
    this.router.navigate(['/competitions', c.id]);
  }

  creerCompetition(): void {
    this.router.navigate(['/competitions/new']);
  }

  // ── Helpers ───────────────────────────────────────────────
  getInitials(name?: string): string {
    return (name ?? '').split(' ').map(w => w[0])
      .join('').substring(0, 2).toUpperCase();
  }

  roleLabel(role?: RoleCompetition): string {
    if (!role) return '';
    const m: Record<RoleCompetition, string> = {
      RESPONSABLE:      'Responsable',
      SECRETAIRE:       'Secrétaire',
      ARBITRE:          'Arbitre',
      MEDECIN:          'Médecin',
      KINESITHERAPEUTE: 'Kinésithérapeute',
      COMMISSAIRE:      'Commissaire',
      DELEGUE:          'Délégué',
      OBSERVATEUR:      'Observateur',
    };
    return m[role] ?? role;
  }

  roleColor(role?: RoleCompetition): string {
    const m: Record<string, string> = {
      RESPONSABLE:  '#f59e0b',
      SECRETAIRE:   '#3b82f6',
      ARBITRE:      '#f97316',
      MEDECIN:      '#ef4444',
      COMMISSAIRE:  '#8b5cf6',
      DELEGUE:      '#10b981',
      OBSERVATEUR:  '#6b7280',
    };
    return m[role ?? ''] ?? '#6b7280';
  }

  statutColor(statut: StatutCompetition): string {
    const m: Record<string, string> = {
      EN_COURS:            '#10b981',
      BROUILLON:           '#6b7280',
      INSCRIPTION_OUVERTE: '#3b82f6',
      TERMINE:             '#9ca3af',
      ANNULE:              '#ef4444',
    };
    return m[statut] ?? '#6b7280';
  }

  statutLabel(s: StatutCompetition): string {
    const m: Record<string, string> = {
      BROUILLON:           'Brouillon',
      INSCRIPTION_OUVERTE: 'Inscriptions ouvertes',
      EN_COURS:            'En cours',
      TERMINE:             'Terminée',
      ANNULE:              'Annulée',
    };
    return m[s] ?? s;
  }

  typeIcon(t: TypeCompetition): string {
    const m: Record<string, string> = {
      CHAMPIONNAT: 'emoji_events',
      COUPE:       'workspace_premium',
      MIXTE:       'account_tree',
    };
    return m[t] ?? 'sports_soccer';
  }

  formatLabel(f?: string): string {
    const m: Record<string, string> = {
      ALLER_SIMPLE:       'Aller simple',
      ALLER_RETOUR:       'Aller-retour',
      ELIMINATION_SIMPLE: 'Élimination directe',
      MIXTE:              'Poules + Knockout',
    };
    return m[f ?? ''] ?? f ?? '';
  }
}