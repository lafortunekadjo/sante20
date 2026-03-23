import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core'; // Inject depuis @angular/core
import { FormsModule } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Import manquant pour mat-spinner
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { InvitationService } from '../../../../core/services/invitation.service';


@Component({
  selector: 'app-vote-action-sheet',
  standalone: true,
  imports: [
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    FormsModule, 
    CommonModule, 
    TranslateModule
  ],
  template: `
    <div class="vote-sheet">
      <header>
        <h3>{{ 'mvpVote.castYourVote' | translate }}</h3>
        <p>{{ 'mvpVote.anonymousHint' | translate }}</p>
      </header>

      <div class="player-confirm">
        <div class="mini-avatar">
            <img *ngIf="data.player.photoUrl" [src]="data.player.photoUrl">
            <mat-icon *ngIf="!data.player.photoUrl">person</mat-icon>
        </div>
        <strong>{{ data.player.prenom }} {{ data.player.nom }}</strong>
      </div>

      <div class="comment-section">
        <label>{{ 'mvpVote.leaveComment' | translate }}</label>
        <textarea [(ngModel)]="comment" maxlength="140" [placeholder]="'mvpVote.placeholder' | translate"></textarea>
        <span class="char-count">{{ comment.length }}/140</span>
      </div>

      <button mat-flat-button color="primary" class="w-100" (click)="confirm()" [disabled]="loading">
        <mat-spinner diameter="20" *ngIf="loading" style="display: inline-block; margin-right: 8px;"></mat-spinner>
        {{ 'mvpVote.confirmBtn' | translate }}
      </button>
    </div>
  `,
  styles: [`
    .vote-sheet { padding: 20px; font-family: 'Inter', sans-serif; }
    .player-confirm { display: flex; align-items: center; gap: 10px; margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 8px; }
    .mini-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: #ddd; display: flex; align-items: center; justify-content: center; img { width: 100%; height: 100%; object-fit: cover; } }
    textarea { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 10px; height: 80px; margin-bottom: 5px; resize: none; }
    .char-count { font-size: 10px; color: #888; display: block; text-align: right; }
    .w-100 { width: 100%; }
  `]
})
export class VoteActionSheetComponent {
  // Injections modernes (hors constructeur)
  public data = inject<{player: any, groupeId: number}>(MAT_BOTTOM_SHEET_DATA);
  private sheetRef = inject(MatBottomSheetRef<VoteActionSheetComponent>);
  private voteService = inject(InvitationService); // Assure-toi du nom du service
  private auth = inject(AuthService);

  comment = '';
  loading = false;

  confirm() {
    const user = this.auth.getUser();
    if (!user?.id) return;

    this.loading = true;
    const payload = {
      groupeId: this.data.groupeId,
      votantId: user.id,
      candidatId: this.data.player.id,
      commentaire: this.comment
    };

    this.voteService.soumettreVote(payload).subscribe({
      next: () => {
        this.sheetRef.dismiss({ success: true });
      },
      error: (err) => {
        this.loading = false;
        // Gestion du message d'erreur renvoyé par le backend (ex: 50% de présence)
        const errorMsg = err.error || "Erreur lors du vote";
        this.sheetRef.dismiss({ error: errorMsg });
      }
    });
  }
}