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
   :host { display: block; --bg-card: #ffffff; --text-main: #1a1a1a; --text-sub: #666; --border: #e2e8f0; --input-bg: #ffffff; }

    /* Configuration Thème Sombre */
    @media (prefers-color-scheme: dark) {
      :host { --bg-card: #1e1e1e; --text-main: #f5f5f5; --text-sub: #a0aec0; --border: #333; --input-bg: #2d2d2d; }
    }

    .vote-sheet { 
      padding: 24px; 
      font-family: 'Poppins', sans-serif; 
      background: var(--bg-card);
      color: var(--text-main);
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
    }

    header h3 { margin: 0; color: var(--text-main); font-weight: 700; }
    header p { color: var(--text-sub); font-size: 0.85rem; margin-bottom: 20px; }

    .player-confirm { 
      display: flex; align-items: center; gap: 15px; margin: 20px 0; padding: 12px; 
      background: var(--input-bg); border: 1px solid var(--border); border-radius: 12px; 
    }

    .mini-avatar { 
      width: 50px; height: 50px; border-radius: 12px; overflow: hidden; 
      background: #333; display: flex; align-items: center; justify-content: center; 
      border: 2px solid var(--border);
    }

    textarea { 
      width: 100%; border: 1.5px solid var(--border); border-radius: 12px; 
      padding: 12px; height: 100px; margin-bottom: 5px; resize: none;
      background: var(--input-bg); color: var(--text-main);
    }

    textarea:focus { outline: none; border-color: #3b82f6; }

    .char-count { font-size: 11px; color: var(--text-sub); display: block; text-align: right; margin-bottom: 15px; }

    .w-100 { 
      width: 100%; height: 48px; border-radius: 12px !important; 
      font-weight: 600 !important; text-transform: uppercase;
    }
  
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
    if (!user?.userId) return;
    console.log(this.data)
    this.loading = true;
    const payload = {
      groupeId: this.data.groupeId,
      votantId: user.userId,
      candidatId: this.data.player.id,
      commentaire: this.comment
    };

    this.voteService.soumettreVote(payload).subscribe({
      next: () => {
        console.log("vote soumis")
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