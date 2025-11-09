import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap , switchMap, throwError, catchError, map, forkJoin, of, BehaviorSubject, first } from 'rxjs';
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

  private currentGroupeIdSubject = new BehaviorSubject<number | null>(null);
  public currentGroupeId$ = this.currentGroupeIdSubject.asObservable();

  // NOUVEAU: BehaviorSubject pour suivre si l'état de l'utilisateur est stable et chargé.
  private isUserReadySubject = new BehaviorSubject<boolean>(false);
  public isUserReady$ = this.isUserReadySubject.asObservable();
  

  constructor(private http: HttpClient,private sanitizer: DomSanitizer, private router: Router) {
    this.initializeAuthState();
  }


  /**
   * Initialise l'état du service à partir du localStorage au chargement.
   */
  private initializeAuthState(): void {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !this.jwtHelper.isTokenExpired(storedToken)) {
        this.token = storedToken;
        this.fetchUserGroup()
        
        // Comme le token existe, nous allons essayer de charger les infos utilisateur
        this.fetchUserInfoFromToken().pipe(
            first(), // Ne prendre qu'une seule émission
            tap(() => this.isUserReadySubject.next(true)), // Émettre TRUE si chargement réussi
            catchError(err => {
                console.warn("Token valide mais erreur lors du rechargement des infos utilisateur. Déconnexion.", err);
                this.logout();
                this.isUserReadySubject.next(true); // Terminer l'attente même en cas d'erreur de rechargement
                return of(null);
            })
        ).subscribe();
    } else {
        // Si aucun token ou token expiré, l'utilisateur est non connecté. L'état est stable.
        this.isUserReadySubject.next(true);
    }
    
    // Initialise le BehaviorSubject avec le groupe stocké
    const storedGroupeId = localStorage.getItem('currentGroupeId');
    if (storedGroupeId) {
      const id = parseInt(storedGroupeId, 10);
      this.currentGroupeIdSubject.next(id);
    }
  }

/**
 * Logique pour récupérer les informations utilisateur après l'authentification.
 * Utilisé après le login OU lors de l'initialisation si un token est présent.
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
            this.currentRole = this.roles.length > 0 ? this.roles[0] : null;
            localStorage.setItem('profilUrl', environment.imageUrl + userInfo.profilePhotoUrl);

            localStorage.setItem('userInfo', JSON.stringify({
                userId: this.userId,
                roles: this.roles,
                username: this.username
            }));
        })
    );
}

login(username: string, password: string): Observable<any> {
  const loginPayload = { username, password };
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  
  // Rétablir l'état initial avant le login
  this.isUserReadySubject.next(false);

  // Étape 1 : Authentification et récupération du token
  return this.http.post<any>(this.apiUrl, loginPayload, {
    headers,
    withCredentials: true // Important si backend autorise les credentials
  }).pipe(
    tap(response => {
      if (response?.token) {
        this.token = response.token;
        localStorage.setItem('token', response.token);
      }
    }),

    // Étape 2 : Utilisation du token pour récupérer les infos utilisateur
    switchMap(response => {
      if (!response?.token) {
        return throwError(() => new Error('Connexion échouée : pas de token reçu.'));
      }
this.fetchUserGroup()
      // Utilise la nouvelle méthode d'extraction des infos
      return this.fetchUserInfoFromToken();
    }),

    // Étape 3 : Émettre que l'utilisateur est prêt
    tap(() => {
        this.isUserReadySubject.next(true);
    }),
    catchError(err => {
        // Émettre TRUE pour débloquer l'UI, même si le login a échoué
        this.isUserReadySubject.next(true); 
        return throwError(() => err);
    })
  );
}

getGroupId(): number | null {
    // 1. Si vous utilisez un BehaviorSubject (recommandé dans les services)
    // C'est l'état le plus fiable car il est mis à jour après l'appel API.
    if (this.currentGroupeIdSubject && this.currentGroupeIdSubject.value !== null) {
        return this.currentGroupeIdSubject.value;
    }

    // 2. Fallback: Tentative de récupération depuis le localStorage (pour rechargement)
    const groupInfoString = localStorage.getItem('currentGroupeId');
    
    if (groupInfoString) {
        // CONVERSION CRITIQUE: La valeur du localStorage est une STRING,
        // mais le type de retour est NUMBER | null.
        const groupIdNumber = parseInt(groupInfoString, 10);

        // Vérifier si la conversion a réussi (n'est pas NaN)
        if (!isNaN(groupIdNumber)) {
            // Mettre à jour la propriété interne du service (si elle est utilisée)
            // this.groupeId = groupIdNumber; 
            return groupIdNumber;
        }
    }
    
    // Si rien n'est trouvé ou si la valeur est invalide
    return null;
}

private fetchUserGroup(): Observable<any> {
    // --- Fonction getToken() est nécessaire ici ---
    const token = this.getToken(); // Assume que this.getToken() est défini dans le service
    
    if (!token) {
        return throwError(() => new Error('Token manquant pour la récupération du groupe.'));
    }

    const authHeaders = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });
    

    return this.http.get<any>(this.apiGroupesConnect, { headers: authHeaders, withCredentials: true }).pipe(
        tap(groupInfo => {
            if (groupInfo && groupInfo.id) {
                const newGroupeId = groupInfo.id;
                
                // Mettre à jour l'état réactif (BehaviorSubject)
                this.currentGroupeIdSubject.next(newGroupeId);
                
                // --- C'EST LA LIGNE QUI MET À JOUR LE LOCALSTORAGE ---
                localStorage.setItem('currentGroupeId', newGroupeId.toString());
                // ----------------------------------------------------
                
                console.log(`[AuthService] Groupe ID récupéré et défini: ${newGroupeId}`);
            } else {
                console.warn("[AuthService] Groupe ID non trouvé dans la réponse de /groupes/connect.");
                this.currentGroupeIdSubject.next(null);
                localStorage.removeItem('currentGroupeId');
            }
        }),
        catchError(err => {
            console.error("[AuthService] Erreur lors de la récupération du groupe connecté:", err);
            this.currentGroupeIdSubject.next(null);
            localStorage.removeItem('currentGroupeId');
            return of(null);
        })
    );
}

  /**
   * Retourne un Observable du Groupe ID actif (pour utilisation réactive)
   */
  getCurrentGroupeId$(): Observable<number | null> {
    return this.currentGroupeIdSubject.asObservable();
  }

  /**
   * Retourne immédiatement le Groupe ID actif (pour utilisation synchrone)
   */
  getCurrentGroupeId(): number | null {
    return this.currentGroupeIdSubject.value;
  }

  // Vérifier si l'utilisateur a besoin de réinitialiser son mot de passe
  isPasswordResetRequired(): boolean {
    // Ceci devrait venir d'une propriété de votre objet utilisateur
    return this.passwordResetRequired;
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('token');
  }

getProfilePhoto2(): Observable<SafeUrl> {
    // 1. Récupérer la partie de l'URL (le chemin, ex: 'users/123/avatar.jpg')
    const pathPart = localStorage.getItem('profilUrl');
    
    let finalUrl: string;

    if (pathPart) {
      // 2. Compléter l'URL
      finalUrl = environment.imageUrl + pathPart;
    } else {
      // Utiliser une image par défaut si le chemin n'est pas trouvé
      finalUrl = 'assets/default-avatar.png'; 
      console.warn('Chemin de photo de profil non trouvé dans localStorage.');
    }

    // 3. Sécuriser l'URL: bypassSecurityTrustUrl est utilisé car nous savons que l'URL est fiable.
    const safeUrl = this.sanitizer.bypassSecurityTrustUrl(finalUrl);

    // 4. Retourner l'objet SafeUrl dans un Observable (utilisant 'of' de RxJS)
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
  // Si les rôles sont déjà chargés et formatés, on les retourne.
  if (this.roles.length > 0 && typeof this.roles[0] === 'string' && !this.roles[0].startsWith('ROLE_')) {
    return this.roles;
  }

  const userInfoString = localStorage.getItem('userInfo');

  if (userInfoString) {
    try {
      const userInfo = JSON.parse(userInfoString);
      
      if (userInfo && userInfo.roles && Array.isArray(userInfo.roles) && userInfo.roles.length > 0) {
        
        // On mappe pour extraire le nom, puis on utilise replace() pour enlever le préfixe.
        this.roles = userInfo.roles.map((role: any) => 
          role.name.replace('ROLE_', '')
        );
        
        return this.roles;
      }
    } catch (e) {
      console.error("Erreur lors du parsing de userInfo :", e);
      return [];
    }
  }

  // Retourne un tableau vide par défaut.
  return [];
}

  getUserId(): number | null {
    if (!this.userId) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        this.userId = JSON.parse(userInfo).userId || null;
      }
    }
    return this.userId;
  }

  getUsername(): string | null {
    if (!this.username) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        this.username = JSON.parse(userInfo).username || null;
      }
    }
    return this.username;
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    return token ? this.jwtHelper.isTokenExpired(token) : true;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  logout(): void {
    this.token = null;
    this.roles = [];
    this.userId = null;
    this.isUserReadySubject.next(true); // Émettre TRUE pour indiquer un état stable (déconnecté)
    localStorage.removeItem('token');
    // ✅ NETTOYER LES REDIRECTIONS RÉSIDUELLES
  localStorage.removeItem('redirectAfterLogin');
  
  // Rediriger vers la page publique
  this.router.navigate(['/explorer']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return token ? !this.jwtHelper.isTokenExpired(token) : false;
  }

  isAdmin(): boolean {
    return this.getRoles().includes('ADMIN');
  }

   // Méthodes ajoutées
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
        // Mettre à jour les données locales après une modification réussie
        this.userId = updatedUser.id || this.userId;
        this.username = updatedUser.username || this.username;
        localStorage.setItem('userInfo', JSON.stringify({
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
    
    // Créez les deux observables pour les requêtes de mise à jour
    const userUpdate$ = this.http.put<User>(this.userUpdateUrl, userData, { headers }).pipe(
      map(() => true), // Si la requête réussit, émet true
      catchError(err => {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', err);
        return of(false); // Si la requête échoue, émet false
      })
    );
    
    const memberUpdate$ = this.http.put<any>(this.memberUpdateUrl, memberData, { headers }).pipe(
      map(() => true), // Si la requête réussit, émet true
      catchError(err => {
        console.error('Erreur lors de la mise à jour du membre:', err);
        return of(false); // Si la requête échoue, émet false
      })
    );

    // Utilisez forkJoin pour attendre la fin des deux observables
    return forkJoin({
      userUpdated: userUpdate$,
      memberUpdated: memberUpdate$
    });
  }
 getCurrentRole(): string | null {
    if (!this.currentRole) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        this.currentRole = JSON.parse(userInfo).currentRole || this.getRoles()[0] || null;
      } else {
        this.currentRole = this.getRoles()[0] || null;
      }
    }
    return this.currentRole;
  }

  setCurrentRole(role: string): void {
    if (this.getRoles().includes(role)) {
      this.currentRole = role;
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const userData = JSON.parse(userInfo);
        userData.currentRole = role;
        localStorage.setItem('userInfo', JSON.stringify(userData));
      }
    }
  }

  getUser(): any {
    const userInfo = localStorage.getItem('userInfo');
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

  async checkIn(id:number): Promise<{ success: boolean; message: string }> {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const data = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        equipe: id,
      };
      console.log('Données envoyées:', data);

      const response = await this.http.post<{ message: string }>(this.apiCheck, data).toPromise();
      console.log('Réponse complète:', response);
      return { success: true, message:  'Présence enregistrée avec succès' };
    } catch (error: any) {
      console.error('Erreur API détaillée:', error);
      let errorMessage = 'Erreur : Une erreur inattendue est survenue.';
      if (error.status) {
        // Erreur HTTP avec un corps JSON
        errorMessage = error.error?.message || `Erreur ${error.status}: ${error.statusText}`;
      } else if (error.message) {
        // Erreur non HTTP (ex. réseau)
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
}
