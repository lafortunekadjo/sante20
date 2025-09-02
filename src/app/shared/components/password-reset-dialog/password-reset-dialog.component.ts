import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-password-reset-dialog',
  imports: [CommonModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,
      MatTableModule,
      MatInputModule,
      MatFormFieldModule,
      MatSelectModule,
      MatCheckboxModule,
      MatPaginatorModule,
      MatSortModule,
      MatProgressSpinnerModule,
      MatDialogModule,
      FormsModule, 
      ReactiveFormsModule],
  templateUrl: './password-reset-dialog.component.html',
  styleUrl: './password-reset-dialog.component.scss'
})
export class PasswordResetDialogComponent {
   passwordForm: FormGroup;
  errorMessage: string = '';

  constructor(
    public dialogRef: MatDialogRef<PasswordResetDialogComponent>,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.passwordsMatchValidator
    });
  }

  passwordsMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }

  onUpdatePassword(): void {
     const userId = this.authService.getUserId();
    this.errorMessage = '';
    const { oldPassword, newPassword } = this.passwordForm.value;
    // VERIFICATION CRITIQUE : S'assurer que l'ID utilisateur n'est pas null
  if (userId === null) {
    this.errorMessage = 'Erreur: ID utilisateur non disponible. Veuillez vous reconnecter.';
    console.error(this.errorMessage);
    return; // Arrêter l'exécution si l'ID est null
  }

  // Si l'ID est valide, on peut procéder à l'appel
  this.authService.updatePassword(userId, oldPassword, newPassword).subscribe({
    next: () => {
      this.dialogRef.close(true);
      this.router.navigate(['/login']);
    },
    error: (error) => {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      this.errorMessage = error.error?.message || 'Erreur lors de la mise à jour du mot de passe.';
    }
  });
  }

}
