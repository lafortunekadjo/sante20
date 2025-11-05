import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Presence } from '../models/presence.model';
import { Membre } from '../models/membre.model';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
 

  constructor(private http: HttpClient) {}

  private presenceUrl = `${environment.apiUrl}/presences`; 
  


  getPresences(matchId: number): Observable<Presence[]> {
    return this.http.get<Presence[]>(`${environment.apiUrl}/presences/match/${matchId}`);
  }



  addPresence(groupeId: number, matchId: number, presence: any): Observable<Presence> {
    return this.http.post<Presence>(`${environment.apiUrl}/groupes/${groupeId}/matchs/${matchId}/presences`, presence);
  }

  getPresencesByMatch(groupeId: number, matchId: number): Observable<Presence[]> {
    return this.http.get<Presence[]>(`${environment.apiUrl}/groupes/${groupeId}/matchs/${matchId}/presences`);
  }

  createPresence(presence: any): Observable<Presence> {
    return this.http.post<Presence>(this.presenceUrl, presence);
  }

  updatePresence(id: number, presence: any): Observable<Presence> {
    return this.http.put<Presence>(`${this.presenceUrl}/${id}`, presence);
  }

  getPresenceById(id: number): Observable<Presence> {
    return this.http.get<Presence>(`${this.presenceUrl}/${id}`);
  }

  getAllPresences(): Observable<Presence[]> {
    return this.http.get<Presence[]>(this.presenceUrl);
  }

  getPresencesByMatchId(matchId: number): Observable<Presence[]> {
    return this.http.get<Presence[]>(`${this.presenceUrl}/match/${matchId}`);
  }

  getPresencesByMembreId(membreId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.presenceUrl}/membre/${membreId}`);
  }

   getPresenceByMatchAndMembre(matchId: number, membreId: number): Observable<Presence> {
    return this.http.get<Presence>(`${this.presenceUrl}/match/${matchId}/membre/${membreId}`);
  }

savePresences(matchId: number, presences: any[]): Observable<void> {
    console.log('Présences avant transformation:', presences);
    const payload = presences
      .filter(p => p.present) // Inclure uniquement les présences avec present: true
      .map(presence => ({
        id: presence.id,
        matchId: presence.match?.id || matchId,
        membre: presence.membre?.id,
        present: presence.present,
        nomOccasionnel: presence.nomOccasionnel,
        aJoue: presence.aJoue,
        estCapitaine: presence.estCapitaine,
        buts: presence.buts,
        passes: presence.passes,
        estHommeDuMatch: presence.estHommeDuMatch,
        estHommeDuMatchEq: presence.estHommeDuMatchEq,
        equipeMatch: presence.equipeMatch,
        cartonsJaunes: presence.cartonsJaunes || 0,
        cartonsRouges: presence.cartonsRouges || 0,
        butsContreSonCamp: presence.butsContreSonCamp || 0,
        penalti: presence.penalti || 0
      }));
    console.log('Payload envoyé:', payload);
    return this.http.post<void>(`${this.presenceUrl}/match/${matchId}`, payload);
  }

  deletePresence(id: number): Observable<void> {
    return this.http.delete<void>(`${this.presenceUrl}/${id}`);
  }

  getMembreByMatch(id: number): Observable<Membre[]> {
    return this.http.get<Membre[]>(`${this.presenceUrl}/matchAll/${id}`);
  }

  getPresencesForMembre(membreId: number, dateDebut: Date, dateFin: Date): Observable<Presence[]> {
    let params = new HttpParams()
      .set('membreId', membreId.toString())
      .set('dateDebut', dateDebut.toISOString())
      .set('dateFin', dateFin.toISOString());

    return this.http.get<Presence[]>(`${this.presenceUrl}/by-membre-and-dates`, { params });
  }
}
