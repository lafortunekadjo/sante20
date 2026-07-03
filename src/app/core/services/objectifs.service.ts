import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


import { environment } from '../../environment';
import { CreateObjectifPersonnelDTO, CreateObjectifGroupeDTO, ObjectifDTO } from '../models/objectifs.model';

@Injectable({ providedIn: 'root' })
export class ObjectifsService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/objectifs`;

  // ── Membre : ses propres objectifs ────────────────────────
  getMesObjectifs(): Observable<ObjectifDTO[]> {
    return this.http.get<ObjectifDTO[]>(`${this.base}/mes-objectifs`);
  }

  // ── Membre : créer objectif personnel ─────────────────────
  creerObjectifPersonnel(dto: CreateObjectifPersonnelDTO): Observable<ObjectifDTO> {
    return this.http.post<ObjectifDTO>(`${this.base}/personnel`, dto);
  }

  // ── Responsable : objectifs de son groupe ─────────────────
  getObjectifsGroupe(groupeId: number): Observable<ObjectifDTO[]> {
    return this.http.get<ObjectifDTO[]>(`${this.base}/groupe/${groupeId}`);
  }

  // ── Responsable : créer objectif pour membres ─────────────
  creerObjectifGroupe(dto: CreateObjectifGroupeDTO): Observable<any> {
    return this.http.post(`${this.base}/groupe`, dto);
  }

  // ── Modifier ──────────────────────────────────────────────
  updateObjectif(id: number, dto: Partial<CreateObjectifPersonnelDTO>): Observable<ObjectifDTO> {
    return this.http.put<ObjectifDTO>(`${this.base}/${id}`, dto);
  }

  // ── Supprimer ─────────────────────────────────────────────
  deleteObjectif(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}