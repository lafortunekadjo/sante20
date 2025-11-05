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
    MatSnackBarModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  accountForm: FormGroup;
  profileForm: FormGroup;
  returnUrl: string | null = null;
  
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  maxDate = new Date();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    // Formulaire compte
    this.accountForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Formulaire profil
    this.profileForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      dateNaissance: ['', Validators.required],
      sexe: ['', Validators.required],
      tel: ['', [Validators.pattern('^[0-9]{9,15}$')]],
      adresse: [''],
      accepteConditions: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
    
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.accountForm.valid && this.profileForm.valid) {
      this.isLoading = true;

      const signupData = {
        // Données du compte
        username: this.accountForm.value.username,
        email: this.accountForm.value.email,
        motDePasse: this.accountForm.value.password,
        roles:'CANDIDAT',
        
        // Données du profil
        membre: {
          nom: this.profileForm.value.nom,
          prenom: this.profileForm.value.prenom,
          dateNaissance: this.profileForm.value.dateNaissance,
          sexe: this.profileForm.value.sexe,
          tel: this.profileForm.value.tel,
          adresse: this.profileForm.value.adresse
        }
      };

      this.authService.createUser(signupData).subscribe({
        next: (response) => {
          this.snackBar.open('Compte créé avec succès ! Bienvenue !', 'Fermer', {
            duration: 4000
          });

          // Connexion automatique après inscription
          this.authService.login(
            this.accountForm.value.username,
            this.accountForm.value.password
          ).subscribe({
            next: () => {
              // Vérifier s'il y a une redirection sauvegardée
              const redirectUrl = localStorage.getItem('redirectAfterLogin');
              if (redirectUrl) {
                localStorage.removeItem('redirectAfterLogin');
                this.router.navigateByUrl(redirectUrl);
              } else {
                this.router.navigate(['/dashboard']);
              }
            },
            error: (err) => {
              console.error('Erreur connexion auto:', err);
              this.router.navigate(['/login']);
            }
          });

          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur inscription:', err);
          let errorMessage = 'Erreur lors de l\'inscription';
          
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.status === 409) {
            errorMessage = 'Ce nom d\'utilisateur ou cet email existe déjà';
          }

          this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
          this.isLoading = false;
        }
      });
    } else {
      this.snackBar.open('Veuillez remplir tous les champs correctement', 'Fermer', {
        duration: 3000
      });
    }
  }

  getErrorMessage(formName: 'account' | 'profile', fieldName: string): string {
    const form = formName === 'account' ? this.accountForm : this.profileForm;
    const field = form.get(fieldName);

    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (field?.hasError('email')) {
      return 'Email invalide';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} caractères`;
    }
    if (field?.hasError('pattern')) {
      if (fieldName === 'tel') {
        return 'Format de téléphone invalide';
      }
      return 'Format invalide';
    }
    if (fieldName === 'confirmPassword' && this.accountForm.hasError('passwordMismatch')) {
      return 'Les mots de passe ne correspondent pas';
    }
    return '';
  }
}