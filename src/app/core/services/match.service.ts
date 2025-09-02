import { HttpClient } from '@angular/common/http';
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
  
  
  
  // updateMatch(id: number, matchToSave: Match) : Observable<Match> {
  //   return this.http.put<Match>(`${environment.apiUrl}/groupes/${id}`, matchToSave)
  // }
  // deleteMatch(id: number) {
  //   return this.http.delete<void>(`${environment.apiUrl}/match/${id}`);
  // }

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
        return this.http.get<Match[]>(`${environment.apiUrl}/matchs`);
  }

  getMatch(matchId: number): Observable<Match> {
    return this.http.get<Match>(`${environment.apiUrl}/matchs/${matchId}`);

  }


  createMatch(match: any): Observable<Match> {
    return this.http.post<Match>(this.matchUrl, match);
  }

  updateMatch(id: number, match: any): Observable<Match> {
    return this.http.put<Match>(`${this.matchUrl}/${id}`, match);
  }

  getMatchById(id: number): Observable<Match> {
    return this.http.get<Match>(`${this.matchUrl}/${id}`);
  }

  getAllMatches(): Observable<Match[]> {
    return this.http.get<Match[]>(this.matchUrl);
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
    return this.http.get<Presence[]>(`${environment.apiUrl}/presences`);
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
