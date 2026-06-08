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
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { Match } from '../../../../core/models/match.model';
import { Groupe } from '../../../../core/models/groupe.model';
import { PresenceService } from '../../../../core/services/presence.service';
import { GeneralService } from '../../../../core/services/general.service';
import { MatchService } from '../../../../core/services/match.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface Equipe {
  id: number;
  nom: string;
}

export interface MembreStats {
  membreId: number;
  nom: string;
  prenom: string;
  nomAffiche: string;
  nomAbrege: string;
  poste?: string;
  membreEquipeId?: number;
  avatarColor: string;
  initiales: string;
  // Présences au terrain vs Matchs Joués
  totalMatchs: number;     // Matchs totaux de la période
  matchsAuTerrain: number; // Présence physique sur le terrain/banc
  matchsJoues: number;     // A effectivement joué (aJoue === true)
  absences: number;        // Ni au terrain, ni joué
  tauxPresenceTerrain: number;
  tauxJoue: number;
  // Performances détaillées
  butsCumules: number;
  butsDansLeJeu: number;
  penalties: number;
  passes: number;
  mvp: number;
  hdm: number;
  // Évolutions mensuelles
  parMois: Record<string, { presentTerrain: number; aJoue: number; total: number }>;
  // Historique des matchs
  timeline: Array<{
    matchId: number;
    date: Date;
    result: 'W' | 'L' | 'N' | 'ABS';
    statut: 'JOUE' | 'TERRAIN_UNIQUEMENT' | 'ABSENT';
    buts: number;
    penalties: number;
    passes: number;
  }>;
}

export type PeriodFilter = '1' | '3' | '5' | '6' | '12' | 'all' | 'custom';
export type SortField = 'nom' | 'taux' | 'tauxJoue' | 'buts' | 'passes' | 'mvp';
export type SortDir = 'asc' | 'desc';
export type ActiveView = 'heatmap' | 'table' | 'compare';

const AVATAR_COLORS = ['#378ADD', '#1D9E75', '#D85A30', '#534AB7', '#BA7517', '#D4537E', '#0F6E56', '#993C1D'];
function getAvatarColor(id: number): string { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function getInitiales(nom: string, prenom: string): string { return ((nom?.charAt(0) || '') + (prenom?.charAt(0) || '')).toUpperCase(); }
function formatNom(nom: string, prenom: string, abrege = false): string {
  if (!prenom) return nom || '';
  if (abrege) return `${nom} ${prenom.charAt(0).toUpperCase()}.`.trim();
  return `${nom} ${prenom}`.trim();
}
function moisKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }

function heatColor(taux: number): string {
  if (taux === 0) return '#F09595'; if (taux < 40) return '#FAEEDA'; if (taux < 60) return '#C0DD97'; if (taux < 80) return '#5DCAA5'; return '#1D9E75';
}
function heatTextColor(taux: number): string {
  if (taux === 0) return '#791F1F'; if (taux < 40) return '#633806'; if (taux < 60) return '#27500A'; if (taux < 80) return '#085041'; return '#E1F5EE';
}

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatTooltipModule, MatProgressSpinnerModule, MatMenuModule, MatSelectModule,
    MatFormFieldModule, MatChipsModule, MatInputModule, TranslateModule
  ],
  templateUrl: './stats-dashboard.component.html',
  styleUrl: './stats-dashboard.component.scss',
})
export class StatsDashboardComponent implements OnInit, OnDestroy {

  activeView = signal<ActiveView>('heatmap');
  isLoading  = signal(true);
  isMobile   = false;

  // ── Filtres ──
  periodFilter  = signal<PeriodFilter>('5');
  dateDebut     = signal<string>(''); // YYYY-MM-DD
  dateFin       = signal<string>('');   // YYYY-MM-DD
  searchQuery   = signal('');
  posteFilter   = signal('');
  equipeFilter  = signal<number | 'all'>('all');
  sortField     = signal<SortField>('taux');
  sortDir       = signal<SortDir>('desc');
  compareIds    = signal<number[]>([]);

  // ── Données ──
  private allStats     = signal<MembreStats[]>([]);
  private allMonths    = signal<string[]>([]);
  private allMatches   = signal<Match[]>([]);
  readonly allEquipes  = signal<Equipe[]>([]);

  selectedMembre = signal<MembreStats | null>(null);

  // ── Listes des mois visibles en fonction du filtre temporel ──
  readonly visibleMonths = computed(() => {
    const all = this.allMonths();
    const period = this.periodFilter();
    if (period === 'all' || period === 'custom') return all;
    return all.slice(-parseInt(period, 10));
  });

  // ── Filtrage et restriction des statistiques ──
  readonly filteredStats = computed(() => {
    const stats = this.allStats();
    const q = this.searchQuery().toLowerCase().trim();
    const poste = this.posteFilter();
    const equipeId = this.equipeFilter();
    const field = this.sortField();
    const dir = this.sortDir();
    
    const period = this.periodFilter();
    const dDeb = this.dateDebut();
    const dFin = this.dateFin();
    const months = this.visibleMonths();

    return stats
      .map(s => this.restrictToPeriodCustom(s, period, months, dDeb, dFin))
      .filter(s => {
        if (s.totalMatchs === 0) return false; // Exclure si aucun match sur la période sélectionnée
        if (q && !s.nomAffiche.toLowerCase().includes(q)) return false;
        if (poste && s.poste !== poste) return false;
        if (equipeId !== 'all' && s.membreEquipeId !== equipeId) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (field) {
          case 'nom':       cmp = a.nomAffiche.localeCompare(b.nomAffiche); break;
          case 'taux':      cmp = a.tauxPresenceTerrain - b.tauxPresenceTerrain; break;
          case 'tauxJoue':  cmp = a.tauxJoue - b.tauxJoue; break;
          case 'buts':      cmp = a.butsCumules - b.butsCumules; break;
          case 'passes':    cmp = a.passes - b.passes; break;
          case 'mvp':       cmp = a.mvp - b.mvp; break;
        }
        return dir === 'desc' ? -cmp : cmp;
      });
  });

  readonly globalKpis = computed(() => {
    const stats = this.filteredStats();
    const period = this.periodFilter();
    const dDeb = this.dateDebut();
    const dFin = this.dateFin();
    const months = this.visibleMonths();
    
    if (!stats.length) return { totalMatchs: 0, presenceMoy: 0, joueMoy: 0, topJoueur: '', absentCount: 0 };
    
    const totalMatchs = this.allMatches().filter(m => this.isMatchInFilterRange(m, period, months, dDeb, dFin)).length;
    
    const cumulTerrain = stats.reduce((acc, s) => acc + s.matchsAuTerrain, 0);
    const cumulJoues = stats.reduce((acc, s) => acc + s.matchsJoues, 0);
    const cumulMatchsPossibles = stats.reduce((acc, s) => acc + s.totalMatchs, 0);

    const presenceMoy = cumulMatchsPossibles > 0 ? Math.round((cumulTerrain / cumulMatchsPossibles) * 100) : 0;
    const joueMoy = cumulMatchsPossibles > 0 ? Math.round((cumulJoues / cumulMatchsPossibles) * 100) : 0;

    const top = [...stats].sort((a, b) => b.tauxJoue - a.tauxJoue || b.butsCumules - a.butsCumules)[0];
    const absentCount = stats.filter(s => s.tauxPresenceTerrain < 50).length;
    
    return { totalMatchs, presenceMoy, joueMoy, topJoueur: top?.nomAbrege || '', absentCount };
  });

  readonly compareStats = computed(() => {
    const ids = this.compareIds();
    const period = this.periodFilter();
    const dDeb = this.dateDebut();
    const dFin = this.dateFin();
    const months = this.visibleMonths();

    return this.allStats()
      .filter(s => ids.includes(s.membreId))
      .map(s => this.restrictToPeriodCustom(s, period, months, dDeb, dFin));
  });

  readonly postes = computed(() => [...new Set(this.allStats().map(s => s.poste).filter(Boolean))] as string[]);
  readonly heatColor = heatColor;
  readonly heatTextColor = heatTextColor;
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

  private buildStats(matches: Match[], presencesByMatch: Record<number, any[]>): void {
    const membresMap = new Map<number, MembreStats>();
    const monthsSet = new Set<string>();

    matches.forEach(match => {
      const presences = presencesByMatch[match.id] || [];
      presences.forEach(p => {
        if (!p.membre?.id) return;
        const id = p.membre.id;
        if (!membresMap.has(id)) {
          membresMap.set(id, {
            membreId:   id,
            nom:        p.membre.nom || '',
            prenom:     p.membre.prenom || '',
            nomAffiche: formatNom(p.membre.nom, p.membre.prenom),
            nomAbrege:  formatNom(p.membre.nom, p.membre.prenom, true),
            poste:      p.membre.poste || p.poste || undefined,
            membreEquipeId: p.membre.equipe?.id || p.membre.equipe || undefined,
            avatarColor: getAvatarColor(id),
            initiales:   getInitiales(p.membre.nom, p.membre.prenom),
            totalMatchs: 0,
            matchsAuTerrain: 0,
            matchsJoues:     0,
            absences:        0,
            tauxPresenceTerrain: 0,
            tauxJoue:            0,
            butsCumules: 0, butsDansLeJeu: 0, penalties: 0, passes: 0, mvp: 0, hdm: 0,
            parMois: {},
            timeline: [],
          });
        }
      });
    });

    matches.forEach(match => monthsSet.add(moisKey(new Date(match.dateMatch))));
    this.allMonths.set([...monthsSet].sort());

    matches.forEach(match => {
      const presences  = presencesByMatch[match.id] || [];
      const matchDate  = new Date(match.dateMatch);
      const mk         = moisKey(matchDate);
      const result     = this.getMatchResult(match);

      const mapPresentsDuMatch = new Map<number, any>();
      presences.forEach(p => { if (p.membre?.id) mapPresentsDuMatch.set(p.membre.id, p); });

      membresMap.forEach((s, id) => {
        const p = mapPresentsDuMatch.get(id);
        
        // Au terrain = présent sur la feuille de match
        const auTerrain = !!p; 
        // A joué = présent sur la feuille ET propriété aJoue cochée vraie
        const aJoue = p ? !!p.aJoue : false;

        if (!s.parMois[mk]) s.parMois[mk] = { presentTerrain: 0, aJoue: 0, total: 0 };

        s.totalMatchs++;
        s.parMois[mk].total++;

        if (auTerrain) {
          s.matchsAuTerrain++;
          s.parMois[mk].presentTerrain++;
          
          if (aJoue) {
            s.matchsJoues++;
            s.parMois[mk].aJoue++;
            
            // Traitement des buts et pénaltys distincts
            const pButs = p.buts || 0;
            const pPens = p.penalti || p.penalts || 0; // Sécurité sur l'attribut backend
            s.butsDansLeJeu += pButs;
            s.penalties     += pPens;
            s.butsCumules   += (pButs + pPens);

            s.passes += p.passes || 0;
            if (p.isMvp || p.mvp || p.estHommeDuMatchEq) s.mvp++;
            if (p.estHommeDuMatch) s.hdm++;
          }

          s.timeline.push({
            matchId: match.id,
            date:    matchDate,
            result:  result,
            statut:  aJoue ? 'JOUE' : 'TERRAIN_UNIQUEMENT',
            buts:    aJoue ? (p.buts || 0) : 0,
            penalties: aJoue ? (p.penalties || p.penalts || 0) : 0,
            passes:  aJoue ? (p.passes || 0) : 0
          });
        } else {
          s.absences++;
          s.timeline.push({
            matchId: match.id,
            date:    matchDate,
            result:  'ABS',
            statut:  'ABSENT',
            buts: 0, penalties: 0, passes: 0
          });
        }
      });
    });

    membresMap.forEach(s => {
      s.tauxPresenceTerrain = s.totalMatchs > 0 ? Math.round((s.matchsAuTerrain / s.totalMatchs) * 100) : 0;
      s.tauxJoue = s.totalMatchs > 0 ? Math.round((s.matchsJoues / s.totalMatchs) * 100) : 0;
      
      Object.values(s.parMois).forEach(m => {
        m.total > 0 ? Math.round((m.presentTerrain / m.total) * 100) : 0;
      });
      s.timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    this.allStats.set([...membresMap.values()]);
    this.isLoading.set(false);
  }

  // ── Filtrage de date avancé ──
  private isMatchInFilterRange(match: Match, period: PeriodFilter, months: string[], dDeb: string, dFin: string): boolean {
    const mDate = new Date(match.dateMatch);
    if (period === 'custom') {
      if (dDeb && mDate < new Date(dDeb)) return false;
      if (dFin) {
        const targetFin = new Date(dFin);
        targetFin.setHours(23, 59, 59, 999);
        if (mDate > targetFin) return false;
      }
      return true;
    }
    return months.includes(moisKey(mDate));
  }

  private restrictToPeriodCustom(s: MembreStats, period: PeriodFilter, months: string[], dDeb: string, dFin: string): MembreStats {
    const timeline = s.timeline.filter(t => {
      if (period === 'custom') {
        if (dDeb && t.date < new Date(dDeb)) return false;
        if (dFin) {
          const limit = new Date(dFin); limit.setHours(23,59,59,999);
          if (t.date > limit) return false;
        }
        return true;
      }
      return months.includes(moisKey(t.date));
    });

    const total = timeline.length;
    const terrain = timeline.filter(t => t.statut === 'JOUE' || t.statut === 'TERRAIN_UNIQUEMENT').length;
    const joues = timeline.filter(t => t.statut === 'JOUE').length;

    return {
      ...s,
      timeline,
      totalMatchs: total,
      matchsAuTerrain: terrain,
      matchsJoues: joues,
      absences: total - terrain,
      tauxPresenceTerrain: total > 0 ? Math.round((terrain / total) * 100) : 0,
      tauxJoue: total > 0 ? Math.round((joues / total) * 100) : 0,
      butsDansLeJeu: timeline.reduce((acc, t) => acc + t.buts, 0),
      penalties: timeline.reduce((acc, t) => acc + t.penalties, 0),
      butsCumules: timeline.reduce((acc, t) => acc + (t.buts + t.penalties), 0),
      passes: timeline.reduce((acc, t) => acc + t.passes, 0),
    };
  }

  private isMatchPlayed(match: Match): boolean {
    const d = new Date(match.dateMatch); d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    if (d >= t) return false;
    return !!match.rapporteur || !!(match.rapporteurNomOccasionnel?.trim()) ||
           match.scoreEquipe1 != null || match.scoreEquipe2 != null || match.scoreAdversaire != null;
  }

  private getMatchResult(match: Match): 'W' | 'L' | 'N' {
    const s1 = match.scoreEquipe1 ?? match.scoreAdversaire ?? 0;
    const s2 = match.scoreEquipe2 ?? match.scoreAdversaire ?? 0;
    if (s1 === s2) return 'N'; return s1 > s2 ? 'W' : 'L';
  }

  // ── Actions UI ──
  setView(v: ActiveView): void { this.activeView.set(v); }
  setPeriod(p: PeriodFilter | string): void { this.periodFilter.set(p as PeriodFilter); this.selectedMembre.set(null); }
  setSort(field: SortField): void {
    if (this.sortField() === field) { this.sortDir.set(this.sortDir() === 'desc' ? 'asc' : 'desc'); } 
    else { this.sortField.set(field); this.sortDir.set('desc'); }
  }
  selectMembre(s: MembreStats): void { this.selectedMembre.set(this.selectedMembre()?.membreId === s.membreId ? null : s); }
  toggleCompare(id: number): void {
    const ids = this.compareIds();
    if (ids.includes(id)) { this.compareIds.set(ids.filter(i => i !== id)); } 
    else if (ids.length < 3) { this.compareIds.set([...ids, id]); }
  }
  isInCompare(id: number): boolean { return this.compareIds().includes(id); }
  compareColor(id: number): string { const idx = this.compareIds().indexOf(id); return idx >= 0 ? this.compareColors[idx] : ''; }
  clearCompare(): void { this.compareIds.set([]); }
  onClose(): void { if (this.dialogRef) this.dialogRef.close(); }

  getMoisLabel(key: string): string {
    const [, m] = key.split('-');
    const monthNames = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    return monthNames[parseInt(m, 10) - 1] || m;
  }
  getCellForMois(s: MembreStats, mois: string): { taux: number; present: number; total: number } {
    const m = s.parMois[mois];
    return m ? { taux: m.total > 0 ? Math.round((m.presentTerrain / m.total) * 100) : 0, present: m.presentTerrain, total: m.total } : { taux: 0, present: 0, total: 0 };
  }
  getTauxClass(taux: number): string { if (taux >= 80) return 'taux-hi'; if (taux >= 50) return 'taux-mid'; return 'taux-lo'; }
  getTimelineIcon(result: string): string { const map: Record<string, string> = { W: 'V', L: 'D', N: 'N', ABS: 'A' }; return map[result] || '?'; }
  getMaxStat(field: 'butsCumules' | 'passes' | 'mvp'): number { return Math.max(...this.compareStats().map(s => s[field]), 1); }
  barWidth(val: number, max: number): string { return `${Math.round((val / max) * 100)}%`; }

  exportCSV(): void {
    const stats  = this.filteredStats();
    // En-têtes mis à jour avec la séparation Terrain/Joue et Buts/Penaltys
    const header = ['Joueur', 'Poste', 'Matchs Période', 'Présences Terrain', 'Matchs Joués', 'Absences', 'Taux Terrain %', 'Taux Joué %', 'Buts Cumulés', 'Buts (Jeu)', 'Penalties', 'Passes', 'MVP'];
    const rows   = stats.map(s => [
      s.nomAffiche, s.poste || '', s.totalMatchs, s.matchsAuTerrain, s.matchsJoues, s.absences,
      s.tauxPresenceTerrain, s.tauxJoue, s.butsCumules, s.butsDansLeJeu, s.penalties, s.passes, s.mvp
    ]);
    const csv = [header, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url; a.download = `stats_detailles_${this.data.groupeActif?.nom || 'groupe'}.csv`; a.click(); URL.revokeObjectURL(url);
  }
}

