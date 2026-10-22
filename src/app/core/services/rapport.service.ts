import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export type TypeRapport = 'FINANCIER' | 'SPORTIF' | 'GLOBAL';
export type StatutPeriode = 'EN_COURS' | 'CLOTURE' | 'PERIODE';

export interface RapportResume {
  id: number;
  type: TypeRapport;
  langue: 'fr' | 'en';
  titre: string;
  dateDebut: string;
  dateFin: string;
  statutPeriode: StatutPeriode;
  inclureCompetitions: boolean;
  generePar: string;
  genereLe: string;
  taille: number;
}

/** Soit un exercice (exerciceId), soit une période libre (dateDebut / dateFin au format yyyy-MM-dd). */
export interface DemandeRapport {
  type: TypeRapport;
  langue: 'fr' | 'en';
  exerciceId?: number | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  inclureCompetitions: boolean;
}

@Injectable({ providedIn: 'root' })
export class RapportService {
  private baseUrl = `${environment.apiUrl}/rapports`;

  constructor(private http: HttpClient) {}

  generer(demande: DemandeRapport): Observable<RapportResume> {
    return this.http.post<RapportResume>(this.baseUrl, demande);
  }

  lister(): Observable<RapportResume[]> {
    return this.http.get<RapportResume[]>(this.baseUrl);
  }

  pdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
