import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../environment';

@Component({
  selector: 'app-delete-account',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatIconModule, MatProgressSpinnerModule,
    MatCheckboxModule, MatSnackBarModule, MatDialogModule
  ],
  templateUrl: './delete-account.component.html',
  styleUrl: './delete-account.component.scss'
})
export class DeleteAccountComponent {
  private http      = inject(HttpClient);
  private snackBar  = inject(MatSnackBar);
  private dialog    = inject(MatDialog);
  public router    = inject(Router);
  private auth      = inject(AuthService);

  step: 'info' | 'confirm' | 'done' = 'info';
  motif = '';
  confirmText = '';
  hasConfirmed = false;
  isDeleting = false;

  readonly motifs = [
    'Je n\'utilise plus l\'application',
    'Je veux créer un nouveau compte',
    'Problèmes de confidentialité',
    'L\'application ne répond pas à mes besoins',
    'Autre raison',
  ];

  readonly username = this.auth.getUsername() ?? '';

  canConfirm(): boolean {
    return this.confirmText.trim().toLowerCase() === 'supprimer'
        && this.hasConfirmed;
  }

  goToConfirm(): void {
    this.step = 'confirm';
  }

  deleteAccount(): void {
    if (!this.canConfirm() || this.isDeleting) return;
    this.isDeleting = true;

    this.http.delete(`${environment.apiUrl}/account/me`, {
      body: { motif: this.motif }
    }).subscribe({
      next: () => {
        this.isDeleting = false;
        this.step = 'done';
        // Déconnecter après 3 secondes
        setTimeout(() => {
          this.auth.logout(false);
          this.router.navigate(['/home']);
        }, 3000);
      },
      error: (err) => {
        this.isDeleting = false;
        this.snackBar.open(
          err.error?.message || 'Erreur lors de la suppression',
          'Fermer', { duration: 5000 }
        );
      }
    });
  }
}