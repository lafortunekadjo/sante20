import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { LayoutModule, BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

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
import { Stats } from '../../../../core/models/stats.model';

// i18n
import { TranslateModule } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';

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

// Interface Exercice
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
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    LayoutModule,
    // Charts
    BaseChartDirective,
    // i18n
    TranslateModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class RDashboardComponent implements OnInit, OnDestroy {

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

  // Formulaire de filtre par dates
  dateRangeForm: FormGroup;

  // Statistiques
  stats: Stats = {
    memberCount: 0,
    totalContributions: 0,
    paidSanctions: { amount: 0, count: 0 },
    unpaidSanctions: { amount: 0, count: 0 },
    sanctionsPercentage: 0,
    contributionsByMonth: [],
    upcomingMatches: [],
    topScorers: [],
    topAssists: [],
    topAttendance: [],
    totalDues: 0,
    totalFines: 0,
    totalMatches: 0,
    avgGoalsPerMatch: 0,
    activePlayers: 0,
    participationRate: 0,
    bestPerformingTeam: '',
    teamComparison: []
  };

  // Configuration des graphiques
  donutChartData: ChartData<'doughnut'> = {
    labels: ['Sanctions Payées', 'Sanctions Non Payées'],
    datasets: [{ data: [], backgroundColor: ['#10b981', '#ef4444'] }],
  };
  
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Contributions (FCFA)', backgroundColor: '#667eea' }],
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

  // Grid responsive
  gridCols!: Observable<number>;

  constructor(
    private statService: StatsService,
    private financesService: FinancesService,
    private authService: AuthService,
    private fb: FormBuilder,
    private breakpointObserver: BreakpointObserver
  ) {
    this.dateRangeForm = this.fb.group({
      start: [null],
      end: [null],
    });

    // Configuration de la grille responsive
    this.gridCols = this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ]).pipe(
      map((result) => {
        if (result.breakpoints[Breakpoints.XSmall]) return 1;
        if (result.breakpoints[Breakpoints.Small]) return 2;
        if (result.breakpoints[Breakpoints.Medium]) return 2;
        return 4;
      })
    );
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

    if (!groupeId) {
      console.error('Groupe ID not found');
      this.isLoadingExercices = false;
      this.loadStats();
      return;
    }

    this.financesService.getExercicesByGroupe(groupeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exercices) => {
          // Trier par date de début décroissante (plus récent en premier)
          this.exercices = exercices.sort((a, b) => 
            new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime()
          );

          // Trouver l'exercice actif (non clôturé)
          this.currentExercice = this.exercices.find(e => e.actif && !e.cloture) || null;
          
          // Sélectionner l'exercice actif par défaut
          if (this.currentExercice) {
            this.selectedExerciceId = this.currentExercice.id;
          } else if (this.exercices.length > 0) {
            // Sinon, prendre le plus récent
            this.selectedExerciceId = this.exercices[0].id;
          }

          this.isLoadingExercices = false;

          // Charger les stats avec l'exercice sélectionné
          this.loadStatsForSelectedExercice();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des exercices:', err);
          this.isLoadingExercices = false;
          // Charger les stats sans filtre d'exercice
          this.loadStats();
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
    }
  }

  /**
   * Charge les stats pour l'exercice sélectionné
   */
  private loadStatsForSelectedExercice(): void {
    if (!this.selectedExerciceId) {
      this.loadStats();
      return;
    }

    const exercice = this.exercices.find(e => e.id === this.selectedExerciceId);
    if (!exercice) {
      this.loadStats();
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
    
    return 'Toutes les données';
  }

  // ============ CHARGEMENT DES STATISTIQUES ============

  /**
   * Charge les statistiques principales
   */
  private loadStats(startDate?: Date, endDate?: Date): void {
    this.isLoading = true;

    this.statService.getResponsableStats(startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = {
            ...this.stats,
            ...data,
            contributionsByMonth: data.contributionsByMonth || [],
            upcomingMatches: this.sortAndLimitUpcomingMatches(data.upcomingMatches || []),
            topScorers: data.topScorers || [],
            topAssists: data.topAssists || [],
            topAttendance: data.topAttendance || [],
            
            // Métriques sportives
            totalMatches: data.totalMatches || 0,
            avgGoalsPerMatch: data.avgGoalsPerMatch || 0,
            activePlayers: data.activePlayers || 0,
            participationRate: data.participationRate || 0,
            bestPerformingTeam: data.bestPerformingTeam || '',
            bestTeamTotalGoals: data.bestTeamTotalGoals || 0,
            teamComparison: data.teamComparison || [],
            
            // Finances
            totalDues: data.totalDues || 0,
            totalFines: data.totalFines || 0,
            
            totalSanction: data.unpaidSanctions
          };

          console.log('Stats chargées:', this.stats);

          // Mise à jour des graphiques
          this.updateCharts();

          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des statistiques:', err);
          this.isLoading = false;
        }
      });
  }

  /**
   * Met à jour les graphiques
   */
  private updateCharts(): void {
    // Graphique donut pour les sanctions
    this.donutChartData.datasets[0].data = [
      this.stats.paidSanctions.count,
      this.stats.unpaidSanctions.count,
    ];

    // Graphique barres pour les contributions
    this.barChartData.labels = this.stats.contributionsByMonth.map(item => item.month);
    this.barChartData.datasets[0].data = this.stats.contributionsByMonth.map(item => item.amount);
  }

  /**
   * Trie et limite les matchs à venir aux 3 plus proches
   */
  private sortAndLimitUpcomingMatches(matches: any[]): any[] {
    if (!matches || matches.length === 0) {
      return [];
    }

    const now = new Date();

    return matches
      .filter(match => {
        const matchDate = new Date(match.date);
        return matchDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3);
  }

  /**
   * Crée un graphique de comparaison des équipes (optionnel)
   */
  private createTeamComparisonChart(): void {
    if (this.stats.teamComparison && this.stats.teamComparison.length > 0) {
      console.log('Données pour graphique équipes:', this.stats.teamComparison);
    }
  }
}