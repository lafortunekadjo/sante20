import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export type TypeEvenement = 'BUT' | 'COUP_FRANC_MARQUE' | 'PENALTI_MARQUE' | 'PENALTI_RATE' | 'CONTRE_SON_CAMP' | 'CARTON_JAUNE' | 'CARTON_ROUGE' | 'MI_TEMPS';

export interface DirectEvenement { type: TypeEvenement; minute: number | null; equipePosition: number | null; joueur: string | null; }

/** Un match du groupe en cours de saisie. `provisoire` : feuille d'un scribe pas encore validée. */
export interface MatchDirect {
  matchId: number;
  equipe1: string;
  equipe2: string;
  score1: number;
  score2: number;
  minute: number | null;
  miTemps: boolean;
  provisoire: boolean;
  derniers: DirectEvenement[];
}

@Injectable({ providedIn: 'root' })
export class DirectService {
  constructor(private http: HttpClient) {}

  enDirect(): Observable<MatchDirect[]> { return this.http.get<MatchDirect[]>(`${environment.apiUrl}/direct`); }
}
