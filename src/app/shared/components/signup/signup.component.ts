import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { MembreService } from '../../../core/services/membre.service';
import { MatStepperModule } from '@angular/material/stepper';

function confirmPasswordValidator(group: FormGroup) {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatCheckboxModule,
    MatProgressSpinnerModule, MatSnackBarModule, TranslateModule, MatStepperModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  accountForm: FormGroup;
  profileForm: FormGroup;
  returnUrl: string | null = null;

  isLoading = false;
  currentStep: 1 | 2 = 1;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage = '';

  maxDate = new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate());

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private membreService: MembreService
  ) {
    this.accountForm = this.initializeAccountForm();
    this.profileForm = this.initializeProfileForm();
  }

  ngOnInit(): void {
    // Lire le returnUrl depuis (1) queryParams, (2) sessionStorage en fallback
    this.returnUrl = this.route.snapshot.queryParams['returnUrl']
                     || sessionStorage.getItem('concours_returnUrl')
                     || null;
    this.clearError();
  }

  private initializeAccountForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern('^[a-zA-Z0-9._-]+$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{6,}$')]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: confirmPasswordValidator });
  }

  private initializeProfileForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: ['', [Validators.minLength(2), Validators.maxLength(50)]],
      dateNaissance: [''],
      sexe: ['', [Validators.required]],
      tel: ['', [Validators.required, Validators.pattern('^[0-9]{9,15}$')]],
      adresse: [''],
      accepteConditions: [false, [Validators.requiredTrue]]
    });
  }

  // ── Soumission ────────────────────────────────────────────────
 onSubmit(): void {
  if (this.accountForm.invalid || this.profileForm.invalid) return;
  this.isLoading = true;
 
  const profileData = {
    nom:           this.profileForm.value.nom,
    prenom:        this.profileForm.value.prenom,
    dateNaissance: this.profileForm.value.dateNaissance,
    sexe:          this.profileForm.value.sexe,
    tel:           this.profileForm.value.tel,
    adresse:       this.profileForm.value.adresse
  };
 
  const signupData: any = {
    username:   this.accountForm.value.username,
    email:      this.accountForm.value.email,
    motDePasse: this.accountForm.value.password,
    roles:      'ROLE_CANDIDAT',
    // Gardé pour rétrocompat (backend crée encore un Membre)
    membre:     { ...profileData },
    // NOUVEAU : données de profil centralisé (UserProfile)
    userProfile: { ...profileData }
  };
 
  this.authService.addUser(signupData).subscribe({
    next: (response) => {
      this.isLoading = false;
      if (response.success) {
        this.snackBar.open('Inscription réussie ! Vous pouvez vous connecter.', 'OK', {
          duration: 5000, panelClass: 'success-snackbar'
        });
        const queryParams: any = {};
        if (this.returnUrl) queryParams['returnUrl'] = this.returnUrl;
        this.router.navigate(['/login'], { queryParams });
      }
    },
    error: (err) => {
      this.isLoading = false;
      const message = err.error?.message || 'Erreur lors de l\'inscription';
      this.snackBar.open(message, 'Fermer', { duration: 5000, panelClass: 'error-snackbar' });
    }
  });
}
  // ── Vérifications async ───────────────────────────────────────
  checkUsername(): void {
    const username = this.accountForm.get('username')?.value;
    if (username && username.length >= 3) {
      this.authService.checkUsernameAvailability(username).subscribe({
        next: (res) => { if (!res.available) this.accountForm.get('username')?.setErrors({ taken: true }); }
      });
    }
  }

  checkEmail(): void {
    const email = this.accountForm.get('email')?.value;
    if (email && this.accountForm.get('email')?.valid) {
      this.authService.checkEmailAvailability(email).subscribe({
        next: (res) => { if (!res.available) this.accountForm.get('email')?.setErrors({ taken: true }); }
      });
    }
  }

  // ── Connexion automatique après signup (méthode alternative) ──
  private handleSignupSuccess(response: any): void {
    this.snackBar.open('Compte créé avec succès ! Bienvenue !', 'Fermer', { duration: 4000 });

    this.authService.login(
      this.accountForm.value.username,
      this.accountForm.value.password
    ).subscribe({
      next: () => { this.redirectAfterLogin(); },
      error: () => {
        this.isLoading = false;
        // ── FIX : passer le returnUrl même en cas d'erreur de connexion auto
        const queryParams: any = { message: 'Compte créé ! Veuillez vous connecter.' };
        if (this.returnUrl) queryParams['returnUrl'] = this.returnUrl;
        this.router.navigate(['/login'], { queryParams });
      }
    });
  }

  private redirectAfterLogin(): void {
    this.isLoading = false;

    // Nettoyer le sessionStorage après utilisation
    sessionStorage.removeItem('concours_returnUrl');

    // Priorité 1 : localStorage (ancienne logique)
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin');
      this.router.navigateByUrl(redirectUrl);
      return;
    }

    // Priorité 2 : returnUrl (concours ou autre)
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    // Priorité 3 : redirection par rôle
    const roles = this.authService.getRoles();
    if (roles.includes('ADMIN'))           this.router.navigate(['/admin']);
    else if (roles.includes('RESPONSABLE')) this.router.navigate(['/responsable']);
    else if (roles.includes('MEMBRE') || roles.includes('CANDIDAT')) this.router.navigate(['/membre2']);
    else this.router.navigate(['/dashboard']);
  }

  // ── Gestion erreurs ───────────────────────────────────────────
  private handleSignupError(err: any): void {
    this.isLoading = false;
    let errorMessage = 'Erreur lors de l\'inscription';

    if (err.status === 409) {
      if (err.error?.message?.includes('email'))    errorMessage = 'Cette adresse email est déjà utilisée';
      else if (err.error?.message?.includes('username')) errorMessage = 'Ce nom d\'utilisateur est déjà pris';
      else errorMessage = 'Ce nom d\'utilisateur ou cet email existe déjà';
    } else if (err.status === 400) {
      errorMessage = 'Données invalides. Veuillez vérifier vos informations';
    } else if (err.status === 0) {
      errorMessage = 'Problème de connexion. Vérifiez votre connexion internet';
    } else if (err.error?.message) {
      errorMessage = err.error.message;
    }

    this.setErrorMessage(errorMessage);
    this.snackBar.open(errorMessage, 'Fermer', { duration: 5000, panelClass: ['error-snackbar'] });
  }

  private setErrorMessage(message: string): void {
    this.errorMessage = message;
    setTimeout(() => { if (this.errorMessage === message) this.clearError(); }, 10000);
  }

  clearError(): void { this.errorMessage = ''; }

  // ── Helpers template ──────────────────────────────────────────
  getErrorMessage(formName: 'account' | 'profile', fieldName: string): string {
    const form = formName === 'account' ? this.accountForm : this.profileForm;
    const field = form.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const messages: Record<string, Record<string, string>> = {
      username:         { required: 'Le nom d\'utilisateur est requis', minlength: 'Minimum 3 caractères', maxlength: 'Maximum 20 caractères', pattern: 'Lettres, chiffres, points, tirets et underscores uniquement' },
      email:            { required: 'L\'email est requis', email: 'Format d\'email invalide' },
      password:         { required: 'Le mot de passe est requis', minlength: 'Minimum 6 caractères', pattern: 'Doit contenir majuscule, minuscule et chiffre' },
      confirmPassword:  { required: 'La confirmation est requise' },
      nom:              { required: 'Le nom est requis', minlength: 'Minimum 2 caractères' },
      sexe:             { required: 'Le sexe est requis' },
      tel:              { required: 'Le téléphone est requis', pattern: 'Format invalide (9 à 15 chiffres)' },
      accepteConditions:{ required: 'Vous devez accepter les conditions' }
    };

    if (fieldName === 'confirmPassword' && this.accountForm.errors?.['passwordMismatch'])
      return 'Les mots de passe ne correspondent pas';

    for (const errorType in field.errors) {
      if (messages[fieldName]?.[errorType]) return messages[fieldName][errorType];
    }

    if (field.hasError('required'))   return 'Ce champ est requis';
    if (field.hasError('email'))      return 'Email invalide';
    if (field.hasError('minlength'))  return `Minimum ${field.errors?.['minlength'].requiredLength} caractères`;
    if (field.hasError('pattern'))    return fieldName === 'tel' ? 'Format de téléphone invalide' : 'Format invalide';
    return 'Champ invalide';
  }

  hasFieldError(formName: 'account' | 'profile', fieldName: string, errorType?: string): boolean {
    const form = formName === 'account' ? this.accountForm : this.profileForm;
    const field = form.get(fieldName);
    if (!field) return false;
    if (errorType) return field.hasError(errorType) && (field.dirty || field.touched);
    return field.invalid && (field.dirty || field.touched);
  }

  get passwordsMatch(): boolean {
    return this.accountForm.get('password')?.value === this.accountForm.get('confirmPassword')?.value;
  }

  getPasswordStrength(): number {
    const p = this.accountForm.get('password')?.value || '';
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 8) s++;
    if (/[a-z]/.test(p)) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const p = group.get('password')?.value;
    const cp = group.get('confirmPassword')?.value;
    return p === cp ? null : { passwordMismatch: true };
  }
}