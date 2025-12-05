import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ProfilEditComponent } from '../profil-edit/profil-edit.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SafeUrl } from '@angular/platform-browser';
import { ProfileImageEditDialogComponent, ProfileImageDialogResult } from '../profile-image-edit-dialog/profile-image-edit-dialog.component';
import { PasswordResetDialogComponent } from '../password-reset-dialog/password-reset-dialog.component';
import { Geolocation } from '@capacitor/geolocation';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { EquipeSelectionDialogComponent } from '../equipe-selection-dialog/equipe-selection-dialog.component';
import { GeneralService } from '../../../core/services/general.service';
import { MembreService } from '../../../core/services/membre.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Language, TranslateModule } from '@ngx-translate/core';
import { SettingsService, Theme } from '../../../core/services/settings.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { filter, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatProgressSpinnerModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatSelectModule,
    CommonModule, 
    MatIconModule, 
    MatMenuModule, 
    CommonModule,
    MatSidenavModule,
    MatListModule,
    RouterModule,
    TranslateModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  @Output() toggleMenu = new EventEmitter<void>();
  
  roles: string[] = [];
  selectedRole: string | null = null;
  userProfileImage: string | null = null;
  user: any = null;
  isChecking = false;
  isUploadingPhoto = false;
  success = false;
  error = '';
  isMobile = false;
  currentTheme: Theme = 'light';
  currentLanguage: Language = 'fr';
  currentRoute: string = '';

  constructor(
    public authService: AuthService,
    private settingsService: SettingsService,
    public memberService: MembreService, 
    public router: Router, 
    private dialog: MatDialog, 
    private equipeService: GeneralService,
    private snackBar: MatSnackBar
  ) {
    this.roles = this.authService.getRoles();
    if (this.roles.length > 0) {
      this.selectedRole = this.roles[0];
    }
  }

  ngOnInit() {
    this.loadUserData();
    this.roles = this.authService.getRoles() || [];
    this.selectedRole = this.authService.getCurrentRole() || this.roles[0] || '';

    // Écouter les changements de route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });

    // Charger les paramètres actuels
    this.currentTheme = this.settingsService.getTheme();
    this.currentLanguage = this.settingsService.getLanguage();

    // S'abonner aux changements
    this.settingsService.settings$.subscribe(settings => {
      this.currentTheme = settings.theme;
      this.currentLanguage = settings.language;
    });
  }
  
  /**
   * Charge les données utilisateur et la photo de profil
   */
  loadUserData(): void {
    this.user = this.authService.getUser();
    this.loadProfilePhoto();
  }

  /**
   * Charge la photo de profil depuis le localStorage ou le service
   */
  loadProfilePhoto(): void {
    const storedUrl = localStorage.getItem('profilUrl');
    
    if (storedUrl) {
      this.userProfileImage = this.getFullImageUrl(storedUrl);
    } else {
      // Fallback : charger via le service
      this.authService.getProfilePhoto2().subscribe({
        next: (url: SafeUrl) => {
          this.userProfileImage = url as string;
        },
        error: (error) => {
          console.error('Erreur lors du chargement de la photo de profil:', error);
          this.userProfileImage = null;
        }
      });
    }
  }

  /**
   * Retourne l'URL complète de l'image
   */
  getFullImageUrl(url: string): string {
    if (!url) return '';
    
    // Si c'est déjà une URL complète (Cloudinary)
    if (url.startsWith('http')) {
      return url;
    }
    
    // Sinon, c'est un chemin relatif (ancien format) - ne devrait plus arriver avec Cloudinary
    return url;
  }
  
  openPasswordEdit(): void {
    this.dialog.open(PasswordResetDialogComponent);
  }

  openProfileEdit(): void {
    const dialogRef = this.dialog.open(ProfilEditComponent, {
      width: '600px',
      data: { user: this.user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUserData();
      }
    });
  }

  /**
   * Ouvre le dialog d'édition de photo de profil
   */
  openProfileImageEdit(): void {
    const dialogRef = this.dialog.open(ProfileImageEditDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      disableClose: true,
      data: {
        currentImageUrl: this.userProfileImage,
        userId: this.user?.userId
      }
    });

    dialogRef.afterClosed().subscribe((result: ProfileImageDialogResult | undefined) => {
      if (result && result.file && this.user?.userId) {
        this.uploadProfilePhoto(result.file, result.previewUrl);
      }
    });
  }

  /**
   * Upload la photo de profil vers le serveur
   */
  uploadProfilePhoto(file: File, previewUrl: string): void {
    if (!this.user?.userId) {
      this.snackBar.open('Erreur : utilisateur non identifié', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    this.isUploadingPhoto = true;
    
    // Mise à jour immédiate de l'affichage avec la prévisualisation
    const previousImage = this.userProfileImage;
    this.userProfileImage = previewUrl;

    this.authService.uploadProfilePhoto(this.user.userId, file).pipe(
      finalize(() => this.isUploadingPhoto = false)
    ).subscribe({
      next: (response: any) => {
        // Extraire l'URL du message de réponse
        let serverUrl = this.extractUrlFromResponse(response);
        
        if (serverUrl) {
          this.userProfileImage = serverUrl;
          localStorage.setItem('profilUrl', serverUrl);
        }
        
        this.snackBar.open('Photo de profil mise à jour avec succès !', 'Fermer', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        console.error('Erreur lors de l\'upload:', err);
        
        // Restaurer l'ancienne photo en cas d'erreur
        this.userProfileImage = previousImage;
        
        this.snackBar.open('Erreur lors de la mise à jour de la photo', 'Fermer', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  /**
   * Extrait l'URL Cloudinary de la réponse du serveur
   */
  private extractUrlFromResponse(response: any): string | null {
    if (!response) return null;

    // Si la réponse contient directement une URL
    if (response.url && response.url.startsWith('http')) {
      return response.url;
    }

    // Si l'URL est dans le message (format: "... URL: https://...")
    if (response.message && typeof response.message === 'string') {
      const urlMatch = response.message.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        return urlMatch[0];
      }
    }

    // Si la réponse est une chaîne directe
    if (typeof response === 'string' && response.startsWith('http')) {
      return response;
    }

    return null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.user && this.user.userId) {
        // Créer une prévisualisation
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewUrl = e.target?.result as string;
          this.uploadProfilePhoto(file, previewUrl);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  viewNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  viewSettings(): void {
    this.router.navigate(['/settings']);
  }

  changeRole(role: string): void {
    this.selectedRole = role;
    this.navigateToRole(role);
  }

  navigateToRole(role: string): void {
    if (role === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else if (role === 'RESPONSABLE') {
      this.router.navigate(['/responsable']);
    } else if (role === 'MEMBRE') {
      this.router.navigate(['/membre']);
    } else if (role === 'CANDIDAT') {
      this.router.navigate(['/mes-demandes']);
    }
  }

  getDashboardRoute(): string {
    if (this.selectedRole === 'ADMIN') {
      return '/admin';
    } else if (this.selectedRole === 'RESPONSABLE') {
      return '/responsable';
    } else if (this.selectedRole === 'MEMBRE') {
      return '/membre';
    } else if (this.selectedRole === 'CANDIDAT') {
      return '/mes-demandes';
    }
    return '/explorer';
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'ADMIN':
      case 'ROLE_ADMIN':
        return 'admin_panel_settings';
      case 'RESPONSABLE':
      case 'ROLE_RESPONSABLE':
        return 'supervisor_account';
      case 'MEMBRE':
      case 'ROLE_MEMBRE':
        return 'person';
      case 'CANDIDAT':
      case 'ROLE_CANDIDAT':
        return 'person_add';
      default:
        return 'person';
    }
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'ADMIN':
      case 'ROLE_ADMIN':
        return 'Administrateur';
      case 'RESPONSABLE':
      case 'ROLE_RESPONSABLE':
        return 'Responsable';
      case 'MEMBRE':
      case 'ROLE_MEMBRE':
        return 'Membre';
      case 'CANDIDAT':
      case 'ROLE_CANDIDAT':
        return 'Candidat';
      default:
        return role;
    }
  }

  logout(): void {
    this.authService.logout();
  }
async checkIn(): Promise<void> {
  this.isChecking = true;
  this.error = '';
  this.success = false;

  try {
    const equipes = await this.equipeService.getEquipesByGroupe().toPromise();
    const userId: number | null = this.authService.getUserId();

    if (userId === null) {
      this.isChecking = false;
      this.error = 'Utilisateur non authentifié ou ID introuvable.';
      return;
    }

    const membre = await this.memberService.getMembreByUserId(userId).toPromise();
    const membreEquipeId = membre?.equipe?.id ?? null;

    const dialogRef = this.dialog.open(EquipeSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '500px',
      data: {
        equipes,
        defaultEquipeId: membreEquipeId,
        joueur: {
          id: membre?.id,
          nom: membre?.nom,
          prenom: membre?.prenom
        }
      }
    });

    const checkInResult = await dialogRef.afterClosed().toPromise();

    if (!checkInResult) {
      this.isChecking = false;
      this.error = 'Check-in annulé.';
      return;
    }

    // Appel du service avec l'équipe sélectionnée (peut être null)
    const result = await this.authService.checkIn(
      checkInResult.equipe?.id || null,
      checkInResult.hasPlayed
    );
    
    this.isChecking = false;

    const confirmRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '90vw',
      maxWidth: '400px',
      panelClass: 'scrollable-dialog',
      data: { 
        message: checkInResult.hasPlayed 
          ? result.message 
          : 'Votre présence a été enregistrée. Vous n\'avez pas participé au match.'
      }
    });

    confirmRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.success = result.success;
      } else {
        this.error = result.success ? '' : result.message;
      }
    });

  } catch (err: any) {
    this.isChecking = false;
    this.error = 'Erreur lors du check-in : ' + (err.message || 'inconnue');
    console.error(err);
  }
}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/signup']);
  }

  toggleLanguage(): void {
    this.settingsService.toggleLanguage();
  }

  getLanguageLabel(): string {
    return this.currentLanguage === 'fr' ? '🇫🇷' : '🇬🇧';
  }

  getLanguageTooltip(): string {
    return this.currentLanguage === 'fr' ? 'Passer en anglais' : 'Switch to French';
  }

  toggleTheme(): void {
    this.settingsService.toggleTheme();
  }

  getThemeIcon(): string {
    switch (this.currentTheme) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'auto':
        return 'brightness_auto';
      default:
        return 'light_mode';
    }
  }

  getThemeTooltip(): string {
    switch (this.currentTheme) {
      case 'light':
        return 'Passer en mode sombre';
      case 'dark':
        return 'Passer en mode clair';
      case 'auto':
        return 'Mode automatique';
      default:
        return 'Changer le thème';
    }
  }
}