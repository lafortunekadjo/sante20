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

    // uploadProfilePhoto(userId: number, file: File): Observable<any> {
    //   const formData: FormData = new FormData();
    //   formData.append('profilePhoto', file, file.name);
  
    //   return this.http.post(`${this.userUpdateUrl}/${userId}/profile-photo`, formData).pipe(
    //     tap(() => console.log('Photo de profil téléchargée avec succès sur le serveur.')),
    //     catchError(error => {
    //       console.error('Erreur lors du téléchargement de la photo de profil:', error);
    //       return throwError(error);
    //     })
    //   );
    // }


  uploadGroupePhoto(groupId: number, formData: FormData): Observable<any> {
    // Le chemin de l'API pourrait être quelque chose comme:
    // POST /api/v1/groupes/{groupId}/photo
    const url = `${environment.apiUrl}/group/${groupId}/profile-photo`;

    // HttpClient gère automatiquement les headers (comme 'Content-Type: multipart/form-data')
    // lorsqu'il reçoit un objet FormData.
    return this.http.post<any>(url, formData);
  }

  // --- Fonctions simulées pour un exemple complet (non requises mais utiles) ---

  /**
   * Récupère les détails d'un groupe. (Simulé)
   */
  // getGroupe(groupId: number): Observable<Groupe> {
  //   const url = `${this.apiUrl}/${groupId}`;
  //   return this.http.get<Groupe>(url);
  // }
  
  verifierDemandeExistante(id: number, userId: number) {
    return this.http.get<Boolean>(`${environment.apiUrl}/candidatures/check/${id}/${userId}`);
  }

  constructor(private http: HttpClient) {}

  getAllGroupes(): Observable<Groupe[]> {
    return this.http.get<Groupe[]>(`${environment.apiUrl}/groupes`);
  }

  getAllGroupesMembre(): Observable<Groupe> {
    return this.http.get<Groupe>(`${environment.apiUrl}/groupes/connect`);
  }

  getGroupe(id: number): Observable<Groupe> {
    return this.http.get<Groupe>(`${environment.apiUrl}/groupes/${id}`);
  }

   getGroupeId(id: number): Observable<Groupe> {
    return this.http.get<Groupe>(`${environment.apiUrl}/groupes/byId/${id}`);
  }

    getGroupeConn(): Observable<Groupe> {
    return this.http.get<Groupe>(`${environment.apiUrl}/groupes/connect`);
  }

  createGroupe(groupe: any): Observable<Groupe> {
    return this.http.post<Groupe>(`${environment.apiUrl}/groupes`, groupe);
  }

    addGroupe(groupe: any): Observable<Groupe> {
    return this.http.post<Groupe>(`${environment.apiUrl}/addgroupe`, groupe);
  }

  updateGroupe(id: number, groupe: any): Observable<Groupe> {
    console.log(groupe)
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

   createStade(stade: any): Observable<Stade> {
    console.log(stade)
    return this.http.post<Stade>(`${environment.apiUrl}/stades`, stade);
  }
  
  

}
