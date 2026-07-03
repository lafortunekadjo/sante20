import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environment';
 

export interface UserProfileDTO {
  id?: number;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  sexe?: string;
  tel?: string;
  adresse?: string;
  cni?: string;
  profession?: string;
  assurance?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/profil`;

  private readonly CACHE_KEY = 'userProfile';

  /** Charge le profil depuis le backend et le met en cache */
  getMyProfile(): Observable<UserProfileDTO> {
    return this.http.get<UserProfileDTO>(this.base).pipe(
      tap(p => localStorage.setItem(this.CACHE_KEY, JSON.stringify(p)))
    );
  }

  /** Met à jour les infos personnelles (source de vérité unique) */
  updateMyProfile(data: Partial<UserProfileDTO>): Observable<UserProfileDTO> {
    return this.http.patch<UserProfileDTO>(this.base, data).pipe(
      tap(p => localStorage.setItem(this.CACHE_KEY, JSON.stringify(p)))
    );
  }

  /** Lecture synchrone depuis le cache localStorage */
  getCache(): UserProfileDTO | null {
    const raw = localStorage.getItem(this.CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /** Vider le cache au logout */
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }
}