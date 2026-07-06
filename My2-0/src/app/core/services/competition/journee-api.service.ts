// services/journee-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { JourneeDTO, JourneeDetailDTO } from '../../models/competition.models';

@Injectable({ providedIn: 'root' })
export class JourneeApiService {

  private http = inject(HttpClient);
  private base(competitionId: number) {
    return `${environment.apiUrl}/competitions/${competitionId}/journees`;
  }

  getJournees(competitionId: number,
              groupeId?: number): Observable<JourneeDTO[]> {
    let p = new HttpParams();
    if (groupeId) p = p.set('groupeId', groupeId);
    return this.http.get<JourneeDTO[]>(
      this.base(competitionId), { params: p });
  }

  getJourneeDetail(competitionId: number,
                   journeeId: number): Observable<JourneeDetailDTO> {
    return this.http.get<JourneeDetailDTO>(
      `${this.base(competitionId)}/${journeeId}`);
  }

  changerStatut(competitionId: number,
                journeeId: number,
                statut: string): Observable<JourneeDTO> {
    return this.http.patch<JourneeDTO>(
      `${this.base(competitionId)}/${journeeId}/statut`,
      { statut });
  }

  planifier(competitionId: number,
            journeeId: number,
            dto: any): Observable<JourneeDTO> {
    return this.http.patch<JourneeDTO>(
      `${this.base(competitionId)}/${journeeId}/planifier`, dto);
  }
}