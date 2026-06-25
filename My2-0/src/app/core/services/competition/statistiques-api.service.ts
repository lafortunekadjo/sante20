// services/statistiques-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { ButeurDTO, PasseurDTO, CartonsDTO, StatsEquipeDTO, StatsJoueurDTO, SuspensionDTO } from '../../models/competition.models';


@Injectable({ providedIn: 'root' })
export class StatistiquesApiService {

  private http = inject(HttpClient);
  private base(competitionId: number) {
    return `${environment.apiUrl}/competitions/${competitionId}/stats`;
  }

  getButeurs(competitionId: number,
             limit = 10): Observable<ButeurDTO[]> {
    return this.http.get<ButeurDTO[]>(
      `${this.base(competitionId)}/buteurs`,
      { params: new HttpParams().set('limit', limit) });
  }

  getPasseurs(competitionId: number,
              limit = 10): Observable<PasseurDTO[]> {
    return this.http.get<PasseurDTO[]>(
      `${this.base(competitionId)}/passeurs`,
      { params: new HttpParams().set('limit', limit) });
  }

  getCartons(competitionId: number): Observable<CartonsDTO> {
    return this.http.get<CartonsDTO>(`${this.base(competitionId)}/cartons`);
  }

  getStatsEquipe(competitionId: number,
                 participantId: number): Observable<StatsEquipeDTO> {
    return this.http.get<StatsEquipeDTO>(
      `${this.base(competitionId)}/equipes/${participantId}`);
  }

  getStatsJoueur(competitionId: number,
                 joueurId: number): Observable<StatsJoueurDTO> {
    return this.http.get<StatsJoueurDTO>(
      `${this.base(competitionId)}/joueurs/${joueurId}`);
  }

  getSuspensions(competitionId: number,
                 actifSeulement = false): Observable<SuspensionDTO[]> {
    return this.http.get<SuspensionDTO[]>(
      `${this.base(competitionId)}/suspensions`,
      { params: new HttpParams().set('actifSeulement', actifSeulement) });
  }
}