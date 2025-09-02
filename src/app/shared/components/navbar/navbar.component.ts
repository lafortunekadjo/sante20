import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ProfilEditComponent } from '../profil-edit/profil-edit.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu'; //
import { SafeUrl } from '@angular/platform-browser';
import { ProfileImageEditDialogComponent } from '../profile-image-edit-dialog/profile-image-edit-dialog.component';
import { PasswordResetDialogComponent } from '../password-reset-dialog/password-reset-dialog.component';
import { Geolocation } from '@capacitor/geolocation';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatFormFieldModule, MatSelectModule,CommonModule, MatIconModule, MatMenuModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  
  roles: string[] = [];
  selectedRole: string | null = null;
  userProfileImage: SafeUrl | string | null = null;
  user: any = null;
  isChecking = false;
  success = false;
  error = '';


  ngOnInit() {
    this.loadUserData();
    this.roles = this.authService.getRoles() || [];
    this.selectedRole = this.authService.getCurrentRole() || this.roles[0] || '';
  }

  loadUserData() {
    this.user = this.authService.getUser();
   if (this.user && this.user.userId) {
      // Étape 2 : Appeler le service pour récupérer la photo de profil
      this.authService.getProfilePhoto(this.user.userId).subscribe(
        // En cas de succès, on reçoit une URL sécurisée (SafeUrl)
        (url: SafeUrl) => {
          this.userProfileImage = url;
        },
        // En cas d'erreur (par exemple, photo non trouvée), on peut utiliser une image par défaut
        (error) => {
          console.error('Erreur lors du chargement de la photo de profil:', error);
          this.userProfileImage = '../assets/default-profile.jpg';
        }
      );
    } else {
      // Si l'utilisateur n'est pas connecté ou n'a pas d'ID, on affiche l'image par défaut
      this.userProfileImage = '../assets/default-profile.jpg';
    }
  }
  
  openPasswordEdit(){
    this.dialog.open(PasswordResetDialogComponent);
  }

  openProfileEdit() {
    const dialogRef = this.dialog.open(ProfilEditComponent, {
      width: '400px',
      data: { user: this.user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUserData(); // Mettre à jour les données après modification
      }
    });
  }

 openProfileImageEdit(): void {
    const dialogRef = this.dialog.open(ProfileImageEditDialogComponent, {
      width: '400px',
      data: { user: this.user } // Facultatif : passe des données à la pop-up
    });

    dialogRef.afterClosed().subscribe(result => {
      // Le 'result' sera le fichier sélectionné si l'utilisateur a cliqué sur "Enregistrer"
      console.log(this.user)
      if (result && this.user && this.user.userId) {
        this.authService.uploadProfilePhoto(this.user.userId, result).subscribe(
          () => {
            console.log('Photo de profil téléchargée avec succès.');
            this.loadUserData(); // Rafraîchit l'image après le téléchargement
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
    this.router.navigate(['/notifications']); // Rediriger vers la page des notifications
  }

  viewSettings() {
    this.router.navigate(['/settings']); // Rediriger vers la page des paramètres
  }

  constructor(public authService: AuthService, private router: Router, private dialog: MatDialog,) {
    this.roles = this.authService.getRoles();
    if (this.roles.length > 0) {
      this.selectedRole = this.roles[0];
      this.navigateToRole(this.selectedRole);
    }
  }

  changeRole(role: string) {
    this.selectedRole = role;
    this.navigateToRole(role);
  }

  navigateToRole(role: string) {
    if (role === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else if (role === 'RESPONSABLE') {
      this.router.navigate(['/responsable']);
    } else if (role === 'MEMBRE') {
      this.router.navigate(['/membre2']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

async checkIn() {
    this.isChecking = true;
    this.error = '';
    this.success = false;

    const result = await this.authService.checkIn();
    this.isChecking = false;

    // Ouvrir le dialogue de confirmation avec le message
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: { message: result.message }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // Action si l'utilisateur confirme (ex. succès)
        this.success = result.success;
      } else {
        // Action si l'utilisateur annule (ex. erreur ou rien)
        this.error = result.success ? '' : result.message;
      }
    });
  }
}
