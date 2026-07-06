// ============================================================
// ADMIN SERVICE - Frontend Angular
// À créer/mettre à jour dans src/app/core/services/admin.service.ts
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

// Interfaces
export interface AdminStats {
  totalGroups: number;
  totalUsers: number;
  totalContributions: number;
  totalMatches: number;
  paidSanctions: { amount: number; count: number };
  unpaidSanctions: { amount: number; count: number };
  usersByRole: { admin: number; responsable: number; membre: number };
  usersByGroup: GroupUsers[];
  contributionsByGroup: ContributionByGroup[];
  recentActivity: Activity[];
  activeGroups: number;
  newUsersThisMonth: number;
  matchesThisMonth: number;
  avgContributionPerGroup: number;
  topContributingGroups: TopGroup[];
  groupGrowth: GrowthData[];
  sanctionsEvolution: SanctionEvolution[];
  matchesEvolution: MatchEvolution[];
}

export interface GroupUsers {
  groupId: number;
  groupName: string;
  userCount: number;
  users: UserInfo[];
  status: string;
  createdAt: string;
}

export interface UserInfo {
  id: number;
  name: string;
  role: string;
  email?: string;
  status?: string;
}

export interface ContributionByGroup {
  groupName: string;
  totalAmount: number;
  contributionCount: number;
}

export interface Activity {
  date: string;
  action: string;
  type: string;
  groupName?: string;
}

export interface TopGroup {
  groupName: string;
  totalContributions: number;
  memberCount: number;
  matchCount: number;
}

export interface GrowthData {
  month: string;
  groups: number;
  users: number;
}

export interface SanctionEvolution {
  month: string;
  paid: number;
  unpaid: number;
}

export interface MatchEvolution {
  month: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les statistiques admin avec filtrage par dates optionnel
   */
  getAdminStats(startDate?: string | null, endDate?: string | null): Observable<AdminStats> {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    
    return this.http.get<AdminStats>(`${this.apiUrl}/admin/stats`, { params });
  }

  /**
   * Récupère les statistiques de croissance
   */
  getGrowthStats(months: number = 12): Observable<GrowthData[]> {
    return this.http.get<GrowthData[]>(`${this.apiUrl}/admin/stats/growth?months=${months}`);
  }

  /**
   * Récupère l'évolution des sanctions
   */
  getSanctionsEvolution(months: number = 12): Observable<SanctionEvolution[]> {
    return this.http.get<SanctionEvolution[]>(`${this.apiUrl}/admin/stats/sanctions-evolution?months=${months}`);
  }

  /**
   * Récupère les top groupes contributeurs
   */
  getTopContributingGroups(limit: number = 5): Observable<TopGroup[]> {
    return this.http.get<TopGroup[]>(`${this.apiUrl}/admin/stats/top-groups?limit=${limit}`);
  }

  /**
   * Récupère tous les groupes
   */
  getAllGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/groups`);
  }

  /**
   * Récupère tous les utilisateurs
   */
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users`);
  }

  /**
   * Récupère l'activité récente
   */
  getRecentActivity(limit: number = 10): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/admin/activity?limit=${limit}`);
  }
}