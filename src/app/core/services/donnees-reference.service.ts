import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { ZoneGeographique, Ethnie } from '../models/zonegeographique.model';


@Injectable({
  providedIn: 'root'
})
export class DonneesReferenceService {
  private apiUrl = `${environment.apiUrl}/metadata`;

  constructor(private http: HttpClient) {}

  getVilles(): Observable<ZoneGeographique[]> {
    return this.http.get<ZoneGeographique[]>(`${this.apiUrl}/villes`);
  }

  getZonesOrigine(): Observable<ZoneGeographique[]> {
    return this.http.get<ZoneGeographique[]>(`${this.apiUrl}/zones-origine`);
  }

  getEthnies(): Observable<Ethnie[]> {
    return this.http.get<Ethnie[]>(`${this.apiUrl}/ethnies`);
  }
}