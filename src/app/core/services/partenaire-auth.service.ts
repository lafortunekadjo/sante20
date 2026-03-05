// ============================================================
// MY2-0 - SERVICE AUTHENTIFICATION PARTENAIRE
// Gère l'authentification et les tokens pour l'espace partenaire
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environment';


export interface PartenaireUser {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  telephone?: string;
  partenaireId: number;
  partenaireNom: string;
  role: string;
  permissions?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: PartenaireUser;
  expiresIn: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class PartenaireAuthService {
  private readonly API_URL = `${environment.apiUrl}/partenaire/auth`;
  private readonly TOKEN_KEY = 'partenaire_token';
  private readonly REFRESH_TOKEN_KEY = 'partenaire_refresh_token';
  private readonly USER_KEY = 'partenaire_user';

  private userSubject = new BehaviorSubject<PartenaireUser | null>(null);
  public user$ = this.userSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  // ============================================================
  // AUTHENTIFICATION
  // ============================================================

  /**
   * Connexion partenaire
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        this.setSession(response);
      }),
      catchError(error => {
        console.error('Erreur login partenaire:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    // Appeler le backend pour invalider le token (optionnel)
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.API_URL}/logout`, {}).subscribe({
        error: () => {} // Ignorer les erreurs
      });
    }

    this.clearSession();
    this.router.navigate(['/partenaire/login']);
  }

  /**
   * Rafraîchir le token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.http.post<LoginResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(response => {
        this.setSession(response);
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Changer le mot de passe
   */
  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/change-password`, request);
  }

  /**
   * Mot de passe oublié
   */
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/forgot-password`, { email });
  }

  /**
   * Réinitialiser le mot de passe
   */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/reset-password`, { token, newPassword });
  }

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================

  private setSession(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    
    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    
    this.userSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  private loadStoredUser(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson && !this.isTokenExpired(token)) {
      try {
        const user = JSON.parse(userJson) as PartenaireUser;
        this.userSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch {
        this.clearSession();
      }
    } else {
      this.clearSession();
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Obtenir le token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtenir l'utilisateur connecté
   */
  getUser(): PartenaireUser | null {
    return this.userSubject.value;
  }

  /**
   * Obtenir le rôle
   */
  getRole(): string {
    return this.userSubject.value?.role || '';
  }

  /**
   * Obtenir l'ID du partenaire
   */
  getPartenaireId(): number | null {
    return this.userSubject.value?.partenaireId || null;
  }

  /**
   * Vérifier si connecté
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Vérifier si le token est expiré
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir en millisecondes
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  // ============================================================
  // PERMISSIONS
  // ============================================================

  /**
   * Vérifier si l'utilisateur a une permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    
    // Admin a toutes les permissions
    if (user.role === 'ADMIN_PARTENAIRE') return true;
    
    // Vérifier les permissions spécifiques
    return user.permissions?.includes(permission) || false;
  }

  /**
   * Vérifier si l'utilisateur peut créer des publicités
   */
  canCreateAds(): boolean {
    const role = this.getRole();
    console.log(role)
    return role === 'ADMIN_PARTENAIRE' || role === 'GESTIONNAIRE' || role === 'PARTENAIRE' || role === 'ROLE_PARTENAIRE';
  }

  /**
   * Vérifier si l'utilisateur peut gérer les utilisateurs
   */
  canManageUsers(): boolean {
    return this.getRole() === 'PARTENAIRE';
  }

  /**
   * Vérifier si l'utilisateur peut voir les statistiques
   */
  canViewStats(): boolean {
    // Tous les rôles peuvent voir les stats
    return this.isLoggedIn();
  }
}