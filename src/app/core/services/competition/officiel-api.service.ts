// services/officiel-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { RoleOfficiel, OfficielDTO, OfficielCreateDTO } from '../../models/competition.models';


@Injectable({ providedIn: 'root' })
export class OfficielApiService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/officiels`;

  lister(params?: {
    role?: RoleOfficiel;
    nom?: string;
  }): Observable<OfficielDTO[]> {
    let p = new HttpParams();
    if (params?.role) p = p.set('role', params.role);
    if (params?.nom)  p = p.set('nom',  params.nom);
    return this.http.get<OfficielDTO[]>(this.base, { params: p });
  }

  getById(id: number): Observable<OfficielDTO> {
    return this.http.get<OfficielDTO>(`${this.base}/${id}`);
  }

  creer(dto: OfficielCreateDTO): Observable<OfficielDTO> {
    return this.http.post<OfficielDTO>(this.base, dto);
  }

  modifier(id: number, dto: OfficielCreateDTO): Observable<OfficielDTO> {
    return this.http.put<OfficielDTO>(`${this.base}/${id}`, dto);
  }

  desactiver(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}