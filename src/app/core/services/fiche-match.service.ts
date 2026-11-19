import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export type StatutFiche = 'EN_SAISIE' | 'A_VALIDER' | 'A_CORRIGER' | 'VALIDEE';

export interface PersonneFiche { id: number; nom: string; }

/** État de la feuille d'un match saisie par un scribe puis validée par le responsable. */
export interface EtatFiche {
  matchId: number;
  statut: StatutFiche;
  scribes: PersonneFiche[];
  ouvertATous: boolean;
  saisiPar: string | null;
  validePar: string | null;
  valideLe: string | null;
  soumisLe: string | null;
  commentaire: string | null;
  peutSaisir: boolean;
  estResponsable: boolean;
}

export interface ResumeFiche {
  matchId: number;
  date: string | null;
  titre: string;
  statut: StatutFiche;
  saisiPar: string | null;
  soumisLe: string | null;
  commentaire: string | null;
}

export interface Habitue { membreId: number; matchs: number; equipePosition: number | null; }
export interface JoueurDuDernier { membreId: number; equipePosition: number | null; }

/** Aides à la saisie des présents : membres assidus récemment et composition du dernier match. */
export interface SuggestionsFiche {
  habitues: Habitue[];
  dateDernierMatch: string | null;
  titreDernierMatch: string | null;
  dernierMatch: JoueurDuDernier[];
}

@Injectable({ providedIn: 'root' })
export class FicheMatchService {
  private url = `${environment.apiUrl}/fiches`;

  constructor(private http: HttpClient) {}

  etat(matchId: number): Observable<EtatFiche> { return this.http.get<EtatFiche>(`${this.url}/match/${matchId}`); }

  designer(matchId: number, membreIds: number[], ouvertATous: boolean): Observable<EtatFiche> {
    return this.http.put<EtatFiche>(`${this.url}/match/${matchId}/scribes`, { membreIds, ouvertATous });
  }

  soumettre(matchId: number, commentaire?: string | null): Observable<EtatFiche> {
    return this.http.post<EtatFiche>(`${this.url}/match/${matchId}/soumettre`, { commentaire: commentaire ?? null });
  }

  valider(matchId: number): Observable<EtatFiche> { return this.http.post<EtatFiche>(`${this.url}/match/${matchId}/valider`, {}); }

  renvoyer(matchId: number, commentaire: string): Observable<EtatFiche> {
    return this.http.post<EtatFiche>(`${this.url}/match/${matchId}/renvoyer`, { commentaire });
  }

  rouvrir(matchId: number): Observable<EtatFiche> { return this.http.post<EtatFiche>(`${this.url}/match/${matchId}/rouvrir`, {}); }

  aValider(): Observable<ResumeFiche[]> { return this.http.get<ResumeFiche[]>(`${this.url}/a-valider`); }

  suggestions(matchId: number): Observable<SuggestionsFiche> {
    return this.http.get<SuggestionsFiche>(`${this.url}/match/${matchId}/suggestions`);
  }

  mesSaisies(): Observable<ResumeFiche[]> { return this.http.get<ResumeFiche[]>(`${this.url}/mes-saisies`); }
}
