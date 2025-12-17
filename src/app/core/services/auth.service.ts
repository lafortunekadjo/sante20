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

// Définition de l'interface pour le groupe (s'assurer qu'elle est bien importée/définie)
export interface GroupeInfo {
  id: number;
  nom: string;
  // Autres propriétés du groupe si nécessaires
}
export interface SignupRequest {
  username: string;
  email: string;
  motDePasse: string;
  roles: string;
  membre: {
    nom: string;
    prenom: string;
    dateNaissance?: string;
    sexe?: string;
    tel?: string;
    adresse?: string;
  };
}

export interface SignupResponse {
  userId: number;
  membreId: number;
  username: string;
  email: string;
  message: string;
  success: boolean;
}

export interface AvailabilityResponse {
  available: boolean;
}

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
  // Suppression de private groupeId: number | null = null; car nous utilisons le Subject

  private apiUrl = `${environment.apiUrl}/auth/login`; 
  private apiAAuth = `${environment.apiUrl}/auth`; 
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

  // Indique si le service est prêt (auth et données initiales chargées)
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
      
      // Charger les données utilisateur depuis localStorage IMMÉDIATEMENT
      this.loadUserDataFromStorage();
      
      // 3. Initialisation du BehaviorSubject du groupe depuis le localStorage
      const storedGroupeId = localStorage.getItem(this.GROUPE_ID_KEY);
      const id = storedGroupeId ? parseInt(storedGroupeId, 10) : null;
      if (id !== null && !isNaN(id)) {
        this.currentGroupeIdSubject.next(id);
      }
      
      // Émettre isUserReady IMMÉDIATEMENT avec les données en cache
      this.isUserReadySubject.next(true); // Autorise la navigation pendant le rechargement
      
      // 2. Chargement des données utilisateur et groupe en arrière-plan (pour mise à jour)
      const fetchGroup$ = this.fetchUserGroup().pipe(catchError(() => of(null)));
      const fetchUser$ = this.fetchUserInfoFromToken();

      forkJoin([fetchGroup$, fetchUser$]).pipe(
        first(),
        catchError(err => {
          console.warn("Erreur lors du rechargement des infos utilisateur. Utilisation du cache.", err);
          return of(null);
        })
      ).subscribe();
    } else {
      // Si non connecté, nettoyer le stockage et stabiliser l'état
      this.logout(false); // Déconnexion sans navigation
      this.isUserReadySubject.next(true); // L'application est prête, mais l'utilisateur n'est pas logué.
    }
  }

  /**
   * Charge les données utilisateur depuis localStorage
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

  /**
   * Gère le processus de connexion
   */
  login(username: string, password: string): Observable<any> {
    const loginPayload = { username, password };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    this.isUserReadySubject.next(false); // Blocage de l'UI pendant la connexion

    return this.http.post<any>(this.apiUrl, loginPayload, {
      headers,
      withCredentials: true 
    }).pipe(
      tap(response => {
        if (response?.token) {
          this.token = response.token;
          localStorage.setItem(this.TOKEN_KEY, response.token);
        } else {
          throw new Error('Connexion échouée : pas de token reçu.');
        }
      }),

      switchMap(() => {
        // Le token est maintenant dans this.getToken() grâce au tap précédent.
        // Lancer les deux requêtes en parallèle (groupe et user info)
        
        // Nous garantissons que même si fetchUserGroup échoue, l'Observable continue
        const fetchGroup$ = this.fetchUserGroup().pipe(catchError(() => of(null)));
        const fetchUser$ = this.fetchUserInfoFromToken();
        
        return forkJoin([fetchGroup$, fetchUser$]);
      }),

      tap(() => {
        // Une fois que les deux appels sont terminés (même si fetchGroup a retourné null)
        this.isUserReadySubject.next(true); 
      }),
      
      catchError(err => {
        // En cas d'erreur totale (login API ou fetchUserInfoFromToken)
        this.logout(false); // Nettoyage complet
        this.isUserReadySubject.next(true); // L'UI peut s'afficher (avec l'état déconnecté)
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

  /**
   * Récupère les informations du groupe de l'utilisateur connecté.
   * Gère le cas où l'utilisateur n'a pas de groupe.
   */
  private fetchUserGroup(): Observable<GroupeInfo | null> {
    // L'API est supposée retourner l'objet GroupeInfo si l'utilisateur a un groupe,
    // ou null / un objet vide si l'utilisateur n'en a pas.
    return this.http.get<GroupeInfo | null>(this.apiGroupesConnect).pipe(
      tap(groupInfo => {
        // Vérifie si groupInfo est défini, non nul, ET a une propriété 'id' valide.
        if (groupInfo && typeof groupInfo === 'object' && groupInfo.id) {
          const newGroupeId = groupInfo.id;
          
          this.currentGroupeIdSubject.next(newGroupeId);
          
          // Mise à jour de la propriété privée this.groupeId pour les accès synchrones (OPTIONNEL MAIS UTILE)
          // this.groupeId = newGroupeId; // <-- Suppression car nous utilisons le Subject comme source unique de vérité.
          
          // Utilisez toString() pour stocker dans localStorage
          localStorage.setItem(this.GROUPE_ID_KEY, newGroupeId.toString());
          
          console.log(`[AuthService] Groupe ID récupéré et défini: ${newGroupeId}`);

        } else {
          // Cas où l'utilisateur n'a pas de groupe (groupInfo est null/vide/sans id)
          this.currentGroupeIdSubject.next(null);
          localStorage.removeItem(this.GROUPE_ID_KEY);
          
          console.warn("[AuthService] L'utilisateur connecté n'est associé à aucun groupe.");
        }
      }),
      catchError(err => {
        // En cas d'erreur de l'API (ex: 404, 500, ou erreur de connexion)
        console.error("[AuthService] Erreur lors de la récupération du groupe connecté:", err);
        
        // Assurez-vous que l'état est réinitialisé
        this.currentGroupeIdSubject.next(null);
        localStorage.removeItem(this.GROUPE_ID_KEY);
        
        // Retourne un Observable de 'null' pour que la chaîne d'Observable principale continue ou se termine proprement
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
        return throwError(() => error); // Utilisation de throwError correcte
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
      this.router.navigate(['/home']);
    }
  }

  /**
   * Détermine si l'utilisateur a un token valide (état "connecté" de base)
   */
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

      return { success: true, message: 'Présence enregistrée avec succès' };
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
        return throwError(() => err);
      })
    );
  }

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


  /**
   * Récupère l'ID du groupe depuis le BehaviorSubject (source de vérité)
   */
  getGroupe(): number | null {
    // Supprime l'accès à this.groupeId et le parsing du localStorage pour se concentrer sur le Subject
    return this.currentGroupeIdSubject.value; 
  }

  addUser(signupData: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.apiAAuth}/signup`, signupData);
  }

  /**
   * Vérifier si un nom d'utilisateur est disponible
   */
  checkUsernameAvailability(username: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(
      `${this.apiUrl}/check-username`,
      { params: { username } }
    );
  }

  /**
   * Vérifier si un email est disponible
   */
  checkEmailAvailability(email: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(
      `${this.apiUrl}/check-email`,
      { params: { email } }
    );
  }

  /**
   * Vérifier si un numéro de téléphone est disponible
   */
  checkTelAvailability(tel: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(
      `${this.apiUrl}/check-tel`,
      { params: { tel } }
    );
  }
}