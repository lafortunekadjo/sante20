// ============================================================
// MY2-0 - SERVICE PARTENAIRE
// Gère les appels API pour l'espace partenaire
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

import {
  PartenaireDTO,
  EntrepriseDTO,
  CreateEntrepriseRequest,
  PubliciteDTO,
  CreatePubliciteRequest,
  UpdatePubliciteRequest,
  UtilisateurPartenaireDTO,
  CreateUtilisateurPartenaireRequest,
  StatsPartenaireDTO,
  StatsPubliciteDTO
} from '../models/partenaire.model';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class PartenaireService {
  private readonly API_URL = `${environment.apiUrl}/partenaire`;

  // Cache du partenaire actuel
  private partenaireSubject = new BehaviorSubject<PartenaireDTO | null>(null);
  public partenaire$ = this.partenaireSubject.asObservable();

  // Cache des entreprises
  private entreprisesSubject = new BehaviorSubject<EntrepriseDTO[]>([]);
  public entreprises$ = this.entreprisesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ============================================================
  // PARTENAIRE
  // ============================================================

  /**
   * Obtenir mon profil partenaire
   */
  getMonPartenaire(): Observable<PartenaireDTO> {
    return this.http.get<PartenaireDTO>(`${this.API_URL}/me`).pipe(
      tap(partenaire => this.partenaireSubject.next(partenaire))
    );
  }

  /**
   * Obtenir mes statistiques
   */
  getMesStats(dateDebut?: string, dateFin?: string): Observable<StatsPartenaireDTO> {
    let params = new HttpParams();
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);

    return this.http.get<StatsPartenaireDTO>(`${this.API_URL}/me/stats`, { params });
  }

  // ============================================================
  // ENTREPRISES
  // ============================================================

  /**
   * Lister mes entreprises
   */
  getMesEntreprises(): Observable<EntrepriseDTO[]> {
    return this.http.get<EntrepriseDTO[]>(`${this.API_URL}/entreprises`).pipe(
      tap(entreprises => this.entreprisesSubject.next(entreprises))
    );
  }

  /**
   * Obtenir une entreprise par ID
   */
  getEntreprise(id: number): Observable<EntrepriseDTO> {
    return this.http.get<EntrepriseDTO>(`${this.API_URL}/entreprises/${id}`);
  }

  /**
   * Créer une entreprise
   */
  createEntreprise(request: CreateEntrepriseRequest): Observable<EntrepriseDTO> {
    return this.http.post<EntrepriseDTO>(`${this.API_URL}/entreprises`, request).pipe(
      tap(() => this.refreshEntreprises())
    );
  }

  /**
   * Mettre à jour une entreprise
   */
  updateEntreprise(id: number, request: CreateEntrepriseRequest): Observable<EntrepriseDTO> {
    return this.http.put<EntrepriseDTO>(`${this.API_URL}/entreprises/${id}`, request).pipe(
      tap(() => this.refreshEntreprises())
    );
  }

  /**
   * Supprimer une entreprise
   */
  deleteEntreprise(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/entreprises/${id}`).pipe(
      tap(() => this.refreshEntreprises())
    );
  }

  /**
   * Upload logo entreprise
   */
  uploadLogo(entrepriseId: number, file: File): Observable<EntrepriseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<EntrepriseDTO>(
      `${this.API_URL}/entreprises/${entrepriseId}/logo`, 
      formData
    ).pipe(
      tap(() => this.refreshEntreprises())
    );
  }

  /**
   * Upload banner entreprise
   */
  uploadBanner(entrepriseId: number, file: File): Observable<EntrepriseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<EntrepriseDTO>(
      `${this.API_URL}/entreprises/${entrepriseId}/banner`, 
      formData
    ).pipe(
      tap(() => this.refreshEntreprises())
    );
  }

  private refreshEntreprises(): void {
    this.getMesEntreprises().subscribe();
  }

  // ============================================================
  // PUBLICITÉS
  // ============================================================

  /**
   * Lister mes publicités
   */
  getMesPublicites(statut?: string): Observable<PubliciteDTO[]> {
    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);

    return this.http.get<PubliciteDTO[]>(`${this.API_URL}/publicites`, { params });
  }

  /**
   * Obtenir une publicité par ID
   */
  getPublicite(id: number): Observable<PubliciteDTO> {
    return this.http.get<PubliciteDTO>(`${this.API_URL}/publicites/${id}`);
  }

  /**
   * Créer une publicité
   */
  createPublicite(request: CreatePubliciteRequest): Observable<PubliciteDTO> {
    return this.http.post<PubliciteDTO>(`${this.API_URL}/publicites`, request);
  }

  /**
   * Mettre à jour une publicité
   */
  updatePublicite(id: number, request: UpdatePubliciteRequest): Observable<PubliciteDTO> {
    return this.http.put<PubliciteDTO>(`${this.API_URL}/publicites/${id}`, request);
  }

  /**
   * Upload image publicité
   */
  uploadPubliciteImage(publiciteId: number, file: File): Observable<PubliciteDTO> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<PubliciteDTO>(
      `${this.API_URL}/publicites/${publiciteId}/image`, 
      formData
    );
  }

  /**
   * Supprimer une publicité
   */
  deletePublicite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/publicites/${id}`);
  }

  /**
   * Mettre en pause / reprendre une publicité
   */
  togglePausePublicite(id: number): Observable<PubliciteDTO> {
    return this.http.post<PubliciteDTO>(`${this.API_URL}/publicites/${id}/toggle-pause`, {});
  }

  /**
   * Dupliquer une publicité
   */
  duplicatePublicite(id: number): Observable<PubliciteDTO> {
    return this.http.post<PubliciteDTO>(`${this.API_URL}/publicites/${id}/duplicate`, {});
  }

  /**
   * Obtenir les stats d'une publicité
   */
  getPubliciteStats(id: number, dateDebut?: string, dateFin?: string): Observable<StatsPubliciteDTO> {
    let params = new HttpParams();
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);

    return this.http.get<StatsPubliciteDTO>(`${this.API_URL}/publicites/${id}/stats`, { params });
  }

  /**
   * Obtenir les emplacements disponibles selon le contrat
   */
  getEmplacementsDisponibles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/emplacements-disponibles`);
  }

  // ============================================================
  // UTILISATEURS
  // ============================================================

  /**
   * Lister les utilisateurs du partenaire
   */
  getUtilisateurs(): Observable<UtilisateurPartenaireDTO[]> {
    return this.http.get<UtilisateurPartenaireDTO[]>(`${this.API_URL}/utilisateurs`);
  }

  /**
   * Ajouter un utilisateur
   */
  addUtilisateur(request: CreateUtilisateurPartenaireRequest): Observable<UtilisateurPartenaireDTO> {
    return this.http.post<UtilisateurPartenaireDTO>(`${this.API_URL}/utilisateurs`, request);
  }

  /**
   * Mettre à jour un utilisateur
   */
  updateUtilisateur(id: number, request: Partial<CreateUtilisateurPartenaireRequest>): Observable<UtilisateurPartenaireDTO> {
    return this.http.put<UtilisateurPartenaireDTO>(`${this.API_URL}/utilisateurs/${id}`, request);
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUtilisateur(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/utilisateurs/${id}`);
  }

  /**
   * Activer/Désactiver un utilisateur
   */
  toggleUtilisateurActif(id: number): Observable<UtilisateurPartenaireDTO> {
    return this.http.post<UtilisateurPartenaireDTO>(`${this.API_URL}/utilisateurs/${id}/toggle-actif`, {});
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Obtenir statistiques avec paramètres
   */
  getStatistiques(params: any = {}): Observable<StatsPartenaireDTO> {
    let httpParams = new HttpParams();
    if (params.dateDebut) httpParams = httpParams.set('dateDebut', params.dateDebut);
    if (params.dateFin) httpParams = httpParams.set('dateFin', params.dateFin);
    if (params.entrepriseId) httpParams = httpParams.set('entrepriseId', params.entrepriseId);

    return this.http.get<StatsPartenaireDTO>(`${this.API_URL}/me/stats`, { params: httpParams });
  }

  /**
   * Obtenir stats de toutes les publicités
   */
  getStatsPublicites(params: any = {}): Observable<StatsPubliciteDTO[]> {
    let httpParams = new HttpParams();
    if (params.dateDebut) httpParams = httpParams.set('dateDebut', params.dateDebut);
    if (params.dateFin) httpParams = httpParams.set('dateFin', params.dateFin);
    if (params.entrepriseId) httpParams = httpParams.set('entrepriseId', params.entrepriseId);

    return this.http.get<StatsPubliciteDTO[]>(`${this.API_URL}/stats/publicites`, { params: httpParams });
  }

  /**
   * Obtenir stats d'une publicité spécifique
   */
  getStatsPublicite(publiciteId: number): Observable<StatsPubliciteDTO> {
    return this.http.get<StatsPubliciteDTO>(`${this.API_URL}/publicites/${publiciteId}/stats`);
  }

  /**
   * Exporter statistiques
   */
  exportStatistiques(params: any = {}): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params.dateDebut) httpParams = httpParams.set('dateDebut', params.dateDebut);
    if (params.dateFin) httpParams = httpParams.set('dateFin', params.dateFin);
    if (params.entrepriseId) httpParams = httpParams.set('entrepriseId', params.entrepriseId);

    return this.http.get(`${this.API_URL}/stats/export`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  /**
   * Obtenir les publicités d'une entreprise
   */
  getPublicitesEntreprise(entrepriseId: number): Observable<PubliciteDTO[]> {
    return this.http.get<PubliciteDTO[]>(`${this.API_URL}/entreprises/${entrepriseId}/publicites`);
  }

  /**
   * Activer/Désactiver une entreprise
   */
  toggleEntrepriseActif(entrepriseId: number): Observable<EntrepriseDTO> {
    return this.http.post<EntrepriseDTO>(`${this.API_URL}/entreprises/${entrepriseId}/toggle-actif`, {});
  }

  /**
   * Forcer le rechargement du partenaire
   */
  refreshPartenaire(): void {
    this.getMonPartenaire().subscribe();
  }

  /**
   * Obtenir le partenaire actuel (cache)
   */
  getCurrentPartenaire(): PartenaireDTO | null {
    return this.partenaireSubject.value;
  }

  /**
   * Obtenir les entreprises actuelles (cache)
   */
  getCurrentEntreprises(): EntrepriseDTO[] {
    return this.entreprisesSubject.value;
  }

  /**
   * Vider le cache
   */
  clearCache(): void {
    this.partenaireSubject.next(null);
    this.entreprisesSubject.next([]);
  }
}