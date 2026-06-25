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
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSliderModule } from '@angular/material/slider';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, ChartData, ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip } from 'chart.js';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';

import { AdminAnalyticsService } from '../../../../core/services/admin-analytics.service';

// ============ INTERFACES ============

interface PlatformKPIs {
  // Acquisition
  totalGroupes: number;
  newGroupesThisMonth: number;
  groupesGrowthRate: number;
  totalVisitors: number;
  totalSignups: number;
  conversionRate: number;
  
  // Activation
  totalUsers: number;
  activeUsers: number; // Connectés au moins 1x/semaine
  activeUsersRate: number;
  newUsersThisMonth: number;
  usersWithCompleteProfile: number;
  profileCompletionRate: number;
  
  // Engagement
  totalMatches: number;
  matchesThisMonth: number;
  engagedGroupes: number; // Groupes avec >= X matchs/mois
  engagementRate: number;
  avgMatchesPerGroup: number;
  avgMembersPerGroup: number;
  
  // Rétention
  retentionRate7Days: number;
  retentionRate30Days: number;
  churnedGroupes: number; // Groupes inactifs depuis 30j+
  churnRate: number;
}

interface GroupeEngagement {
  id: number;
  nom: string;
  membresCount: number;
  activeMembers: number;
  matchesThisMonth: number;
  lastActivityDate: string;
  engagementScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface GrowthData {
  period: string;
  groupes: number;
  users: number;
  matches: number;
  activeUsers: number;
}

interface ConversionFunnel {
  step: string;
  count: number;
  rate: number;
}
  Chart.register(
  LineController, LineElement, PointElement, LinearScale, CategoryScale, 
  BarController, BarElement, 
  DoughnutController, ArcElement, 
  Legend, Tooltip
);

@Component({
  selector: 'app-analytics-dashboard',
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
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    MatTabsModule,
    MatSliderModule,
    BaseChartDirective
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
      ]),
      transition(':decrement', [
        style({ transform: 'scale(1.1)', color: '#ef4444' }),
        animate('300ms ease-out', style({ transform: 'scale(1)', color: '*' }))
      ])
    ])
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss'
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  activeTab: 'acquisition'|'engagement'|'retention'|'charts'|'funnel'|'groupes' = 'acquisition';
  
  
  private destroy$ = new Subject<void>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // États
  isLoading = true;
  selectedPeriod = 'thisMonth';
  selectedTab = 0;
  
  // Critères d'engagement configurables
  engagementCriteria = {
    minMatchesPerMonth: 2,
    activeUserDays: 7 // Connecté au moins 1x tous les X jours
  };
  
  // KPIs
  kpis: PlatformKPIs = this.getEmptyKPIs();
  previousKpis: PlatformKPIs = this.getEmptyKPIs();
  
  // Données pour les graphiques
  growthData: GrowthData[] = [];
  conversionFunnel: ConversionFunnel[] = [];
  engagementDistribution: { label: string; count: number; color: string }[] = [];
  
  // Table des groupes
  groupesEngagement: GroupeEngagement[] = [];
  groupesDataSource = new MatTableDataSource<GroupeEngagement>([]);
  groupesColumns = ['nom', 'membresCount', 'activeMembers', 'matchesThisMonth', 'engagementScore', 'status'];
  
  // Graphiques
  // Croissance
 
  growthChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  
  // Engagement
  // ✅ Correction : On verrouille le type à 'doughnut'
engagementChartType: ChartType = 'doughnut' as const;

engagementChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

engagementChartOptions: ChartConfiguration<'doughnut'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' }
  }
};

    retentionChartType = 'bar' as const;
    retentionChartData: ChartData<'bar'> = { labels: [], datasets: [] };
    
    growthChartType = 'line' as const;
    growthChartData: ChartData<'line'> = { labels: [], datasets: [] };


  retentionChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { 
        beginAtZero: true,
        max: 100,
        ticks: { callback: (value) => value + '%' }
      }
    }
  };
  
  // Activité par jour de la semaine
 // Assure-toi que le type est verrouillé sur 'bar'
activityByDayChartType: ChartType = 'bar' as const;

// Et que les données sont aussi typées pour 'bar'
activityByDayChartData: ChartData<'bar'> = { labels: [], datasets: [] };

// Et les options également
activityByDayChartOptions: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  // ... tes autres options
};
  
  // Périodes
  periods = [
    { value: 'thisWeek', label: 'Cette semaine' },
    { value: 'thisMonth', label: 'Ce mois' },
    { value: 'thisQuarter', label: 'Ce trimestre' },
    { value: 'thisYear', label: 'Cette année' },
    { value: 'last30Days', label: '30 derniers jours' },
    { value: 'last90Days', label: '90 derniers jours' }
  ];

  constructor(
    private analyticsService: AdminAnalyticsService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ CHARGEMENT ============

  private getEmptyKPIs(): PlatformKPIs {
    return {
      totalGroupes: 0,
      newGroupesThisMonth: 0,
      groupesGrowthRate: 0,
      totalVisitors: 0,
      totalSignups: 0,
      conversionRate: 0,
      totalUsers: 0,
      activeUsers: 0,
      activeUsersRate: 0,
      newUsersThisMonth: 0,
      usersWithCompleteProfile: 0,
      profileCompletionRate: 0,
      totalMatches: 0,
      matchesThisMonth: 0,
      engagedGroupes: 0,
      engagementRate: 0,
      avgMatchesPerGroup: 0,
      avgMembersPerGroup: 0,
      retentionRate7Days: 0,
      retentionRate30Days: 0,
      churnedGroupes: 0,
      churnRate: 0
    };
  }

  loadAnalytics(): void {
    this.isLoading = true;
    
    const { startDate, endDate } = this.getDateRange();
    
    forkJoin([
      this.analyticsService.getPlatformKPIs(startDate, endDate, this.engagementCriteria),
      this.analyticsService.getGrowthData(12), // 12 derniers mois
      this.analyticsService.getGroupesEngagement(this.engagementCriteria),
      this.analyticsService.getConversionFunnel(startDate, endDate),
      this.analyticsService.getActivityByDay(startDate, endDate)
    ]).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ([kpis, growth, groupes, funnel, activityByDay]) => {
        this.previousKpis = { ...this.kpis };
        this.kpis = kpis;
        this.growthData = growth;
        this.groupesEngagement = groupes;
        this.groupesDataSource.data = groupes;
        this.conversionFunnel = funnel;
        
        this.updateAllCharts(activityByDay);
        this.calculateEngagementDistribution();
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement analytics:', err);
        this.isLoading = false;
      }
    });
  }

  private getDateRange(): { startDate: string; endDate: string } {
    const today = new Date();
    let startDate: Date;
    const endDate = new Date();
    
    switch (this.selectedPeriod) {
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
      case 'last30Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'last90Days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.loadAnalytics();
  }

  onEngagementCriteriaChange(): void {
    this.loadAnalytics();
  }

  refreshData(): void {
    this.loadAnalytics();
  }

  // ============ GRAPHIQUES ============

  private updateAllCharts(activityByDay: any[]): void {
    this.updateGrowthChart();
    this.updateEngagementChart();
    this.updateRetentionChart();
    this.updateActivityByDayChart(activityByDay);
  }

  private updateGrowthChart(): void {
    this.growthChartData = {
      labels: this.growthData.map(d => d.period),
      datasets: [
        {
          label: 'Groupes',
          data: this.growthData.map(d => d.groupes),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Utilisateurs',
          data: this.growthData.map(d => d.users),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Utilisateurs actifs',
          data: this.growthData.map(d => d.activeUsers),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  private updateEngagementChart(): void {
    const excellent = this.groupesEngagement.filter(g => g.status === 'excellent').length;
    const good = this.groupesEngagement.filter(g => g.status === 'good').length;
    const warning = this.groupesEngagement.filter(g => g.status === 'warning').length;
    const critical = this.groupesEngagement.filter(g => g.status === 'critical').length;
    
    this.engagementChartData = {
      labels: ['Excellent', 'Bon', 'À surveiller', 'Critique'],
      datasets: [{
        data: [excellent, good, warning, critical],
        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
        borderWidth: 0
      }]
    };
  }

  private updateRetentionChart(): void {
    this.retentionChartData = {
      labels: ['Rétention J+7', 'Rétention J+30', 'Taux d\'engagement', 'Utilisateurs actifs'],
      datasets: [{
        data: [
          this.kpis.retentionRate7Days,
          this.kpis.retentionRate30Days,
          this.kpis.engagementRate,
          this.kpis.activeUsersRate
        ],
        backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'],
        borderRadius: 4
      }]
    };
  }

  private updateActivityByDayChart(activityByDay: any[]): void {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    this.activityByDayChartData = {
      labels: days,
      datasets: [{
        data: activityByDay.map(d => d.count),
        backgroundColor: activityByDay.map((d, i) => 
          i === 5 || i === 6 ? '#22c55e' : '#3b82f6' // Weekend en vert
        ),
        borderRadius: 8
      }]
    };
  }

  private calculateEngagementDistribution(): void {
    const excellent = this.groupesEngagement.filter(g => g.status === 'excellent').length;
    const good = this.groupesEngagement.filter(g => g.status === 'good').length;
    const warning = this.groupesEngagement.filter(g => g.status === 'warning').length;
    const critical = this.groupesEngagement.filter(g => g.status === 'critical').length;
    
    this.engagementDistribution = [
      { label: 'Excellent (≥4 matchs)', count: excellent, color: '#22c55e' },
      { label: 'Bon (2-3 matchs)', count: good, color: '#3b82f6' },
      { label: 'À surveiller (1 match)', count: warning, color: '#f59e0b' },
      { label: 'Critique (0 match)', count: critical, color: '#ef4444' }
    ];
  }

  // ============ HELPERS ============

  getVariation(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  getVariationClass(current: number, previous: number, inverse: boolean = false): string {
    const variation = this.getVariation(current, previous);
    if (inverse) {
      if (variation > 0) return 'negative';
      if (variation < 0) return 'positive';
    } else {
      if (variation > 0) return 'positive';
      if (variation < 0) return 'negative';
    }
    return 'neutral';
  }

  formatPercent(value: number): string {
    return value?.toFixed(1) + '%';
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'excellent': return 'trending_up';
      case 'good': return 'check_circle';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'help';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bon';
      case 'warning': return 'À surveiller';
      case 'critical': return 'Critique';
      default: return 'Inconnu';
    }
  }

  getCurrentPeriodLabel(): string {
    return this.periods.find(p => p.value === this.selectedPeriod)?.label || 'Ce mois';
  }

  // ============ EXPORT ============

  exportReport(): void {
    // TODO: Implémenter export PDF/Excel
    console.log('Export rapport analytics');
  }
}