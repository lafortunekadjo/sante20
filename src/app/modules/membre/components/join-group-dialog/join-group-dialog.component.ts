import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InvitationService } from '../../../../core/services/invitation.service';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';


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
    MatStepperModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './join-group-dialog.component.html',
  styleUrls: ['./join-group-dialog.component.scss']
})
export class JoinGroupDialogComponent implements OnInit {
  code: string = '';
  message: string = '';
  isLoading: boolean = false;
  groupeFoundNom: any = null;
  groupeFound: any = null;
  groupeFoundAbreviation: any = null;
  groupeFoundVille: any = null;
    userId: number | null = null;

  constructor(
    private dialogRef: MatDialogRef<JoinGroupDialogComponent>,
    private invitationService: InvitationService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  /**
   * Étape 1 : Vérifie si le code d'invitation est valide
   * et récupère les infos du groupe associé.
   */
  verifierCode(stepper: MatStepper) {
    if (!this.code) return;

    this.isLoading = true;
    this.invitationService.verifierInvitation(this.code.toUpperCase()).subscribe({
      next: (invitation) => {
        this.groupeFoundNom = invitation.groupeNom;
        this.groupeFound= invitation.groupeNom;
        this.groupeFoundAbreviation = invitation.groupeDescription
        this.groupeFoundVille = invitation.groupeVille
        this.isLoading = false;
        stepper.next(); // Passe à l'étape de confirmation
      },
      error: (err) => {
        this.isLoading = false;
        const errorMsg = err.error?.message || "Code invalide ou expiré";
        this.snackBar.open(errorMsg, "Fermer", { duration: 3000 });
      }
    });
  }

  /**
   * Étape 2 : Envoie la demande d'adhésion pour l'utilisateur connecté
   */
  envoyerDemande() {
    this.isLoading = true;
    this.userId = this.authService.getUserId();
    // On prépare l'objet pour ton backend
    const payload = {
      codeInvitation: this.code.toUpperCase(),
      message: this.message,
      userId:this.userId,
      dateCreation: new Date() // Date locale
    };

    this.invitationService.rejoindreGroupeConnecte(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.snackBar.open(`Demande envoyée avec succès au groupe ${this.groupeFoundNom}`, "OK", { 
          duration: 5000 
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        const errorMsg = err.error?.message || "Erreur lors de l'envoi de la demande";
        this.snackBar.open(errorMsg, "Fermer", { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}