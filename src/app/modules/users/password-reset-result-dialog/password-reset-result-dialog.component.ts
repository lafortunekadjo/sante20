import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface PasswordResetDialogData {
  username: string;
  email: string;
  newPassword: string;
}

@Component({
  selector: 'app-password-reset-result-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './password-reset-result-dialog.component.html',
  styleUrls: ['./password-reset-result-dialog.component.scss']
})
export class PasswordResetResultDialogComponent {

  hidePassword = false;

  constructor(
    public dialogRef: MatDialogRef<PasswordResetResultDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PasswordResetDialogData,
    private snackBar: MatSnackBar
  ) {}

  copyPassword(input: HTMLInputElement): void {
    input.select();
    navigator.clipboard.writeText(this.data.newPassword).then(() => {
      this.snackBar.open('Mot de passe copié !', '✓', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-success']
      });
    });
  }

  shareViaWhatsApp(): void {
    const message = this.generateMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  shareViaEmail(): void {
    const subject = 'Votre nouveau mot de passe - My2-0';
    const body = this.generateMessage();
    const url = `mailto:${this.data.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  shareViaSMS(): void {
    const message = this.generateMessage();
    const url = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = url;
  }

  private generateMessage(): string {
    return `Bonjour ${this.data.username},

Votre mot de passe My2-0 a été réinitialisé.

Nouveau mot de passe : ${this.data.newPassword}

Veuillez vous connecter et changer ce mot de passe dès que possible.

Cordialement,
L'équipe My2-0`;
  }

  close(): void {
    this.dialogRef.close();
  }
}