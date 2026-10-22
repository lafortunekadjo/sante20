import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environment';

export type CibleSignalement = 'MESSAGE' | 'VIDEO' | 'PHOTO' | 'PROFIL' | 'ANNONCE' | 'AUTRE';
export type MotifSignalement = 'HARCELEMENT' | 'HAINE' | 'SEXUEL' | 'VIOLENCE' | 'SPAM' | 'USURPATION' | 'AUTRE';

export interface Signalement {
  id: number;
  auteurId: number;
  cible: CibleSignalement;
  cibleId?: number;
  utilisateurSignaleId?: number;
  motif: MotifSignalement;
  details?: string;
  statut: 'OUVERT' | 'TRAITE' | 'REJETE';
  createdAt: string;
  decision?: string;
}

/**
 * Signaler un contenu ou une personne, bloquer / débloquer un utilisateur.
 * (Exigence de Google Play et de l'App Store pour toute application qui héberge des contenus d'utilisateurs.)
 */
@Injectable({ providedIn: 'root' })
export class ModerationService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/moderation`;

  /** Identifiants des personnes que j'ai bloquées (chargés à la demande). */
  readonly bloques = signal<number[]>([]);

  signaler(cible: CibleSignalement, cibleId: number | null, utilisateurId: number | null, motif: MotifSignalement, details?: string): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(`${this.base}/signalements`, { cible, cibleId, utilisateurId, motif, details });
  }

  chargerBlocages(): Observable<number[]> {
    return this.http.get<number[]>(`${this.base}/blocages`).pipe(tap(ids => this.bloques.set(ids)));
  }

  bloquer(utilisateurId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/blocages/${utilisateurId}`, {}).pipe(tap(() => this.bloques.update(l => l.includes(utilisateurId) ? l : [...l, utilisateurId])));
  }

  debloquer(utilisateurId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/blocages/${utilisateurId}`).pipe(tap(() => this.bloques.update(l => l.filter(i => i !== utilisateurId))));
  }
}
