import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { PaiementSanction } from '../models/paiement-sanction.model';

@Injectable({
  providedIn: 'root'
})
export class PaiementSanctionService {

    constructor(private http: HttpClient) {}

  addPaiementSanction(groupeId: number, membreId: number, sanctionId: number, paiement: any): Observable<PaiementSanction> {
    return this.http.post<PaiementSanction>(`${environment.apiUrl}/groupes/${groupeId}/membres/${membreId}/sanctions/${sanctionId}/paiements`, paiement);
  }

  getPaiementsBySanction(groupeId: number, membreId: number, sanctionId: number): Observable<PaiementSanction[]> {
    return this.http.get<PaiementSanction[]>(`${environment.apiUrl}/groupes/${groupeId}/membres/${membreId}/sanctions/${sanctionId}/paiements`);
  }

  getPaiementsByGroupe(groupeId: number): Observable<PaiementSanction[]> {
    return this.http.get<PaiementSanction[]>(`${environment.apiUrl}/groupes/${groupeId}/sanctions/paiements`);
  }
}
