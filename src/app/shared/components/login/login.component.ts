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
import { PushNotificationService } from '../../../core/services/push-notification.service';

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
    private snack: MatSnackBar,
    private pushService: PushNotificationService 
  ) {
    this.loginForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.isLoading = false;
    this.clearError();
    
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
    }
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  submit(): void {
    if (!this.loginForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.clearError();

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => { this.handleSuccessfulLogin(); },
      error: (err) => { this.handleLoginError(err); }
    });
  }

  openForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  clearError(): void {
    this.errorMessage = '';
  }

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

  private redirectBasedOnRole(): void {
    // 1. Lire returnUrl depuis les queryParams de l'URL
    let returnUrl = this.route.snapshot.queryParams['returnUrl'];

    // 2. Fallback sessionStorage — mis par concours-public ou signup
    //    quand le signup redirige vers /login sans passer le returnUrl
    if (!returnUrl) {
      returnUrl = sessionStorage.getItem('concours_returnUrl') ?? null;
    }

    this.isLoading = false;

    // 3. Si returnUrl trouvé → y aller directement
    if (returnUrl) {
      sessionStorage.removeItem('concours_returnUrl'); // nettoyage
      this.router.navigateByUrl(returnUrl);
      return;
    }

    // 4. Sinon, redirection par rôle
    const roles = this.authService.getRoles();

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

  private handleLoginError(err: any): void {
    console.log('Erreur de connexion:', JSON.stringify(err));
    this.isLoading = false;

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

  private setErrorMessage(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      if (this.errorMessage === message) this.clearError();
    }, 10000);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  hasFieldError(fieldName: string, errorType?: string): boolean {
    const field = this.loginForm.get(fieldName);
    if (!field) return false;
    if (errorType) return field.hasError(errorType) && (field.dirty || field.touched);
    return field.invalid && (field.dirty || field.touched);
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';
    if (field.errors['required'])
      return fieldName === 'username' ? 'L\'email est requis' : 'Le mot de passe est requis';
    if (field.errors['email']) return 'Format d\'email invalide';
    if (field.errors['minlength'])
      return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    return 'Champ invalide';
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.isLoading) this.submit();
  }
}