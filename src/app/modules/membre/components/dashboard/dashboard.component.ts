import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatBadgeModule } from '@angular/material/badge';

// Charts
import { 
  ArcElement, BarController, BarElement, CategoryScale, 
  Chart, ChartConfiguration, ChartData, ChartType, 
  DoughnutController, Legend, LinearScale, Title, Tooltip 
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

// Services
import { StatsService } from '../../../../core/services/stats.service';
import { Exercice, FinancesService } from '../../../../core/services/finances.service';
import { AuthService } from '../../../../core/services/auth.service';

// Models
import { MemberStats, MonthlyStats } from '../../../../core/models/stats.model';

// i18n
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { PubliciteFeedComponent } from '../../../publicite/publicite-feed/publicite-feed.component';
import { GroupeService } from '../../../../core/services/groupe.service';
import { PubliciteBannerComponent } from '../../../publicite/publicite-banner/publicite-banner.component';

// Register Chart.js components
Chart.register(
  BarController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Interfaces
interface MonthOption {
  value: string;
  label: string;
  date: Date;
}

// interface Exercice {
//   id: number;
//   nom: string;
//   dateDebut: string;
//   dateFin: string;
//   actif: boolean;
//   cloture: boolean;
// }

type FilterMode = 'season' | 'dateRange';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    // Material
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    MatListModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatBadgeModule,
    // Charts
    BaseChartDirective,
    // i18n
    TranslateModule,
    PubliciteFeedComponent,
    PubliciteBannerComponent
  ],
    animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class MDashboardComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();

  // États
  isLoading = true;
  isLoadingExercices = false;
  currentDate: Date = new Date();

  // Mode de filtrage
  filterMode: FilterMode = 'season';

  // Exercices (Saisons)
  exercices: Exercice[] = [];
  selectedExerciceId: number | null = null;
  currentExercice: Exercice | null = null;

  // Formulaires
  dateRangeForm: FormGroup;
  monthFilterForm: FormGroup;
  
  // Mois sélectionné
  selectedMonth: string = '';

  // Statistiques
  stats: MemberStats = {
    matchesPlayed: 0,
    topScorers: [],
    topAttendance: [],
    successfulPasses: 0,
    recentMatches: [],
    topAssists: [],
    passesByMatch: [],
    totalPasses: 0,
    goalsScored: 0,
    sanctions: { 
      paid: { amount: 0, count: 0 }, 
      unpaid: { amount: 0, count: 0 }, 
      yellowCards: 0, 
      redCards: 0 
    },
    totalPlayingTime: 0,
    monthlyStats:{
      month: '',
      monthLabel: '',
      bestTeam: {
        teamName: '',
        wins: 0,
        losses: 0,
        draws: 0,
        goalsScored: 0,
        goalsConceded: 0,
        matchesPlayed: 0,
        winRate: 0
      },
      topScorer: {
        playerName: '',
        teamName: '',
        goals: 0,
        assists: 0,
        appearances: 0,
        manOfTheMatchCount: 0
      },
      topAssister: {
        playerName: '',
        teamName: '',
        goals: 0,
        assists: 0,
        appearances: 0,
        manOfTheMatchCount: 0
      },
      mostAppearances: {
        playerName: '',
        teamName: '',
        goals: 0,
        assists: 0,
        appearances: 0,
        manOfTheMatchCount: 0
      },
      mostManOfTheMatch: {
        playerName: '',
        teamName: '',
        goals: 0,
        assists: 0,
        appearances: 0,
        manOfTheMatchCount: 0
      }
    },
    availableMonths: [],
  };

  // Configuration des graphiques
  donutChartData: ChartData<'doughnut'> = {
    labels: ['Sanctions Payées', 'Sanctions Non Payées'],
    datasets: [{ data: [], backgroundColor: ['#10b981', '#ef4444'] }],
  };

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Passes par match', backgroundColor: '#667eea' }],
  };

  donutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
  };

  donutChartType: ChartType = 'doughnut';
  barChartType: ChartType = 'bar';
  userVille: any;

  constructor(
    private dashboardService: StatsService,
    private financesService: FinancesService,
    private authService: AuthService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private groupeService: GroupeService
  ) {
    this.dateRangeForm = this.fb.group({
      start: [null],
      end: [null],
    });

    this.monthFilterForm = this.fb.group({
      selectedMonth: [null],
    });
  }

  // ============ LIFECYCLE ============

  ngOnInit(): void {
    this.loadExercices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ CHARGEMENT DES EXERCICES ============

  /**
   * Charge la liste des exercices (saisons) du groupe
   */
private loadExercices(): void {
  this.isLoadingExercices = true;
  const groupeId = this.authService.getGroupe();
  const userId = this.authService.getUserId();

  if (!groupeId) {
    console.error('Groupe ID not found');
    this.isLoadingExercices = false;
    this.isLoading = false;
    return;
  }

  // Utilisation de forkJoin pour lancer les deux appels en parallèle
  forkJoin({
    exercices: this.financesService.getExercicesByGroupe(groupeId),
    groupe: this.groupeService.getGroupe(userId)
  })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ exercices, groupe }) => { // Déstructuration du résultat
        // 1. Gérer les exercices
        if (exercices) {
          this.exercices = exercices.sort((a, b) => 
            new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime()
          );

          // Trouver l'exercice actif (non clôturé)
          this.currentExercice = this.exercices.find(e => e.actif && !e.cloture) || null;
          
          // Sélectionner l'exercice actif par défaut ou le plus récent
          if (this.currentExercice) {
            this.selectedExerciceId = this.currentExercice.id;
          } else if (this.exercices.length > 0) {
            this.selectedExerciceId = this.exercices[0].id;
          }
        }

        // 2. Gérer les infos de ville du groupe
        if (groupe && groupe.ville) {
          this.userVille = groupe.ville.nom;
        }

        // 3. Finalisation du chargement
        this.isLoadingExercices = false;
        this.loadStatsForSelectedExercice();
        this.loadAvailableMonths();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.isLoadingExercices = false;
        this.isLoading = false;
      }
    });
}

  // ============ GESTION DU MODE DE FILTRAGE ============

  /**
   * Change le mode de filtrage (saison ou plage de dates)
   */
  onFilterModeChange(mode: FilterMode): void {
    this.filterMode = mode;
    
    if (mode === 'season' && this.selectedExerciceId) {
      this.loadStatsForSelectedExercice();
    }
  }

  /**
   * Gère le changement d'exercice/saison
   */
  onExerciceChange(exerciceId: number): void {
    this.selectedExerciceId = exerciceId;
    
    if (this.filterMode === 'season') {
      this.loadStatsForSelectedExercice();
      this.loadAvailableMonthsForExercice(exerciceId);
    }
  }

  /**
   * Charge les stats pour l'exercice sélectionné
   */
  private loadStatsForSelectedExercice(): void {
    if (!this.selectedExerciceId) {
      this.isLoading = false;
      return;
    }

    const exercice = this.exercices.find(e => e.id === this.selectedExerciceId);
    if (!exercice) {
      this.isLoading = false;
      return;
    }

    const startDate = new Date(exercice.dateDebut);
    const endDate = new Date(exercice.dateFin);

    this.loadStats(startDate, endDate);
  }

  /**
   * Retourne l'exercice actuellement sélectionné
   */
  getSelectedExercice(): Exercice | undefined {
    return this.exercices.find(e => e.id === this.selectedExerciceId);
  }

  /**
   * Formate les dates d'un exercice pour l'affichage
   */
  formatExercicePeriod(exercice: Exercice): string {
    const start = new Date(exercice.dateDebut).toLocaleDateString('fr-FR', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
    const end = new Date(exercice.dateFin).toLocaleDateString('fr-FR', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
    return `${start} - ${end}`;
  }

  /**
   * Vérifie si un exercice est l'exercice actif actuel
   */
  isCurrentExercice(exercice: Exercice): boolean {
    return exercice.actif && !exercice.cloture;
  }

  // ============ FILTRAGE PAR DATES ============

  /**
   * Applique le filtre de dates personnalisé
   */
  applyDateFilter(): void {
    const { start, end } = this.dateRangeForm.value;
    
    if (start && end && start <= end) {
      this.filterMode = 'dateRange';
      this.loadStats(start, end);
    } else {
      console.warn('Plage de dates invalide');
    }
  }

  /**
   * Réinitialise le filtre et revient à la saison en cours
   */
  resetDateFilter(): void {
    this.dateRangeForm.reset();
    this.filterMode = 'season';
    
    // Revenir à l'exercice actif
    if (this.currentExercice) {
      this.selectedExerciceId = this.currentExercice.id;
    }
    
    this.loadStatsForSelectedExercice();
  }

  /**
   * Vérifie si un filtre de dates est actif
   */
  hasDateFilter(): boolean {
    const { start, end } = this.dateRangeForm.value;
    return !!(start && end);
  }

  // ============ GESTION DES MOIS ============

  /**
   * Gère le changement de mois sélectionné
   */
  onMonthChange(month: string): void {
    this.selectedMonth = month;
    this.loadMonthlyStats(month);
  }

  /**
   * Retourne les mois disponibles filtrés selon l'exercice sélectionné
   */
  getFilteredAvailableMonths(): any[] {
    if (!this.selectedExerciceId) {
      return this.filterCurrentYearMonths();
    }

    const exercice = this.exercices.find(e => e.id === this.selectedExerciceId);
    if (!exercice) {
      return this.filterCurrentYearMonths();
    }

    const exerciceStart = new Date(exercice.dateDebut);
    const exerciceEnd = new Date(exercice.dateFin);
    const now = new Date();

    return this.stats.availableMonths.filter(month => {
      const [year, monthNum] = month.value.split('-').map(Number);
      const monthDate = new Date(year, monthNum - 1, 1);
      
      // Le mois doit être dans la période de l'exercice
      const isInExercice = monthDate >= new Date(exerciceStart.getFullYear(), exerciceStart.getMonth(), 1) &&
                           monthDate <= new Date(exerciceEnd.getFullYear(), exerciceEnd.getMonth(), 1);
      
      // Et ne pas être dans le futur
      const isNotFuture = monthDate <= now;
      
      return isInExercice && isNotFuture;
    });
  }

  /**
   * Filtre les mois de l'année courante (fallback)
   */
  private filterCurrentYearMonths(): any[] {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    return this.stats.availableMonths.filter(month => {
      const [year, monthNum] = month.value.split('-').map(Number);
      return year === currentYear && monthNum - 1 <= currentMonth;
    });
  }

  /**
   * Charge les mois disponibles pour un exercice spécifique
   */
  private loadAvailableMonthsForExercice(exerciceId: number): void {
    // Recharger les mois et filtrer
    this.dashboardService.getAvailableMonths()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (months) => {
          this.stats.availableMonths = months;
          
          const filteredMonths = this.getFilteredAvailableMonths();
          if (filteredMonths.length > 0) {
            this.selectedMonth = filteredMonths[filteredMonths.length - 1].value;
            this.monthFilterForm.patchValue({ selectedMonth: this.selectedMonth });
            this.loadMonthlyStats(this.selectedMonth);
          } else {
            this.stats.monthlyStats = null;
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des mois:', err);
        }
      });
  }

  // ============ HELPERS UI ============

  /**
   * Détermine s'il faut afficher la meilleure équipe
   */
  shouldShowBestTeam(): boolean {
    return !!(this.stats.monthlyStats?.bestTeam && this.stats.monthlyStats.bestTeam.teamName);
  }

  /**
   * Vérifie si des stats mensuelles sont disponibles
   */
  hasMonthlyStats(): boolean {
    return !!this.stats.monthlyStats && this.getFilteredAvailableMonths().length > 0;
  }

  /**
   * Retourne le nombre de mois disponibles
   */
  getAvailableMonthsCount(): number {
    return this.getFilteredAvailableMonths().length;
  }

  /**
   * Formate le taux de victoire
   */
  getWinRateFormatted(): string {
    if (!this.stats.monthlyStats?.bestTeam) return '0%';
    return Math.round(this.stats.monthlyStats.bestTeam.winRate) + '%';
  }

  /**
   * Calcule le nombre total de sanctions
   */
  getTotalSanctions(): number {
    if (!this.stats.sanctions) return 0;
    return this.stats.sanctions.paid.count + this.stats.sanctions.unpaid.count;
  }

  /**
   * Calcule le pourcentage de progression des matches
   */
  getMatchesProgress(): number {
    const maxMatches = 20;
    return Math.min((this.stats.matchesPlayed / maxMatches) * 100, 100);
  }

  /**
   * Retourne le libellé de la période actuelle
   */
  getCurrentPeriodLabel(): string {
    if (this.filterMode === 'dateRange' && this.hasDateFilter()) {
      const { start, end } = this.dateRangeForm.value;
      const startStr = start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      const endStr = end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    }
    
    const exercice = this.getSelectedExercice();
    if (exercice) {
      return exercice.libelle;
    }
    
    return 'Période non définie';
  }

  // ============ CHARGEMENT DES DONNÉES ============

  /**
   * Charge les mois disponibles
   */
  private loadAvailableMonths(): void {
    this.dashboardService.getAvailableMonths()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (months) => {
          this.stats.availableMonths = months;

          const filteredMonths = this.getFilteredAvailableMonths();
          if (filteredMonths.length > 0) {
            this.selectedMonth = filteredMonths[filteredMonths.length - 1].value;
            this.monthFilterForm.patchValue({ selectedMonth: this.selectedMonth });
            this.loadMonthlyStats(this.selectedMonth);
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des mois disponibles:', err);
        }
      });
  }

  /**
   * Charge les statistiques mensuelles pour un mois donné
   */
  private loadMonthlyStats(month: string): void {
    if (!month) return;

    this.dashboardService.getMonthlyStats(month)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (monthlyStats) => {
          console.log(monthlyStats)
          this.stats.monthlyStats = monthlyStats;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des stats mensuelles:', err);
        }
      });
  }

  /**
   * Charge les statistiques principales
   */
  private loadStats(startDate?: Date, endDate?: Date): void {
    this.isLoading = true;

    this.dashboardService.getResponsableStats2(startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = {
            ...this.stats,
            ...data,
            passesByMatch: data.passesByMatch || [],
            recentMatches: data.recentMatches || [],
            topScorers: data.topScorers || [],
            topAssists: data.topAssists || [],
            topAttendance: data.topAttendance || [],
          };

          this.updateChartData();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des statistiques:', err);
          this.isLoading = false;
        }
      });
  }

  /**
   * Met à jour les données des graphiques
   */
  private updateChartData(): void {
    // Graphique donut pour les sanctions
    this.donutChartData.datasets[0].data = [
      this.stats.sanctions.paid.count,
      this.stats.sanctions.unpaid.count,
    ];

    // Graphique barres pour les passes
    this.barChartData.labels = this.stats.passesByMatch.map(item => item.match);
    this.barChartData.datasets[0].data = this.stats.passesByMatch.map(item => item.passes);
  }
}