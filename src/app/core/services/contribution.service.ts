import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Contribution, ContributionIndividuelle } from '../models/contribution.model';

@Injectable({
  providedIn: 'root'
})
export class ContributionService {

  
    constructor(private http: HttpClient) {}



  updateContribution(id: number, editContribution: Contribution) {
    return this.http.put<Contribution>(`${environment.apiUrl}/contributions/${id}`, editContribution);
  }
  deleteContribution(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/contributions/${id}`);
  }
  getAllContributions(): Observable<Contribution[]> {
    return this.http.get<Contribution[]>(`${environment.apiUrl}/contributions`);
  }
    


  addContribution(contribution: any): Observable<Contribution> {
    return this.http.post<Contribution>(`${environment.apiUrl}/contributions`, contribution);
  }

  getContributionsByMembre(groupeId: number, membreId: number): Observable<Contribution[]> {
    return this.http.get<Contribution[]>(`${environment.apiUrl}/groupes/${groupeId}/membres/${membreId}/contributions`);
  }

  getContributionsByGroupe(groupeId: number): Observable<Contribution[]> {
    return this.http.get<Contribution[]>(`${environment.apiUrl}/groupes/${groupeId}/contributions`);
  }


    getContributionByEvenementId(idEvenement: number): Observable<Contribution> {
    // Endpoint REST pour récupérer la contribution liée à un événement
    return this.http.get<Contribution>(
      `${environment.apiUrl}/contributions/byEvenement/${idEvenement}`
    );
  }

  getContributionsIndividuellesByContributionId(
    idContribution: number
  ): Observable<ContributionIndividuelle[]> {
    // Endpoint REST pour récupérer les contributions individuelles
    return this.http.get<ContributionIndividuelle[]>(
      `${environment.apiUrl}/contributions/${idContribution}/individuelles`
    );
  }

    getContributionsIndividuellesById(idContribution: number | undefined): any {
     return this.http.get<ContributionIndividuelle[]>(
      `${environment.apiUrl}/contributions/${idContribution}/individuelles`
    );
  }

  createIndividuelleContribution(
    contributionData: ContributionIndividuelle
  ): Observable<ContributionIndividuelle> {
    // Endpoint REST pour créer une contribution individuelle
    return this.http.post<ContributionIndividuelle>(
      `${environment.apiUrl}/contributions/individuelles`,
      contributionData
    );
  }

  updateIndividuelleContribution(
    id: number,
    contributionData: ContributionIndividuelle
  ): Observable<ContributionIndividuelle> {
    return this.http.put<ContributionIndividuelle>(
      `${environment.apiUrl}/contributions/individuelles/${id}`,
      contributionData
    );
  }

  deleteIndividuelleContribution(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/contributions/individuelles/${id}`);
  }

  // Récupère toutes les contributions individuelles
  getAllContributionsIndividuelles(): Observable<ContributionIndividuelle[]> {
    return this.http.get<ContributionIndividuelle[]>(`${environment.apiUrl}/contributions-individuelles`);
  }

  // Récupère les contributions en cours (filtré côté client)
  getOngoingContributions(): Observable<Contribution[]> {
    return this.getAllContributions();
  }
}
