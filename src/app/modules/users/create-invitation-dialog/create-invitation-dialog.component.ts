import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationCreatedResponse, CreateInvitationRequest, MatchInvitationService } from '../../../core/services/match-invitation.service';



export interface CreateInvitationDialogData {
  match: {
    id: number;
    dateMatch: Date;
    adversaire?: string;
  };
}

@Component({
  selector: 'app-create-invitation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './create-invitation-dialog.component.html',
  styleUrls: ['./create-invitation-dialog.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class CreateInvitationDialogComponent {

  isCreating = false;
  invitationCreated = false;
  createdInvitation: InvitationCreatedResponse | null = null;

  formData: CreateInvitationRequest = {
    matchId: 0,
    minJoueurs: 7,
    maxJoueurs: 25,
    message: '',
    joursValidite: 7
  };

  constructor(
    public dialogRef: MatDialogRef<CreateInvitationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateInvitationDialogData,
    private invitationService: MatchInvitationService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.formData.matchId = data.match.id;
  }

  // ===== CRÉATION =====

  createInvitation(): void {
    if (this.isCreating) return;

    // const groupeId = this.authService.getGroupe();
    // if (!groupeId) {
    //   this.showSnackbar(this.translate.instant('errors.noGroup'), 'error');
    //   return;
    // }

    this.isCreating = true;

    this.invitationService.createInvitation(this.formData).subscribe({
      next: (response) => {
        this.isCreating = false;
        this.invitationCreated = true;
        this.createdInvitation = response;
        this.showSnackbar(this.translate.instant('invitation.created'), 'success');
      },
      error: (err) => {
        this.isCreating = false;
        const errorMsg = err.error?.message || this.translate.instant('invitation.createError');
        this.showSnackbar(errorMsg, 'error');
      }
    });
  }

  // ===== PARTAGE =====

  copyLink(input: HTMLInputElement): void {
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
      this.showSnackbar(this.translate.instant('invitation.linkCopied'), 'success');
    });
  }

  shareOnWhatsApp(): void {
    if (!this.createdInvitation) return;

    const text = this.generateShareMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  shareViaSMS(): void {
    if (!this.createdInvitation) return;

    const text = this.generateShareMessage();
    const url = `sms:?body=${encodeURIComponent(text)}`;
    window.location.href = url;
  }

  shareViaEmail(): void {
    if (!this.createdInvitation) return;

    const subject = `Invitation match amical - ${this.formatDate(this.data.match.dateMatch)}`;
    const body = this.generateShareMessage();
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  private generateShareMessage(): string {
    const date = this.formatDate(this.data.match.dateMatch);
    let message = `⚽ Invitation Match Amical\n\n`;
    message += `📅 Date: ${date}\n`;
    if (this.data.match.adversaire) {
      message += `🆚 Contre: ${this.data.match.adversaire}\n`;
    }
    message += `\n📋 Inscrivez votre équipe:\n${this.createdInvitation!.inviteUrl}\n`;
    message += `\nℹ️ Lien valide jusqu'au ${this.formatDateTime(this.createdInvitation!.dateExpiration)}`;
    return message;
  }

  // ===== UTILITAIRES =====

  private formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  private formatDateTime(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private showSnackbar(message: string, type: 'success' | 'error'): void {
    const panelClass = type === 'success' ? 'snackbar-success' : 'snackbar-error';
    this.snackBar.open(message, '✕', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
  }

  close(): void {
    this.dialogRef.close(this.invitationCreated ? this.createdInvitation : null);
  }
}