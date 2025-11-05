import { Component, OnInit } from '@angular/core';
import { ArcElement, BarController, BarElement, CategoryScale, Chart, ChartConfiguration, ChartData, ChartType, DoughnutController, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { ContributionService } from '../../../../core/services/contribution.service';
import { GroupeService } from '../../../../core/services/groupe.service';
import { SanctionService } from '../../../../core/services/sanction.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { StatsService } from '../../../../core/services/stats.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Stats } from '../../../../core/models/stats.model';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
import { map, Observable } from 'rxjs';
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
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    MatListModule, 
    LayoutModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class RDashboardComponent implements OnInit {

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
  };
  currentDate: Date = new Date();
  isLoading = true;
  dateRangeForm: FormGroup;
  donutChartData: ChartData<'doughnut'> = {
    labels: ['Sanctions Payées', 'Sanctions Non Payées'],
    datasets: [{ data: [], backgroundColor: ['#50c4b7', '#ff6b6b'] }],
  };
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Contributions (FCFA)', backgroundColor: '#1a3c6d' }],
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
   gridCols!: Observable<number>;

  constructor(private statService: StatsService, private fb: FormBuilder, private breakpointObserver: BreakpointObserver) {
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
      map((result: { breakpoints: { [x: string]: any; }; }) => {
        if (result.breakpoints[Breakpoints.XSmall]) {
          return 1;
        }
        if (result.breakpoints[Breakpoints.Small]) {
          return 2;
        }
        if (result.breakpoints[Breakpoints.Medium]) {
          return 2;
        }
        return 4;
      })
    );
  }

  

  

  ngOnInit(): void {
    this.loadStats();
  }

  applyDateFilter(): void {
    const { start, end } = this.dateRangeForm.value;
    this.loadStats(start, end);
  }

  resetDateFilter(): void {
    this.dateRangeForm.reset();
    this.loadStats();
  }

  private loadStats(startDate?: Date, endDate?: Date): void {
     this.isLoading = true;
    const groupeId = 1; // Remplacez par l'ID du groupe actuel (à récupérer dynamiquement)
   this.statService.getResponsableStats(startDate, endDate).subscribe({
      next: (data) => {
        this.stats = {
          ...this.stats,
          ...data,
          contributionsByMonth: data.contributionsByMonth || [],
          upcomingMatches: this.sortAndLimitUpcomingMatches(data.upcomingMatches || []),
          topScorers: data.topScorers || [],
          topAssists: data.topAssists || [],
          topAttendance: data.topAttendance || [],
        };
        this.donutChartData.datasets[0].data = [
          this.stats.paidSanctions.count,
          this.stats.unpaidSanctions.count,
        ];
        this.barChartData.labels = this.stats.contributionsByMonth.map(item => item.month);
        this.barChartData.datasets[0].data = this.stats.contributionsByMonth.map(item => item.amount);
        
        this.isLoading = false; // Arrêter le loader
      },
      error: (err) => {
        console.error('Erreur lors du chargement des statistiques:', err);
        this.isLoading = false; // Arrêter le loader même en cas d'erreur
      }
    });
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
      // Ne garder que les matchs futurs (y compris ceux d'aujourd'hui mais pas encore passés)
      const matchDate = new Date(match.date);
      return matchDate >= now;
    })
    .sort((a, b) => {
      // Trier du plus proche au plus éloigné
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3); // Limiter aux 3 premiers
}

}
