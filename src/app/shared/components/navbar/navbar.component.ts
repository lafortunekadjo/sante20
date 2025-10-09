import { Component, EventEmitter, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
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
import { EquipeSelectionDialogComponent } from '../equipe-selection-dialog/equipe-selection-dialog.component';
import { GeneralService } from '../../../core/services/general.service';
import { MembreService } from '../../../core/services/membre.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule,MatProgressSpinnerModule, MatButtonModule, MatFormFieldModule, MatSelectModule,CommonModule, MatIconModule, MatMenuModule, CommonModule,

    MatSidenavModule,
 
    MatListModule,
    RouterModule,
 ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  @Output() toggleMenu = new EventEmitter<void>();
  
  roles: string[] = [];
  selectedRole: string | null = null;
  userProfileImage: SafeUrl | string | null = null;
  user: any = null;
  isChecking = false;
  success = false;
  error = '';
  isMobile = false;


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
          this.userProfileImage = null;
        }
      );
    } else {
      // Si l'utilisateur n'est pas connecté ou n'a pas d'ID, on affiche l'image par défaut
      this.userProfileImage = null;
    }
  }
  
  openPasswordEdit(){
    this.dialog.open(PasswordResetDialogComponent);
  }

  openProfileEdit() {
    const dialogRef = this.dialog.open(ProfilEditComponent, {
      width: '600px',
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

  constructor(public authService: AuthService,public memberService: MembreService, private router: Router, private dialog: MatDialog, private equipeService: GeneralService) {
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

  //   toggleSidenav() {
  //   if (this.sidenav) {
  //     this.sidenav.toggle();
  //   }
  // }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

async checkIn() {
  this.isChecking = true;
  this.error = '';
  this.success = false;

  try {
    // 1. Récupérer les équipes
    const equipes = await this.equipeService.getEquipesByGroupe().toPromise();

    // 2. Récupérer l'équipe du membre (par défaut)
    const userId: number | null = this.authService.getUserId();

if (userId === null) {
  this.isChecking = false;
  this.error = 'Utilisateur non authentifié ou ID introuvable.';
  return;
}

const membre = await this.memberService.getMembreByUserId(userId).toPromise();

    const membreEquipeId = membre?.equipe?.id ?? null;

    // 3. Ouvrir le dialog de sélection d’équipe
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

    // 4. Appeler le checkIn avec l’équipe choisie
    const result = await this.authService.checkIn(selectedEquipe.id);
    this.isChecking = false;

    // 5. Afficher le message de confirmation
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

  } catch (err:any) {
    this.isChecking = false;
    this.error = 'Erreur lors du check-in : ' + (err.message || 'inconnue');
    console.error(err);
  }
}




}
