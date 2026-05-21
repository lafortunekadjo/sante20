import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Membre } from '../models/membre.model';

export interface Announcement {
  id?: number;
  title: string;
  content: string;
  titre?: string; // Mappés selon ton entité si besoin
  contenu?: string;
  date?: string;
  groupeId?: number;
  equipeId?: number;
  roleCible?: number;
  actifSeulement?: boolean;
  pieceJointeUrl?: string;
  createur?:Membre;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private apiUrl = `${environment.apiUrl}/announcements`; 
  

  constructor(private http: HttpClient) {}

  create(groupeId: number, announcement: Announcement): Observable<Announcement> {
    console.log(announcement)
    return this.http.post<Announcement>(`${this.apiUrl}/groupe/${groupeId}`, announcement);
  }

  getByGroupe(groupeId: number): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.apiUrl}/groupe/${groupeId}`);
  }

  getById(id: number): Observable<Announcement> {
    return this.http.get<Announcement>(`${this.apiUrl}/${id}`);
  }

  update(id: number, announcement: Announcement): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.apiUrl}/${id}`, announcement);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}