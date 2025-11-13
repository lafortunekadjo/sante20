import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Objectif } from '../models/objectifs.model';

@Injectable({
  providedIn: 'root'
})
export class ObjectifsService {



  constructor(private http: HttpClient) { }

  getObjectifsByMembre(membreId: number): Observable<Objectif[]> {
    return this.http.get<Objectif[]>(`${environment.apiUrl}/objectifs/membre/${membreId}`);
  }

  createObjectif(objectif: Objectif): Observable<Objectif> {
    return this.http.post<Objectif>(`${environment.apiUrl}/objectifs`, objectif);
  }

   updateObjectif(id: number, objectif: Objectif): Observable<Objectif> {
    return this.http.post<Objectif>(`${environment.apiUrl}/objectifs`, objectif);
  }

  deleteObjectif(objectifId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/${objectifId}`);
  }
}
