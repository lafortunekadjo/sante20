import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';


export interface AuditDto {
  revisionId: number;
  date: string;
  utilisateur: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entite: string;
  entiteId: number;
  details: any; // L'objet complet
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly API_URL = `${environment.apiUrl}/api/audit`;

  constructor(private http: HttpClient) {}

  // Récupère l'historique des mouvements (le filtrage groupeId est géré par le backend via le JWT)
  getMouvementsAudit(): Observable<AuditDto[]> {
    return this.http.get<AuditDto[]>(`${this.API_URL}/mouvements`);
  }

    getAllAudit(): Observable<AuditDto[]> {
    return this.http.get<AuditDto[]>(`${this.API_URL}/all`);
  }

  // Récupère la version précédente pour faire un comparatif
  getPreviousVersion(entityId: number, revisionId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/mouvements/${entityId}/diff/${revisionId}`);
  }
}