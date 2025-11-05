import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environment';
import { Sanction } from '../models/sanction.model';
import { TypeSanction } from '../models/typeSanction.model';

@Injectable({
  providedIn: 'root'
})
export class SanctionService {

  constructor(private http: HttpClient) {}
  
 updateSanction(id: number, sanction: any): Observable<Sanction> {
    return this.http.put<Sanction>(`${environment.apiUrl}/sanctions/${id}`, sanction);
  }

  payerSanction(id: number): Observable<Sanction> {
    return this.http.get<Sanction>(`${environment.apiUrl}/sanctions/payer/${id}`);
  }

  getSanctionsByMatch(matchId: number): Observable<Sanction[]> {
    return this.http.get<Sanction[]>(`${environment.apiUrl}/groupes/${matchId}/sanctions`);
  }

  getTypeSanctions(): Observable<TypeSanction[]> {
    return this.http.get<TypeSanction[]>(`${environment.apiUrl}/type-sanctions`);
  }

 

  applySanction(sanction: any): Observable<Sanction> {
    console.log(sanction)
    return this.http.post<Sanction>(`${environment.apiUrl}/sanctions`, sanction);
  }

  getSanctionsByGroupe(groupeId: number): Observable<Sanction[]> {
    return this.http.get<Sanction[]>(`${environment.apiUrl}/groupes/${groupeId}/sanctions`);
  }

  getSanctionsAll(): Observable<Sanction[]> {
    return this.http.get<Sanction[]>(`${environment.apiUrl}/presences/sanctions`);
  }


  deleteSanction(id: number): Observable<void> {
      return this.http.delete<void>(`${environment.apiUrl}/membres/all`).pipe(
        catchError(err => {
          console.error('Erreur lors de la suppression du membre:', err);
          return throwError(err);
        })
      );
    }



  /**
   * Crée un nouveau type de sanction
   * @param typeSanction Données du type de sanction
   * @returns Observable avec le type de sanction créé
   */
  createTypeSanction(typeSanction: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/type-sanctions`, typeSanction);
  }

  /**
   * Met à jour un type de sanction existant
   * @param id ID du type de sanction
   * @param typeSanction Données mises à jour
   * @returns Observable avec le type de sanction mis à jour
   */
  updateTypeSanction(id: number, typeSanction: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/type-sanctions/${id}`, typeSanction);
  }

  /**
   * Supprime un type de sanction
   * @param id ID du type de sanction
   * @returns Observable pour la suppression
   */
  deleteTypeSanction(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/type-sanctions/${id}`);
  }


  
}
