import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy, signal, computed, HostListener, Optional } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Match } from '../../../../core/models/match.model';
import { Groupe } from '../../../../core/models/groupe.model';
import { PresenceService } from '../../../../core/services/presence.service';
import { MatchService } from '../../../../core/services/match.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { GroupeService } from '../../../../core/services/groupe.service';
import { GeneralService } from '../../../../core/services/general.service';

// ─────────────────── Interfaces ───────────────────

export interface MembreStats {
  membreId: number;
  nom: string;
  prenom: string;
  nomAffiche: string;
  nomAbrege: string;
  poste?: string;
  avatarColor: string;
  initiales: string;
  membreEquipeId?: number;
  // Présences
  totalMatchs: number;
  presences: number;
  absences: number;
  tauxPresence: number;
  // Perf
  buts: number;
  passes: number;
  mvp: number;
  hdm: number;
  // Timeline mensuelle: mois → { present, total, taux }
  parMois: Record<string, { present: number; total: number; taux: number }>;
  // Timeline matchs (ordre chrono)
  timeline: Array<{
    matchId: number;
    date: Date;
    result: 'W' | 'L' | 'N' | 'ABS' | 'FUT';
    present: boolean;
    buts: number;
    passes: number;
  }>;
}

export interface HeatmapCell {
  membreId: number;
  moisKey: string; 
  taux: number;
  present: number;
  total: number;
}

export type PeriodFilter = '1' | '3' | '5' | '6' | '12' | 'all';
export type SortField = 'nom' | 'taux' | 'buts' | 'passes' | 'mvp';
export type SortDir = 'asc' | 'desc';
export type ActiveView = 'heatmap' | 'table' | 'compare';
export type EquipeFilter = 'all' | 'equipe1' | 'equipe2'; // 🔥 Nouveau filtre d'équipe

// ─────────────────── Helpers ───────────────────

const AVATAR_COLORS = [
  '#378ADD', '#1D9E75', '#D85A30', '#534AB7',
  '#BA7517', '#D4537E', '#0F6E56', '#993C1D',
];

function getAvatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitiales(nom: string, prenom: string): string {
  return ((nom?.charAt(0) || '') + (prenom?.charAt(0) || '')).toUpperCase();
}

function formatNom(nom: string, prenom: string, abrege = false): string {
  if (!prenom) return nom || '';
  if (abrege) return `${nom} ${prenom.charAt(0).toUpperCase()}.`.trim();
  return `${nom} ${prenom}`.trim();
}

function moisKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function heatColor(taux: number): string {
  if (taux === 0)  return '#F09595';
  if (taux < 40)  return '#FAEEDA';
  if (taux < 60)  return '#C0DD97';
  if (taux < 80)  return '#5DCAA5';
  return '#1D9E75';
}

function heatTextColor(taux: number): string {
  if (taux === 0)  return '#791F1F';
  if (taux < 40)  return '#633806';
  if (taux < 60)  return '#27500A';
  if (taux < 80)  return '#085041';
  return '#E1F5EE';
}

// ─────────────────── Component ───────────────────

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    TranslateModule,
  ],
  templateUrl: './stats-dashboard.component.html',
  styleUrl: './stats-dashboard.component.scss',
})
export class StatsDashboardComponent implements OnInit, OnDestroy {

  // ── État UI ──
  activeView = signal<ActiveView>('heatmap');
  isLoading  = signal(true);
  isMobile   = false;

  // ── Filtres ──
  periodFilter  = signal<PeriodFilter>('5');
  searchQuery   = signal('');
  posteFilter   = signal('');
  equipeFilter  = signal<number | 'all'>('all'); // 🔥 Initialisation du filtre d'équipe
  sortField     = signal<SortField>('taux');
  sortDir       = signal<SortDir>('desc');
  compareIds    = signal<number[]>([]);   // max 3

  // ── Données brutes ──
  private allStats     = signal<MembreStats[]>([]);
  private allMonths    = signal<string[]>([]);  // 'YYYY-MM' triés
  private allMatches   = signal<Match[]>([]);
  readonly allEquipes  = signal<Equipe[]>([]);

  // ── Panneau joueur ──
  selectedMembre = signal<MembreStats | null>(null);

  // ── Computed Corrigés et Filtrés ──
// ── Computed Corrigés et Filtrés avec Équipe Dynamique ──
  readonly filteredStats = computed(() => {
    const stats  = this.allStats();
    const q      = this.searchQuery().toLowerCase().trim();
    const poste  = this.posteFilter();
    const equipeId = this.equipeFilter(); // 🔥 ID de l'équipe sélectionnée
    const field  = this.sortField();
    const dir    = this.sortDir();
    const months = this.visibleMonths();


    return stats
      .map(s => this.restrictToPeriod(s, months))
      .filter(s => {
        if (q && !s.nomAffiche.toLowerCase().includes(q)) return false;
        if (poste && s.poste !== poste) return false;
        
        // 🔥 FILTRE SUR L'EQUIPE DU MEMBRE
        if (equipeId !== 'all' && s.membreEquipeId !== equipeId) return false;
        
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (field) {
          case 'nom':    cmp = a.nomAffiche.localeCompare(b.nomAffiche); break;
          case 'taux':   cmp = a.tauxPresence - b.tauxPresence; break;
          case 'buts':   cmp = a.buts - b.buts; break;
          case 'passes': cmp = a.passes - b.passes; break;
          case 'mvp':    cmp = a.mvp - b.mvp; break;
        }
        return dir === 'desc' ? -cmp : cmp;
      });
  });

  readonly visibleMonths = computed(() => {
    const all    = this.allMonths();
    const period = this.periodFilter();
    if (period === 'all') return all;
    const n = parseInt(period, 10);
    return all.slice(-n);
  });

  readonly globalKpis = computed(() => {
    const stats  = this.filteredStats();
    const months = this.visibleMonths();
    
    if (!stats.length) return { totalMatchs: 0, presenceMoy: 0, topJoueur: '', absentCount: 0 };
    
    const totalMatchs = this.allMatches().filter(m => this.matchInPeriod(m, months)).length;
    
    // 🔥 CORRECTION : Vraie formule mathématique de participation globale (cumul présence / cumul possible)
    const cumulPresences = stats.reduce((acc, s) => acc + s.presences, 0);
    const cumulMatchsPossibles = stats.reduce((acc, s) => acc + s.totalMatchs, 0);
    const presenceMoy = cumulMatchsPossibles > 0 
      ? Math.round((cumulPresences / cumulMatchsPossibles) * 100) 
      : 0;

    const top = [...stats].sort((a, b) => b.tauxPresence - a.tauxPresence || b.buts - a.buts)[0];
    const absentCount = stats.filter(s => s.tauxPresence < 50).length;
    
    return { totalMatchs, presenceMoy, topJoueur: top?.nomAbrege || '', absentCount };
  });

  readonly compareStats = computed(() => {
    const ids    = this.compareIds();
    const months = this.visibleMonths();
    return this.allStats()
      .filter(s => ids.includes(s.membreId))
      .map(s => this.restrictToPeriod(s, months));
  });

  readonly postes = computed(() =>
    [...new Set(this.allStats().map(s => s.poste).filter(Boolean))] as string[]
  );

  // ── Couleurs heatmap exposées au template ──
  readonly heatColor   = heatColor;
  readonly heatTextColor = heatTextColor;

  // ── Couleurs comparaison ──
  readonly compareColors = ['#378ADD', '#1D9E75', '#EF9F27'];

  private destroy$ = new Subject<void>();

  constructor(
    private presenceService: PresenceService,
    private matchService: MatchService,
    private authService: AuthService,
    private equipeService: GeneralService,
    @Optional() public dialogRef: MatDialogRef<StatsDashboardComponent>, // 🔥 Optionnel pour éviter l'erreur NullInjectorError
    private translate: TranslateService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { matches: Match[]; groupeActif?: Groupe; }
  ) {
    this.isMobile = window.innerWidth <= 768;
    if (!this.data) {
      this.data = { matches: [], groupeActif: undefined };
    }
  }

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth <= 768; }

  // ──────────────────── Lifecycle ────────────────────

 ngOnInit(): void {
  this.isLoading.set(true);

  // 2. Appel de l'API pour charger les matchs (par exemple du groupe actif)
  const groupeId = this.authService.getGroupe(); 
  
  this.matchService.getMatchesByGroupeId(groupeId!) // Adapte le nom de ta méthode API
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        // Optionnel : actions à faire à la fin du chargement
      })
    )
    .subscribe({
      next: (matchsDuGroupe: Match[]) => {
        // On alimente le signal avec les données de l'API
        this.allMatches.set(matchsDuGroupe || []);
        
        // On continue la logique existante de calcul des présences
        this.loadAllPresences(); 
      },
      error: (err) => {
        console.error("Erreur lors du chargement des matchs", err);
        this.isLoading.set(false);
      }
    });

    // 🔥 Appel de l'API pour charger dynamiquement les équipes du groupe
  if (groupeId) {
    this.equipeService.getEquipesByGroupe() // <-- Adapte le nom de ta méthode API
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (equipes: Equipe[]) => {
          this.allEquipes.set(equipes || []);
        },
        error: (err) => {
          console.error("Erreur lors du chargement des équipes depuis l'API", err);
          this.allEquipes.set([]); // Sécurité
        }
      });
  }
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ──────────────────── Chargement données ────────────────────

  private loadAllPresences(): void {
    const matches = this.allMatches();
    if (!matches.length) { this.isLoading.set(false); return; }

    const playedMatches = matches.filter(m => this.isMatchPlayed(m));
    if (!playedMatches.length) { this.isLoading.set(false); return; }

    let pending = playedMatches.length;
    const presencesByMatch: Record<number, any[]> = {};

    playedMatches.forEach(match => {
      this.presenceService.getPresencesByMatchId(match.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (presences: any[]) => {
            presencesByMatch[match.id] = presences || [];
            pending--;
            if (pending === 0) this.buildStats(playedMatches, presencesByMatch);
          },
          error: () => {
            presencesByMatch[match.id] = [];
            pending--;
            if (pending === 0) this.buildStats(playedMatches, presencesByMatch);
          }
        });
    });
  }

  private buildStats(
    matches: Match[],
    presencesByMatch: Record<number, any[]>
  ): void {
    const membresMap = new Map<number, MembreStats>();
    const monthsSet = new Set<string>();

    // 1. Collecter d'abord la liste absolue de tous les membres uniques
    matches.forEach(match => {
      const presences = presencesByMatch[match.id] || [];
      presences.forEach(p => {
        if (!p.membre?.id) return;
        const id = p.membre.id;
        if (!membresMap.has(id)) {
          membresMap.set(id, {
            membreId: id,
            nom:       p.membre.nom || '',
            prenom:    p.membre.prenom || '',
            nomAffiche: formatNom(p.membre.nom, p.membre.prenom),
            nomAbrege:  formatNom(p.membre.nom, p.membre.prenom, true),
            poste:      p.membre.poste || p.poste || undefined,
            avatarColor: getAvatarColor(id),
            initiales:   getInitiales(p.membre.nom, p.membre.prenom),
            membreEquipeId: p.membre.equipe?.id || p.membre.equipe || undefined,
            totalMatchs: 0,
            presences:   0,
            absences:    0,
            tauxPresence: 0,
            buts:    0,
            passes:  0,
            mvp:     0,
            hdm:     0,
            parMois: {},
            timeline: [],
          });
        }
      });
    });

    // 2. Extraire et trier la liste chronologique des mois
    matches.forEach(match => {
      const d = new Date(match.dateMatch);
      monthsSet.add(moisKey(d));
    });
    const sortedMonths = [...monthsSet].sort();
    this.allMonths.set(sortedMonths);

    // 3. 🔥 LOGIQUE SÉCURISÉE : Boucler par Match, puis évaluer CHAQUE Joueur du 2-0
    matches.forEach(match => {
      const presences  = presencesByMatch[match.id] || [];
      const matchDate  = new Date(match.dateMatch);
      const mk         = moisKey(matchDate);
      const result     = this.getMatchResult(match);

      // Indexation rapide des présents du match courant
      const mapPresentsDuMatch = new Map<number, any>();
      presences.forEach(p => {
        if (p.membre?.id) mapPresentsDuMatch.set(p.membre.id, p);
      });

      // Analyse systématique pour chaque joueur inscrit dans le groupe
      membresMap.forEach((s, id) => {
        const p = mapPresentsDuMatch.get(id);
        const aJoue = p ? !!p.aJoue : false; // Si absent de la liste = Absence réelle enregistrée

        if (!s.parMois[mk]) {
          s.parMois[mk] = { present: 0, total: 0, taux: 0 };
        }

        s.totalMatchs++;
        s.parMois[mk].total++;

        if (aJoue) {
          s.presences++;
          s.parMois[mk].present++;
          s.buts   += p.buts   || 0;
          s.passes += p.passes || 0;
          if (p.isMvp || p.mvp || p.estHommeDuMatchEq) s.mvp++;
          if (p.estHommeDuMatch) s.hdm++;
        } else {
          s.absences++;
        }

        s.timeline.push({
          matchId: match.id,
          date:    matchDate,
          result:  aJoue ? result : 'ABS',
          present: aJoue,
          buts:    aJoue ? (p.buts || 0) : 0,
          passes:  aJoue ? (p.passes || 0) : 0,
        });
      });
    });

    // 4. Calcul final des pourcentages par joueur
    membresMap.forEach(s => {
      s.tauxPresence = s.totalMatchs > 0
        ? Math.round((s.presences / s.totalMatchs) * 100)
        : 0;

      Object.values(s.parMois).forEach(m => {
        m.taux = m.total > 0 ? Math.round((m.present / m.total) * 100) : 0;
      });

      s.timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    this.allStats.set([...membresMap.values()]);
    this.isLoading.set(false);
  }

  // ──────────────────── Helpers domaine ────────────────────

  private isMatchPlayed(match: Match): boolean {
    const d = new Date(match.dateMatch);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    if (d >= t) return false;
    return !!match.rapporteur ||
           !!(match.rapporteurNomOccasionnel?.trim()) ||
           match.scoreEquipe1 != null ||
           match.scoreEquipe2 != null ||
           match.scoreAdversaire != null;
  }

  private getMatchResult(match: Match): 'W' | 'L' | 'N' {
    const s1 = match.scoreEquipe1 ?? match.scoreAdversaire ?? 0;
    const s2 = match.scoreEquipe2 ?? match.scoreAdversaire ?? 0;
    if (s1 === s2) return 'N';
    return s1 > s2 ? 'W' : 'L';
  }

  private matchInPeriod(match: Match, months: string[]): boolean {
    return months.includes(moisKey(new Date(match.dateMatch)));
  }

  private restrictToPeriod(s: MembreStats, months: string[]): MembreStats {
    if (months.length === this.allMonths().length) return s;
    const mSet = new Set(months);
    const timeline = s.timeline.filter(t => mSet.has(moisKey(t.date)));
    const presences = timeline.filter(t => t.present).length;
    const total     = timeline.length;
    return {
      ...s,
      timeline,
      presences,
      absences:     total - presences,
      totalMatchs:  total,
      tauxPresence: total > 0 ? Math.round((presences / total) * 100) : 0,
      buts:    timeline.reduce((acc, t) => acc + t.buts, 0),
      passes:  timeline.reduce((acc, t) => acc + t.passes, 0),
    };
  }

  // ──────────────────── Actions UI ────────────────────

  setView(v: ActiveView): void { this.activeView.set(v); }

  setPeriod(p: PeriodFilter | string): void {
    this.periodFilter.set(p as PeriodFilter);
    this.selectedMembre.set(null);
  }

  setSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
  }

  selectMembre(s: MembreStats): void {
    this.selectedMembre.set(
      this.selectedMembre()?.membreId === s.membreId ? null : s
    );
  }

  toggleCompare(id: number): void {
    const ids = this.compareIds();
    if (ids.includes(id)) {
      this.compareIds.set(ids.filter(i => i !== id));
    } else if (ids.length < 3) {
      this.compareIds.set([...ids, id]);
    }
  }

  isInCompare(id: number): boolean {
    return this.compareIds().includes(id);
  }

  compareColor(id: number): string {
    const idx = this.compareIds().indexOf(id);
    return idx >= 0 ? this.compareColors[idx] : '';
  }

  clearCompare(): void { this.compareIds.set([]); }

  onClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  // ──────────────────── Template helpers ────────────────────

  getMoisLabel(key: string): string {
    const [y, m] = key.split('-');
    const monthNames = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    return monthNames[parseInt(m, 10) - 1] || m;
  }

  getCellForMois(s: MembreStats, mois: string): { taux: number; present: number; total: number } {
    return s.parMois[mois] || { taux: 0, present: 0, total: 0 };
  }

  getTauxClass(taux: number): string {
    if (taux >= 80) return 'taux-hi';
    if (taux >= 50) return 'taux-mid';
    return 'taux-lo';
  }

  getTimelineIcon(result: string): string {
    const map: Record<string, string> = { W: 'V', L: 'D', N: 'N', ABS: 'A', FUT: '?' };
    return map[result] || '?';
  }

  getMaxStat(field: 'buts' | 'passes' | 'mvp'): number {
    const stats = this.compareStats();
    return Math.max(...stats.map(s => s[field]), 1);
  }

  barWidth(val: number, max: number): string {
    return `${Math.round((val / max) * 100)}%`;
  }

  exportCSV(): void {
    const stats  = this.filteredStats();
    const header = ['Joueur', 'Poste', 'Matchs', 'Présences', 'Absences', 'Taux%', 'Buts', 'Passes', 'MVP', 'HDM'];
    const rows   = stats.map(s => [
      s.nomAffiche, s.poste || '', s.totalMatchs, s.presences,
      s.absences, s.tauxPresence, s.buts, s.passes, s.mvp, s.hdm
    ]);
    const csv = [header, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `stats_${this.data.groupeActif?.nom || 'groupe'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}