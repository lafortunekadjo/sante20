// ============================================================
// ADMIN ANALYTICS SERVICE - Frontend Angular
// Fichier: src/app/core/services/admin-analytics.service.ts
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

// ============ INTERFACES ============

export interface PlatformKPIs {
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

export interface EngagementCriteria {
  minMatchesPerMonth: number;
  activeUserDays: number;
}

export interface GroupeEngagement {
  id: number;
  nom: string;
  membresCount: number;
  activeMembers: number;
  matchesThisMonth: number;
  lastActivityDate: string;
  engagementScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface GrowthData {
  period: string;
  groupes: number;
  users: number;
  matches: number;
  activeUsers: number;
}

export interface ConversionFunnel {
  step: string;
  count: number;
  rate: number;
}

export interface ActivityByDay {
  day: string;
  dayIndex: number;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAnalyticsService {
  
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les KPIs de la plateforme
   */
  getPlatformKPIs(
    startDate: string, 
    endDate: string, 
    criteria: EngagementCriteria
  ): Observable<PlatformKPIs> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('minMatchesPerMonth', criteria.minMatchesPerMonth.toString())
      .set('activeUserDays', criteria.activeUserDays.toString());
    
    return this.http.get<PlatformKPIs>(`${this.apiUrl}/admin/analytics/kpis`, { params });
  }

  /**
   * Récupère les données de croissance sur N mois
   */
  getGrowthData(months: number): Observable<GrowthData[]> {
    return this.http.get<GrowthData[]>(`${this.apiUrl}/admin/analytics/growth?months=${months}`);
  }

  /**
   * Récupère l'engagement des groupes
   */
  getGroupesEngagement(criteria: EngagementCriteria): Observable<GroupeEngagement[]> {
    let params = new HttpParams()
      .set('minMatchesPerMonth', criteria.minMatchesPerMonth.toString())
      .set('activeUserDays', criteria.activeUserDays.toString());
    
    return this.http.get<GroupeEngagement[]>(`${this.apiUrl}/admin/analytics/groupes-engagement`, { params });
  }

  /**
   * Récupère le funnel de conversion
   */
  getConversionFunnel(startDate: string, endDate: string): Observable<ConversionFunnel[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<ConversionFunnel[]>(`${this.apiUrl}/admin/analytics/conversion-funnel`, { params });
  }

  /**
   * Récupère l'activité par jour de la semaine
   */
  getActivityByDay(startDate: string, endDate: string): Observable<ActivityByDay[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<ActivityByDay[]>(`${this.apiUrl}/admin/analytics/activity-by-day`, { params });
  }

  /**
   * Récupère le taux de rétention
   */
  getRetentionRates(): Observable<{ day7: number; day30: number; day90: number }> {
    return this.http.get<{ day7: number; day30: number; day90: number }>(
      `${this.apiUrl}/admin/analytics/retention`
    );
  }

  /**
   * Récupère les utilisateurs actifs
   */
  getActiveUsersStats(activeUserDays: number): Observable<{
    total: number;
    active: number;
    rate: number;
    trend: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/admin/analytics/active-users?days=${activeUserDays}`);
  }
}