// pages/joueur-dashboard/joueur-dashboard.component.ts
import { t } from '../../../../core/i18n/traduire';
import { TranslateModule } from '@ngx-translate/core';
import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';

// ── Interfaces ─────────────────────────────────────────────────────────────

interface GlobalStats {
  matchsJoues:      number;
  buts:             number;
  passesDecisives:  number;
  cartonsJaunes:    number;
  cartonsRouges:    number;
  competitionsCount: number;
  awardsCount:      number;
}

interface CompetitionStats {
  competitionId:   number;
  competitionNom:  string;
  statut:          string;
  equipeNom:       string;
  matchsJoues:     number;
  buts:            number;
  passesDecisives: number;
  cartonsJaunes:   number;
  cartonsRouges:   number;
  awards:          string[];
  sanctionsSolde:  number;
}

interface JoueurStatsDTO {
  global:       GlobalStats;
  competitions: CompetitionStats[];
}

// ── Composant ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-joueur-dashboard',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterModule, MatIconModule],
  templateUrl: './joueur-dashboard.component.html',
  styleUrls:   ['./joueur-dashboard.component.scss']
})
export class JoueurDashboardComponent implements OnInit {

  private api = inject(CompetitionApiService);

  stats    = signal<JoueurStatsDTO | null>(null);
  loading  = signal(true);
  erreur   = signal(false);

  // Tab active
  activeTab = signal<'global' | 'competitions'>('global');

  // Compétitions filtrées selon le filtre actif
  filtreStatut = signal<'toutes' | 'actives' | 'terminees'>('toutes');

  competitionsFiltrees = computed(() => {
    const s = this.stats();
    if (!s) return [];
    const comps = s.competitions;
    switch (this.filtreStatut()) {
      case 'actives':
        return comps.filter(c =>
          c.statut === 'EN_COURS' || c.statut === 'INSCRIPTION_OUVERTE'
        );
      case 'terminees':
        return comps.filter(c => c.statut === 'TERMINE');
      default:
        return comps;
    }
  });

  ngOnInit(): void {
    this.api.getMesStatsCompetitions().subscribe({
      next: data => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.erreur.set(true);
        this.loading.set(false);
      }
    });
  }

  statutLabel(s: string): string {
    const m: Record<string, string> = {
      EN_COURS:            'En cours',
      INSCRIPTION_OUVERTE: 'Inscriptions ouvertes',
      BROUILLON:           'Brouillon',
      TERMINE:             t('partenaire.publicites.status.TERMINEE'),
      ANNULE:              t('invitation.cancelled'),
    };
    return m[s] ?? s;
  }

  statutClass(s: string): string {
    return 'badge-statut statut-' + s.toLowerCase();
  }

  // Icône dynamique par stat
  kpiCards(g: GlobalStats) {
    return [
      { label: t('dashboard.stats.matchesPlayed'),      value: g.matchsJoues,       icon: 'sports_soccer',  color: 'blue'   },
      { label: t('dashboard.goals'),              value: g.buts,              icon: 'sports_score',   color: 'green'  },
      { label: t('ui.ts_passes_dec_ff63'),       value: g.passesDecisives,   icon: 'assistant',      color: 'teal'   },
      { label: t('dashboard.stats.yellowCards'),    value: g.cartonsJaunes,     icon: 'square',         color: 'yellow' },
      { label: t('dashboard.stats.redCards'),    value: g.cartonsRouges,     icon: 'square',         color: 'red'    },
      { label: t('competition.nav.competitions'),      value: g.competitionsCount, icon: 'emoji_events',   color: 'purple' },
      { label: 'Awards',            value: g.awardsCount,       icon: 'military_tech',  color: 'gold'   },
    ];
  }
}