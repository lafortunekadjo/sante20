import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PasswordResetDialogComponent } from '../password-reset-dialog/password-reset-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  errorMessage = '';
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private route: ActivatedRoute,
    private router: Router, 
    private dialog: MatDialog,
  private translate: TranslateService,
  private snack: MatSnackBar
  ) {
    this.loginForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.isLoading = false;
    this.clearError();
    
    // Vérifier si l'utilisateur est déjà connecté
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
    }
  }

  /**
   * Initialise le formulaire de connexion avec validation
   */
  private initializeForm(): FormGroup {
    return this.fb.group({
      username: ['', [
        Validators.required,
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(3)
      ]]
    });
  }

  /**
   * Soumet le formulaire de connexion
   */
  submit(): void {
    if (!this.loginForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.clearError();

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        this.handleSuccessfulLogin();
      },
      error: (err) => {
        this.handleLoginError(err);
      }
    });
  }

  /**
   * Ouvre la boîte de dialogue de mot de passe oublié
   */
openForgotPassword(): void {
  // Redirige l'utilisateur vers ton nouveau composant de demande
  this.router.navigate(['/forgot-password']);
}
  /**
   * Efface le message d'erreur
   */
  clearError(): void {
    this.errorMessage = '';
  }

  /**
   * Gère une connexion réussie
   */
  private handleSuccessfulLogin(): void {
    if (this.authService.isPasswordResetRequired()) {
      this.dialog.open(PasswordResetDialogComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: true
      });
      this.isLoading = false;
    } else {
      this.redirectBasedOnRole();
    }
  }

  /**
   * Redirige l'utilisateur selon son rôle
   */
 private redirectBasedOnRole(): void {
    // 1. Récupérer l'URL de retour depuis les paramètres de la route
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    const roles = this.authService.getRoles();

    this.isLoading = false;

    // 2. Si une URL de retour existe, on y va directement
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    // 3. Sinon, logique par défaut basée sur les rôles
    if (roles.includes('ADMIN')) {
      this.router.navigate(['/admin']);
    } else if (roles.includes('RESPONSABLE')) {
      this.router.navigate(['/responsable']);
    } else if (roles.includes('MEMBRE')) {
      this.router.navigate(['/membre2']);
    } else if (roles.includes('CANDIDAT')) {
      this.router.navigate(['/explorer']);
    } else if (roles.includes('PARTENAIRE')) {
       this.router.navigate(['/partenaire/dashboard']);
    } else {
      this.authService.logout();
      this.setErrorMessage('Compte non autorisé.');
    }
}
  /**
   * Gère les erreurs de connexion
   */
  private handleLoginError(err: any): void {
    console.error('Erreur de connexion:', err);
    this.isLoading = false;

    // Gestion personnalisée des erreurs selon le code d'erreur
    if (err.status === 401) {
      this.setErrorMessage('Identifiants incorrects. Vérifiez votre email et mot de passe.');
    } else if (err.status === 403) {
      this.setErrorMessage('Accès refusé. Votre compte pourrait être désactivé.');
    } else if (err.status === 429) {
      this.setErrorMessage('Trop de tentatives. Veuillez patienter avant de réessayer.');
    } else if (err.status === 0) {
      this.setErrorMessage('Problème de connexion. Vérifiez votre connexion internet.');
    } else {
      this.setErrorMessage('Erreur de connexion. Veuillez réessayer plus tard.');
    }
  }

  /**
   * Définit un message d'erreur
   */
  private setErrorMessage(message: string): void {
    this.errorMessage = message;
    
    // Auto-effacement du message après 10 secondes
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.clearError();
      }
    }, 10000);
  }

  /**
   * Marque tous les champs du formulaire comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Vérifie si un champ spécifique a une erreur
   */
  hasFieldError(fieldName: string, errorType?: string): boolean {
    const field = this.loginForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Obtient le message d'erreur pour un champ
   */
  getFieldErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return fieldName === 'username' ? 'L\'email est requis' : 'Le mot de passe est requis';
    }
    if (field.errors['email']) {
      return 'Format d\'email invalide';
    }
    if (field.errors['minlength']) {
      return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    }

    return 'Champ invalide';
  }

  /**
   * Gère la touche Entrée pour soumettre le formulaire
   */
  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.isLoading) {
      this.submit();
    }
  }
}
