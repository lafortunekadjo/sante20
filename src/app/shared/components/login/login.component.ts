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
    return;
  }
 
  // FIX : charger les groupes + l'accès réel AVANT de décider la redirection
  this.authService.getMesGroupes().subscribe({
    next: () => this.redirectBasedOnRole(),
    error: () => this.redirectBasedOnRole() // fallback si erreur réseau
  });
}

 private redirectBasedOnRole(): void {
  let returnUrl = this.route.snapshot.queryParams['returnUrl'];
 
  if (!returnUrl) {
    returnUrl = sessionStorage.getItem('concours_returnUrl') ?? null;
  }
 
  this.isLoading = false;
 
  if (returnUrl) {
    sessionStorage.removeItem('concours_returnUrl');
    this.router.navigateByUrl(returnUrl);
    return;
  }
 
  const roles = this.authService.getRoles();
 
  // ADMIN et PARTENAIRE/CANDIDAT restent des rôles GLOBAUX —
  // inchangé, basé sur le JWT
  if (roles.includes('ADMIN')) {
    this.router.navigate(['/admin']);
    return;
  }
  if (roles.includes('PARTENAIRE')) {
    this.router.navigate(['/partenaire/dashboard']);
    return;
  }
  if (roles.includes('CANDIDAT') && !roles.includes('MEMBRE')) {
    this.router.navigate(['/explorer']);
    return;
  }
 
  // FIX : RESPONSABLE est maintenant déterminé PAR GROUPE ACTIF,
  // pas par le JWT global. isResponsable() lit groupeActifAccess
  // (peuplé par getMesGroupes() appelé juste avant ce point).
  if (this.authService.isResponsable()) {
    this.router.navigate(['/responsable']);
    return;
  }
 
  if (roles.includes('MEMBRE')) {
    this.router.navigate(['/membre2']);
    return;
  }
 
  this.authService.logout();
  this.setErrorMessage('Compte non autorisé.');
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