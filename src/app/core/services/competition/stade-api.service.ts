// services/stade-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { StadeDTO, StadeCreateDTO } from '../../models/competition.models';


@Injectable({ providedIn: 'root' })
export class StadeApiService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/stades`;

  lister(params?: { ville?: string; nom?: string }): Observable<StadeDTO[]> {
    let p = new HttpParams();
    if (params?.ville) p = p.set('ville', params.ville);
    if (params?.nom)   p = p.set('nom',   params.nom);
    return this.http.get<StadeDTO[]>(this.base, { params: p });
  }

  getById(id: number): Observable<StadeDTO> {
    return this.http.get<StadeDTO>(`${this.base}/${id}`);
  }

  creer(dto: StadeCreateDTO): Observable<StadeDTO> {
    return this.http.post<StadeDTO>(this.base, dto);
  }

  modifier(id: number, dto: StadeCreateDTO): Observable<StadeDTO> {
    return this.http.put<StadeDTO>(`${this.base}/${id}`, dto);
  }

  desactiver(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}