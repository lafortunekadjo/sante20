import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Stade } from '../models/stade';


@Injectable({ providedIn: 'root' })
export class StadeService {
  private apiUrl = `${environment.apiUrl}/stades`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Stade[]> { return this.http.get<Stade[]>(this.apiUrl); }
  create(stade: any): Observable<Stade> { return this.http.post<Stade>(`${this.apiUrl}/deux`, stade); }
  update(id: number, stade: any): Observable<Stade> { return this.http.put<Stade>(`${this.apiUrl}/${id}`, stade); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}