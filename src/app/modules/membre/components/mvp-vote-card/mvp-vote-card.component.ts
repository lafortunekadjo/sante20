import { Component, OnInit, signal, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { VoteActionSheetComponent } from '../vote-action-sheet/vote-action-sheet.component';
import { InvitationService } from '../../../../core/services/invitation.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-mvp-vote-card',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatBottomSheetModule, 
    MatProgressSpinnerModule, 
    MatSnackBarModule, 
    TranslateModule, 
    MatTooltipModule
  ],
  templateUrl: './mvp-vote-card.component.html',
  styleUrls: ['./mvp-vote-card.component.scss']
})
export class MvpVoteCardComponent implements OnInit {
  @Input() groupeId!: number;

  private voteService = inject(InvitationService);
  private authService = inject(AuthService);
  private bottomSheet = inject(MatBottomSheet);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  nomines = signal<any[]>([]);
  isLoading = signal(true);
  hasVoted = signal(false);
  isEligible = signal(true);
  currentMonthLabel = signal<string>('');

  ngOnInit() {
    if (!this.groupeId) {
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
    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    // Chargement parallèle de l'éligibilité, du statut de vote et des nominés
    forkJoin({
      eligible: this.voteService.verifierVoteur(this.groupeId, userId),
      voted: this.voteService.verifierVote(this.groupeId, userId),
      players: this.voteService.getnomines(this.groupeId)
    }).subscribe({
      next: (res) => {
        this.isEligible.set(res.eligible);
        this.hasVoted.set(res.voted);
        this.nomines.set(res.players || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  calculatePercentage(votes: number): number {
    if (!this.nomines().length) return 0;
    const maxVotes = Math.max(...this.nomines().map(p => p.votesCount || 0));
    return maxVotes === 0 ? 0 : (votes / maxVotes) * 100;
  }

  openVoteSheet(player: any) {
    if (this.hasVoted() || !this.isEligible()) return;

    const sheetRef = this.bottomSheet.open(VoteActionSheetComponent, {
      data: { player, groupeId: this.groupeId }
    });

    sheetRef.afterDismissed().subscribe(result => {
      if (result?.success) {
        this.hasVoted.set(true);
        this.checkStatusAndLoad(); // Recharger pour voir les scores mis à jour
        this.snackBar.open(this.translate.instant('mvpVote.voteSuccess'), 'OK', { duration: 3000 });
      }
    });
  }

  shareVote() {
    const text = `Découvrez les nominés MVP de ${this.currentMonthLabel()} !`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }
}