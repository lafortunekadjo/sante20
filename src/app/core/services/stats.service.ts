import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../environment';
import { AuthService } from './auth.service';

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

//  getResponsableStats(startDate?: Date, endDate?: Date): Observable<any> {
//     // Données simulées
//     const fullData = {
//       memberCount: 25,
//       totalContributions: 1250000, // FCFA
//       paidSanctions: { amount: 150000, count: 10 },
//       unpaidSanctions: { amount: 50000, count: 5 },
//       sanctionsPercentage: 66.67, // (10 / 15) * 100
//       contributionsByMonth: [
//         { month: 'Jan', amount: 100000, date: new Date('2025-01-15') },
//         { month: 'Fév', amount: 150000, date: new Date('2025-02-15') },
//         { month: 'Mar', amount: 200000, date: new Date('2025-03-15') },
//         { month: 'Avr', amount: 175000, date: new Date('2025-04-15') },
//         { month: 'Mai', amount: 250000, date: new Date('2025-05-15') },
//         { month: 'Juin', amount: 300000, date: new Date('2025-06-15') }
//       ],
//       upcomingMatches: [
//         { date: new Date('2025-08-10'), opponent: 'Équipe A' },
//         { date: new Date('2025-08-17'), opponent: 'Équipe B' },
//         { date: new Date('2025-08-24'), opponent: 'Équipe C' }
//       ]
//     };

//     if (!startDate || !endDate) {
//       return of(fullData);
//     }

//     // Filtrer les données par plage de dates
//     const filteredContributionsByMonth = fullData.contributionsByMonth.filter(item =>
//       item.date >= startDate && item.date <= endDate
//     );
//     const totalContributions = filteredContributionsByMonth.reduce((sum, item) => sum + item.amount, 0);

//     // Supposons que les sanctions sont réparties uniformément sur la période pour la simulation
//     const totalSanctions = fullData.paidSanctions.count + fullData.unpaidSanctions.count;
//     const filteredSanctionCount = Math.round(totalSanctions * (filteredContributionsByMonth.length / fullData.contributionsByMonth.length));
//     const paidSanctionsCount = Math.round(filteredSanctionCount * (fullData.sanctionsPercentage / 100));
//     const unpaidSanctionsCount = filteredSanctionCount - paidSanctionsCount;
//     const paidSanctionsAmount = Math.round(fullData.paidSanctions.amount * (filteredContributionsByMonth.length / fullData.contributionsByMonth.length));
//     const unpaidSanctionsAmount = Math.round(fullData.unpaidSanctions.amount * (filteredContributionsByMonth.length / fullData.contributionsByMonth.length));

//     return of({
//       memberCount: fullData.memberCount, // Supposé constant, ajustez si nécessaire
//       totalContributions,
//       paidSanctions: { amount: paidSanctionsAmount, count: paidSanctionsCount },
//       unpaidSanctions: { amount: unpaidSanctionsAmount, count: unpaidSanctionsCount },
//       sanctionsPercentage: filteredSanctionCount ? (paidSanctionsCount / filteredSanctionCount) * 100 : 0,
//       contributionsByMonth: filteredContributionsByMonth,
//       upcomingMatches: fullData.upcomingMatches.filter(match => match.date >= startDate && match.date <= endDate)
//     });
//   }

//    // Nouvelle méthode pour les stats des membres
//   getMembreStats(startDate?: Date, endDate?: Date): Observable<any> {
//     const fullData = {
//       matchesPlayed: 12,
//       totalPasses: 150,
//       successfulPasses: 120, // Pour calculer le taux de passes réussies
//       sanctions: {
//         paid: { amount: 30000, count: 2 },
//         unpaid: { amount: 10000, count: 1 },
//         yellowCards: 3,
//         redCards: 1
//       },
//       totalPlayingTime: 1080, // en minutes
//       goalsScored: 5,
//       passesByMatch: [
//         { match: 'Match 1', date: new Date('2025-01-10'), passes: 10 },
//         { match: 'Match 2', date: new Date('2025-02-15'), passes: 15 },
//         { match: 'Match 3', date: new Date('2025-03-20'), passes: 20 },
//         { match: 'Match 4', date: new Date('2025-04-25'), passes: 25 },
//         { match: 'Match 5', date: new Date('2025-05-10'), passes: 30 },
//         { match: 'Match 6', date: new Date('2025-06-15'), passes: 50 }
//       ],
//       recentMatches: [
//         { date: new Date('2025-06-15'), opponent: 'Équipe A' },
//         { date: new Date('2025-05-10'), opponent: 'Équipe B' },
//         { date: new Date('2025-04-25'), opponent: 'Équipe C' }
//       ]
//     };

//     if (!startDate || !endDate) {
//       return of(fullData);
//     }

//     // Filtrer les données par plage de dates
//     const filteredPassesByMatch = fullData.passesByMatch.filter(item => item.date >= startDate && item.date <= endDate);
//     const filteredMatchesPlayed = filteredPassesByMatch.length;
//     const filteredTotalPasses = filteredPassesByMatch.reduce((sum, item) => sum + item.passes, 0);
//     const filteredSuccessfulPasses = Math.round(filteredTotalPasses * (fullData.successfulPasses / fullData.totalPasses));
//     const filteredPlayingTime = filteredMatchesPlayed * (fullData.totalPlayingTime / fullData.matchesPlayed);
//     const filteredGoalsScored = Math.round(fullData.goalsScored * (filteredMatchesPlayed / fullData.matchesPlayed));
//     const filteredSanctionsCount = Math.round((fullData.sanctions.paid.count + fullData.sanctions.unpaid.count) * (filteredMatchesPlayed / fullData.matchesPlayed));
//     const paidSanctionsCount = Math.round(filteredSanctionsCount * (fullData.sanctions.paid.count / (fullData.sanctions.paid.count + fullData.sanctions.unpaid.count)));
//     const unpaidSanctionsCount = filteredSanctionsCount - paidSanctionsCount;
//     const yellowCards = Math.round(fullData.sanctions.yellowCards * (filteredMatchesPlayed / fullData.matchesPlayed));
//     const redCards = Math.round(fullData.sanctions.redCards * (filteredMatchesPlayed / fullData.matchesPlayed));

//     return of({
//       matchesPlayed: filteredMatchesPlayed,
//       totalPasses: filteredTotalPasses,
//       successfulPasses: filteredSuccessfulPasses,
//       sanctions: {
//         paid: { amount: Math.round(fullData.sanctions.paid.amount * (filteredMatchesPlayed / fullData.matchesPlayed)), count: paidSanctionsCount },
//         unpaid: { amount: Math.round(fullData.sanctions.unpaid.amount * (filteredMatchesPlayed / fullData.matchesPlayed)), count: unpaidSanctionsCount },
//         yellowCards,
//         redCards
//       },
//       totalPlayingTime: filteredPlayingTime,
//       goalsScored: filteredGoalsScored,
//       passesByMatch: filteredPassesByMatch,
//       recentMatches: fullData.recentMatches.filter(match => match.date >= startDate && match.date <= endDate)
//     });
//   }


  // // Nouvelle méthode pour les stats de l'Administrateur
  // getAdminStats(startDate?: Date, endDate?: Date): Observable<any> {
  //   const fullData = {
  //     totalGroups: 10,
  //     totalUsers: 150,
  //     usersByGroup: [
  //       { groupName: 'Groupe A', userCount: 25, users: [{ id: 1, name: 'Jean Dupont', role: 'MEMBRE' }, { id: 2, name: 'Marie Curie', role: 'RESPONSABLE' }] },
  //       { groupName: 'Groupe B', userCount: 20, users: [{ id: 3, name: 'Pierre Martin', role: 'MEMBRE' }, { id: 4, name: 'Sophie Laurent', role: 'MEMBRE' }] },
  //       { groupName: 'Groupe C', userCount: 30, users: [{ id: 5, name: 'Luc Besson', role: 'MEMBRE' }, { id: 6, name: 'Emma Dubois', role: 'RESPONSABLE' }] }
  //     ],
  //     totalContributions: 5000000,
  //     paidSanctions: { amount: 600000, count: 40 },
  //     unpaidSanctions: { amount: 200000, count: 15 },
  //     totalMatches: 50,
  //     usersByRole: { admin: 5, responsable: 10, membre: 135 },
  //     contributionsByGroup: [
  //       { groupName: 'Groupe A', amount: 1500000, date: new Date('2025-01-15') },
  //       { groupName: 'Groupe B', amount: 1200000, date: new Date('2025-02-15') },
  //       { groupName: 'Groupe C', amount: 1800000, date: new Date('2025-03-15') }
  //     ],
  //     recentActivity: [
  //       { date: new Date('2025-08-01'), action: 'Création du groupe D' },
  //       { date: new Date('2025-07-30'), action: 'Ajout utilisateur Paul Smith' },
  //       { date: new Date('2025-07-28'), action: 'Sanction émise pour retard' },
  //       { date: new Date('2025-07-25'), action: 'Match ajouté' },
  //       { date: new Date('2025-07-20'), action: 'Contribution reçue' }
  //     ]
  //   };

  //   if (!startDate || !endDate) {
  //     return of(fullData);
  //   }

  //   const filteredContributionsByGroup = fullData.contributionsByGroup.filter(item => item.date >= startDate && item.date <= endDate);
  //   const filteredTotalContributions = filteredContributionsByGroup.reduce((sum, item) => sum + item.amount, 0);
  //   const totalSanctions = fullData.paidSanctions.count + fullData.unpaidSanctions.count;
  //   const filteredSanctionCount = Math.round(totalSanctions * (filteredContributionsByGroup.length / fullData.contributionsByGroup.length));
  //   const paidSanctionsCount = Math.round(filteredSanctionCount * (fullData.paidSanctions.count / totalSanctions));
  //   const unpaidSanctionsCount = filteredSanctionCount - paidSanctionsCount;

  //   return of({
  //     totalGroups: fullData.totalGroups,
  //     totalUsers: fullData.totalUsers,
  //     usersByGroup: fullData.usersByGroup,
  //     totalContributions: filteredTotalContributions,
  //     paidSanctions: { amount: Math.round(fullData.paidSanctions.amount * (filteredContributionsByGroup.length / fullData.contributionsByGroup.length)), count: paidSanctionsCount },
  //     unpaidSanctions: { amount: Math.round(fullData.unpaidSanctions.amount * (filteredContributionsByGroup.length / fullData.contributionsByGroup.length)), count: unpaidSanctionsCount },
  //     totalMatches: Math.round(fullData.totalMatches * (filteredContributionsByGroup.length / fullData.contributionsByGroup.length)),
  //     usersByRole: fullData.usersByRole,
  //     contributionsByGroup: filteredContributionsByGroup,
  //     recentActivity: fullData.recentActivity.filter(activity => activity.date >= startDate && activity.date <= endDate)
  //   });
  // }
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



