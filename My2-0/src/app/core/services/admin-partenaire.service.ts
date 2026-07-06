// ============================================================
// MY2-0 - SERVICE ADMIN PARTENAIRES
// Gestion administrative des partenaires
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { 
  PartenaireDTO, 
  UtilisateurPartenaireDTO,
  StatsPartenaireDTO,
  PubliciteDTO,
  StatsPubliciteDTO
} from '../models/partenaire.model';
import { environment } from '../../environment';

export interface CreatePartenaireRequest {
  nom: string;
  description?: string;
  personneContact: string;
  email: string;
  telephone: string;
  adresse?: string;
  ville: string;
  typeContrat: string;
  dateDebutContrat: string;
  dateFinContrat?: string;
  montantContrat?: number;
  frequenceFacturation?: string;
  maxEntreprises: number;
  maxPublicitesActives: number;
  emplacementsAutorises: string[];
  statut: string;
  utilisateurAdmin?: {
    prenom: string;
    nom: string;
    email: string;
    telephone?: string;
    envoyerCredentials: boolean;
  };
}

export interface PartenaireListParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  statut?: string;
  typeContrat?: string;
  ville?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminPartenaireService {
  private apiUrl = `${environment.apiUrl}/admin/partenaires`;
   private apiUrl2 = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // ============================================================
  // CRUD PARTENAIRES
  // ============================================================

  /**
   * Liste paginée des partenaires
   */
  getPartenaires(params: PartenaireListParams = {}): Observable<PaginatedResponse<PartenaireDTO>> {
    let httpParams = new HttpParams();
    
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.statut) httpParams = httpParams.set('statut', params.statut);
    if (params.typeContrat) httpParams = httpParams.set('typeContrat', params.typeContrat);
    if (params.ville) httpParams = httpParams.set('ville', params.ville);

    return this.http.get<PaginatedResponse<PartenaireDTO>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Récupérer un partenaire par ID
   */
  getPartenaire(id: number): Observable<PartenaireDTO> {
    return this.http.get<PartenaireDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Créer un nouveau partenaire
   */
  createPartenaire(request: CreatePartenaireRequest): Observable<PartenaireDTO> {
    return this.http.post<PartenaireDTO>(this.apiUrl, request);
  }

  /**
   * Mettre à jour un partenaire
   */
  updatePartenaire(id: number, request: Partial<CreatePartenaireRequest>): Observable<PartenaireDTO> {
    return this.http.put<PartenaireDTO>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Supprimer un partenaire
   */
  deletePartenaire(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ============================================================
  // GESTION STATUT
  // ============================================================

  /**
   * Activer un partenaire
   */
  activerPartenaire(id: number): Observable<PartenaireDTO> {
    return this.http.post<PartenaireDTO>(`${this.apiUrl}/${id}/activer`, {});
  }

  /**
   * Suspendre un partenaire
   */
  suspendrePartenaire(id: number, motif?: string): Observable<PartenaireDTO> {
    return this.http.post<PartenaireDTO>(`${this.apiUrl}/${id}/suspendre`, { motif });
  }

  /**
   * Résilier le contrat d'un partenaire
   */
  resilierPartenaire(id: number, motif?: string): Observable<PartenaireDTO> {
    return this.http.post<PartenaireDTO>(`${this.apiUrl}/${id}/resilier`, { motif });
  }

  // ============================================================
  // GESTION CONTRAT
  // ============================================================

  /**
   * Renouveler le contrat
   */
  renouvelerContrat(id: number, dateFinContrat: string, montant?: number): Observable<PartenaireDTO> {
    return this.http.post<PartenaireDTO>(`${this.apiUrl}/${id}/renouveler`, {
      dateFinContrat,
      montant
    });
  }

  /**
   * Modifier les limites
   */
  modifierLimites(id: number, maxEntreprises: number, maxPublicites: number): Observable<PartenaireDTO> {
    return this.http.patch<PartenaireDTO>(`${this.apiUrl}/${id}/limites`, {
      maxEntreprises,
      maxPublicitesActives: maxPublicites
    });
  }

  /**
   * Modifier les emplacements autorisés
   */
  modifierEmplacements(id: number, emplacements: string[]): Observable<PartenaireDTO> {
    return this.http.patch<PartenaireDTO>(`${this.apiUrl}/${id}/emplacements`, {
      emplacementsAutorises: emplacements
    });
  }

  // ============================================================
  // UTILISATEURS DU PARTENAIRE
  // ============================================================

  /**
   * Liste des utilisateurs d'un partenaire
   */
  getUtilisateurs(partenaireId: number): Observable<UtilisateurPartenaireDTO[]> {
    return this.http.get<UtilisateurPartenaireDTO[]>(`${this.apiUrl}/${partenaireId}/utilisateurs`);
  }

  /**
   * Ajouter un utilisateur
   */
  addUtilisateur(partenaireId: number, data: {
    prenom: string;
    nom: string;
    email: string;
    telephone?: string;
    role: string;
    envoyerCredentials?: boolean;
  }): Observable<UtilisateurPartenaireDTO> {
    return this.http.post<UtilisateurPartenaireDTO>(
      `${this.apiUrl}/${partenaireId}/utilisateurs`,
      data
    );
  }

  /**
   * Supprimer un utilisateur
   */
  removeUtilisateur(partenaireId: number, utilisateurId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${partenaireId}/utilisateurs/${utilisateurId}`);
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  resetPassword(partenaireId: number, utilisateurId: number): Observable<{ temporaryPassword: string }> {
    return this.http.post<{ temporaryPassword: string }>(
      `${this.apiUrl}/${partenaireId}/utilisateurs/${utilisateurId}/reset-password`,
      {}
    );
  }

  // ============================================================
  // STATISTIQUES
  // ============================================================

  /**
   * Statistiques d'un partenaire
   */
  getStats(partenaireId: number): Observable<StatsPartenaireDTO> {
    return this.http.get<StatsPartenaireDTO>(`${this.apiUrl}/${partenaireId}/stats`);
  }

  /**
   * Statistiques globales des partenaires
   */
  getGlobalStats(): Observable<{
    totalPartenaires: number;
    partenairesActifs: number;
    partenairesSuspendus: number;
    contratsExpirantBientot: number;
    revenusTotal: number;
    revenusMois: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/stats`);
  }

  // ============================================================
  // EXPORT
  // ============================================================

  /**
   * Exporter la liste des partenaires
   */
  exportPartenaires(format: 'csv' | 'excel' = 'excel'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }

  /**
   * Exporter les factures d'un partenaire
   */
  exportFactures(partenaireId: number, annee?: number): Observable<Blob> {
    let params = new HttpParams();
    if (annee) params = params.set('annee', annee.toString());

    return this.http.get(`${this.apiUrl}/${partenaireId}/factures/export`, {
      params,
      responseType: 'blob'
    });
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  /**
   * Statistiques du dashboard admin
   */
  getDashboardStats(): Observable<{
    totalPartenaires: number;
    partenairesActifs: number;
    partenairesSuspendus: number;
    contratsExpirantBientot: number;
    totalEntreprises: number;
    totalPublicites: number;
    publicitesActives: number;
    publicitesEnAttente: number;
    totalImpressionsMois: number;
    totalClicsMois: number;
    tauxClicMoyen: number;
    revenusMois: number;
    revenusTotal: number;
    evolutionRevenus: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/stats`);
  }

  /**
   * Publicités en attente de validation
   */
  getPublicitesEnAttente(): Observable<PubliciteDTO[]> {
    return this.http.get<PubliciteDTO[]>(`${this.apiUrl}/publicites`, {
      params: { statut: 'EN_ATTENTE', size: '10' }
    });
  }

  /**
   * Top publicités par performance
   */
  getTopPublicites(limit: number = 5): Observable<PubliciteDTO[]> {
    return this.http.get<PubliciteDTO[]>(`${this.apiUrl}/publicites/top`, {
      params: { limit: limit.toString() }
    });
  }

  // ============================================================
  // PUBLICITÉS
  // ============================================================

  /**
   * Liste paginée des publicités
   */
  getAllPublicites(params: {
    page?: number;
    size?: number;
    sort?: string;
    search?: string;
    statut?: string;
    emplacement?: string;
    partenaireId?: number;
  } = {}): Observable<PaginatedResponse<PubliciteDTO>> {
    let httpParams = new HttpParams();
    
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.statut) httpParams = httpParams.set('statut', params.statut);
    if (params.emplacement) httpParams = httpParams.set('emplacement', params.emplacement);
    if (params.partenaireId) httpParams = httpParams.set('partenaireId', params.partenaireId.toString());

    return this.http.get<PaginatedResponse<PubliciteDTO>>(`${this.apiUrl}/publicites`, { params: httpParams });
  }

  /**
   * Stats par statut des publicités
   */
  getPublicitesStats(): Observable<{
    total: number;
    enAttente: number;
    actives: number;
    pausees: number;
    rejetees: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/publicites/stats`);
  }

  /**
   * Obtenir une publicité par ID
   */
  getPublicite(id: number): Observable<PubliciteDTO> {
    return this.http.get<PubliciteDTO>(`${this.apiUrl}/publicites/${id}`);
  }

  /**
   * Stats d'une publicité
   */
  getPubliciteStats(id: number): Observable<StatsPubliciteDTO> {
    return this.http.get<StatsPubliciteDTO>(`${this.apiUrl}/publicites/${id}/stats`);
  }

  /**
   * Approuver une publicité
   */
  approuverPublicite(id: number): Observable<PubliciteDTO> {
    return this.http.post<PubliciteDTO>(`${this.apiUrl}/publicites/${id}/approuver`, {});
  }

  /**
   * Rejeter une publicité
   */
  rejeterPublicite(id: number, motif: string): Observable<PubliciteDTO> {
    return this.http.post<PubliciteDTO>(`${this.apiUrl}/publicites/${id}/rejeter`, { motif });
  }

  /**
   * Mettre en pause une publicité
   */
  pauserPublicite(id: number): Observable<PubliciteDTO> {
    return this.http.post<PubliciteDTO>(`${this.apiUrl}/publicites/${id}/pause`, {});
  }

  /**
   * Réactiver une publicité
   */
  reprendrePublicite(id: number): Observable<PubliciteDTO> {
    return this.http.post<PubliciteDTO>(`${this.apiUrl}/publicites/${id}/reprendre`, {});
  }

  /**
   * Supprimer une publicité
   */
  supprimerPublicite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/publicites/${id}`);
  }
}