// ============================================================
// MY2-0 - SYSTÈME D'INVITATION
// Service Angular
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';


// ============================================================
// INTERFACES
// ============================================================

export interface InvitationGroupe {
  id: number;
  groupeId: number;
  groupeNom: string;
  groupeLogo?: string;
  code: string;
  lienComplet: string;
  statut: 'ACTIVE' | 'DESACTIVEE' | 'EXPIREE' | 'QUOTA_ATTEINT';
  dateExpiration?: string;
  quotaMax: number;
  nombreUtilisations: number;
  createdAt: string;
  isValide: boolean;
  placesRestantes?: number;
}

export interface InvitationPublic {
  code: string;
  groupeNom?: string;
  groupeLogo?: string;
  groupeDescription?: string;
  groupeVille?: string;
  groupeDiscipline?: string;
  nombreMembres?: number;
  isValide: boolean;
  messageErreur?: string;
}

export interface DemandeAdhesion {
  id: number;
  groupeId: number;
  groupeNom: string;
  utilisateurId: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  username: string;
  photoUrl?: string;
  statut: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'ANNULEE';
  message?: string;
  motifRefus?: string;
  createdAt: string;
  dateTraitement?: string;
  traiteParNom?: string;
}

export interface CreateDemandeAdhesionRequest {
  codeInvitation: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  username: string;
  password: string;
  message?: string;
}

export interface InscriptionInvitationResponse {
  success: boolean;
  message: string;
  demandeId?: number;
  groupeNom?: string;
  statut: string;
}

export interface InvitationStats {
  totalInvitationsActives: number;
  totalDemandesEnAttente: number;
  totalMembresViaInvitation: number;
  demandesAccepteesAujourdHui: number;
  demandesRefuseesAujourdHui: number;
}

// ============================================================
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class InvitationService {

  private apiUrl = environment.apiUrl;
  
 
  constructor(private http: HttpClient) {}

  // ============================================================
  // ENDPOINTS PUBLICS (sans auth)
  // ============================================================

  /**
   * Vérifier un code d'invitation
   */
  verifierInvitation(code: string): Observable<InvitationPublic> {
    return this.http.get<InvitationPublic>(
      `${this.apiUrl}/public/invitation/${code}`
    );
  }

  /**
   * S'inscrire via une invitation
   */
  rejoindreViaInvitation(request: CreateDemandeAdhesionRequest): Observable<InscriptionInvitationResponse> {
    return this.http.post<InscriptionInvitationResponse>(
      `${this.apiUrl}/public/invitation/join`,
      request
    );
  }

    rejoindreGroupeConnecte(request: any): Observable<InscriptionInvitationResponse> {
    return this.http.post<InscriptionInvitationResponse>(
      `${this.apiUrl}/public/invitation/join/connect`,
      request
    );
  }

  


  // ============================================================
  // ENDPOINTS RESPONSABLE (avec auth)
  // ============================================================

  /**
   * Obtenir ou créer l'invitation du groupe
   */
  getInvitation(groupeId: number): Observable<InvitationGroupe> {
    return this.http.get<InvitationGroupe>(
      `${this.apiUrl}/responsable/invitation`,
      { params: { groupeId: groupeId.toString() } }
    );
  }

  /**
   * Régénérer le code d'invitation
   */
  regenererInvitation(groupeId: number): Observable<InvitationGroupe> {
    return this.http.post<InvitationGroupe>(
      `${this.apiUrl}/responsable/invitation/regenerer`,
      null,
      { params: { groupeId: groupeId.toString() } }
    );
  }

  /**
   * Désactiver l'invitation
   */
  desactiverInvitation(groupeId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/responsable/invitation/desactiver`,
      null,
      { params: { groupeId: groupeId.toString() } }
    );
  }

  /**
   * Configurer l'invitation
   */
  configurerInvitation(
    groupeId: number, 
    dateExpiration?: string, 
    quotaMax?: number
  ): Observable<InvitationGroupe> {
    let params = new HttpParams().set('groupeId', groupeId.toString());
    if (dateExpiration) params = params.set('dateExpiration', dateExpiration);
    if (quotaMax !== undefined) params = params.set('quotaMax', quotaMax.toString());

    return this.http.put<InvitationGroupe>(
      `${this.apiUrl}/responsable/invitation/configurer`,
      null,
      { params }
    );
  }

  // ============================================================
  // GESTION DES DEMANDES
  // ============================================================

  /**
   * Lister les demandes en attente
   */
  getDemandesEnAttente(groupeId: number): Observable<DemandeAdhesion[]> {
    return this.http.get<DemandeAdhesion[]>(
      `${this.apiUrl}/responsable/demandes/en-attente`,
      { params: { groupeId: groupeId.toString() } }
    );
  }

  /**
   * Lister toutes les demandes
   */
  getAllDemandes(
    groupeId: number, 
    statut?: string, 
    page = 0, 
    size = 20
  ): Observable<{ content: DemandeAdhesion[], totalElements: number }> {
    let params = new HttpParams()
      .set('groupeId', groupeId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (statut) params = params.set('statut', statut);

    return this.http.get<{ content: DemandeAdhesion[], totalElements: number }>(
      `${this.apiUrl}/responsable/demandes`,
      { params }
    );
  }

  /**
   * Accepter une demande
   */
  accepterDemande(demandeId: number): Observable<DemandeAdhesion> {
    return this.http.post<DemandeAdhesion>(
      `${this.apiUrl}/responsable/demandes/${demandeId}/accepter`,
      null
    );
  }

  /**
   * Refuser une demande
   */
  refuserDemande(demandeId: number, motif?: string): Observable<DemandeAdhesion> {
    let params = new HttpParams();
    if (motif) params = params.set('motif', motif);

    return this.http.post<DemandeAdhesion>(
      `${this.apiUrl}/responsable/demandes/${demandeId}/refuser`,
      null,
      { params }
    );
  }

  // ============================================================
  // STATISTIQUES
  // ============================================================

  /**
   * Stats des invitations
   */
  getStats(groupeId: number): Observable<InvitationStats> {
    return this.http.get<InvitationStats>(
      `${this.apiUrl}/responsable/invitation/stats`,
      { params: { groupeId: groupeId.toString() } }
    );
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Copier le lien dans le presse-papiers
   */
  async copierLien(lien: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(lien);
      return true;
    } catch {
      // Fallback pour navigateurs plus anciens
      const textArea = document.createElement('textarea');
      textArea.value = lien;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }

  /**
   * Partager via Web Share API (mobile)
   */
  async partagerLien(lien: string, groupeNom: string): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rejoindre ${groupeNom} sur My 2.0`,
          text: `Tu es invité à rejoindre ${groupeNom} sur My 2.0 ! Clique sur le lien pour nous rejoindre.`,
          url: lien
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  getnomines(groupeId: number|null): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/votes/nomines/${groupeId}`);
  }

  verifierVote(groupeId: number|null, membreId: number | null): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/votes/check/${groupeId}/${membreId}`);
  }

  verifierVoteur(groupeId: number|null, membreId: number | null): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/votes/check/eligible/${groupeId}/${membreId}`);
  }


  soumettreVote(voteData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/votes/soumettre`, voteData);
  }

   getTendances(groupeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/votes/tendances/${groupeId}`);
  }
  
  

  getMvpWinner(groupeId: number, periode: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/votes/winner/${groupeId}?periode=${periode}`);
 }

  // invitation.service.ts

/**
 * Récupère l'image générée du MVP sous forme de Blob (binaire)
 */
getMvpWinnerImage(groupeId: number, periode: string): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/votes/image/winner/${groupeId}`, {
    params: { periode: periode },
    responseType: 'blob' // Important pour les images
  });
}
  /**
   * Générer le lien WhatsApp
   */
  getLienWhatsApp(lien: string, groupeNom: string): string {
    const message = encodeURIComponent(
      `🏆 Rejoins ${groupeNom} sur My 2.0 !\n\n` +
      `Clique sur ce lien pour créer ton compte et rejoindre notre équipe :\n${lien}`
    );
    return `https://wa.me/?text=${message}`;
  }
}