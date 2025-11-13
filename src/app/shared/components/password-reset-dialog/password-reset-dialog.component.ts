import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

// Validator personnalisé pour la correspondance des mots de passe
function passwordsMatchValidator(group: FormGroup) {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-password-reset-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FormsModule, 
    TranslateModule,
    ReactiveFormsModule
  ],
  templateUrl: './password-reset-dialog.component.html',
  styleUrl: './password-reset-dialog.component.scss'
})
export class PasswordResetDialogComponent implements OnInit {
  passwordForm: FormGroup;
  
  // États visuels
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    public dialogRef: MatDialogRef<PasswordResetDialogComponent>,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.passwordForm = this.initializeForm();
  }

  ngOnInit(): void {
    this.clearMessages();
  }

  /**
   * Initialise le formulaire de réinitialisation
   */
  private initializeForm(): FormGroup {
    return this.fb.group({
      oldPassword: ['', [
        Validators.required
      ]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{6,}$')
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, { 
      validators: passwordsMatchValidator 
    });
  }

  /**
   * Met à jour le mot de passe
   */
  onUpdatePassword(): void {
    if (!this.passwordForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    // Vérification critique de l'ID utilisateur
    const userId = this.authService.getUserId();
    if (userId === null) {
      this.setErrorMessage('Erreur: ID utilisateur non disponible. Veuillez vous reconnecter.');
      console.error('ID utilisateur null lors de la mise à jour du mot de passe');
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const { oldPassword, newPassword } = this.passwordForm.value;

    this.authService.updatePassword(userId, oldPassword, newPassword).subscribe({
      next: (response) => {
        this.handleUpdateSuccess(response);
      },
      error: (err) => {
        this.handleUpdateError(err);
      }
    });
  }

  /**
   * Gère le succès de la mise à jour
   */
  private handleUpdateSuccess(response: any): void {
    this.isLoading = false;
    this.successMessage = 'Mot de passe mis à jour avec succès !';
    
    // Fermer la modal et rediriger après un délai
    setTimeout(() => {
      this.dialogRef.close(true);
      this.router.navigate(['/login']);
    }, 2000);
  }

  /**
   * Gère les erreurs de mise à jour
   */
  private handleUpdateError(err: any): void {
    console.error('Erreur lors de la mise à jour du mot de passe:', err);
    this.isLoading = false;

    // Gestion spécifique selon le type d'erreur
    if (err.status === 400) {
      if (err.error?.message?.includes('current') || err.error?.message?.includes('ancien')) {
        this.setErrorMessage('L\'ancien mot de passe est incorrect.');
      } else if (err.error?.message?.includes('same') || err.error?.message?.includes('identique')) {
        this.setErrorMessage('Le nouveau mot de passe doit être différent de l\'ancien.');
      } else {
        this.setErrorMessage('Données invalides. Veuillez vérifier vos informations.');
      }
    } else if (err.status === 401) {
      this.setErrorMessage('Session expirée. Veuillez vous reconnecter.');
    } else if (err.status === 403) {
      this.setErrorMessage('Accès refusé. Contactez l\'administrateur.');
    } else if (err.status === 0) {
      this.setErrorMessage('Problème de connexion. Vérifiez votre connexion internet.');
    } else {
      // Utiliser le message d'erreur du serveur ou un message par défaut
      this.setErrorMessage(
        err.error?.message || 'Erreur lors de la mise à jour du mot de passe.'
      );
    }
  }

  /**
   * Annule et ferme la modal
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Définit un message d'erreur
   */
  private setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    
    // Auto-effacement du message après 8 secondes
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.clearMessages();
      }
    }, 8000);
  }

  /**
   * Efface tous les messages
   */
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Marque tous les champs comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  /**
   * Calcule la force du mot de passe
   */
  getPasswordStrength(): number {
    const password = this.passwordForm.get('newPassword')?.value || '';
    let strength = 0;
    
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return Math.min(strength, 4); // Max 4
  }

  /**
   * Obtient la classe CSS pour la force du mot de passe
   */
  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    const classes = ['very-weak', 'weak', 'medium', 'strong', 'very-strong'];
    return classes[strength] || 'very-weak';
  }

  /**
   * Obtient le texte descriptif de la force du mot de passe
   */
  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    const texts = [
      'auth.passwordReset.strengthVeryWeak',
      'auth.passwordReset.strengthWeak',
      'auth.passwordReset.strengthMedium',
      'auth.passwordReset.strengthStrong',
      'auth.passwordReset.strengthVeryStrong'
    ];
    return texts[strength] || texts[0];
  }

  /**
   * TrackBy function pour les barres de force
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Vérifie si les mots de passe correspondent
   */
  get passwordsMatch(): boolean {
    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;
    return newPassword === confirmPassword;
  }

  /**
   * Vérifie si un champ a une erreur
   */
  hasFieldError(fieldName: string, errorType?: string): boolean {
    const field = this.passwordForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Obtient le message d'erreur pour un champ donné
   */
  getFieldErrorMessage(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    // Messages d'erreur spécifiques
    const errorMessages: { [key: string]: { [key: string]: string } } = {
      oldPassword: {
        required: 'L\'ancien mot de passe est requis'
      },
      newPassword: {
        required: 'Le nouveau mot de passe est requis',
        minlength: 'Minimum 6 caractères',
        pattern: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
      },
      confirmPassword: {
        required: 'La confirmation est requise'
      }
    };

    // Vérifier les erreurs de validation au niveau du formulaire
    if (fieldName === 'confirmPassword' && this.passwordForm.errors?.['passwordsMismatch']) {
      return 'Les mots de passe ne correspondent pas';
    }

    // Retourner le premier message d'erreur trouvé
    for (const errorType in field.errors) {
      if (errorMessages[fieldName]?.[errorType]) {
        return errorMessages[fieldName][errorType];
      }
    }

    return 'Champ invalide';
  }

  /**
   * Valide si le nouveau mot de passe est différent de l'ancien
   */
  private validatePasswordsAreDifferent(): boolean {
    const oldPassword = this.passwordForm.get('oldPassword')?.value;
    const newPassword = this.passwordForm.get('newPassword')?.value;
    return oldPassword !== newPassword;
  }

  /**
   * Gère la touche Entrée pour soumettre le formulaire
   */
  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.isLoading && this.passwordForm.valid) {
      this.onUpdatePassword();
    }
  }

  /**
   * Validator pour vérifier la correspondance des mots de passe
   * (Garde ta méthode originale pour compatibilité)
   */
  passwordsMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }
}