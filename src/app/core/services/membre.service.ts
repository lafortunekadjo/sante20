import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environment';
import { Membre } from '../models/membre.model';

@Injectable({
  providedIn: 'root'
})
export class MembreService {

    constructor(private http: HttpClient) {}

     private apiUrl = `${environment.apiUrl}/membres`; 

  getMembreWithStats(membreId: number): Observable<Membre> {
    return this.http.get<Membre>(`${environment.apiUrl}/membres/${membreId}/stats`);
  }

   getMembres(): Observable<Membre[]> {
    return this.http.get<Membre[]>(`${environment.apiUrl}/membres/all`);
  }

  // Membres du groupe
  getGroupMembers(): Observable<Membre[]> {
    return this.http.get<Membre[]>(`${environment.apiUrl}/groupes/membre1`).pipe(
      catchError(err => {
        console.error('Erreur lors de la récupération des membres:', err);
        return throwError(err);
      })
    );
  }

  createMember(membre: any): Observable<Membre> {
    
    const payload = {
      nom: membre.nom,
      prenom: membre.prenom,
      dateNaissance: membre.dateNaissance,
      poste: membre.poste || null,
      email: membre.email || null,
      cotisationPayee: membre.cotisationPayee,
      roleCO: membre.roleCO || null,
      equipe: membre.equipe.id || null,
      groupe: membre.groupe.id,
      user: membre.user.id,
      active: membre.active
    };
    console.log(payload)
    return this.http.post<Membre>(`${environment.apiUrl}/membres`, payload).pipe(
      catchError(err => {
        console.error('Erreur lors de la création du membre:', err);
        return throwError(err);
      })
    );
  }

  // updateMember(id: number, membre: Membre): Observable<Membre> {
  //   const payload = {
  //     nom: membre.nom,
  //     prenom: membre.prenom,
  //     dateNaissance: membre.dateNaissance,
  //     poste: membre.poste || null,
  //     email: membre.email || null,
  //     cotisationPayee: membre.cotisationPayee,
  //     roleCO: membre.roleCO || null,
  //     equipe: membre.equipe || null,
  //     groupe: membre.groupe.id,
  //     user: membre.user.id,
  //     active: membre.active
  //   };
  //   return this.http.put<Membre>(`${environment.apiUrl}/membres/{$id}`, payload).pipe(
  //     catchError(err => {
  //       console.error('Erreur lors de la mise à jour du membre:', err);
  //       return throwError(err);
  //     })
  //   );
  // }

  deleteMember(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/membres/all`).pipe(
      catchError(err => {
        console.error('Erreur lors de la suppression du membre:', err);
        return throwError(err);
      })
    );
  }

  activateMember(id: number): Observable<void> {
    return this.http.get<void>(`${environment.apiUrl}/membres/all`).pipe(
      catchError(err => {
        console.error('Erreur lors de l’activation du membre:', err);
        return throwError(err);
      })
    );
  }

  deactivateMember(id: number): Observable<void> {
    return this.http.get<void>(`${environment.apiUrl}/membres/all`).pipe(
      catchError(err => {
        console.error('Erreur lors de la désactivation du membre:', err);
        return throwError(err);
      })
    );
  }


  createMembre(membre: any): Observable<Membre> {
     const payload = {
      nom: membre.nom,
      prenom: membre.prenom,
      dateNaissance: membre.dateNaissance,
      poste: membre.poste || null,
      email: membre.email || null,
      cotisationPayee: membre.cotisationPayee,
      roleCO: membre.roleCO || null,
      equipe: membre.equipe.id || null,
      groupe: membre.groupe.id,
      user: membre.user.id,
      active: membre.true
    };
    return this.http.post<Membre>(this.apiUrl, payload);
  }

  updateMembre(id: number, membre: any): Observable<Membre> {
    const payload = {
      nom: membre.nom,
      prenom: membre.prenom,
      dateNaissance: membre.dateNaissance,
      poste: membre.poste || null,
      email: membre.email || null,
      cotisationPayee: membre.cotisationPayee,
      roleCO: membre.roleCO || null,
      equipe: membre.equipe.id || null,
      // groupe: membre.groupe.id,
      user: membre.user.id,
      active: true,
      sexe:membre.sexe
    };
    console.log(payload)
    return this.http.put<Membre>(`${this.apiUrl}/${id}`, payload);
  }

  getMembreById(id: number): Observable<Membre> {
    return this.http.get<Membre>(`${this.apiUrl}/${id}`);
  }

  getAllMembres(): Observable<Membre[]> {
    return this.http.get<Membre[]>(this.apiUrl);
  }

  getMembresByGroupeId(groupeId: number): Observable<Membre[]> {
    return this.http.get<Membre[]>(`${this.apiUrl}/groupe/${groupeId}`);
  }

  getMembresByEquipeId(equipeId: number): Observable<Membre[]> {
    return this.http.get<Membre[]>(`${this.apiUrl}/equipe/${equipeId}`);
  }

  getMembreByUserId(userId: number): Observable<Membre> {
    return this.http.get<Membre>(`${this.apiUrl}/user/${userId}`);
  }

  deleteMembre(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

