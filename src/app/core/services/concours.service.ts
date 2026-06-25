import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Concours } from '../../modules/jeu/concours-public/concours-public.component';

@Injectable({ providedIn: 'root' })
export class ConcoursService {
  private api = `${environment.apiUrl}/concours`;

  constructor(private http: HttpClient) {}

  /** Page publique du concours (sans auth) */
  getConcoursPublic(slug: string): Observable<any> {
    return this.http.get<Concours>(`${this.api}/public/${slug}`);
  }

  /** Vérifier si l'utilisateur connecté a déjà participé */
  hasParticipated(concoursId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.api}/${concoursId}/participation/check`);
  }

  /** Soumettre les réponses */
  participer(payload: {
    concoursId: number;
    reponses: { questionId: number; reponse: string }[];
  }): Observable<any> {
    return this.http.post(`${this.api}/${payload.concoursId}/participer`, payload);
  }

   // ── NOUVEAU ──────────────────────────────────────────────
  getResultats(slug: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/public/${slug}/resultats`);
  }
}