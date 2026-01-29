import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, ChartData } from 'chart.js';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { CurrencyXAFPipe } from '../../../../core/pipes/currency-xaf.pipe';
import { AdminService } from '../../../../core/services/admin.service';


// Interfaces
interface AdminStats {
  totalGroups: number;
  totalUsers: number;
  totalContributions: number;
  totalMatches: number;
  paidSanctions: { amount: number | null; count: number };
  unpaidSanctions?: { amount: number; count: number };
  usersByRole: { admin: number; responsable: number; membre: number };
  usersByGroup: GroupUsers[];
  contributionsByGroup: ContributionByGroup[];
  recentActivity: Activity[];
  // Nouvelles stats
  activeGroups: number;
  newUsersThisMonth: number;
  matchesThisMonth: number;
  avgContributionPerGroup: number;
  topContributingGroups: TopGroup[] | null;
  groupGrowth: GrowthData[];
  sanctionsEvolution: SanctionEvolution[];
  matchesEvolution: MatchEvolution[];
}

interface GroupUsers {
  groupId: number;
  groupName: string;
  userCount: number;
  users: UserInfo[];
  status: string;
  createdAt: string;
}

interface UserInfo {
  id: number;
  name: string;
  role: string;
  email?: string;
  status?: string;
}

interface ContributionByGroup {
  groupName: string;
  totalAmount: number;
  contributionCount: number;
}

interface Activity {
  date: string;
  action: string;
  type: string;
  groupName?: string;
}

interface TopGroup {
  groupName: string;
  totalContributions: number;
  memberCount: number;
  matchCount: number;
}

interface GrowthData {
  month: string;
  groups: number;
  users: number;
}

interface SanctionEvolution {
  month: string;
  paid: number;
  unpaid: number;
}

interface MatchEvolution {
  month: string;
  count: number;
}

type FilterMode = 'period' | 'dateRange';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    MatTabsModule,
    MatBadgeModule,
    BaseChartDirective,
    CurrencyXAFPipe
  ],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('countUp', [
      transition(':increment', [
        style({ transform: 'scale(1.1)', color: '#22c55e' }),
        animate('300ms ease-out', style({ transform: 'scale(1)', color: '*' }))
      ])
    ])
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  donutChartType = 'doughnut' as const; // Plus simple et sûr
  donutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  
  barChartType = 'bar' as const;
  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  
  lineChartType = 'line' as const;
  lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  
  // États
  isLoading = true;
  filterMode: FilterMode = 'period';
  selectedPeriod = 'thisYear';
  dateRangeForm: FormGroup;
  
  // Statistiques
  stats: AdminStats = this.getEmptyStats();
  previousStats: AdminStats = this.getEmptyStats();
  
  // Table utilisateurs
  selectedGroup: GroupUsers | null = null;
  usersDataSource = new MatTableDataSource<UserInfo>([]);
  displayedColumns = ['id', 'name', 'role', 'status', 'actions'];
  
  // Graphiques
  // donutChartType: ChartType = 'doughnut';
  // donutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  donutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  
// 1. Force la valeur à être strictement 'bar' avec "as const"
// barChartType: ChartType = 'bar' as const;

// 2. Le reste de ta configuration est correct
// barChartData: ChartData<'bar'> = { labels: [], datasets: [] };

barChartOptions: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true }
  }
};
  
  // lineChartType: ChartType = 'line';
  // lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  
  sanctionsChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  
  // Périodes prédéfinies
  periods = [
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'thisWeek', label: 'Cette semaine' },
    { value: 'thisMonth', label: 'Ce mois' },
    { value: 'thisQuarter', label: 'Ce trimestre' },
    { value: 'thisYear', label: 'Cette année' },
    { value: 'lastYear', label: 'Année dernière' },
    { value: 'all', label: 'Tout' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.dateRangeForm = this.fb.group({
      start: [null],
      end: [null]
    });
  }

  ngOnInit(): void {
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ CHARGEMENT DES DONNÉES ============

  private getEmptyStats(): AdminStats {
    return {
      totalGroups: 0,
      totalUsers: 0,
      totalContributions: 0,
      totalMatches: 0,
      paidSanctions: { amount: 0, count: 0 },
      unpaidSanctions: { amount: 0, count: 0 },
      usersByRole: { admin: 0, responsable: 0, membre: 0 },
      usersByGroup: [],
      contributionsByGroup: [],
      recentActivity: [],
      activeGroups: 0,
      newUsersThisMonth: 0,
      matchesThisMonth: 0,
      avgContributionPerGroup: 0,
      topContributingGroups: [],
      groupGrowth: [],
      sanctionsEvolution: [],
      matchesEvolution: []
    };
  }

  loadStats(): void {
    this.isLoading = true;
    const { startDate, endDate } = this.getDateRange();
    
    this.adminService.getAdminStats(startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.previousStats = { ...this.stats };
          this.stats = data;
          this.updateCharts();
          this.setupTable();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur chargement stats admin:', err);
          this.isLoading = false;
        }
      });
  }

  private getDateRange(): { startDate: string | null; endDate: string | null } {
    if (this.filterMode === 'dateRange') {
      const start = this.dateRangeForm.get('start')?.value;
      const end = this.dateRangeForm.get('end')?.value;
      return {
        startDate: start ? this.formatDate(start) : null,
        endDate: end ? this.formatDate(end) : null
      };
    }
    
    const today = new Date();
    let startDate: Date;
    let endDate = new Date();
    
    switch (this.selectedPeriod) {
      case 'today':
        startDate = new Date(today);
        break;
      case 'thisWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'lastYear':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'all':
      default:
        return { startDate: null, endDate: null };
    }
    
    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate)
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // ============ FILTRES ============

  onFilterModeChange(mode: FilterMode): void {
    this.filterMode = mode;
    if (mode === 'period') {
      this.loadStats();
    }
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.loadStats();
  }

  applyDateFilter(): void {
    if (this.dateRangeForm.get('start')?.value && this.dateRangeForm.get('end')?.value) {
      this.loadStats();
    }
  }

  resetDateFilter(): void {
    this.dateRangeForm.reset();
    this.filterMode = 'period';
    this.selectedPeriod = 'thisYear';
    this.loadStats();
  }

  // ============ GRAPHIQUES ============

  private updateCharts(): void {
    this.updateDonutChart();
    this.updateBarChart();
    this.updateLineChart();
    this.updateSanctionsChart();
  }

  private updateDonutChart(): void {
    const roles = this.stats.usersByRole;
    this.donutChartData = {
      labels: ['Administrateurs', 'Responsables', 'Membres'],
      datasets: [{
        data: [roles.admin, roles.responsable, roles.membre],
        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
        borderWidth: 0
      }]
    };
  }

  private updateBarChart(): void {
    const contributions = this.stats.contributionsByGroup || [];
    this.barChartData = {
      labels: contributions.map(c => c.groupName),
      datasets: [{
        data: contributions.map(c => c.totalAmount),
        backgroundColor: '#3b82f6',
        borderRadius: 8
      }]
    };
  }

  private updateLineChart(): void {
    const growth = this.stats.groupGrowth || [];
    this.lineChartData = {
      labels: growth.map(g => g.month),
      datasets: [
        {
          label: 'Groupes',
          data: growth.map(g => g.groups),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Utilisateurs',
          data: growth.map(g => g.users),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  private updateSanctionsChart(): void {
    const evolution = this.stats.sanctionsEvolution || [];
    this.sanctionsChartData = {
      labels: evolution.map(e => e.month),
      datasets: [
        {
          label: 'Payées',
          data: evolution.map(e => e.paid),
          backgroundColor: '#22c55e',
          borderRadius: 4
        },
        {
          label: 'Non payées',
          data: evolution.map(e => e.unpaid),
          backgroundColor: '#ef4444',
          borderRadius: 4
        }
      ]
    };
  }

  // ============ TABLE ============

  private setupTable(): void {
    if (this.stats.usersByGroup && this.stats.usersByGroup.length > 0) {
      this.selectedGroup = this.stats.usersByGroup[0];
      this.usersDataSource.data = this.selectedGroup.users || [];
    }
  }

  selectGroup(group: GroupUsers): void {
    this.selectedGroup = group;
    this.usersDataSource.data = group.users || [];
    if (this.paginator) {
      this.usersDataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.usersDataSource.sort = this.sort;
    }
  }

  // ============ CALCULS ============

  getTotalSanctionsAmount(): number {
    return (this.stats.paidSanctions?.amount || 0) + (this.stats.unpaidSanctions?.amount || 0);
  }

  getSanctionsPaidPercentage(): number {
    const total = this.getTotalSanctionsAmount();
    if (total === 0) return 0;
    return Math.round((this.stats.paidSanctions?.amount || 0) / total * 100);
  }

  getVariation(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  getVariationClass(current: number, previous: number): string {
    const variation = this.getVariation(current, previous);
    if (variation > 0) return 'positive';
    if (variation < 0) return 'negative';
    return 'neutral';
  }

  // ============ HELPERS ============

  getCurrentPeriodLabel(): string {
    if (this.filterMode === 'dateRange') {
      const start = this.dateRangeForm.get('start')?.value;
      const end = this.dateRangeForm.get('end')?.value;
      if (start && end) {
        return `${start.toLocaleDateString('fr-FR')} - ${end.toLocaleDateString('fr-FR')}`;
      }
      return 'Sélectionner une période';
    }
    return this.periods.find(p => p.value === this.selectedPeriod)?.label || 'Cette année';
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'group_created': return 'groups';
      case 'user_joined': return 'person_add';
      case 'match_played': return 'sports_soccer';
      case 'contribution': return 'payments';
      case 'sanction': return 'gavel';
      default: return 'history';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'group_created': return 'primary';
      case 'user_joined': return 'success';
      case 'match_played': return 'info';
      case 'contribution': return 'warning';
      case 'sanction': return 'error';
      default: return 'default';
    }
  }

  getRoleClass(role: string): string {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return 'role-admin';
      case 'RESPONSABLE': return 'role-responsable';
      case 'MEMBRE': return 'role-membre';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'actif': return 'status-active';
      case 'inactif': return 'status-inactive';
      case 'suspendu': return 'status-suspended';
      default: return '';
    }
  }

  // ============ EXPORT ============

  exportStats(): void {
    // Implémenter l'export Excel/PDF des statistiques
    console.log('Export stats:', this.stats);
  }

  refreshStats(): void {
    this.loadStats();
  }
}