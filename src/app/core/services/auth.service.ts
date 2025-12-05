import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, switchMap, throwError, catchError, map, forkJoin, of, BehaviorSubject, first } from 'rxjs';
import { environment } from '../../environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../models/user';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Geolocation } from '@capacitor/geolocation';
import { Membre } from '../models/membre.model';
import { Route, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
 
  // 🔑 Constantes pour les clés du localStorage
  private readonly TOKEN_KEY = 'token'; 
  private readonly GROUPE_ID_KEY = 'currentGroupeId'; 
  private readonly USER_INFO_KEY = 'userInfo'; 
  private readonly PROFIL_URL_KEY = 'profilUrl';
 
  private jwtHelper = new JwtHelperService();
  private token: string | null = null;
  private roles: string[] = [];
  private userId: number | null = null;
 private groupeId: number | null = null;

  private apiUrl = `${environment.apiUrl}/auth/login`; 
  private apiCheck = `${environment.apiUrl}/presences/check-in`; 
  private userInfoUrl = `${environment.apiUrl}/auth/me`;
  private userUpdateUrl = `${environment.apiUrl}/user`;
  private memberUpdateUrl = `${environment.apiUrl}/membres`;
  private apiGroupesConnect= `${environment.apiUrl}/groupes/connect`;
  
  username: any;
  private passwordResetRequired: boolean = false;
  private currentRole: string | null = null;

  // BehaviorSubject pour la gestion d'état réactif
  private currentGroupeIdSubject = new BehaviorSubject<number | null>(null);
  public currentGroupeId$ = this.currentGroupeIdSubject.asObservable();

  private isUserReadySubject = new BehaviorSubject<boolean>(false);
  public isUserReady$ = this.isUserReadySubject.asObservable();
  

  constructor(private http: HttpClient, private sanitizer: DomSanitizer, private router: Router) {
    this.initializeAuthState();
  }


  /**
   * Initialise l'état du service à partir du localStorage au chargement.
   * Assure la persistance du token et des données utilisateur.
   */
private initializeAuthState(): void {
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    
    // 1. Vérification du token et de son expiration
    if (storedToken && !this.jwtHelper.isTokenExpired(storedToken)) {
        this.token = storedToken; // Mise à jour de la propriété privée
        
        // 🔧 CORRECTION: Charger les données utilisateur depuis localStorage IMMÉDIATEMENT
        this.loadUserDataFromStorage();
        
        // 🔧 CORRECTION: Émettre isUserReady IMMÉDIATEMENT avec les données en cache
        this.isUserReadySubject.next(true);
        
        // 2. Chargement des données utilisateur et groupe en arrière-plan (pour mise à jour)
        const fetchGroup$ = this.fetchUserGroup().pipe(catchError(() => of(null)));
        const fetchUser$ = this.fetchUserInfoFromToken();

        forkJoin([fetchGroup$, fetchUser$]).pipe(
            first(),
            catchError(err => {
                console.warn("Erreur lors du rechargement des infos utilisateur. Utilisation du cache.", err);
                // Ne pas déconnecter, garder les données en cache
                return of(null);
            })
        ).subscribe();
    } else {
        // Si non connecté, nettoyer le stockage et stabiliser l'état
        this.logout(false); // Déconnexion sans navigation
        this.isUserReadySubject.next(true);
    }
    
    // 3. Initialisation du BehaviorSubject du groupe depuis le localStorage
    const storedGroupeId = localStorage.getItem(this.GROUPE_ID_KEY);
    if (storedGroupeId) {
      const id = parseInt(storedGroupeId, 10);
      if (!isNaN(id)) {
        this.currentGroupeIdSubject.next(id);
      }
    }
}

  /**
 * 🆕 Nouvelle méthode: Charge les données utilisateur depuis localStorage
 */
private loadUserDataFromStorage(): void {
    // Charger les infos utilisateur depuis localStorage
    const userInfoString = localStorage.getItem(this.USER_INFO_KEY);
    
    if (userInfoString) {
        try {
            const userInfo = JSON.parse(userInfoString);
            
            // Restaurer les propriétés depuis le cache
            this.userId = userInfo.userId || null;
            this.roles = userInfo.roles || [];
            this.username = userInfo.username || null;
            this.currentRole = userInfo.currentRole || null;
            
            console.log('Données utilisateur chargées depuis localStorage:', {
                userId: this.userId,
                roles: this.roles,
                username: this.username,
                currentRole: this.currentRole
            });
        } catch (e) {
            console.error("Erreur lors du parsing de userInfo depuis localStorage:", e);
        }
    }
}

/**
 * Logique pour récupérer les informations utilisateur après l'authentification.
 */
private fetchUserInfoFromToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
        return throwError(() => new Error('Token manquant.'));
    }

    const authHeaders = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    return this.http.get<any>(this.userInfoUrl, {
        headers: authHeaders,
        withCredentials: true
    }).pipe(
        tap(userInfo => {
            this.userId = userInfo.id || null;
            this.passwordResetRequired = userInfo.passwordResetRequired || false;
            this.roles = userInfo.roles || [];
            this.username = userInfo.username || null;
            
            if (!this.currentRole || !this.roles.includes(this.currentRole)) {
              this.currentRole = this.roles.length > 0 ? this.roles[0] : null;
            }
            
            localStorage.setItem(this.PROFIL_URL_KEY, userInfo.profilePhotoUrl); 

            localStorage.setItem(this.USER_INFO_KEY, JSON.stringify({
                userId: this.userId,
                roles: this.roles, 
                username: this.username,
                currentRole: this.currentRole
            }));
        })
    );
}

login(username: string, password: string): Observable<any> {
  const loginPayload = { username, password };
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  
  this.isUserReadySubject.next(false);

  return this.http.post<any>(this.apiUrl, loginPayload, {
    headers,
    withCredentials: true 
  }).pipe(
    tap(response => {
      if (response?.token) {
        this.token = response.token;
        localStorage.setItem(this.TOKEN_KEY, response.token);
      }
    }),

    switchMap(response => {
      if (!response?.token) {
        return throwError(() => new Error('Connexion échouée : pas de token reçu.'));
      }
      // Lancer les deux requêtes en parallèle (groupe et user info)
      const fetchGroup$ = this.fetchUserGroup().pipe(catchError(() => of(null)));
      const fetchUser$ = this.fetchUserInfoFromToken();
      return forkJoin([fetchGroup$, fetchUser$]);
    }),

    tap(() => {
        this.isUserReadySubject.next(true);
    }),
    catchError(err => {
        this.isUserReadySubject.next(true); 
        return throwError(() => err);
    })
  );
}

/**
 * Récupère le token depuis la mémoire ou le localStorage, et le met en cache dans la mémoire du service.
 */
getToken(): string | null {
  if (!this.token) {
    this.token = localStorage.getItem(this.TOKEN_KEY);
  }
  return this.token;
}

private fetchUserGroup(): Observable<any> {


    return this.http.get<any>(this.apiGroupesConnect).pipe(
        tap(groupInfo => {
            if (groupInfo && groupInfo.id) {
                const newGroupeId = groupInfo.id;
                
                this.currentGroupeIdSubject.next(newGroupeId);
                
                localStorage.setItem(this.GROUPE_ID_KEY, newGroupeId.toString());
                
            } else {
                this.currentGroupeIdSubject.next(null);
                localStorage.removeItem(this.GROUPE_ID_KEY);
            }
        }),
        catchError(err => {
            console.error("[AuthService] Erreur lors de la récupération du groupe connecté:", err);
            this.currentGroupeIdSubject.next(null);
            localStorage.removeItem(this.GROUPE_ID_KEY);
            return of(null);
        })
    );
}

  getCurrentGroupeId$(): Observable<number | null> {
    return this.currentGroupeIdSubject.asObservable();
  }

  getCurrentGroupeId(): number | null {
    return this.currentGroupeIdSubject.value;
  }

  isPasswordResetRequired(): boolean {
    return this.passwordResetRequired;
  }

getProfilePhoto2(): Observable<SafeUrl> {
    const pathPart = localStorage.getItem(this.PROFIL_URL_KEY);
    
    let finalUrl: string;

    if (pathPart) {
      finalUrl = pathPart;
    } else {
      finalUrl = 'assets/default-avatar.png'; 
      console.warn('Chemin de photo de profil non trouvé dans localStorage.');
    }

    const safeUrl = this.sanitizer.bypassSecurityTrustUrl(finalUrl);
    return of(safeUrl);
}


  getProfilePhoto(userId: number): Observable<SafeUrl> {
    return this.http.get(`${this.userUpdateUrl}/${userId}/profile-photo`, { responseType: 'blob' }).pipe(
      map(blob => {
        const objectURL = URL.createObjectURL(blob);
        return this.sanitizer.bypassSecurityTrustUrl(objectURL);
      })
    );
  }

  uploadProfilePhoto(userId: number, file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('profilePhoto', file, file.name);

    return this.http.post(`${this.userUpdateUrl}/${userId}/profile-photo`, formData).pipe(
      tap(() => console.log('Photo de profil téléchargée avec succès sur le serveur.')),
      catchError(error => {
        console.error('Erreur lors du téléchargement de la photo de profil:', error);
        return throwError(error);
      })
    );
  }

getRoles(): string[] {
  // Si on a déjà les rôles en mémoire et qu'ils sont valides
  if (this.roles && this.roles.length > 0 && typeof this.roles[0] === 'string' && !this.roles[0].startsWith('ROLE_')) {
    return this.roles;
  }

  // Sinon, charger depuis localStorage
  const userInfoString = localStorage.getItem(this.USER_INFO_KEY);

  if (userInfoString) {
    try {
      const userInfo = JSON.parse(userInfoString);
      
      if (userInfo && userInfo.roles && Array.isArray(userInfo.roles) && userInfo.roles.length > 0) {
        // Nettoyer les rôles et les mettre en cache
        this.roles = userInfo.roles.map((role: any) => 
          role.name ? role.name.replace('ROLE_', '') : role.replace('ROLE_', '')
        );
        
        return this.roles;
      }
    } catch (e) {
      console.error("Erreur lors du parsing de userInfo :", e);
      return [];
    }
  }

  return [];
}

getUserId(): number | null {
  if (this.userId) {
    return this.userId;
  }
  
  // Charger depuis localStorage si pas en mémoire
  const userInfo = localStorage.getItem(this.USER_INFO_KEY);
  if (userInfo) {
    try {
      const parsedInfo = JSON.parse(userInfo);
      this.userId = parsedInfo.userId || null;
      return this.userId;
    } catch (e) {
      console.error("Erreur parsing userId depuis localStorage:", e);
    }
  }
  
  return null;
}
getUsername(): string | null {
  if (this.username) {
    return this.username;
  }
  
  // Charger depuis localStorage si pas en mémoire
  const userInfo = localStorage.getItem(this.USER_INFO_KEY);
  if (userInfo) {
    try {
      const parsedInfo = JSON.parse(userInfo);
      this.username = parsedInfo.username || null;
      return this.username;
    } catch (e) {
      console.error("Erreur parsing username depuis localStorage:", e);
    }
  }
  
  return null;
}

  isTokenExpired(): boolean {
    const token = this.getToken();
    return token ? this.jwtHelper.isTokenExpired(token) : true;
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn() && !this.isTokenExpired();
  }

  /**
   * Déconnecte l'utilisateur en nettoyant la mémoire et le localStorage.
   * @param navigate Indique si l'application doit naviguer vers '/explorer' après la déconnexion.
   */
  logout(navigate: boolean = true): void {
    this.token = null;
    this.roles = [];
    this.userId = null;
    this.username = null;
    this.currentRole = null;
    this.passwordResetRequired = false;
    this.currentGroupeIdSubject.next(null);

    // Nettoyer toutes les clés pertinentes du localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.GROUPE_ID_KEY);
    localStorage.removeItem(this.USER_INFO_KEY);
    localStorage.removeItem(this.PROFIL_URL_KEY);
    localStorage.removeItem('redirectAfterLogin');
    
    this.isUserReadySubject.next(true); 

    if (navigate) {
      this.router.navigate(['/explorer']);
    }
  }

isLoggedIn(): boolean {
  const token = this.getToken();
  return !!token; 
}

  isAdmin(): boolean {
    return this.getRoles().includes('ADMIN');
  }

  updateUserProfile(userData: User): Observable<User> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Aucun token disponible pour la mise à jour du profil.'));
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.put<User>(this.userUpdateUrl, userData, { headers }).pipe(
      tap(updatedUser => {
        this.userId = updatedUser.id || this.userId;
        this.username = updatedUser.username || this.username;
        localStorage.setItem(this.USER_INFO_KEY, JSON.stringify({
          userId: this.userId,
          roles: this.roles,
          username: this.username,
          currentRole: this.currentRole
        }));
      })
    );
  }

   updateUserProfileAndMember(userData: User, memberData: Membre): Observable<{ userUpdated: boolean; memberUpdated: boolean }> {
    console.log(memberData)
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Aucun token disponible pour la mise à jour.'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    
    const userUpdate$ = this.http.put<User>(this.userUpdateUrl, userData, { headers }).pipe(
      map(() => true), 
      catchError(err => {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', err);
        return of(false); 
      })
    );
    
    const memberUpdate$ = this.http.put<any>(this.memberUpdateUrl, memberData, { headers }).pipe(
      map(() => true), 
      catchError(err => {
        console.error('Erreur lors de la mise à jour du membre:', err);
        return of(false); 
      })
    );

    return forkJoin({
      userUpdated: userUpdate$,
      memberUpdated: memberUpdate$
    });
  }
 getCurrentRole(): string | null {
    if (!this.currentRole) {
      const userInfo = localStorage.getItem(this.USER_INFO_KEY);
      if (userInfo) {
        const parsedInfo = JSON.parse(userInfo);
        this.currentRole = parsedInfo.currentRole || this.getRoles()[0] || null;
      } else {
        this.currentRole = this.getRoles()[0] || null;
      }
    }
    return this.currentRole;
  }

  setCurrentRole(role: string): void {
    if (this.getRoles().includes(role)) {
      this.currentRole = role;
      const userInfo = localStorage.getItem(this.USER_INFO_KEY);
      if (userInfo) {
        const userData = JSON.parse(userInfo);
        userData.currentRole = role;
        localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userData));
      }
    }
  }

  getUser(): any {
    const userInfo = localStorage.getItem(this.USER_INFO_KEY);
    if (userInfo) {
      return JSON.parse(userInfo);
    }
    return {
      userId: this.userId,
      roles: this.roles,
      username: this.username,
      currentRole: this.currentRole
    };
  }

    updatePassword(userId: number, oldPassword: string, newPassword: string): Observable<any> {
    const passwordUpdateUrl = `${this.userUpdateUrl}/${userId}/password`;
    return this.http.patch(passwordUpdateUrl, { oldPassword, newPassword });
  }

  async checkIn(id:number, check: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const data = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        equipe: id,
        ajoue:check,
      };

      const token = this.getToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });
      
      const response = await this.http.post<{ message: string }>(this.apiCheck, data, { headers }).toPromise();

      return { success: true, message:  'Présence enregistrée avec succès' };
    } catch (error: any) {
      console.error('Erreur API détaillée:', error);
      let errorMessage = 'Erreur : Une erreur inattendue est survenue.';
      if (error.status) {
        errorMessage = error.error?.message || `Erreur ${error.status}: ${error.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return { success: false, message: errorMessage };
    }
  }

  createUser(user: any): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/user/create`, user).pipe(
      catchError(err => {
        console.error('Erreur lors de la création de l’utilisateur:', err);
        return throwError(err);
      })
    );
  }

// Dans auth.service.ts

/**
 * Vérifie si l'utilisateur connecté a un rôle de responsable
 */
isResponsable(): boolean {
  const roles = this.getRoles();
  const rolesResponsable = ['RESPONSABLE', 'ADMIN', 'MEMBRE', 'CANDIDAT'];
  return roles.some(role => rolesResponsable.includes(role));
}

 
/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
hasRole(role: string): boolean {
  return this.getRoles().includes(role);
}

/**
 * Vérifie si l'utilisateur a au moins un des rôles spécifiés
 */
hasAnyRole(roles: string[]): boolean {
  const userRoles = this.getRoles();
  return roles.some(role => userRoles.includes(role));
}


     getGroupe(): number | null {
    if (this.groupeId) {
      return this.groupeId;
    }
    
    // Charger depuis localStorage si pas en mémoire
    const userInfo = localStorage.getItem(this.GROUPE_ID_KEY);
    if (userInfo) {
      try {
        const parsedInfo = JSON.parse(userInfo);
        this.groupeId = parsedInfo || null;
        return this.groupeId;
      } catch (e) {
        console.error("Erreur parsing groupeId depuis localStorage:", e);
      }
    }
    
    return null;
  }
}
