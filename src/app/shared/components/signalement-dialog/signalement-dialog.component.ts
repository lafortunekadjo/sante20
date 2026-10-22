import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CibleSignalement, ModerationService, MotifSignalement } from '../../../core/services/moderation.service';

export interface SignalementData {
  cible: CibleSignalement;
  cibleId?: number | null;
  utilisateurId?: number | null;
  /** Nom de la personne concernée (affiché pour proposer de la bloquer). */
  utilisateurNom?: string;
}

/** Fenêtre « Signaler » : motif, précisions facultatives, et possibilité de bloquer la personne dans la foulée. */
@Component({
  selector: 'app-signalement-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, TranslateModule],
  templateUrl: './signalement-dialog.component.html',
  styleUrls: ['./signalement-dialog.component.scss']
})
export class SignalementDialogComponent {
  private moderation = inject(ModerationService);
  private snack = inject(MatSnackBar);
  private translate = inject(TranslateService);

  motifs: MotifSignalement[] = ['HARCELEMENT', 'HAINE', 'SEXUEL', 'VIOLENCE', 'SPAM', 'USURPATION', 'AUTRE'];
  motif = signal<MotifSignalement | null>(null);
  details = '';
  bloquerAussi = false;
  envoi = signal(false);
  erreur = signal<string | null>(null);

  constructor(private ref: MatDialogRef<SignalementDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: SignalementData) {}

  envoyer(): void {
    const m = this.motif();
    if (!m || this.envoi()) return;
    this.envoi.set(true);
    this.erreur.set(null);
    this.moderation.signaler(this.data.cible, this.data.cibleId ?? null, this.data.utilisateurId ?? null, m, this.details).subscribe({
      next: () => {
        if (this.bloquerAussi && this.data.utilisateurId) this.moderation.bloquer(this.data.utilisateurId).subscribe();
        this.snack.open(this.translate.instant('moderation.merci'), 'OK', { duration: 4000 });
        this.ref.close(true);
      },
      error: e => {
        this.erreur.set(e?.error?.message || this.translate.instant('moderation.erreur'));
        this.envoi.set(false);
      }
    });
  }

  fermer(): void { this.ref.close(false); }
}
