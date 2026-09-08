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

  // ── Admin — tous les groupes My2-0 ──────────────────────
  getTousLesGroupes(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/groupes`);
  }

    getPublicStats(competitionId: number): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/public/competitions/${competitionId}/stats`
    );
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

   getClassement(competitionId: number, phaseId: number, groupeId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/competitions/${competitionId}/phases/${phaseId}/groupes/${groupeId}/classement`
    );
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

  modifierMatch(competitionId: number, matchId: number, dto: {
  dateHeure?:    string;
  lieu?:         string;
  domicileId?:   number;
  exterieurId?:  number;
  butsDomicile?:  number;
  butsExterieur?: number;
}): Observable<any> {
  return this.http.patch<any>(
    `${environment.apiUrl}/competitions/${competitionId}/matchs/${matchId}`,
    dto
  );
}

  simulerTirage(competitionId: number): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/competitions/${competitionId}/simuler-tirage`, {}
    );
  }
 
  validerTirage(competitionId: number, tirage: any): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/competitions/${competitionId}/valider-tirage`, tirage
    );
  }

 
  // ── Passer phase suivante ────────────────────────────────
  passerPhaseSuivante(competitionId: number, tirage: any): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/competitions/${competitionId}/passer-phase-suivante`,
      tirage
    );
  }


    // ── Phase finale — qualifiés + tirage ──────────────────
  getQualifies(competitionId: number): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/competitions/${competitionId}/qualifies`
    );
  }

  // ── Awards / Distinctions ───────────────────────────────
  getCompetitionStats(competitionId: number): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/competitions/${competitionId}/awards/stats`
    );
  }
 
  attribuerAward(competitionId: number, dto: any): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/competitions/${competitionId}/awards`, dto
    );
  }
 
  supprimerAward(competitionId: number, awardId: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/competitions/${competitionId}/awards/${awardId}`
    );
  }

    // ── Vue publique (sans auth) ─────────────────────────────
  getPublic(competitionId: number): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/public/competitions/${competitionId}`
    );
  }

  
  // ── Accès staff ─────────────────────────────────────────
  listerAcces(competitionId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/competitions/${competitionId}/acces`
    );
  }
 
  donnerAcces(competitionId: number, dto: any): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/competitions/${competitionId}/acces`, dto
    );
  }
 
  revoquerAcces(competitionId: number, accesId: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/competitions/${competitionId}/acces/${accesId}`
    );
  }
 
  // mesCompetitions(): Observable<any[]> {
  //   return this.http.get<any[]>(
  //     `${environment.apiUrl}/competitions/acces/mes-competitions`
  //   );
  // }

    mesCompetitions(params?: {
    statut?: string;
    type?:   string;
    page?:   number;
    size?:   number;
  }): Observable<any> {
    let query = '';
    if (params) {
      const p: string[] = [];
      if (params.statut) p.push(`statut=${params.statut}`);
      if (params.type)   p.push(`type=${params.type}`);
      if (params.page !== undefined) p.push(`page=${params.page}`);
      if (params.size !== undefined) p.push(`size=${params.size}`);
      if (p.length) query = '?' + p.join('&');
    }
    return this.http.get<any>(
      `${environment.apiUrl}/competitions/mes-competitions${query}`
    );
  }
 

  // ── Vue publique (sans auth) ─────────────────────────────
  listerPublic(search?: string, statut?: string): Observable<any[]> {
    let params = '';
    if (search)  params += `?search=${search}`;
    if (statut)  params += `${params ? '&' : '?'}statut=${statut}`;
    return this.http.get<any[]>(
      `${environment.apiUrl}/public/competitions${params}`
    );
  }

  getMonRole(competitionId: number): Observable<{ role: string }> {
  return this.http.get<{ role: string }>(
    `${environment.apiUrl}/competitions/${competitionId}/mon-role`
  );
}
 

  // getPublic(competitionId: number): Observable<any> {
  //   return this.http.get<any>(
  //     `${environment.apiUrl}/public/competitions/${competitionId}`
  //   );
  // }

 // ── Officiels ─────────────────────────────────────────────
  // Routes : /api/competitions/{id}/officiels/...
 
  listerOfficiels(competitionId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/competitions/${competitionId}/officiels`
    );
  }
 
  ajouterOfficiel(competitionId: number, dto: any): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/competitions/${competitionId}/officiels`, dto
    );
  }
 
  supprimerOfficiel(competitionId: number, officielId: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/competitions/${competitionId}/officiels/${officielId}`
    );
  }
 
  assignerOfficiel(competitionId: number, matchId: number, dto: any): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/competitions/${competitionId}/officiels/matchs/${matchId}/assigner`,
      dto
    );
  }
 
  retirerOfficielDuMatch(
      competitionId: number, matchId: number, officielId: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/competitions/${competitionId}/officiels/matchs/${matchId}/officiel/${officielId}`
    );
  }
 
  officielsDuMatch(competitionId: number, matchId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/competitions/${competitionId}/officiels/matchs/${matchId}`
    );
  }
 
// Dans competition-api.service.ts — corriger
rechercherUser(query: string): Observable<any> {
  return this.http.get<any>(
    `${environment.apiUrl}/user/search?q=${encodeURIComponent(query)}`
    // ↑ /user/ et pas /users/
  );
}

  modifierPermissions(
      competitionId: number, accesId: number,
      permissions: string[]): Observable<any> {
    return this.http.patch<any>(
      `${environment.apiUrl}/competitions/${competitionId}/acces/${accesId}/permissions`,
      permissions
    );
  }
 
  reinitialiserPermissions(
      competitionId: number, accesId: number): Observable<any> {
    return this.http.patch<any>(
      `${environment.apiUrl}/competitions/${competitionId}/acces/${accesId}/reinitialiser`,
      {}
    );
  }
 

 
}