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
import { MemberStats } from '../../../../core/models/stats.model';
import { MatTabsModule } from '@angular/material/tabs';

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
     
    
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})

export class MDashboardComponent implements OnInit{
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
  };
  dateRangeForm: FormGroup;
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

  constructor(private dashboardService: StatsService, private fb: FormBuilder) {
    this.dateRangeForm = this.fb.group({
      start: [null],
      end: [null],
    });
  }

  ngOnInit(): void {
    this.loadStats();
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

  private loadStats(startDate?: Date, endDate?: Date): void {
    this.dashboardService.getMembreStats(startDate, endDate).subscribe(data => {
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
    });
  }
}
