import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap , switchMap, throwError, catchError, map, forkJoin, of} from 'rxjs';
import { environment } from '../../environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../models/user';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Geolocation } from '@capacitor/geolocation';
import { Membre } from '../models/membre.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
 

 private jwtHelper = new JwtHelperService();
   private token: string | null = null;
  private roles: string[] = [];
  private userId: number | null = null;
  private apiUrl = `${environment.apiUrl}/auth/login`; 
  private apiCheck = `${environment.apiUrl}/presences/check-in`; 
  private userInfoUrl = `${environment.apiUrl}/auth/me`;
  private userUpdateUrl = `${environment.apiUrl}/user`;
  private memberUpdateUrl = `${environment.apiUrl}/membres`;
  username: any;
  private passwordResetRequired: boolean = false;
  private currentRole: string | null = null;

  constructor(private http: HttpClient,private sanitizer: DomSanitizer) {}

 login(username: string, password: string): Observable<any> {
  // 1. Appel pour obtenir le token
  return this.http.post<any>(this.apiUrl, { username, password }).pipe(
    // Récupérer et stocker le token
    tap(response => {
      if (response && response.token) {
        this.token = response.token;
        localStorage.setItem('token', response.token);
      }
    }),
    // 2. Utiliser le token pour obtenir les informations de l'utilisateur
    switchMap(response => {
      // Vérifier si le token a bien été reçu avant de continuer
      if (!response || !response.token) {
        return throwError(() => new Error('Connexion échouée : pas de token reçu.'));
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${response.token}`
      });
      return this.http.get<any>(this.userInfoUrl, { headers });
    }),
    // 3. Traiter les informations utilisateur
    tap(userInfo => {
      console.log('Informations utilisateur:', userInfo);
      // S'assurer que les propriétés existent avant de les assigner
      this.userId = userInfo.id || null;
      this.passwordResetRequired = userInfo.passwordResetRequired
      this.roles = userInfo.roles || [];
      this.username = userInfo.username || null;
      this.currentRole = this.roles.length > 0 ? this.roles[0] : null;
      // Stocker toutes les informations en une seule fois dans le localStorage
      localStorage.setItem('userInfo', JSON.stringify({
        userId: this.userId,
        roles: this.roles,
        username: this.username
      }));
    })
  );
}

  // Vérifier si l'utilisateur a besoin de réinitialiser son mot de passe
  isPasswordResetRequired(): boolean {
    // Ceci devrait venir d'une propriété de votre objet utilisateur
    return this.passwordResetRequired;
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('token');
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
    localStorage.removeItem('token');
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

  async checkIn(): Promise<{ success: boolean; message: string }> {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const data = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
      };
      console.log('Données envoyées:', data);

      const response = await this.http.post<{ message: string }>(this.apiCheck, data).toPromise();
      console.log('Réponse complète:', response);
      return { success: true, message:  'Présence enregistrée avec succès' };
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
}


