// services/match-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { StatutMatch, MatchDTO, MatchDetailDTO, ResultatDTO, ForfaitDTO, ReportDTO, PlanificationMatchDTO, MatchEventDTO, MatchCompositionDTO, TempsMatchDTO } from '../../models/competition.models';


@Injectable({ providedIn: 'root' })
export class MatchApiService {

  private http = inject(HttpClient);
  private base(competitionId: number) {
    return `${environment.apiUrl}/competitions/${competitionId}/matchs`;
  }

  getMatchs(competitionId: number, params?: {
    journeeId?: number;
    participantId?: number;
    statut?: StatutMatch;
  }): Observable<MatchDTO[]> {
    let p = new HttpParams();
    if (params?.journeeId)    p = p.set('journeeId', params.journeeId);
    if (params?.participantId) p = p.set('participantId', params.participantId);
    if (params?.statut)        p = p.set('statut', params.statut);
    return this.http.get<MatchDTO[]>(this.base(competitionId), { params: p });
  }

  // Dans match-api.service.ts — ajouter
saisirTemps(competitionId: number,
            matchId: number,
            dto: TempsMatchDTO): Observable<MatchDetailDTO> {
  return this.http.post<MatchDetailDTO>(
    `${this.base(competitionId)}/${matchId}/temps`, dto);
}

  getById(competitionId: number,
          matchId: number): Observable<MatchDetailDTO> {
    return this.http.get<MatchDetailDTO>(
      `${this.base(competitionId)}/${matchId}`);
  }

  saisirResultat(competitionId: number,
                 matchId: number,
                 dto: ResultatDTO): Observable<MatchDetailDTO> {
    return this.http.post<MatchDetailDTO>(
      `${this.base(competitionId)}/${matchId}/resultat`, dto);
  }

  declarerForfait(competitionId: number,
                  matchId: number,
                  dto: ForfaitDTO): Observable<MatchDetailDTO> {
    return this.http.post<MatchDetailDTO>(
      `${this.base(competitionId)}/${matchId}/forfait`, dto);
  }

  reporter(competitionId: number,
           matchId: number,
           dto: ReportDTO): Observable<MatchDetailDTO> {
    return this.http.post<MatchDetailDTO>(
      `${this.base(competitionId)}/${matchId}/reporter`, dto);
  }

  planifier(competitionId: number,
            matchId: number,
            dto: PlanificationMatchDTO): Observable<MatchDetailDTO> {
    return this.http.patch<MatchDetailDTO>(
      `${this.base(competitionId)}/${matchId}/planifier`, dto);
  }

  // ── Événements
  getEvenements(competitionId: number,
                matchId: number): Observable<MatchEventDTO[]> {
    return this.http.get<MatchEventDTO[]>(
      `${this.base(competitionId)}/${matchId}/evenements`);
  }

  ajouterEvenement(competitionId: number,
                   matchId: number,
                   dto: MatchEventDTO): Observable<MatchEventDTO> {
    return this.http.post<MatchEventDTO>(
      `${this.base(competitionId)}/${matchId}/evenements`, dto);
  }

  supprimerEvenement(competitionId: number,
                     matchId: number,
                     eventId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base(competitionId)}/${matchId}/evenements/${eventId}`);
  }

  // ── Composition
  getComposition(competitionId: number,
                 matchId: number): Observable<Record<string, MatchCompositionDTO[]>> {
    return this.http.get<Record<string, MatchCompositionDTO[]>>(
      `${this.base(competitionId)}/${matchId}/composition`);
  }

  saisirComposition(competitionId: number,
                    matchId: number,
                    equipeId: number,
                    dtos: MatchCompositionDTO[]): Observable<MatchCompositionDTO[]> {
    return this.http.post<MatchCompositionDTO[]>(
      `${this.base(competitionId)}/${matchId}/composition/${equipeId}`, dtos);
  }
}