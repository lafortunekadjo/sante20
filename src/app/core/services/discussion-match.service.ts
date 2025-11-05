// src/app/core/services/discussion-match.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';


export interface DiscussionMatch {
  id: number;
  defiMatchId: number;
  dateCreation: string;
  active: boolean;
  groupeEmetteur: {
    id: number;
    nom: string;
    imageUrl?: string;
    discipline: string;
    ville?: string;
  };
  groupeCible: {
    id: number;
    nom: string;
    imageUrl?: string;
    discipline: string;
    ville?: string;
  };
  messages: MessageDiscussionMatch[];
  messagesNonLus: number;
  dernierMessage?: MessageDiscussionMatch;
}

export interface MessageDiscussionMatch {
  id: number;
  discussionId: number;
  auteurId: number;
  auteurNom: string;
  auteurPrenom: string;
  auteurPhotoUrl?: string;
  groupeAuteurId: number;
  groupeAuteurNom: string;
  contenu: string;
  dateEnvoi: string;
  lu: boolean;
}

export interface CreateMessageDTO {
  discussionId: number;
  contenu: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiscussionMatchService {
  private apiUrl = `${environment.apiUrl}/discussions-match`;

  constructor(private http: HttpClient) {}

  /**
   * Créer ou récupérer une discussion pour un défi match
   */
  creerOuRecupererDiscussion(defiMatchId: number): Observable<DiscussionMatch> {
    const params = new HttpParams().set('defiMatchId', defiMatchId.toString());
    return this.http.post<DiscussionMatch>(`${this.apiUrl}/create-or-get`, null, { params });
  }

  /**
   * Récupérer une discussion par son ID
   */
  getDiscussion(discussionId: number): Observable<DiscussionMatch> {
    return this.http.get<DiscussionMatch>(`${this.apiUrl}/${discussionId}`);
  }

  /**
   * Récupérer toutes les discussions d'un groupe
   */
  getDiscussionsParGroupe(groupeId: number): Observable<DiscussionMatch[]> {
    return this.http.get<DiscussionMatch[]>(`${this.apiUrl}/groupe/${groupeId}`);
  }

  /**
   * Envoyer un message
   */
  envoyerMessage(dto: CreateMessageDTO): Observable<MessageDiscussionMatch> {
    return this.http.post<MessageDiscussionMatch>(`${this.apiUrl}/messages`, dto);
  }
}