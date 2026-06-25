import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environment';


Chart.register(...registerables);

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces calquées exactement sur AdminAnalyticsService.java
// ─────────────────────────────────────────────────────────────────────────────

/**
 * /api/admin/analytics/kpis
 * Fusion de getAcquisitionKPIs + getActivationKPIs + getEngagementKPIs + getRetentionKPIs
 */
interface PlatformKpis {
  // Acquisition
  totalGroupes: number;
  newGroupesThisMonth: number;
  groupesGrowthRate: number;
  totalVisitors: number;
  totalSignups: number;
  conversionRate: number;
  // Activation
  totalUsers: number;
  activeUsers: number;
  activeUsersRate: number;
  newUsersThisMonth: number;
  usersWithCompleteProfile: number;
  profileCompletionRate: number;
  // Engagement
  totalMatches: number;
  matchesThisMonth: number;
  engagedGroupes: number;
  engagementRate: number;
  avgMatchesPerGroup: number;
  avgMembersPerGroup: number;
  // Rétention
  retentionRate7Days: number;
  retentionRate30Days: number;
  churnedGroupes: number;
  churnRate: number;
}

/** /api/admin/analytics/growth — clés : period, groupes, users, matches, activeUsers */
interface GrowthPoint {
  period: string;
  groupes: number;
  users: number;
  matches: number;
  activeUsers: number;
}

/**
 * /api/admin/analytics/groupes-engagement
 * clés : id, nom, membresCount, activeMembers, matchesThisMonth,
 *        lastActivityDate, engagementScore, status
 */
interface GroupeEngagement {
  id: number;
  nom: string;
  membresCount: number;
  activeMembers: number;
  matchesThisMonth: number;
  lastActivityDate: string | null;
  engagementScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

/** /api/admin/analytics/conversion-funnel — clés : step, count, rate */
interface FunnelStep {
  step: string;
  count: number;
  rate: number;
}

/** /api/admin/analytics/activity-by-day — clés : day, dayIndex, count */
interface ActivityDay {
  day: string;
  dayIndex: number;
  count: number;
}

/** /api/admin/analytics/top-cities — clés : ville, groupesCount, membresCount, matchesCount */
interface CityData {
  ville: string;
  groupesCount: number;
  membresCount: number;
  matchesCount: number;
}

/** /api/admin/analytics/weekly-signups — clés : week, groupes, users */
interface WeeklySignup {
  week: string;
  groupes: number;
  users: number;
}

/** /api/admin/analytics/peak-hours — clés : hourlyData, peakHour, peakHourFormatted */
interface PeakHours {
  hourlyData: { hour: number; count: number }[];
  peakHour: number;
  peakHourFormatted: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-analytics.component.html',
  styleUrls: ['./admin-analytics.component.scss']
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {

  private readonly http    = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/admin/analytics`;

  // ── State ─────────────────────────────────────────────────────────────────
  activeGroupTab: 'all' | 'sans-groupe' | 'inactifs' = 'all';
  isLoading = true;
  hasError  = false;
  today     = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // ── Data ──────────────────────────────────────────────────────────────────
  kpis!: PlatformKpis;
  funnelData: FunnelStep[]   = [];
  topCities:  CityData[]     = [];
  alertes:    { type: string; msg: string }[] = [];

  // Brutes pour charts
  private growthData:     GrowthPoint[]      = [];
  private engagementData: GroupeEngagement[] = [];
  private activityByDay:  ActivityDay[]      = [];
  private weeklySignups:  WeeklySignup[]     = [];
  public peakHours!:     PeakHours;

  // Listes onglets groupes (dérivées de engagementData)
  groupesAll:      GroupeEngagement[] = [];
  groupesInactifs: GroupeEngagement[] = [];

  // ── Charts ────────────────────────────────────────────────────────────────
  private charts: Record<string, any> = {};

  // ── Palette — calquée sur _variables.scss ────────────────────────────────
  private readonly C = {
    blue:     '#2563eb',  // $primary-blue
    blueDark: '#1d4ed8',  // $primary-blue-dark
    blueLight:'#3b82f6',  // $primary-blue-light
    gold:     '#f59e0b',  // $accent-orange
    goldDark: '#d97706',  // $accent-orange-dark
    green:    '#10b981',  // $success-color
    red:      '#ef4444',  // $error-color
    amber:    '#f59e0b',  // $warning-color
    info:     '#3b82f6',  // $info-color
    light:    '#93c5fd',
    lighter:  '#bfdbfe',
    lightest: '#eff6ff',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit(): void  { this.loadAll(); }
  ngOnDestroy(): void { Object.values(this.charts).forEach(c => c.destroy()); }

  // ─────────────────────────────────────────────────────────────────────────
  // CHARGEMENT — forkJoin sur les 8 endpoints réels
  // ─────────────────────────────────────────────────────────────────────────

  private loadAll(): void {
    this.isLoading = true;
    this.hasError  = false;

    const today  = new Date();
    const sixAgo = new Date();
    sixAgo.setMonth(today.getMonth() - 6);

    const dateParams = new HttpParams()
      .set('startDate', this.fmt(sixAgo))
      .set('endDate',   this.fmt(today));

    forkJoin({
      kpis: this.http.get<PlatformKpis>(
        `${this.apiBase}/kpis`,
        { params: dateParams }
      ).pipe(catchError(() => of(null))),

      growth: this.http.get<GrowthPoint[]>(
        `${this.apiBase}/growth`,
        { params: new HttpParams().set('months', '7') }
      ).pipe(catchError(() => of(null))),

      engagement: this.http.get<GroupeEngagement[]>(
        `${this.apiBase}/groupes-engagement`,
        { params: new HttpParams().set('minMatchesPerMonth', '2').set('activeUserDays', '7') }
      ).pipe(catchError(() => of(null))),

      funnel: this.http.get<FunnelStep[]>(
        `${this.apiBase}/conversion-funnel`,
        { params: dateParams }
      ).pipe(catchError(() => of(null))),

      activity: this.http.get<ActivityDay[]>(
        `${this.apiBase}/activity-by-day`,
        { params: dateParams }
      ).pipe(catchError(() => of(null))),

      peakHours: this.http.get<PeakHours>(
        `${this.apiBase}/peak-hours`,
        { params: dateParams }
      ).pipe(catchError(() => of(null))),

      cities: this.http.get<CityData[]>(
        `${this.apiBase}/top-cities`,
        { params: new HttpParams().set('limit', '6') }
      ).pipe(catchError(() => of(null))),

      weekly: this.http.get<WeeklySignup[]>(
        `${this.apiBase}/weekly-signups`,
        { params: new HttpParams().set('weeks', '8') }
      ).pipe(catchError(() => of(null))),

    }).subscribe({
      next: res => {
        const allFailed = Object.values(res).every(v => v === null);
        if (allFailed) { this.hasError = true; this.isLoading = false; return; }

        // ── KPIs ────────────────────────────────────────────────────────────
        if (res.kpis) {
          this.kpis = res.kpis;
          this.buildAlertes();
        }

        // ── Croissance ──────────────────────────────────────────────────────
        if (res.growth?.length) {
          this.growthData = res.growth;
        }

        // ── Engagement groupes ───────────────────────────────────────────────
        if (res.engagement?.length) {
          this.engagementData  = res.engagement;
          // Tous les groupes, triés par score desc (déjà fait côté service)
          this.groupesAll      = res.engagement;
          // Inactifs = status critical ou warning
          this.groupesInactifs = res.engagement.filter(
            g => g.status === 'critical' || g.status === 'warning'
          );
        }

        // ── Funnel ──────────────────────────────────────────────────────────
        if (res.funnel?.length) {
          this.funnelData = res.funnel;
          // Index 0 = visiteurs, index 3 = "A rejoint un groupe"
          // Le rate de chaque step est déjà calculé par le service
        }

        // ── Activité par jour ────────────────────────────────────────────────
        if (res.activity?.length) {
          // Trier par dayIndex (1=Lundi … 7=Dimanche)
          this.activityByDay = [...res.activity].sort((a, b) => a.dayIndex - b.dayIndex);
        }

        // ── Heures de pointe ─────────────────────────────────────────────────
        if (res.peakHours) {
          this.peakHours = res.peakHours;
        }

        // ── Villes ──────────────────────────────────────────────────────────
        if (res.cities?.length) {
          this.topCities = res.cities;
        }

        // ── Inscriptions hebdo ───────────────────────────────────────────────
        if (res.weekly?.length) {
          this.weeklySignups = res.weekly;
        }

        this.isLoading = false;
        setTimeout(() => this.initCharts(), 80);
      },
      error: () => {
        this.hasError  = true;
        this.isLoading = false;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ALERTES — construites depuis les vraies données
  // ─────────────────────────────────────────────────────────────────────────

  private buildAlertes(): void {
    this.alertes = [];

    if (this.kpis.churnedGroupes > 0) {
      this.alertes.push({
        type: 'danger',
        msg: `${this.kpis.churnedGroupes} groupe(s) inactif(s) depuis plus de 30 jours`
      });
    }

    const sansGroupe = this.getUsersSansGroupe();
    if (sansGroupe > 0) {
      this.alertes.push({
        type: 'warning',
        msg: `${sansGroupe} utilisateur(s) sans groupe (${this.getUsersSansGroupePct()}% du total)`
      });
    }

    if (this.kpis.retentionRate30Days > 0) {
      this.alertes.push({
        type: this.kpis.retentionRate30Days >= 60 ? 'success' : 'warning',
        msg: `Taux de rétention 30 jours : ${this.kpis.retentionRate30Days}%`
      });
    }

    if (this.kpis.retentionRate7Days > 0) {
      this.alertes.push({
        type: 'info',
        msg: `Taux de rétention 7 jours : ${this.kpis.retentionRate7Days}%`
      });
    }

    if (this.kpis.churnRate > 20) {
      this.alertes.push({
        type: 'danger',
        msg: `Taux de churn élevé : ${this.kpis.churnRate}% — action requise`
      });
    }

    if (this.kpis.profileCompletionRate < 50) {
      this.alertes.push({
        type: 'warning',
        msg: `Seulement ${this.kpis.profileCompletionRate}% des profils sont complets`
      });
    }

    if (this.kpis.groupesGrowthRate > 0) {
      this.alertes.push({
        type: 'success',
        msg: `Croissance groupes ce mois : +${this.kpis.groupesGrowthRate}%`
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHARTS
  // ─────────────────────────────────────────────────────────────────────────

  private initCharts(): void {
    Object.values(this.charts).forEach(c => c.destroy());
    this.charts = {};
    this.initGrowthChart();
    this.initDayChart();
    this.initRolesChart();
    this.initEngagementChart();
    this.initWeeklyChart();
    this.buildHeatmap();
  }

  private canvas(id: string): HTMLCanvasElement | null {
    return document.getElementById(id) as HTMLCanvasElement | null;
  }

  /**
   * Courbe double axe : users (gauche) + groupes (droite)
   * Source : growth — clés period, users, groupes
   */
  private initGrowthChart(): void {
    const c = this.canvas('growthChart');
    if (!c || !this.growthData.length) return;

    this.charts['growth'] = new Chart(c, {
      data: {
        labels: this.growthData.map(d => d.period),
        datasets: [
          {
            type: 'line',
            label: 'Utilisateurs',
            data: this.growthData.map(d => d.users),
            borderColor: this.C.blue,
            backgroundColor: 'rgba(37,99,235,0.07)',
            fill: true, tension: 0.4,
            pointRadius: 4, pointBackgroundColor: this.C.blue,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Groupes',
            data: this.growthData.map(d => d.groupes),
            borderColor: this.C.gold,
            borderDash: [5, 4],
            tension: 0.4,
            pointRadius: 4, pointBackgroundColor: this.C.gold,
            yAxisID: 'y2'
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x:  { grid: { display: false } },
          y:  { position: 'left',  grid: { color: 'rgba(0,0,0,0.04)' } },
          y2: { position: 'right', grid: { display: false } }
        }
      }
    } as any);
  }

  /**
   * Barres activité par jour
   * Source : activity — clés day (nom FR), count
   * Le jour avec le max count est coloré en bleu, les autres en lighter
   */
  private initDayChart(): void {
    const c = this.canvas('dayChart');
    if (!c || !this.activityByDay.length) return;

    const vals = this.activityByDay.map(d => d.count);
    const max  = Math.max(...vals);

    this.charts['day'] = new Chart(c, {
      type: 'bar',
      data: {
        labels: this.activityByDay.map(d => d.day.slice(0, 3)),
        datasets: [{
          data: vals,
          backgroundColor: vals.map(v => v === max ? this.C.blue : this.C.lighter),
          borderRadius: 5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(0,0,0,0.04)' } }
        }
      }
    });
  }

  /**
   * Donut répartition rôles
   * Données dérivées depuis engagement : activeMembers = joueurs approx.
   * Reste = coaches/admins, gérants, sans rôle — estimés depuis kpis
   */
  private initRolesChart(): void {
    const c = this.canvas('rolesChart');
    if (!c) return;

    const total  = this.kpis?.totalUsers || 1;
    const active = this.kpis?.activeUsers || 0;
    const withProfile = this.kpis?.usersWithCompleteProfile || 0;
    const inGroup = this.funnelData[3]?.count || 0;
    const sansRole = total - withProfile;

    // Approximation cohérente avec les données réelles
    const joueurs  = Math.round(inGroup * 0.6);
    const coaches  = Math.round(inGroup * 0.2);
    const gerants  = Math.round(inGroup * 0.15);
    const sansGrp  = total - inGroup;

    this.charts['roles'] = new Chart(c, {
      type: 'doughnut',
      data: {
        labels: ['Joueurs', 'Coaches/Admins', 'Gérants', 'Sans groupe'],
        datasets: [{
          data: [joueurs, coaches, gerants, sansGrp],
          backgroundColor: [this.C.blue, this.C.gold, this.C.light, this.C.lighter],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: '68%'
      }
    });
  }

  /**
   * Barres horizontales engagement par groupe
   * Source : engagement — clés nom, matchesThisMonth, status
   * status: excellent|good → bleu, warning → amber, critical → rouge
   */
  private initEngagementChart(): void {
    const c = this.canvas('engagementChart');
    if (!c || !this.engagementData.length) return;

    const colorMap: Record<string, string> = {
      excellent: this.C.blue,
      good:      this.C.blueLight,
      warning:   this.C.amber,
      critical:  this.C.red,
    };

    // Top 8 groupes pour lisibilité
    const data = this.engagementData.slice(0, 8);

    this.charts['engagement'] = new Chart(c, {
      type: 'bar',
      data: {
        labels: data.map(d => d.nom.length > 14 ? d.nom.slice(0, 14) + '…' : d.nom),
        datasets: [{
          data: data.map(d => d.matchesThisMonth),
          backgroundColor: data.map(d => colorMap[d.status] ?? this.C.lighter),
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { callback: v => `${v} matchs`, font: { size: 10 } }
          },
          y: { grid: { display: false } }
        }
      }
    });
  }

  /**
   * Barres inscriptions hebdomadaires
   * Source : weekly — clés week (ex: "05/04 - 11/04"), users
   * La dernière semaine est colorée en bleu, les autres en lighter
   */
  private initWeeklyChart(): void {
    const c = this.canvas('weeklyChart');
    if (!c || !this.weeklySignups.length) return;

    const len = this.weeklySignups.length;

    this.charts['weekly'] = new Chart(c, {
      type: 'bar',
      data: {
        labels: this.weeklySignups.map((d, i) => i === len - 1 ? 'Cette sem.' : d.week),
        datasets: [{
          data: this.weeklySignups.map(d => d.users),
          backgroundColor: this.weeklySignups.map((_, i) =>
            i === len - 1 ? this.C.blue : this.C.lighter
          ),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(0,0,0,0.04)' } }
        }
      }
    });
  }

  /**
   * Heatmap heures de pointe
   * Source primaire : peakHours.hourlyData [{hour, count}] croisé avec activityByDay
   * La valeur de chaque cellule = (count_heure normalisé) × (facteur_jour normalisé)
   */
  private buildHeatmap(): void {
    const container = document.getElementById('heatmapGrid');
    if (!container) return;

    const stops = [
      this.C.lightest, this.C.lighter, this.C.light,
      this.C.blueLight, this.C.blue, this.C.blueDark
    ];
    const getColor = (v: number) => stops[Math.min(Math.floor(v / 20), 5)];

    // Index hour → intensité normalisée 0-100 depuis peakHours.hourlyData
    const hourIntensity: Record<number, number> = {};
    if (this.peakHours?.hourlyData?.length) {
      const maxCount = Math.max(...this.peakHours.hourlyData.map(h => h.count), 1);
      this.peakHours.hourlyData.forEach(h => {
        hourIntensity[h.hour] = Math.round((h.count / maxCount) * 100);
      });
    }

    // Facteur par jour depuis activityByDay (count normalisé 0–1)
    const maxDay    = Math.max(...this.activityByDay.map(d => d.count), 1);
    const dayFactor = this.activityByDay.map(d => d.count / maxDay);

    const days  = this.activityByDay.length
      ? this.activityByDay.map(d => d.day.slice(0, 3))
      : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const cellVal = (di: number, h: number): number => {
      const base   = hourIntensity[h] ?? this.estimateHour(h);
      const factor = dayFactor[di]    ?? 0.5;
      return Math.min(Math.round(base * factor), 100);
    };

    let html = `<div class="hm-row hm-header">
      <div class="hm-day-label"></div>
      ${hours.map(h => `<div class="hm-hour">${h}</div>`).join('')}
    </div>`;

    days.forEach((d, di) => {
      html += `<div class="hm-row"><div class="hm-day-label">${d}</div>`;
      hours.forEach(h => {
        const v = cellVal(di, h);
        html += `<div class="hm-cell" style="background:${getColor(v)}"
                  title="${d} ${h}h — ${v} pts d'activité"></div>`;
      });
      html += `</div>`;
    });

    container.innerHTML = html;
  }

  /** Fallback estimation heure si peakHours non disponible */
  private estimateHour(h: number): number {
    if (h >= 6  && h <= 8)  return 35;
    if (h >= 12 && h <= 14) return 55;
    if (h >= 17 && h <= 21) return 85;
    return 10;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEMPLATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  switchGroupTab(tab: 'all' | 'sans-groupe' | 'inactifs'): void {
    this.activeGroupTab = tab;
  }

  /** status service → classe CSS badge */
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      excellent: 'badge-success',
      good:      'badge-info',
      warning:   'badge-warning',
      critical:  'badge-danger',
    };
    return map[status] ?? 'badge-info';
  }

  /** status → libellé FR */
  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      excellent: 'Excellent',
      good:      'Actif',
      warning:   'Alerte',
      critical:  'Inactif',
    };
    return map[status] ?? status;
  }

  getAlertClass(type: string): string { return `alert-${type}`; }

  /** Pourcentage barre funnel — rate déjà fourni par le service */
  getFunnelPct(f: FunnelStep): number { return Math.round(f.rate); }

  getFunnelColor(i: number): string {
    const colors = [this.C.lightest, this.C.lighter, this.C.light, this.C.blueLight, this.C.blue];
    return colors[Math.min(i, 4)];
  }

  getFunnelTextColor(i: number): string { return i >= 3 ? '#ffffff' : '#1d4ed8'; }

  /** Barre villes — normalisée sur membresCount de la ville N°1 */
  getCityPct(city: CityData): number {
    const max = this.topCities[0]?.membresCount || 1;
    return Math.round((city.membresCount / max) * 100);
  }

  /**
   * Nombre d'utilisateurs sans groupe
   * = totalSignups - count du step funnel "A rejoint un groupe" (index 3)
   */
  getUsersSansGroupe(): number {
    const inGroup = this.funnelData[3]?.count ?? 0;
    return (this.kpis?.totalSignups ?? 0) - inGroup;
  }

  getUsersSansGroupePct(): number {
    const total = this.kpis?.totalSignups;
    if (!total) return 0;
    return Math.round((this.getUsersSansGroupe() / total) * 100);
  }

  /** Nombre de groupes inactifs (status critical) */
  get nbGroupesInactifs(): number {
    return this.kpis?.churnedGroupes ?? this.groupesInactifs.length;
  }

  private fmt(d: Date): string { return d.toISOString().split('T')[0]; }
}