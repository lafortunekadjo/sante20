import { Component, OnInit } from '@angular/core';
import { Membre } from '../../../../core/models/membre.model';
import { ArcElement, BarController, BarElement, CategoryScale, Chart, ChartConfiguration, ChartData, ChartType, DoughnutController, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { MembreService } from '../../../../core/services/membre.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule, MatDateRangeInput } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { StatsService } from '../../../../core/services/stats.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MemberStats, MonthlyStats } from '../../../../core/models/stats.model';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

// Enregistrer les contrôleurs localement
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

interface MonthOption {
  value: string;
  label: string;
  date: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule,
    BaseChartDirective,
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    MatListModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class MDashboardComponent implements OnInit {
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
    sanctions: { paid: { amount: 0, count: 0 }, unpaid: { amount: 0, count: 0 }, yellowCards: 0, redCards: 0 },
    totalPlayingTime: 0,
    monthlyStats: {
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
  
  currentDate: Date = new Date();
  dateRangeForm: FormGroup;
  monthFilterForm: FormGroup;
  isLoading = true;
  selectedMonth: string = '';
  
  donutChartData: ChartData<'doughnut'> = {
    labels: ['Sanctions Payées', 'Sanctions Non Payées'],
    datasets: [{ data: [], backgroundColor: ['#50c4b7', '#ff6b6b'] }],
  };
  
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Passes par match', backgroundColor: '#1a3c6d' }],
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

  constructor(
    private dashboardService: StatsService, 
    private fb: FormBuilder
  ) {
    this.dateRangeForm = this.fb.group({
      start: [null],
      end: [null],
    });
    
    this.monthFilterForm = this.fb.group({
      selectedMonth: [null],
    });
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadAvailableMonths();
  }

  /**
   * Applique le filtre de dates
   */
  applyDateFilter(): void {
    const { start, end } = this.dateRangeForm.value;
    if (start && end && start <= end) {
      this.loadStats(start, end);
    } else {
      console.warn('Invalid date range');
    }
  }

  /**
   * Remet à zéro le filtre de dates
   */
  resetDateFilter(): void {
    this.dateRangeForm.reset();
    this.loadStats();
  }

  /**
   * Gère le changement de mois sélectionné
   */
  onMonthChange(month: string): void {
    this.selectedMonth = month;
    this.loadMonthlyStats(month);
  }

  /**
   * Retourne les mois disponibles filtrés (seulement les mois passés ou en cours de l'année actuelle)
   */
getFilteredAvailableMonths(): any[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  return this.stats.availableMonths.filter(month => {
    const [year, monthNum] = month.value.split('-').map(Number);
    // Ne garder que les mois de l'année actuelle passés ou en cours
    return year === currentYear && monthNum - 1 <= currentMonth;
  });
}

  /**
   * Détermine s'il faut afficher la meilleure équipe ou un message d'égalité
   */
  shouldShowBestTeam(): boolean {
    if (!this.stats.monthlyStats?.bestTeam) {
      return false;
    }

    // Logique d'égalité : si plusieurs équipes ont le même nombre de victoires max
    // Cette logique doit être implémentée côté serveur idéalement
    // Pour l'instant, on suppose que le serveur ne renvoie bestTeam que s'il y a un vrai gagnant
    return true;
  }

  /**
   * Vérifie si des stats mensuelles sont disponibles
   */
  hasMonthlyStats(): boolean {
    return !!this.stats.monthlyStats && this.getFilteredAvailableMonths().length > 0;
  }

  /**
   * Retourne le nombre de mois disponibles filtrés
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
   * Calcule le pourcentage de progression des matches (basé sur un objectif théorique)
   */
  getMatchesProgress(): number {
    const maxMatches = 20; // Objectif théorique de matches par période
    return Math.min((this.stats.matchesPlayed / maxMatches) * 100, 100);
  }

  /**
   * Charge les mois disponibles
   */
  private loadAvailableMonths(): void {
    this.dashboardService.getAvailableMonths().subscribe({
      next: (months) => {
        this.stats.availableMonths = months;
        
        // Sélectionner automatiquement le mois le plus récent disponible
        const filteredMonths = this.getFilteredAvailableMonths();
        if (filteredMonths.length > 0) {
          // Prendre le dernier mois (le plus récent)
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
    
    this.dashboardService.getMonthlyStats(month).subscribe({
      next: (monthlyStats) => {
        console.log(monthlyStats)
        this.stats.monthlyStats = monthlyStats;
        
        // Vérifier s'il y a égalité et ajuster l'affichage si nécessaire
        this.checkForEquality(monthlyStats);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des stats mensuelles:', err);
      }
    });
  }

  /**
   * Vérifie s'il y a égalité entre les équipes
   */
  private checkForEquality(monthlyStats: MonthlyStats): void {
    // Cette logique pourrait être étendue pour détecter les égalités
    // Par exemple, vérifier si plusieurs équipes ont le même nombre de victoires
    // et dans ce cas, ne pas afficher de "meilleure équipe"
    
    if (!monthlyStats.bestTeam) {
      // Pas d'équipe dominante - probablement une égalité
      console.log('Égalité détectée pour le mois:', monthlyStats.monthLabel);
    }
  }

  /**
   * Charge les statistiques principales
   */
  private loadStats(startDate?: Date, endDate?: Date): void {
    this.isLoading = true;
    
    this.dashboardService.getResponsableStats2(startDate, endDate).subscribe({
      next: (data) => {
        console.log(data)
        this.stats = {
          ...this.stats,
          ...data,
          passesByMatch: data.passesByMatch || [],
          recentMatches: data.recentMatches || [],
          topScorers: data.topScorers || [],
          topAssists: data.topAssists || [],
          topAttendance: data.topAttendance || [],
        };
        
        // Mettre à jour les données des graphiques
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
    // Graphique en donut pour les sanctions
    this.donutChartData.datasets[0].data = [
      this.stats.sanctions.paid.count,
      this.stats.sanctions.unpaid.count,
    ];
    
    // Graphique en barres pour les passes
    this.barChartData.labels = this.stats.passesByMatch.map(item => item.match);
    this.barChartData.datasets[0].data = this.stats.passesByMatch.map(item => item.passes);
  }
}