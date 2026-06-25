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
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { MembreService } from '../../../core/services/membre.service';

// Validator personnalisé pour la confirmation de mot de passe
function confirmPasswordValidator(group: FormGroup) {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  accountForm: FormGroup;
  profileForm: FormGroup;
  returnUrl: string | null = null;
  
  // États visuels
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage = '';
  
  // Date limite pour la date de naissance (18 ans minimum)
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
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
    this.clearError();
  }

  /**
   * Initialise le formulaire de compte (étape 1)
   */
  private initializeAccountForm(): FormGroup {
    return this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern('^[a-zA-Z0-9._-]+$')
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{6,}$')
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, { 
      validators: confirmPasswordValidator 
    });
  }

  /**
   * Initialise le formulaire de profil (étape 2)
   */
  private initializeProfileForm(): FormGroup {
    return this.fb.group({
      nom: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      prenom: ['', [
       
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      dateNaissance: ['', [
       
      ]],
      sexe: ['', [
        Validators.required
      ]],
      tel: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{9,15}$')
      ]],
      adresse: [''],
      accepteConditions: [false, [
        Validators.requiredTrue
      ]]
    });
  }

  /**
   * Soumet le formulaire complet
   */
 onSubmit(): void {
    if (this.accountForm.invalid || this.profileForm.invalid) {
      return;
    }

    this.isLoading = true;

    const signupData: any = {
      username: this.accountForm.value.username,
      email: this.accountForm.value.email,
      motDePasse: this.accountForm.value.password,
      roles: 'ROLE_CANDIDAT',
      membre: {
        nom: this.profileForm.value.nom,
        prenom: this.profileForm.value.prenom,
        dateNaissance: this.profileForm.value.dateNaissance,
        sexe: this.profileForm.value.sexe,
        tel: this.profileForm.value.tel,
        adresse: this.profileForm.value.adresse
      }
    };

    this.authService.addUser(signupData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.snackBar.open('Inscription réussie ! Vous pouvez vous connecter.', 'OK', {
            duration: 5000,
            panelClass: 'success-snackbar'
          });
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        const message = err.error?.message || 'Erreur lors de l\'inscription';
        this.snackBar.open(message, 'Fermer', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  // Vérification asynchrone du username
  checkUsername(): void {
    const username = this.accountForm.get('username')?.value;
    if (username && username.length >= 3) {
      this.authService.checkUsernameAvailability(username).subscribe({
        next: (res) => {
          if (!res.available) {
            this.accountForm.get('username')?.setErrors({ taken: true });
          }
        }
      });
    }
  }

  // Vérification asynchrone de l'email
  checkEmail(): void {
    const email = this.accountForm.get('email')?.value;
    if (email && this.accountForm.get('email')?.valid) {
      this.authService.checkEmailAvailability(email).subscribe({
        next: (res) => {
          if (!res.available) {
            this.accountForm.get('email')?.setErrors({ taken: true });
          }
        }
      });
    }
  }

  /**
   * Gère le succès de l'inscription
   */
  private handleSignupSuccess(response: any): void {
    this.snackBar.open('Compte créé avec succès ! Bienvenue !', 'Fermer', {
      duration: 4000
    });

    // Connexion automatique après inscription
    this.authService.login(
      this.accountForm.value.username,
      this.accountForm.value.password
    ).subscribe({
      next: () => {
        // Redirection intelligente
        this.redirectAfterLogin();
      },
      error: (err) => {
        console.error('Erreur connexion auto:', err);
        this.isLoading = false;
        this.router.navigate(['/login'], {
          queryParams: { 
            message: 'Compte créé ! Veuillez vous connecter.' 
          }
        });
      }
    });
  }

  /**
   * Gère la redirection après connexion
   */
  private redirectAfterLogin(): void {
    this.isLoading = false;
    
    // Vérifier s'il y a une redirection sauvegardée
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin');
      this.router.navigateByUrl(redirectUrl);
      return;
    }

    // Redirection selon le returnUrl ou par défaut
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      // Redirection selon les rôles
      const roles = this.authService.getRoles();
      if (roles.includes('ADMIN')) {
        this.router.navigate(['/admin']);
      } else if (roles.includes('RESPONSABLE')) {
        this.router.navigate(['/responsable']);
      } else if (roles.includes('MEMBRE') || roles.includes('CANDIDAT')) {
        this.router.navigate(['/membre2']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  /**
   * Gère les erreurs d'inscription
   */
  private handleSignupError(err: any): void {
    console.error('Erreur inscription:', err);
    this.isLoading = false;

    let errorMessage = 'Erreur lors de l\'inscription';
    
    // Gestion spécifique selon le type d'erreur
    if (err.status === 409) {
      if (err.error?.message?.includes('email')) {
        errorMessage = 'Cette adresse email est déjà utilisée';
        this.setErrorMessage(errorMessage);
      } else if (err.error?.message?.includes('username')) {
        errorMessage = 'Ce nom d\'utilisateur est déjà pris';
        this.setErrorMessage(errorMessage);
      } else {
        errorMessage = 'Ce nom d\'utilisateur ou cet email existe déjà';
        this.setErrorMessage(errorMessage);
      }
    } else if (err.status === 400) {
      errorMessage = 'Données invalides. Veuillez vérifier vos informations';
      this.setErrorMessage(errorMessage);
    } else if (err.status === 0) {
      errorMessage = 'Problème de connexion. Vérifiez votre connexion internet';
      this.setErrorMessage(errorMessage);
    } else if (err.error?.message) {
      errorMessage = err.error.message;
      this.setErrorMessage(errorMessage);
    } else {
      this.setErrorMessage(errorMessage);
    }

    // Afficher aussi dans le snackbar pour plus de visibilité
    this.snackBar.open(errorMessage, 'Fermer', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
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
   * Efface le message d'erreur
   */
  clearError(): void {
    this.errorMessage = '';
  }

  /**
   * Obtient le message d'erreur pour un champ donné
   */
  getErrorMessage(formName: 'account' | 'profile', fieldName: string): string {
    const form = formName === 'account' ? this.accountForm : this.profileForm;
    const field = form.get(fieldName);

    if (!field || !field.errors || !field.touched) {
      return '';
    }

    // Messages d'erreur spécifiques
    const errorMessages: { [key: string]: { [key: string]: string } } = {
      username: {
        required: 'Le nom d\'utilisateur est requis',
        minlength: 'Minimum 3 caractères',
        maxlength: 'Maximum 20 caractères',
        pattern: 'Seuls les lettres, chiffres, points, tirets et underscores sont autorisés'
      },
      email: {
        required: 'L\'email est requis',
        email: 'Format d\'email invalide'
      },
      password: {
        required: 'Le mot de passe est requis',
        minlength: 'Minimum 6 caractères',
        pattern: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
      },
      confirmPassword: {
        required: 'La confirmation est requise'
      },
      nom: {
        required: 'Le nom est requis',
        minlength: 'Minimum 2 caractères',
        maxlength: 'Maximum 50 caractères'
      },
      prenom: {
        minlength: 'Minimum 2 caractères',
        maxlength: 'Maximum 50 caractères'
      },
     
      sexe: {
        required: 'Le sexe est requis'
      },
      tel: {
        required: 'Le téléphone est requis',
        pattern: 'Format invalide (9 à 15 chiffres)'
      },
      accepteConditions: {
        required: 'Vous devez accepter les conditions d\'utilisation'
      }
    };

    // Vérifier les erreurs de validation au niveau du formulaire
    if (fieldName === 'confirmPassword' && this.accountForm.errors?.['passwordMismatch']) {
      return 'Les mots de passe ne correspondent pas';
    }

    // Retourner le premier message d'erreur trouvé
    for (const errorType in field.errors) {
      if (errorMessages[fieldName]?.[errorType]) {
        return errorMessages[fieldName][errorType];
      }
    }

    // Messages génériques de fallback
    if (field.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (field.hasError('email')) {
      return 'Email invalide';
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} caractères`;
    }
    if (field.hasError('pattern')) {
      if (fieldName === 'tel') {
        return 'Format de téléphone invalide';
      }
      return 'Format invalide';
    }

    return 'Champ invalide';
  }

  /**
   * Marque tous les champs comme touchés pour afficher les erreurs
   */
  private markAllFormGroupsTouched(): void {
    this.markFormGroupTouched(this.accountForm);
    this.markFormGroupTouched(this.profileForm);
  }

  /**
   * Marque tous les champs d'un FormGroup comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
        if (control instanceof FormGroup) {
          this.markFormGroupTouched(control);
        }
      }
    });
  }

  /**
   * Vérifie si un champ a une erreur
   */
  hasFieldError(formName: 'account' | 'profile', fieldName: string, errorType?: string): boolean {
    const form = formName === 'account' ? this.accountForm : this.profileForm;
    const field = form.get(fieldName);
    
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Vérifie si les mots de passe correspondent
   */
  get passwordsMatch(): boolean {
    const password = this.accountForm.get('password')?.value;
    const confirmPassword = this.accountForm.get('confirmPassword')?.value;
    return password === confirmPassword;
  }

  /**
   * Calcule la force du mot de passe
   */
  getPasswordStrength(): number {
    const password = this.accountForm.get('password')?.value || '';
    let strength = 0;
    
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return Math.min(strength, 4);
  }

  /**
   * Valide l'âge minimum (18 ans)
   */
  private validateAge(birthDate: Date): boolean {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    
    return age >= 18;
  }

  /**
   * Validator pour vérifier la correspondance des mots de passe
   * (Gardé pour compatibilité avec l'ancien code si nécessaire)
   */
  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
