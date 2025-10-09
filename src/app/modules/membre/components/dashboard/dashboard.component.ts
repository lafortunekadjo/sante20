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
    monthlyStats: undefined,
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

  applyDateFilter(): void {
    const { start, end } = this.dateRangeForm.value;
    if (start && end && start <= end) {
      this.loadStats(start, end);
    } else {
      console.warn('Invalid date range');
    }
  }

  resetDateFilter(): void {
    this.dateRangeForm.reset();
    this.loadStats();
  }

  onMonthChange(month: string): void {
    this.selectedMonth = month;
    this.loadMonthlyStats(month);
  }

  private loadAvailableMonths(): void {
    this.dashboardService.getAvailableMonths().subscribe({
      next: (months) => {
        this.stats.availableMonths = months;
        // Sélectionner le mois le plus récent par défaut
        if (months.length > 0) {
          this.selectedMonth = months[0].value;
          this.monthFilterForm.patchValue({ selectedMonth: this.selectedMonth });
          this.loadMonthlyStats(this.selectedMonth);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des mois disponibles:', err);
      }
    });
  }

  private loadMonthlyStats(month: string): void {
    if (!month) return;
    
    this.dashboardService.getMonthlyStats(month).subscribe({
      next: (monthlyStats) => {
        this.stats.monthlyStats = monthlyStats;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des stats mensuelles:', err);
      }
    });
  }

  private loadStats(startDate?: Date, endDate?: Date): void {
    this.isLoading = true;
    console.log(this.isLoading);
    
    this.dashboardService.getResponsableStats2(startDate, endDate).subscribe({
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
        
        this.donutChartData.datasets[0].data = [
          this.stats.sanctions.paid.count,
          this.stats.sanctions.unpaid.count,
        ];
        
        this.barChartData.labels = this.stats.passesByMatch.map(item => item.match);
        this.barChartData.datasets[0].data = this.stats.passesByMatch.map(item => item.passes);
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des statistiques:', err);
        this.isLoading = false;
      }
    });
  }

  // Méthode helper pour déterminer si les stats mensuelles sont disponibles
  hasMonthlyStats(): boolean {
    return !!this.stats.monthlyStats;
  }

  // Méthode helper pour obtenir le taux de victoire formaté
  getWinRateFormatted(): string {
    if (!this.stats.monthlyStats?.bestTeam) return '0%';
    return this.stats.monthlyStats.bestTeam.winRate.toFixed(1) + '%';
  }
}