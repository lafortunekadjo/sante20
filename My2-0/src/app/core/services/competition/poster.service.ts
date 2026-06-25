// poster.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environment';


export interface PosterRequest {
  matchId: number;
  type: 'AVANT' | 'MI_TEMPS' | 'APRES';
  format: 'PORTRAIT' | 'CARRE' | 'PAYSAGE';
  templateId: string;
  photoUrls?: string[];
  photoMode?: 'SINGLE' | 'DOUBLE';
  message?: String;
  options?: {
    showWatermark?: boolean;
    showQrCode?: boolean;
    customTitle?: string;
    customFooter?: string;
    language?: string;
  };
}

export interface PosterAvailability {
  matchId: number;
  matchExists: boolean;
  matchDate: string;
  matchStatus: 'FUTUR' | 'AUJOURD_HUI' | 'PASSE';
  scoresAvailable: boolean;
  availableTypes: ('AVANT' | 'MI_TEMPS' | 'APRES')[];
  defaultType: 'AVANT' | 'MI_TEMPS' | 'APRES';
  message: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  compatibleTypes: string[];
  isPremium: boolean;
}

export interface AsyncPosterResponse {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  posterUrl?: string;
  message: string;
  progress?: number;
  errorMessage?: string;
}

export interface PosterHistory {
  posterId: string;
  type: string;
  format: string;
  templateId: string;
  thumbnailUrl: string;
  fullUrl: string;
  generatedAt: Date;
  downloadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class PosterService {
  private apiUrl = `${environment.apiUrl}/posters`;

  constructor(private http: HttpClient) {}

  /**
   * Vérifie les types d'affiches disponibles pour un match
   */
  checkAvailability(matchId: number): Observable<PosterAvailability> {
    return this.http.get<PosterAvailability>(`${this.apiUrl}/availability/${matchId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Génère une affiche (téléchargement direct)
   */
  generatePoster(request: PosterRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/generate`, request, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(catchError(this.handleError));
  }

  /**
   * Génère une affiche de manière asynchrone
   */
  generatePosterAsync(request: PosterRequest): Observable<AsyncPosterResponse> {
    return this.http.post<AsyncPosterResponse>(`${this.apiUrl}/generate-async`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Vérifie le statut d'une génération asynchrone
   */
  getPosterStatus(jobId: string): Observable<AsyncPosterResponse> {
    return this.http.get<AsyncPosterResponse>(`${this.apiUrl}/status/${jobId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Télécharge une affiche générée précédemment
   */
  downloadPoster(posterId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${posterId}`, {
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  /**
   * Récupère la liste des templates disponibles
   */
  getTemplates(): Observable<Template[]> {
    return this.http.get<Template[]>(`${this.apiUrl}/templates`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Upload une photo temporaire pour l'affiche
   */
  uploadPhoto(file: File, matchId: number, teamSide: 'home' | 'away' | 'global'): Observable<{ photoUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('matchId', matchId.toString());
    formData.append('teamSide', teamSide);
    
    return this.http.post<{ photoUrl: string; message: string }>(`${this.apiUrl}/upload-photo`, formData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère l'historique des affiches d'un match
   */
  getPosterHistory(matchId: number): Observable<PosterHistory[]> {
    return this.http.get<PosterHistory[]>(`${this.apiUrl}/history/${matchId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Gestionnaire d'erreurs
   */
  private handleError(error: any) {
    console.error('PosterService Error:', error);
    let errorMessage = 'Une erreur est survenue lors de la génération de l\'affiche';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Requête invalide';
    } else if (error.status === 404) {
      errorMessage = 'Match non trouvé';
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur, veuillez réessayer';
    }
    
    return throwError(() => new Error(errorMessage));
  }
}