import { Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select'; // Pour mat-select
import { MatFormFieldModule } from '@angular/material/form-field'; // Pour mat-form-field
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { MatDialog } from '@angular/material/dialog';
import { ProfilEditComponent } from '../profil-edit/profil-edit.component';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    RouterModule,
    MatSelectModule,
    MatFormFieldModule,
    NavbarComponent,
     MatMenuModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isAdmin: boolean = true;
  isResponsable: boolean = true;
  roles: string[] = []; // Exemple de rôles, à remplir via authService
  selectedRole: string = '';
  authService: any; // Remplacez par le type correct de votre AuthService
  userProfileImage: string | null = null;
  user: any = null;

  constructor(authService: AuthService, private router: Router, private dialog: MatDialog) {
    this.authService = authService;
    // Simuler la récupération des rôles (à remplacer par la logique réelle)
    this.roles = this.authService.getRoles() || ['ADMIN', 'RESPONSABLE'];
    this.selectedRole = this.roles[0] || '';
       this.navigateToRole(this.selectedRole);
    this.updateRoleVisibility();
  }
  

  toggleSidenav(): void {
    this.sidenav.toggle();
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

  changeRole(role: string): void {
    this.selectedRole = role;
    this.updateRoleVisibility();
    // Logique pour changer de rôle (par exemple, recharger les permissions)
    console.log('Rôle changé à:', role);
  }

  logout(): void {
    this.authService.logout(); // Implémentez cette méthode dans authService
    // Rediriger vers la page de login après déconnexion
    window.location.href = '/login';
  }

  private updateRoleVisibility(): void {
    this.isAdmin = this.selectedRole === 'ADMIN';
    this.isResponsable = this.selectedRole === 'RESPONSABLE';
  }

    loadUserData() {
    this.user = this.authService.getUser();
    this.userProfileImage = this.user?.profileImage || null;
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

  viewNotifications() {
    this.router.navigate(['/notifications']); // Rediriger vers la page des notifications
  }

  viewSettings() {
    this.router.navigate(['/settings']); // Rediriger vers la page des paramètres
  }



}