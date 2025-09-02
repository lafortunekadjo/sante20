import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Stade } from '../models/stade';
import { environment } from '../../environment';
import { TypeSanction } from '../models/typeSanction.model';
import { Equipe } from '../models/groupe.model copy';
import { Evenement } from '../models/evenement.model';
import { Contribution } from '../models/contribution.model';
import { Membre } from '../models/membre.model';
import { Presence } from '../models/presence.model';
import { Announcement } from '../models/announcement.model';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {
  getAllMembres(): any {
    throw new Error('Method not implemented.');
  }
 

  constructor(private http: HttpClient) { }

  private stadeUrl = `${environment.apiUrl}/stade`; 
  private typeSanctionUrl = `${environment.apiUrl}/type-sanctions`;
  private equipeUrl = `${environment.apiUrl}/equipes`;
    private evenementUrl = `${environment.apiUrl}/evenements`;

  createStade(stade: any): Observable<Stade> {
    return this.http.post<Stade>(this.stadeUrl, stade);
  }

  updateStade(id: number, stade: any): Observable<Stade> {
    return this.http.put<Stade>(`${this.stadeUrl}/${id}`, stade);
  }

  getStadeById(id: number): Observable<Stade> {
    return this.http.get<Stade>(`${this.stadeUrl}/${id}`);
  }

  getAllStades(): Observable<Stade[]> {
    return this.http.get<Stade[]>(this.stadeUrl);
  }

  deleteStade(id: number): Observable<void> {
    return this.http.delete<void>(`${this.stadeUrl}/${id}`);
  }

  createTypeSanction(typeSanction: any): Observable<TypeSanction> {
    return this.http.post<TypeSanction>(this.typeSanctionUrl, typeSanction);
  }

  updateTypeSanction(id: number, typeSanction: any): Observable<TypeSanction> {
    return this.http.put<TypeSanction>(`${this.typeSanctionUrl}/${id}`, typeSanction);
  }

  getTypeSanctionById(id: number): Observable<TypeSanction> {
    return this.http.get<TypeSanction>(`${this.typeSanctionUrl}/${id}`);
  }

  getAllTypeSanctions(): Observable<TypeSanction[]> {
    return this.http.get<TypeSanction[]>(this.typeSanctionUrl);
  }

  deleteTypeSanction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.typeSanctionUrl}/${id}`);
  }


  // equipes

  getEquipesByGroupe(): Observable<Equipe[]> {
    return this.http.get<Equipe[]>(`${this.equipeUrl}/groupe`);
  }

  createEquipe(equipe: Equipe): Observable<Equipe> {
    return this.http.post<TypeSanction>(this.equipeUrl, equipe);
  }

  updateEquipe(id: number, equipe: Equipe): Observable<Equipe> {
    return this.http.put<TypeSanction>(`${this.equipeUrl}/${id}`, equipe);
  }

  desactivateEquipe(id: number): Observable<void> {
    return this.http.get<void>(`${this.equipeUrl}/desactivate/${id}`).pipe(
      catchError(err => {
        console.error('Erreur lors de la désactivation du groupe:', err);
        return throwError(err);
      })
    );
  }

    getAllEvenements(): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(this.evenementUrl);
  }

  getEvenementById(id: number): Observable<Evenement> {
    return this.http.get<Evenement>(`${this.evenementUrl}/${id}`);
  }

  createEvenement(evenement: Evenement): Observable<Evenement> {
    return this.http.post<Evenement>(this.evenementUrl, evenement);
  }

  updateEvenement(id: number, evenement: Evenement): Observable<Evenement> {
    return this.http.put<Evenement>(`${this.evenementUrl}/${id}`, evenement);
  }

  deleteEvenement(id: number): Observable<any> {
    return this.http.delete(`${this.evenementUrl}/${id}`);
  }

  getNotifications() {
     return this.http.get<Evenement[]>(this.evenementUrl);
  }

   getContributionsByEvenement(evenementId: number): Observable<Contribution[]> {
     return this.http.get<Contribution[]>(`${this.evenementUrl}/${evenementId}`);
  }

  // Récupère les anniversaires à venir (logique côté client dans le composant)
  getUpcomingBirthdays(): Observable<Membre[]> {
    return this.http.get<Membre[]>(`${environment.apiUrl}/membres`);
  }

  // Récupère les annonces du groupe (statique pour l'instant)
  getGroupAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${environment.apiUrl}/announcements/groupe/{groupeId}`); // Remplace {groupeId} par l'ID réel
  }

  // Récupère les top buteurs (basé sur les présences)
  getTopScorers(): Observable<{ membre: Membre; buts: number }[]> {
    return this.http.get<Presence[]>(`${environment.apiUrl}/presences`).pipe(
      map(presences => {
        const scorerMap = new Map<number, number>();
        presences.forEach(p => {
          scorerMap.set(p.membre.id, (scorerMap.get(p.membre.id) || 0) + p.buts);
        });
        return Array.from(scorerMap.entries())
          .map(([id, buts]) => ({ membre: presences.find(p => p.membre.id === id)?.membre!, buts }))
          .sort((a, b) => b.buts - a.buts)
          .slice(0, 5);
      })
    );
  }

  // Récupère les top passeurs (basé sur les présences)
  getTopPassers(): Observable<{ membre: Membre; passes: number }[]> {
    return this.http.get<Presence[]>(`${environment.apiUrl}/presences`).pipe(
      map(presences => {
        const passerMap = new Map<number, number>();
        presences.forEach(p => {
          passerMap.set(p.membre.id, (passerMap.get(p.membre.id) || 0) + p.passes);
        });
        return Array.from(passerMap.entries())
          .map(([id, passes]) => ({ membre: presences.find(p => p.membre.id === id)?.membre!, passes }))
          .sort((a, b) => b.passes - a.passes)
          .slice(0, 5);
      })
    );
  }
  // Récupère les événements actuels (filtré côté client)
  getCurrentEvents(): Observable<Evenement[]> {
    return this.getAllEvenements();
  }
  
}
