import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

// ===== INTERFACES =====

export interface CreateInvitationRequest {
  matchId: number;
  minJoueurs?: number;
  maxJoueurs?: number;
  message?: string;
  joursValidite?: number;
}

export interface InvitationCreatedResponse {
  id: number;
  token: string;
  inviteUrl: string;
  qrCodeUrl: string;
  dateExpiration: string;
  minJoueurs: number;
  maxJoueurs: number;
  message?: string;
}

export interface SubmitPlayersRequest {
  nomEquipe: string;
  emailContact?: string;
  telephoneContact?: string;
  joueurs: JoueurInviteRequest[];
}

export interface JoueurInviteRequest {
  nom: string;
  prenom: string;
  numeroMaillot?: number;
  poste?: string;
  estCapitaine?: boolean;
  estGardien?: boolean;
}

export interface PublicInvitationResponse {
  valide: boolean;
  messageErreur?: string;
  match?: MatchInfo;
  organisateur?: GroupeInfo;
  messagePersonnalise?: string;
  minJoueurs?: number;
  maxJoueurs?: number;
  dateExpiration?: string;
  dejaSoumis?: boolean;
  nomEquipeSoumise?: string;
  nombreJoueursSoumis?: number;
}

export interface MatchInfo {
  id: number;
  dateMatch: string;
  heureMatch?: string;
  lieu?: string;
  stade?: string;
  typeMatch?: string;
}

export interface GroupeInfo {
  id: number;
  nom: string;
  ville?: string;
  logoUrl?: string;
}

export interface InvitationListItem {
  id: number;
  token: string;
  matchId: number;
  adversairePrevu?: string;
  dateMatch: string;
  statut: InvitationStatus;
  nomEquipeAdverse?: string;
  nombreJoueurs: number;
  dateExpiration: string;
  nombreVues: number;
  dateSoumission?: string;
}

export interface InvitationDetails {
  id: number;
  token: string;
  statut: InvitationStatus;
  dateExpiration: string;
  dateSoumission?: string;
  nombreVues: number;
  minJoueurs: number;
  maxJoueurs: number;
  message?: string;
  match: MatchInfo;
  organisateur: GroupeInfo;
  equipeAdverse?: EquipeAdverse;
}

export interface EquipeAdverse {
  nomEquipe: string;
  emailContact?: string;
  telephoneContact?: string;
  joueurs: JoueurInviteResponse[];
}

export interface JoueurInviteResponse {
  id: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  initiales: string;
  numeroMaillot?: number;
  poste?: string;
  estCapitaine: boolean;
  estGardien: boolean;
}

export type InvitationStatus = 
  | 'EN_ATTENTE' 
  | 'SOUMIS' 
  | 'VALIDE' 
  | 'REFUSE' 
  | 'EXPIRE' 
  | 'ANNULE';

// ===== SERVICE =====

@Injectable({
  providedIn: 'root'
})
export class MatchInvitationService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ===== ENDPOINTS AUTHENTIFIÉS =====

  /**
   * Crée une nouvelle invitation
   */
  createInvitation(request: CreateInvitationRequest): Observable<InvitationCreatedResponse> {
    return this.http.post<InvitationCreatedResponse>(
      `${this.apiUrl}/groupes/invitations`,
      request
    );
  }

  /**
   * Liste les invitations du groupe
   */
  getInvitations(): Observable<InvitationListItem[]> {
    return this.http.get<InvitationListItem[]>(
      `${this.apiUrl}/groupes/invitations`
    );
  }

  /**
   * Détails d'une invitation
   */
  getInvitationDetails(invitationId: number): Observable<InvitationDetails> {
    return this.http.get<InvitationDetails>(
      `${this.apiUrl}/groupes/invitations/${invitationId}`
    );
  }

  /**
   * Valide une invitation
   */
  validateInvitation(invitationId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/groupes/invitations/${invitationId}/validate`,
      {}
    );
  }

  /**
   * Refuse une invitation
   */
  rejectInvitation(invitationId: number, motif?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/groupes/invitations/${invitationId}/reject`,
      { motif }
    );
  }

  /**
   * Annule une invitation
   */
  cancelInvitation(invitationId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/groupes/invitations/${invitationId}`
    );
  }

  // ===== ENDPOINTS PUBLICS =====

  /**
   * Récupère les infos publiques d'une invitation
   */
  getPublicInvitation(token: string): Observable<PublicInvitationResponse> {
    return this.http.get<PublicInvitationResponse>(
      `${this.apiUrl}/public/invitations/${token}`
    );
  }

  /**
   * Soumet la liste des joueurs
   */
  submitPlayers(token: string, request: SubmitPlayersRequest): Observable<{ message: string; info: string }> {
    return this.http.post<{ message: string; info: string }>(
      `${this.apiUrl}/public/invitations/${token}/submit`,
      request
    );
  }

  /**
   * URL du QR Code
   */
  getQRCodeUrl(token: string): string {
    return `${this.apiUrl}/invitations/${token}/qrcode`;
  }

  // ===== UTILITAIRES =====

  /**
   * Retourne le libellé du statut
   */
  getStatutLabel(statut: InvitationStatus): string {
    const labels: Record<InvitationStatus, string> = {
      'EN_ATTENTE': 'En attente',
      'SOUMIS': 'Liste soumise',
      'VALIDE': 'Validée',
      'REFUSE': 'Refusée',
      'EXPIRE': 'Expirée',
      'ANNULE': 'Annulée'
    };
    return labels[statut] || statut;
  }

  /**
   * Retourne la classe CSS du statut
   */
  getStatutClass(statut: InvitationStatus): string {
    const classes: Record<InvitationStatus, string> = {
      'EN_ATTENTE': 'status-pending',
      'SOUMIS': 'status-submitted',
      'VALIDE': 'status-validated',
      'REFUSE': 'status-rejected',
      'EXPIRE': 'status-expired',
      'ANNULE': 'status-cancelled'
    };
    return classes[statut] || '';
  }

  /**
   * Vérifie si l'invitation peut être validée
   */
  canValidate(statut: InvitationStatus): boolean {
    return statut === 'SOUMIS';
  }

  /**
   * Vérifie si l'invitation peut être annulée
   */
  canCancel(statut: InvitationStatus): boolean {
    return statut === 'EN_ATTENTE' || statut === 'SOUMIS';
  }
}