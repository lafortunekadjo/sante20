import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export type TypeEvenementMatch =
  | 'BUT' | 'COUP_FRANC_MARQUE' | 'PENALTI_MARQUE' | 'PENALTI_RATE'
  | 'CONTRE_SON_CAMP' | 'CARTON_JAUNE' | 'CARTON_ROUGE' | 'MI_TEMPS';

export interface EvenementMatch {
  id: number;
  type: TypeEvenementMatch;
  minute: number | null;
  /** Équipe du joueur concerné (1 ou 2). */
  equipePosition: number | null;
  joueurMembreId: number | null;
  joueurNom: string | null;
  passeurMembreId: number | null;
  passeurNom: string | null;
}

/** Tout ce qu'il faut afficher après chaque action : chronologie, score, score à la mi-temps. */
export interface LiveMatch {
  evenements: EvenementMatch[];
  score1: number;
  score2: number;
  scoreMiTemps1: number | null;
  scoreMiTemps2: number | null;
  miTemps: boolean;
}

export interface AjoutEvenement {
  type: TypeEvenementMatch;
  minute: number | null;
  equipePosition?: number | null;
  joueurMembreId?: number | null;
  joueurNom?: string | null;
  passeurMembreId?: number | null;
  passeurNom?: string | null;
}

@Injectable({ providedIn: 'root' })
export class EvenementMatchService {
  constructor(private http: HttpClient) {}

  private url(matchId: number): string { return `${environment.apiUrl}/matchs/${matchId}/evenements`; }

  live(matchId: number): Observable<LiveMatch> { return this.http.get<LiveMatch>(this.url(matchId)); }

  ajouter(matchId: number, e: AjoutEvenement): Observable<LiveMatch> { return this.http.post<LiveMatch>(this.url(matchId), e); }

  supprimer(matchId: number, evenementId: number): Observable<LiveMatch> {
    return this.http.delete<LiveMatch>(`${this.url(matchId)}/${evenementId}`);
  }

  modifierMinute(matchId: number, evenementId: number, minute: number | null): Observable<LiveMatch> {
    return this.http.patch<LiveMatch>(`${this.url(matchId)}/${evenementId}/minute`, { minute });
  }

  terminer(matchId: number): Observable<LiveMatch> { return this.http.post<LiveMatch>(`${this.url(matchId)}/terminer`, {}); }
}
