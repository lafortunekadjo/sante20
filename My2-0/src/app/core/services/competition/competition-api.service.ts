// services/competition-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { StatutCompetition, TypeCompetition, Page, CompetitionDTO, CompetitionDetailDTO, CompetitionResumeDTO, CompetitionCreateDTO, CompetitionUpdateDTO, StatutInscription, CompetitionParticipantDTO, InscriptionDTO, PhaseDTO, PouleDTO, ClassementDTO, BracketDTO } from '../../models/competition.models';


@Injectable({ providedIn: 'root' })
export class CompetitionApiService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/competitions`;

  // ── Compétitions
  lister(params?: {
    statut?: StatutCompetition;
    type?: TypeCompetition;
    page?: number;
    size?: number;
  }): Observable<Page<CompetitionDTO>> {
    let p = new HttpParams();
    if (params?.statut) p = p.set('statut', params.statut);
    if (params?.type)   p = p.set('type', params.type);
    if (params?.page != null) p = p.set('page', params.page);
    if (params?.size != null) p = p.set('size', params.size);
    return this.http.get<Page<CompetitionDTO>>(this.base, { params: p });
  }

  // services/competition-api.service.ts — ajouts
ouvrirInscriptions(id: number): Observable<void> {
  return this.http.post<void>(
    `${this.base}/${id}/ouvrir-inscriptions`, {});
}

fermerInscriptions(id: number): Observable<void> {
  return this.http.post<void>(
    `${this.base}/${id}/fermer-inscriptions`, {});
}

  getById(id: number): Observable<CompetitionDetailDTO> {
    return this.http.get<CompetitionDetailDTO>(`${this.base}/${id}`);
  }

  getResume(id: number): Observable<CompetitionResumeDTO> {
    return this.http.get<CompetitionResumeDTO>(`${this.base}/${id}/resume`);
  }

  creer(dto: CompetitionCreateDTO): Observable<CompetitionDTO> {
    return this.http.post<CompetitionDTO>(this.base, dto);
  }

  modifier(id: number, dto: CompetitionUpdateDTO): Observable<CompetitionDTO> {
    return this.http.put<CompetitionDTO>(`${this.base}/${id}`, dto);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  lancer(id: number): Observable<CompetitionDTO> {
    return this.http.post<CompetitionDTO>(`${this.base}/${id}/lancer`, {});
  }

  phaseSuivante(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/phase-suivante`, {});
  }

  terminer(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/terminer`, {});
  }

  annuler(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/annuler`, {});
  }

  // ── Participants
  getParticipants(id: number,
                  statut?: StatutInscription): Observable<CompetitionParticipantDTO[]> {
    let p = new HttpParams();
    if (statut) p = p.set('statut', statut);
    return this.http.get<CompetitionParticipantDTO[]>(
      `${this.base}/${id}/participants`, { params: p });
  }

  inscrire(id: number, dto: InscriptionDTO): Observable<CompetitionParticipantDTO> {
    return this.http.post<CompetitionParticipantDTO>(
      `${this.base}/${id}/participants`, dto);
  }

  validerInscription(competitionId: number,
                     participantId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/${competitionId}/participants/${participantId}/valider`, {});
  }

  rejeterInscription(competitionId: number,
                     participantId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/${competitionId}/participants/${participantId}/rejeter`, {});
  }

  retirerParticipant(competitionId: number,
                     participantId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/${competitionId}/participants/${participantId}`);
  }

  // ── Phases & Poules
  getPhases(competitionId: number): Observable<PhaseDTO[]> {
    return this.http.get<PhaseDTO[]>(`${this.base}/${competitionId}/phases`);
  }

  getPoules(competitionId: number,
            phaseId: number): Observable<PouleDTO[]> {
    return this.http.get<PouleDTO[]>(
      `${this.base}/${competitionId}/phases/${phaseId}/groupes`);
  }

  getClassement(competitionId: number,
                phaseId: number,
                pouleId: number): Observable<ClassementDTO[]> {
    return this.http.get<ClassementDTO[]>(
      `${this.base}/${competitionId}/phases/${phaseId}/groupes/${pouleId}/classement`);
  }

  recalculerClassement(competitionId: number,
                       phaseId: number,
                       pouleId: number): Observable<ClassementDTO[]> {
    return this.http.post<ClassementDTO[]>(
      `${this.base}/${competitionId}/phases/${phaseId}/groupes/${pouleId}/classement/recalculer`,
      {});
  }

  getBracket(competitionId: number,
             phaseId: number): Observable<BracketDTO> {
    return this.http.get<BracketDTO>(
      `${this.base}/${competitionId}/phases/${phaseId}/bracket`);
  }
}