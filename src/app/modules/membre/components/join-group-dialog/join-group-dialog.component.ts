import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InvitationService } from '../../../../core/services/invitation.service';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { GroupeContextService } from '../../../../core/services/groupe-context.service';


@Component({
  selector: 'app-join-group-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './join-group-dialog.component.html',
  styleUrls: ['./join-group-dialog.component.scss']
})
export class JoinGroupDialogComponent {

  code                   = '';
  message                = '';
  isLoading              = false;
  currentStep: 1 | 2 | 3 = 1;   // FIX : étape 3 = succès

  // Groupe trouvé
  groupeFoundNom         = '';
  groupeFoundAbreviation = '';
  groupeFoundVille       = '';
  groupeFoundDiscipline  = '';
  groupeFoundNbMembres   = 0;

  // FIX : stocker le groupeId pour le switch après succès
  groupeFoundId: number | null = null;

  codeError = '';
  userId: number | null = null;

  constructor(
    private dialogRef:         MatDialogRef<JoinGroupDialogComponent>,
    private invitationService: InvitationService,
    private authService:       AuthService,
    private groupeContext:     GroupeContextService,
    private snackBar:          MatSnackBar,
    private router:            Router,
  ) {}

  // ── Étape 1 : vérifier le code ───────────────────────────────
  verifierCode(): void {
    if (!this.code.trim()) return;

    this.codeError = '';
    this.isLoading = true;

    this.invitationService.verifierInvitation(this.code.trim().toUpperCase()).subscribe({
      next: (invitation) => {
        this.isLoading = false;

        const isValid = (invitation as any).valide ?? invitation.isValide;
        if (!isValid) {
          this.codeError = invitation.messageErreur
            || (invitation as any).messageErreur
            || 'Code invalide ou expiré. Vérifiez et réessayez.';
          return;
        }

        // Code valide → remplir les infos
        this.groupeFoundNom         = invitation.groupeNom         || '';
        this.groupeFoundAbreviation = invitation.groupeDescription || '';
        this.groupeFoundVille       = invitation.groupeVille       || '';
        this.groupeFoundDiscipline  = invitation.groupeDiscipline  || '';
        this.groupeFoundNbMembres   = invitation.nombreMembres     || 0;
        this.codeError              = '';
        this.currentStep            = 2;
      },
      error: (err) => {
        this.isLoading = false;
        this.codeError = err.error?.message
          || err.error?.messageErreur
          || 'Code invalide ou expiré. Vérifiez et réessayez.';
      }
    });
  }

  // ── Étape 2 : envoyer la demande ─────────────────────────────
  envoyerDemande(): void {
    this.isLoading = true;
    this.userId = this.authService.getUserId();

    const payload = {
      codeInvitation: this.code.trim().toUpperCase(),
      message:        this.message,
      userId:         this.userId,
      dateCreation:   new Date()
    };

    this.invitationService.rejoindreGroupeConnecte(payload).subscribe({
      next: (res: any) => {
        this.isLoading   = false;
        this.currentStep = 3;  // FIX : passer à l'étape succès dans le dialog
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || "Erreur lors de l'envoi de la demande";

        // FIX : si déjà membre → proposer de switcher directement
        if (err.status === 409 || msg.toLowerCase().includes('déjà membre')) {
          this.snackBar.open(
            `Vous êtes déjà membre de "${this.groupeFoundNom}"`,
            'Aller sur ce groupe',
            { duration: 6000 }
          ).onAction().subscribe(() => {
            // Tenter de switcher vers ce groupe si on a l'ID
            if (this.groupeFoundId) {
              this.authService.switchGroupe(this.groupeFoundId).subscribe(() => {
                this.groupeContext.notifyGroupeChanged(this.groupeFoundId!);
                this.dialogRef.close(true);
              });
            } else {
              this.dialogRef.close(false);
              this.router.navigate(['/mes-demandes']);
            }
          });
        } else {
          this.snackBar.open(msg, 'Fermer', { duration: 5000 });
        }
      }
    });
  }

  // ── Actions nav ───────────────────────────────────────────────
  goToMesDemandes(): void {
    this.dialogRef.close(true);
    this.router.navigate(['/mes-demandes']);
  }

  goToExplorer(): void {
    this.dialogRef.close(false);
    this.router.navigate(['/explorer2']);
  }

  retourEtape1(): void {
    this.currentStep = 1;
    this.code        = '';
    this.codeError   = '';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getDisciplineIcon(discipline?: string): string {
    const map: Record<string, string> = {
      'FOOTBALL':   'sports_soccer',
      'BASKETBALL': 'sports_basketball',
    };
    return discipline ? (map[discipline] ?? 'sports') : 'sports';
  }
}