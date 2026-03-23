import { Component, OnInit, signal, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { VoteActionSheetComponent } from '../vote-action-sheet/vote-action-sheet.component';
import { InvitationService } from '../../../../core/services/invitation.service';
import { MatTooltipModule } from '@angular/material/tooltip';


/**
 * COMPOSANT PRINCIPAL : La carte de vote à inclure dans le feed
 */
@Component({
  selector: 'app-mvp-vote-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatBottomSheetModule, MatProgressSpinnerModule, MatSnackBarModule, TranslateModule, MatTooltipModule],
  templateUrl: './mvp-vote-card.component.html',
  styleUrls: ['./mvp-vote-card.component.scss']
})
export class MvpVoteCardComponent implements OnInit {
  @Input() groupeId!: number; // Reçu du parent (NewsFeed)
  @Input() exerciceId?: number; // Optionnel, pour filtrer par exercice

  private voteService = inject(InvitationService);
  private authService = inject(AuthService);
  private bottomSheet = inject(MatBottomSheet);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  nomines = signal<any[]>([]);
  isLoading = signal(true);
  hasVoted = signal(false);
  currentMonthLabel = signal<string>('');

  ngOnInit() {
    console.log(this.groupeId);
    if (!this.groupeId) {
      console.error('MvpVoteCardComponent: groupeId est requis');
      this.isLoading.set(false);
      return;
    }
    this.setCurrentMonthLabel();
    this.checkStatusAndLoad();
  }

  private setCurrentMonthLabel() {
    const date = new Date();
    this.currentMonthLabel.set(date.toLocaleDateString(this.translate.currentLang, { month: 'long', year: 'numeric' }));
  }

  checkStatusAndLoad() {
    const userId = this.authService.getUserId();
    
    // Sécurité : Seul un user connecté peut voter
    if (!userId) {
      this.isLoading.set(false);
      return; 
    }

    // 1. Vérifier si l'utilisateur a déjà voté ce mois-ci
    this.voteService.verifierVote(this.groupeId, userId).subscribe({
      
      next: (voted: boolean) => {
        console.log(voted)
        this.hasVoted.set(voted);
        
        // 2. Si non voté, charger les nomines (Top 3 calculé par le backend)
        if (!voted) {
          this.voteService.getnomines(this.groupeId).subscribe({
            next: (players) => {
              console.log(players)
              this.nomines.set(players);
              this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
          });
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  openVoteSheet(player: any) {
    // N'ouvre le sheet que si l'user n'a pas voté
    if (this.hasVoted()) return;

    const sheetRef = this.bottomSheet.open(VoteActionSheetComponent, {
      data: { player, groupeId: this.groupeId }
    });

    sheetRef.afterDismissed().subscribe(result => {
      if (result?.success) {
        this.hasVoted.set(true);
        this.snackBar.open(this.translate.instant('mvpVote.voteSuccess'), 'OK', { duration: 3000 });
      } else if (result?.error) {
        // Gère l'erreur d'éligibilité (ex: < 50% présence) renvoyée par le backend
        this.snackBar.open(result.error, 'Compris', { duration: 5000 });
      }
    });
  }

  shareVote() {
    const groupName = this.authService.getGroupe || 'notre groupe';
    const text = this.translate.instant('mvpVote.shareText', { month: this.currentMonthLabel(), group: groupName });
    const url = `${window.location.origin}/public/vote/${this.groupeId}`; // Lien public hypothétique

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(whatsappUrl, '_blank');
  }
}