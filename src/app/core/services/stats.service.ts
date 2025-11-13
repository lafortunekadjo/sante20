import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, ModelOptions } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environment';
import { AuthService } from './auth.service';
import { MemberStats, MonthlyStats } from '../models/stats.model';


@Injectable({
  providedIn: 'root' 
})
export class StatsService {

  private adminStatsUrl = `${environment.apiUrl}/admin/stats`;
  private responsableStatsUrl = `${environment.apiUrl}/responsable/stats`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getAdminStatss(): Observable<AdminStats> {
    return this.http.get<AdminStats>(this.adminStatsUrl, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.error('Erreur lors de la récupération des stats admin:', err);
        return throwError(err);
      })
    );
  }

   getAdminStats(startDate?: Date, endDate?: Date): Observable<any> {
    let params = new HttpParams();
    if (startDate && endDate) {
      params = params.set('startDate', startDate.toISOString().split('T')[0]);
      params = params.set('endDate', endDate.toISOString().split('T')[0]);
    }
    return this.http.get(`${this.adminStatsUrl}`, { params });
  }

   getResponsableStats(startDate?: Date, endDate?: Date): Observable<any> {
    let params = new HttpParams();
    if (startDate && endDate) {
      params = params.set('startDate', startDate.toISOString().split('T')[0]);
      params = params.set('endDate', endDate.toISOString().split('T')[0]);
    }
    return this.http.get(`${environment.apiUrl}/responsable/stats`, { params });
  }

  getMembreStats(startDate?: Date, endDate?: Date): Observable<any> {
    let params = new HttpParams();
    if (startDate && endDate) {
      params = params.set('startDate', startDate.toISOString().split('T')[0]);
      params = params.set('endDate', endDate.toISOString().split('T')[0]);
    }
    return this.http.get(`${environment.apiUrl}/membre/stats`, { params });
  }

  getResponsableStats1(): Observable<ResponsableStats> {
    return this.http.get<ResponsableStats>(this.responsableStatsUrl, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.error('Erreur lors de la récupération des stats responsable:', err);
        return throwError(err);
      })
    );
  }

   // Stats du joueur avec filtre de dates
  getResponsableStats2(startDate?: Date, endDate?: Date): Observable<MemberStats> {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }
    
    return this.http.get<MemberStats>(`${environment.apiUrl}/membre/stats`, { params });
  }

  // Récupérer les stats mensuelles
  getMonthlyStats(month: string): Observable<MonthlyStats> {
    return this.http.get<MonthlyStats>(`${environment.apiUrl}/stats/monthly/${month}`);
  }

  // Récupérer la liste des mois disponibles
  getAvailableMonths(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/stats/available-months`);
  }

  // Stats du joueur avec stats mensuelles
  getMemberStatsWithMonthly(startDate?: Date, endDate?: Date, month?: string): Observable<MemberStats> {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }
    if (month) {
      params = params.set('month', month);
    }
    
    return this.http.get<MemberStats>(`${environment.apiUrl}/member/with-monthly`, { params });
  }


}

export interface AdminStats {
  groupCount: number;
  userCount: number;
  roleDistribution: { [key: string]: number };
  totalContributions: number;
  totalCartons: number;
}

export interface ResponsableStats {
  groupMemberCount: number;
  groupContributions: number;
  groupCartons: number;
}



