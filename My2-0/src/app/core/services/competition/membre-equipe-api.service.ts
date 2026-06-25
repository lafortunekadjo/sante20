// services/membre-equipe-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { MembreEquipeDTO, MembreEquipeCreateDTO, StatutMembre } from '../../models/competition.models';

@Injectable({ providedIn: 'root' })
export class MembreEquipeApiService {

  private http = inject(HttpClient);

  private base(competitionId: number, participantId: number) {
    return `${environment.apiUrl}/competitions/${competitionId}`
         + `/participants/${participantId}/membres`;
  }

  getTous(competitionId: number,
          participantId: number): Observable<MembreEquipeDTO[]> {
    return this.http.get<MembreEquipeDTO[]>(
      this.base(competitionId, participantId));
  }

  getJoueurs(competitionId: number,
             participantId: number): Observable<MembreEquipeDTO[]> {
    return this.http.get<MembreEquipeDTO[]>(
      `${this.base(competitionId, participantId)}/joueurs`);
  }

  getStaff(competitionId: number,
           participantId: number): Observable<MembreEquipeDTO[]> {
    return this.http.get<MembreEquipeDTO[]>(
      `${this.base(competitionId, participantId)}/staff`);
  }

  ajouter(competitionId: number,
          participantId: number,
          dto: MembreEquipeCreateDTO): Observable<MembreEquipeDTO> {
    return this.http.post<MembreEquipeDTO>(
      this.base(competitionId, participantId), dto);
  }

  modifier(competitionId: number,
           participantId: number,
           membreId: number,
           dto: MembreEquipeCreateDTO): Observable<MembreEquipeDTO> {
    return this.http.put<MembreEquipeDTO>(
      `${this.base(competitionId, participantId)}/${membreId}`, dto);
  }

  changerStatut(competitionId: number,
                participantId: number,
                membreId: number,
                statut: StatutMembre): Observable<void> {
    return this.http.patch<void>(
      `${this.base(competitionId, participantId)}/${membreId}/statut`,
      { statut });
  }

  retirer(competitionId: number,
          participantId: number,
          membreId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base(competitionId, participantId)}/${membreId}`);
  }
}