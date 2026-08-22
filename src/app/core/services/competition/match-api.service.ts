import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  MatchDTO, MatchDetailDTO, ResultatDTO, ForfaitDTO,
  MatchEventDTO, PlanificationMatchDTO,
  TempsMatchDTO, MatchCompositionDTO, MembreEquipeDTO
} from '../../models/competition.models';
import { environment } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class MatchApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/competitions`;

  // ── Lister les matchs d'une compétition ──────────────────
  getMatchs(competitionId: number, params?: {
    journeeId?: number;
    participantId?: number;
    statut?: string;
  }): Observable<MatchDTO[]> {
    let p = new HttpParams();
    if (params?.journeeId)    p = p.set('journeeId',    params.journeeId);
    if (params?.participantId) p = p.set('participantId', params.participantId);
    if (params?.statut)       p = p.set('statut',       params.statut);
    return this.http.get<MatchDTO[]>(
      `${this.base}/${competitionId}/matchs`, { params: p });
  }

   // ── Bracket — modifier les équipes d'un noeud ───────────
  modifierNoeudBracket(
    competitionId: number,
    noeudId: number,
    dto: { participant1Nom?: string; participant2Nom?: string }
  ): Observable<void> {
    return this.http.patch<void>(
      `${environment.apiUrl}/competitions/${competitionId}/bracket/noeuds/${noeudId}`,
      dto
    );
  }

    // ── Fin de match (homme du match + commentaire) ─────────
  saisirFin(competitionId: number, matchId: number,
            dto: { hommeDuMatchId?: number | null; commentaire?: string | null }
  ): Observable<any> {
    return this.http.patch<any>(
      `${environment.apiUrl}/competitions/${competitionId}/matchs/${matchId}/fin`,
      dto
    );
  }
 

  // ── Détail d'un match ─────────────────────────────────────
  getById(competitionId: number, matchId: number): Observable<MatchDetailDTO> {
    return this.http.get<MatchDetailDTO>(
      `${this.base}/${competitionId}/matchs/${matchId}`);
  }

  // ── Saisie du résultat ───────────────────────────────────
  saisirResultat(competitionId: number, matchId: number,
                  dto: ResultatDTO): Observable<MatchDetailDTO> {
    return this.http.post<MatchDetailDTO>(
      `${this.base}/${competitionId}/matchs/${matchId}/resultat`, dto);
  }

  // ── Forfait ───────────────────────────────────────────────
  declarerForfait(competitionId: number, matchId: number,
                   dto: ForfaitDTO): Observable<MatchDetailDTO> {
    return this.http.post<MatchDetailDTO>(
      `${this.base}/${competitionId}/matchs/${matchId}/forfait`, dto);
  }

  // ── Démarrer un match (PLANIFIE → EN_COURS) ─────────────────
  demarrerMatch(competitionId: number, matchId: number): Observable<MatchDetailDTO> {
    return this.http.post<MatchDetailDTO>(
      `${this.base}/${competitionId}/matchs/${matchId}/demarrer`, {});
  }

  // ── Corriger résultat (admin) ─────────────────────────────
  corrigerResultat(competitionId: number, matchId: number,
                    dto: ResultatDTO): Observable<MatchDetailDTO> {
    return this.http.patch<MatchDetailDTO>(
      `${this.base}/${competitionId}/matchs/${matchId}/corriger`, dto);
  }

  // ── Reporter ──────────────────────────────────────────────
  reporter(competitionId: number, matchId: number,
            dto: { nouvelleDate: string }): Observable<MatchDetailDTO> {
    return this.http.post<MatchDetailDTO>(
      `${this.base}/${competitionId}/matchs/${matchId}/reporter`, dto);
  }

  // ── Planifier (date, stade, officiels) ───────────────────
  planifier(competitionId: number, matchId: number,
             dto: PlanificationMatchDTO): Observable<MatchDetailDTO> {
    return this.http.put<MatchDetailDTO>(
      `${this.base}/${competitionId}/matchs/${matchId}/planifier`, dto);
  }

  // ── Événements (buts, cartons, remplacements) ────────────
  getEvenements(competitionId: number, matchId: number): Observable<MatchEventDTO[]> {
    return this.http.get<MatchEventDTO[]>(
      `${this.base}/${competitionId}/matchs/${matchId}/evenements`);
  }

  ajouterEvenement(competitionId: number, matchId: number,
                    dto: MatchEventDTO): Observable<MatchEventDTO> {
    return this.http.post<MatchEventDTO>(
      `${this.base}/${competitionId}/matchs/${matchId}/evenements`, dto);
  }

  supprimerEvenement(competitionId: number, matchId: number,
                      eventId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/${competitionId}/matchs/${matchId}/evenements/${eventId}`);
  }

  // ── Composition ───────────────────────────────────────────
  getComposition(competitionId: number, matchId: number): Observable<{
    domicile: MatchCompositionDTO[];
    exterieur: MatchCompositionDTO[];
  }> {
    return this.http.get<any>(
      `${this.base}/${competitionId}/matchs/${matchId}/composition`);
  }
saisirComposition(
  competitionId: number, 
  matchId: number, 
  equipeId: number, 
  joueurs: any[]
): Observable<any> {
  return this.http.post<any>(
    `${this.base}/${competitionId}/matchs/${matchId}/composition/${equipeId}`, 
    joueurs // Envoie directement le tableau d'objets [ ... ]
  );
}

  // ── Temps de jeu ─────────────────────────────────────────
  saisirTemps(competitionId: number, matchId: number,
               dto: TempsMatchDTO): Observable<MatchDetailDTO> {
    return this.http.post<MatchDetailDTO>(
      `${this.base}/${competitionId}/matchs/${matchId}/temps`, dto);
  }
}