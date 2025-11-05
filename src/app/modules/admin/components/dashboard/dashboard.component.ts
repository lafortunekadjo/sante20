import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { CurrencyXAFPipe } from '../../../../core/pipes/currency-xaf.pipe';
import { BaseChartDirective } from 'ng2-charts'; 
import { StatsService,AdminStats } from '../../../../core/services/stats.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ArcElement, BarController, BarElement, CategoryScale, Chart, ChartConfiguration, ChartData, ChartType, DoughnutController, Legend, LinearScale, Title, Tooltip } from 'chart.js/auto';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { MatchFormComponent } from '../../../responsable/components/match-form/match-form.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Groupe } from '../../../../core/models/groupe.model';
import { Match } from '../../../../core/models/match.model';
import { Membre } from '../../../../core/models/membre.model';
import { Sanction } from '../../../../core/models/sanction.model';
import { Contribution } from '../../../../core/models/contribution.model';
import { GroupeService } from '../../../../core/services/groupe.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user';
import { UserService } from '../../../../core/services/user.service';
import { MembreService } from '../../../../core/services/membre.service';
import { MatchService } from '../../../../core/services/match.service';
import { SanctionService } from '../../../../core/services/sanction.service';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { RouterModule } from '@angular/router';

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
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    MatListModule,
    CurrencyXAFPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
@ViewChild('roleChart') roleChartCanvas!: ElementRef<HTMLCanvasElement>;
  stats: any = {};
  dateRangeForm: FormGroup;
  selectedGroup: any = null;
  displayedColumns: string[] = ['id', 'name', 'role'];
  donutChartData: ChartData<'doughnut'> = {
    labels: ['Admins', 'Responsables', 'Membres'],
    datasets: [{ data: [], backgroundColor: ['#50c4b7', '#1a3c6d', '#ff6b6b'] }]
  };
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Contributions par groupe (FCFA)', backgroundColor: '#1a3c6d' }]
  };
  donutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'top' } }
  };
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } }
  };
  donutChartType: ChartType = 'doughnut';
  barChartType: ChartType = 'bar';

  constructor(private dashboardService: StatsService, private fb: FormBuilder) {
    this.dateRangeForm = this.fb.group({
      start: [null],
      end: [null]
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

  selectGroup(group: any): void {
    this.selectedGroup = group;
  }

  private loadStats(startDate?: Date, endDate?: Date): void {
    this.dashboardService.getAdminStats(startDate, endDate).subscribe(data => {
      this.stats = data;
      this.donutChartData.datasets[0].data = [
        this.stats.usersByRole.admin,
        this.stats.usersByRole.responsable,
        this.stats.usersByRole.membre
      ];
      this.barChartData.labels = this.stats.contributionsByGroup.map((item: any) => item.groupName);
      this.barChartData.datasets[0].data = this.stats.contributionsByGroup.map((item: any) => item.amount);
    });
  }


}

