import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Groupe } from '../models/groupe.model';
import { Sanction } from '../models/sanction.model';
import { environment } from '../../environment';
import { Contribution } from '../models/contribution.model';
import { Stade } from '../models/stade';
import { Ville } from '../models/ville';

@Injectable({
  providedIn: 'root'
})
export class GroupeService {

  constructor(private http: HttpClient) {}

  getAllGroupes(): Observable<Groupe[]> {
    return this.http.get<Groupe[]>(`${environment.apiUrl}/groupes`);
  }

  getAllGroupesMembre(): Observable<Groupe> {
    return this.http.get<Groupe>(`${environment.apiUrl}/groupes/membre`);
  }

  getGroupe(id: number): Observable<Groupe> {
    return this.http.get<Groupe>(`${environment.apiUrl}/groupes/${id}`);
  }

  createGroupe(groupe: any): Observable<Groupe> {
    return this.http.post<Groupe>(`${environment.apiUrl}/groupes`, groupe);
  }

  updateGroupe(id: number, groupe: any): Observable<Groupe> {
    return this.http.put<Groupe>(`${environment.apiUrl}/groupes/${id}`, groupe);
  }

  deleteGroupe(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/groupes/${id}`);
  }

  disableGroupe(id: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/groupes/${id}/disable`, {});
  }

  configureGroupe(id: number, config: any): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/groupes/${id}/config`, config);
  }

  getContributionsByGroupe(groupeId: number): Observable<Contribution[]> {
    return this.http.get<Contribution[]>(`${environment.apiUrl}/groupes/${groupeId}/contributions`);
  }

  getSanctionsByGroupe(groupeId: number): Observable<Sanction[]> {
    return this.http.get<Sanction[]>(`${environment.apiUrl}/groupes/${groupeId}/sanctions`);
  }

  getMembresByGroupe(groupeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/groupes/${groupeId}/membres`);
  }

   // Villes
  getVilles(): Observable<Ville[]> {
    return this.http.get<Ville[]>(`${environment.apiUrl}/ville/all`).pipe(
      catchError(err => {
        console.error('Erreur lors de la récupération des villes:', err);
        return throwError(err);
      })
    );
  }

  // Stades
  getStades(): Observable<Stade[]> {
    return this.http.get<Stade[]>(`${environment.apiUrl}/stade/all`).pipe(
      catchError(err => {
        console.error('Erreur lors de la récupération des stades:', err);
        return throwError(err);
      })
    );
  }

  deactivateGroupe(id: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/groupes/${id}/disable`, {});
  }



   activateGroupe(id: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/groupes/${id}/enable`,{});
  }
  
  

}
