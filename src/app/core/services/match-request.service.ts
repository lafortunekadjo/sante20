// src/app/core/services/match-request.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export interface MatchRequest {
  dateCreation: string | number | Date;
  statut: string;
  groupeCible: any;
  groupeDemandeur: any;
  id?: number;
  groupeCibleId: number;
  dateProposee: string; // ISO string
  lieuPropose: string;
  descriptionMessage: string;
}

export interface MatchRequestResponse {
  [x: string]: string | number | Date;
  id: number;
  groupeDemandeur: any;
  groupeCible: any;
  dateProposee: string;
  lieuPropose: string;
  descriptionMessage: string;
  statut: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';
  createdAt: string;
  dateReponse: string; // ✅ Changer de Date à string pour correspondre au format ISO
  motifRefus: string; 
}

@Injectable({
  providedIn: 'root'
})
export class MatchRequestService {
  private apiUrl = `${environment.apiUrl}/defis`;

  constructor(private http: HttpClient) {}

  /**
   * Créer une demande de match amical
   */
  createMatchRequest(request: MatchRequest): Observable<MatchRequestResponse> {
    return this.http.post<MatchRequestResponse>(`${this.apiUrl}/lancer`, request);
  }

  /**
   * Récupérer toutes les demandes envoyées par mon groupe
   */
  getMyGroupRequests(): Observable<MatchRequestResponse[]> {
    return this.http.get<MatchRequestResponse[]>(`${this.apiUrl}/envoye`);
  }

  /**
   * Récupérer toutes les demandes reçues par mon groupe
   */
  getReceivedRequests(): Observable<MatchRequestResponse[]> {
    return this.http.get<MatchRequestResponse[]>(`${this.apiUrl}/recus/all`);
  }

  /**
   * Accepter une demande de match
   */
  acceptRequest(requestId: number): Observable<MatchRequestResponse> {
    return this.http.put<MatchRequestResponse>(`${this.apiUrl}/${requestId}/accept`, {});
  }

  /**
   * Refuser une demande de match
   */
  refuseRequest(requestId: number): Observable<MatchRequestResponse> {
    return this.http.put<MatchRequestResponse>(`${this.apiUrl}/${requestId}/refuse`, {});
  }

  /**
   * Annuler une demande de match
   */
  cancelRequest(requestId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${requestId}`);
  }
}