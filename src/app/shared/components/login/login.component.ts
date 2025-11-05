// src/app/shared/components/login/login.component.ts

import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { PasswordResetDialogComponent } from '../password-reset-dialog/password-reset-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatSnackBarModule,
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  isLoading = false;
  returnUrl: string | null = null;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('LoginComponent initialized');
    
    // ✅ Récupérer l'URL de retour depuis les query params (vient du RoleGuard)
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
    console.log('Return URL from query params:', this.returnUrl);
    
    // ❌ NE PAS utiliser localStorage pour la redirection
    // Supprimer toute valeur résiduelle
    localStorage.removeItem('redirectAfterLogin');
    
    this.isLoading = false;
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs', 'OK', {
        duration: 3000
      });
      return;
    }

    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    
    this.authService.login(username, password).subscribe({
      next: (response) => {
        console.log('✅ Login successful');
        
        // Vérifier si un reset de mot de passe est requis
        if (this.authService.isPasswordResetRequired()) {
          console.log('⚠️ Password reset required');
          this.dialog.open(PasswordResetDialogComponent);
          this.isLoading = false;
          return;
        }

        const roles = this.authService.getRoles();
        console.log('User roles:', roles);
        
        // Déterminer la destination
        const destination = this.getRedirectDestination(roles);
        console.log('🔄 Redirecting to:', destination);
        
        this.isLoading = false;
        this.router.navigate([destination]);
      },
      error: (err) => {
        console.error('❌ Login error:', err);
        this.isLoading = false;
        
        const errorMessage = err.error?.message || 'Échec de la connexion. Vérifiez vos identifiants.';
        this.snackBar.open(errorMessage, 'OK', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  /**
   * Déterminer la destination de redirection après login
   */
  private getRedirectDestination(roles: string[]): string {
    // 1. PRIORITÉ: Si on vient d'une redirection du guard, retourner à cette page
    if (this.returnUrl && this.returnUrl !== '/login') {
      console.log('Using return URL:', this.returnUrl);
      return this.returnUrl;
    }

    // 2. Sinon, rediriger selon le rôle par ordre de priorité
    if (roles.includes('ROLE_ADMIN')) {
      return '/admin';
    } else if (roles.includes('ROLE_RESPONSABLE')) {
      return '/responsable';
    } else if (roles.includes('ROLE_MEMBRE')) {
      return '/membre2';
    } else if (roles.includes('ROLE_CANDIDAT')) {
      return '/mes-demandes';
    }

    // 3. Par défaut
    return '/explorer';
  }

  /**
   * Naviguer vers la page d'inscription
   */
  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  /**
   * Naviguer vers l'explorateur public
   */
  goToExplorer(): void {
    this.router.navigate(['/explorer-public']);
  }
}