// src/app/shared/components/navbar/navbar.component.ts

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
import { ProfileImageEditDialogComponent } from '../profile-image-edit-dialog/profile-image-edit-dialog.component';
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
import { filter } from 'rxjs/operators';

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
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  @Output() toggleMenu = new EventEmitter<void>();
  
  roles: string[] = [];
  selectedRole: string | null = null;
  userProfileImage: SafeUrl | string | null = null;
  user: any = null;
  isChecking = false;
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
    private router: Router, 
    private dialog: MatDialog, 
    private equipeService: GeneralService
  ) {
    console.log('==========================================');
    console.log('📍 NavbarComponent Constructor');
    console.log('Current route:', this.router.url);
    console.log('==========================================');

    // ✅ CORRECTION : Ne PAS appeler navigateToRole() automatiquement
    this.roles = this.authService.getRoles();
    if (this.roles.length > 0) {
      this.selectedRole = this.roles[0];
      // ❌ SUPPRIMER CETTE LIGNE :
      // this.navigateToRole(this.selectedRole);
      
      // ✅ À la place, juste définir le rôle sélectionné
      console.log('Selected role:', this.selectedRole);
    }
  }

  ngOnInit() {
    console.log('==========================================');
    console.log('📍 NavbarComponent ngOnInit');
    console.log('Current route:', this.router.url);
    console.log('==========================================');

    this.loadUserData();
    this.roles = this.authService.getRoles() || [];
    this.selectedRole = this.authService.getCurrentRole() || this.roles[0] || '';

    // Écouter les changements de route pour mettre à jour l'UI
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
      console.log('Route changed in navbar:', this.currentRoute);
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
  
  loadUserData() {
    this.user = this.authService.getUser();
    if (this.user && this.user.userId) {
      this.userProfileImage = this.authService.getProfilePhoto2().subscribe(
        (url: SafeUrl) => {
          this.userProfileImage = url;
        },
        (error) => {
          console.error('Erreur lors du chargement de la photo de profil:', error);
          this.userProfileImage = null;
        }
      );
    } else {
      this.userProfileImage = null;
    }
  }
  
  openPasswordEdit() {
    this.dialog.open(PasswordResetDialogComponent);
  }

  openProfileEdit() {
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

  openProfileImageEdit(): void {
    const dialogRef = this.dialog.open(ProfileImageEditDialogComponent, {
      width: '400px',
      data: { user: this.user }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(this.user)
      if (result && this.user && this.user.userId) {
        this.authService.uploadProfilePhoto(this.user.userId, result).subscribe(
          () => {
            console.log('Photo de profil téléchargée avec succès.');
            this.loadUserData();
          },
          (error) => {
            console.error('Erreur lors du téléchargement de la photo:', error);
          }
        );
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.user && this.user.id) {
        this.authService.uploadProfilePhoto(this.user.id, file).subscribe(
          () => {
            console.log('Photo de profil téléchargée avec succès.');
            this.loadUserData();
          },
          (error) => {
            console.error('Erreur lors du téléchargement de la photo:', error);
          }
        );
      }
    }
  }

  viewNotifications() {
    this.router.navigate(['/notifications']);
  }

  viewSettings() {
    this.router.navigate(['/settings']);
  }

  /**
   * ✅ CORRECTION : Cette méthode doit être appelée MANUELLEMENT
   * par un bouton ou un changement de sélection dans le menu
   * PAS automatiquement au chargement !
   */
  changeRole(role: string) {
    console.log('Changing role to:', role);
    this.selectedRole = role;
    this.navigateToRole(role);
  }

  /**
   * Navigation vers le dashboard selon le rôle
   * Cette méthode doit être appelée UNIQUEMENT quand l'utilisateur
   * clique sur un bouton ou change de rôle manuellement
   */
  navigateToRole(role: string) {
    console.log('Navigating to role:', role);
    
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

  /**
   * ✅ NOUVELLE MÉTHODE : Obtenir le lien du dashboard
   * (pour l'utiliser avec routerLink dans le template)
   */
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

  logout() {
    this.authService.logout();
  }

  async checkIn() {
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
        width: '500px',
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

      const selectedEquipe = await dialogRef.afterClosed().toPromise();

      if (!selectedEquipe) {
        this.isChecking = false;
        this.error = 'Check-in annulé : aucune équipe sélectionnée.';
        return;
      }

      const result = await this.authService.checkIn(selectedEquipe.id);
      this.isChecking = false;

      const confirmRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '90vw',
        panelClass: 'scrollable-dialog',
        data: { message: result.message }
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