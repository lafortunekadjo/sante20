import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { InvitationService } from '../../../../core/services/invitation.service';
import { VoteActionSheetComponent } from '../vote-action-sheet/vote-action-sheet.component';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-mvp-vote',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatBottomSheetModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './mvp-vote.component.html',
  styleUrls: ['./mvp-vote.component.scss']
})
export class MvpVoteComponent implements OnInit {
  private voteService = inject(InvitationService);
  private authService = inject(AuthService);
  private bottomSheet = inject(MatBottomSheet);
  private snackBar = inject(MatSnackBar);

  nominés = signal<any[]>([]);
  isLoading = signal(true);
  hasVoted = signal(false); // Directement lié au boolean du backend

  ngOnInit() {
    this.checkStatusAndLoad();
  }

  checkStatusAndLoad() {
    const user = this.authService.getUser();
    const gId = this.authService.getGroupe(); // récupéré via route params

    if (!user?.id) return;

    // Appel direct à ton API qui renvoie boolean
    this.voteService.verifierVote(gId, user.id).subscribe({
      next: (voted: boolean) => {
        this.hasVoted.set(voted);
        
        // Si l'utilisateur n'a pas encore voté, on charge les candidats
        if (!voted) {
          this.voteService.getnomines(gId).subscribe(players => {
            this.nominés.set(players);
            this.isLoading.set(false);
          });
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  openVoteSheet(player: any) {
    const sheetRef = this.bottomSheet.open(VoteActionSheetComponent, {
      data: { player, groupeId: this.authService.getGroupe() }
    });

    sheetRef.afterDismissed().subscribe(result => {
      if (result?.success) {
        this.hasVoted.set(true);
        this.snackBar.open('Vote enregistré !', 'OK', { duration: 3000 });
      } else if (result?.error) {
        // C'est ici qu'on gère le message "Désolé, il faut 50% de présence"
        this.snackBar.open(result.error, 'Compris', { duration: 5000 });
      }
    });
  }
}