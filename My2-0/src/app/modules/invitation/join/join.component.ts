// ============================================================
// MY2-0 - PAGE PUBLIQUE "REJOINDRE UN GROUPE"
// Component Angular - join.component.ts
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InvitationPublic, InvitationService, CreateDemandeAdhesionRequest } from '../../../core/services/invitation.service';
import { MatDivider } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-join',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatSnackBarModule,
    MatDivider,
    TranslateModule
  ],
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss']
})
export class JoinComponent implements OnInit {

  // États
  isLoading = true;
  isSubmitting = false;
  invitationValide = false;
  inscriptionReussie = false;
  showPassword = false;
  showConfirmPassword = false;

  // Données
  invitation: InvitationPublic | null = null;
  code: string = '';
  groupeNom: string = '';

  // Formulaire
  form!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private invitationService: InvitationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Récupérer le code depuis l'URL
    this.code = this.route.snapshot.paramMap.get('code') || '';
    
    if (this.code) {
      this.verifierInvitation();
    } else {
      this.isLoading = false;
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      // Infos personnelles
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      
      // Identifiants
      username: ['', [
        Validators.required, 
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  verifierInvitation(): void {
    this.isLoading = true;
    
    this.invitationService.verifierInvitation(this.code).subscribe({
      next: (result) => {
        this.invitation = result;
        this.invitationValide = result.isValide;
        this.groupeNom = result.groupeNom || '';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur vérification invitation:', err);
        this.invitation = {
          code: this.code,
          isValide: false,
          messageErreur: 'Impossible de vérifier cette invitation'
        };
        this.invitationValide = false;
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const request: CreateDemandeAdhesionRequest = {
      codeInvitation: this.code,
      nom: this.form.value.nom.trim(),
      prenom: this.form.value.prenom.trim(),
      email: this.form.value.email.trim().toLowerCase(),
      telephone: this.form.value.telephone.trim(),
      username: this.form.value.username.trim(),
      password: this.form.value.password
    };

    this.invitationService.rejoindreViaInvitation(request).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        
        if (result.success) {
          this.inscriptionReussie = true;
          this.groupeNom = result.groupeNom || this.groupeNom;
        } else {
          this.snackBar.open(result.message || 'Une erreur est survenue', 'Fermer', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = err.error?.message || 'Une erreur est survenue lors de l\'inscription';
        this.snackBar.open(message, 'Fermer', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Helpers pour le template
  get f() { return this.form.controls; }

  hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return control ? control.hasError(error) && control.touched : false;
  }
}