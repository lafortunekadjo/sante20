import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environment';
import { Match } from '../models/match.model';
import { FeuilleMatch } from '../models/feuilleMatch.model';
import { Groupe } from '../models/groupe.model';
import { Presence } from '../models/presence.model';

@Injectable({
  providedIn: 'root'
})
export class MatchService {

  
    constructor(private http: HttpClient) {}

    private matchUrl = `${environment.apiUrl}/matchs`; 
  
  
  
  getMatchesByDateRange(startDate: string, endDate: string): Observable<Match[]> {
  const params = new HttpParams()
    .set('startDate', startDate)
    .set('endDate', endDate);
    
  return this.http.get<Match[]>(`${environment.apiUrl}/matchs/by-date-range`, { params });
}

  generatePoster(matchId: number): Observable<Blob> {
    // Appel au endpoint backend qui utilise ImageGeneratorService
    return this.http.get(`${environment.apiUrl}/matches/${matchId}/poster`, { responseType: 'blob' });
  }

/**
 * Récupère les matchs pour un exercice spécifique
 * 
 * @param exerciceId ID de l'exercice
 * @returns Observable<Match[]>
 */
getMatchesByExercice(exerciceId: number): Observable<Match[]> {
  return this.http.get<Match[]>(`${environment.apiUrl}/match/exercice/${exerciceId}`);
}

/**
 * Récupère les matchs de l'exercice en cours du groupe
 * 
 * @param groupeId ID du groupe
 * @returns Observable<Match[]>
 */
getMatchesForCurrentExercice(groupeId: number): Observable<Match[]> {
  return this.http.get<Match[]>(`${environment.apiUrl}/match/groupe/${groupeId}/current-exercice`);
}


    updateGroupe(id: number, groupe: any): Observable<Groupe> {
    return this.http.put<Groupe>(`${environment.apiUrl}/groupes/${id}`, groupe);
  }

  deleteGroupe(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/groupes/${id}`);
  }



  // createMatch(match: any): Observable<Match> {
  //   return this.http.post<Match>(`${environment.apiUrl}/matchs`, match);
  // }

  getAllMatch(): Observable<Match[]> {
        return this.http.get<Match[]>(`${environment.apiUrl}/matchs/groupe`);
  }

  getMatch(matchId: number): Observable<Match> {
    return this.http.get<Match>(`${environment.apiUrl}/matchs/${matchId}`);

  }


  createMatch(match: any): Observable<Match> {
    return this.http.post<Match>(this.matchUrl, match);
  }

  updateMatch(id: number, match: any): Observable<Match> {
    console.log(match)
    return this.http.put<Match>(`${this.matchUrl}/${id}`, match);
  }

  getMatchById(id: number): Observable<Match> {
    return this.http.get<Match>(`${this.matchUrl}/${id}`);
  }

  getAllMatches(): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.matchUrl}/groupe`);
  }

  getMatchesByGroupeId(groupeId: number): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.matchUrl}/groupe/${groupeId}`);
  }

  deleteMatch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.matchUrl}/${id}`);
  }



  // // Récupère les matchs récents (filtré côté client)
  // getRecentMatches(): Observable<Match[]> {
  //   return this.getAllMatches();
  // }

  //   // Récupère tous les matchs
  // getAllMatches(): Observable<Match[]> {
  //   return this.http.get<Match[]>(`${this.apiUrl}/matches`);
  // }

  // Récupère toutes les présences
  getAllPresences(): Observable<Presence[]> {
    return this.http.get<Presence[]>(`${environment.apiUrl}/presences/groupe`);
  }

    getPresencesByMatch(matchId: number): Observable<Presence[]> {
    return this.http.get<Presence[]>(`${environment.apiUrl}/presences/match/${matchId}`);
  }

  // // Récupère les présences d'un match spécifique
  // getPresencesByMatch(matchId: number): Presence[] {
  //   // Simulé, à remplacer par un appel HTTP si backend le permet
  //   return this.getAllPresences().pipe(
  //     map(presences => presences.filter(p => p.match.id === matchId))
  //   ).subscribe(presences => presences); // À adapter avec Observable si besoin
  //   // Note : Cette méthode devrait idéalement être un Observable<Presence[]>
  // }

  // Récupère les matchs récents (filtré côté client)
  getRecentMatches(): Observable<Match[]> {
    return this.getAllMatches();
  }
  
      
}
