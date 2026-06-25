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

@Component({
  selector: 'app-join-group-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './join-group-dialog.component.html',
  styleUrls: ['./join-group-dialog.component.scss']
})
export class JoinGroupDialogComponent {

  code                    = '';
  message                 = '';
  isLoading               = false;
  currentStep: 1 | 2      = 1;

  // Groupe trouvé
  groupeFoundNom          = '';
  groupeFoundAbreviation  = '';
  groupeFoundVille        = '';

  // Message d'erreur inline (étape 1)
  codeError               = '';

  userId: number | null = null;

  constructor(
    private dialogRef:         MatDialogRef<JoinGroupDialogComponent>,
    private invitationService: InvitationService,
    private authService:       AuthService,
    private snackBar:          MatSnackBar,
    private router: Router,
  ) {}

  // ── Étape 1 : vérifier le code ─────────────────────────────
  verifierCode(): void {
    if (!this.code.trim()) return;

    this.codeError = '';
    this.isLoading = true;

    this.invitationService.verifierInvitation(this.code.trim().toUpperCase()).subscribe({
      next: (invitation) => {
        this.isLoading = false;

        // Le backend retourne 200 même pour les codes invalides.
        // Jackson sérialise isValide() → "valide" en JSON (retire le préfixe is)
        // On vérifie les deux noms possibles selon la config Jackson du backend.
        const isValid = (invitation as any).valide ?? invitation.isValide;
        if (!isValid) {
          this.codeError = invitation.messageErreur
            || (invitation as any).messageErreur
            || 'Code invalide ou expiré. Vérifiez et réessayez.';
          return;
        }

        // Code valide → remplir les infos et passer à l'étape 2
        this.groupeFoundNom         = invitation.groupeNom         || '';
        this.groupeFoundAbreviation = invitation.groupeDescription || '';
        this.groupeFoundVille       = invitation.groupeVille       || '';
        this.codeError              = '';
        this.currentStep            = 2;
      },
      error: (err) => {
        this.isLoading = false;
        // Erreur HTTP réelle (réseau, 5xx, etc.)
        this.codeError = err.error?.message
          || err.error?.messageErreur
          || 'Code invalide ou expiré. Vérifiez et réessayez.';
      }
    });
  }

  // 3. Ajouter la méthode goToExplorer()
goToExplorer(): void {
  this.dialogRef.close();           // fermer le dialog d'abord
  this.router.navigate(['/explorer']);
}

  // ── Étape 2 : envoyer la demande ───────────────────────────
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
      next: () => {
        this.isLoading = false;
        this.snackBar.open(
          `Demande envoyée avec succès au groupe ${this.groupeFoundNom}`,
          'OK',
          { duration: 5000 }
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        const errorMsg = err.error?.message || "Erreur lors de l'envoi de la demande";
        this.snackBar.open(errorMsg, 'Fermer', { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}