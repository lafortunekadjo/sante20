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
import { of, switchMap } from 'rxjs';


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

  nomines = signal<any[]>([]);
  isLoading = signal(true);
  hasVoted = signal(false); // Directement lie au boolean du backend
  isEligible = signal(false); 

  ngOnInit() {
    this.checkStatusAndLoad();
  }

// Définition d'un type pour la clarté du message
statusMessage = signal<string>('');

checkStatusAndLoad() {
    const userId = this.authService.getUserId();
    const groupeId = this.authService.getGroupe();
    // Sécurité : Seul un user connecté peut voter
    if (!userId) {
      this.isLoading.set(false);
      return; 
    }

    // 1. Vérifier si l'utilisateur a déjà voté ce mois-ci
    this.voteService.verifierVote(groupeId, userId).subscribe({
      
      next: (voted: boolean) => {
        console.log(voted)
        this.hasVoted.set(voted);
        
        // 2. Si non voté, charger les nomines (Top 3 calculé par le backend)
        if (!voted) {
          this.voteService.getnomines(groupeId).subscribe({
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
    const sheetRef = this.bottomSheet.open(VoteActionSheetComponent, {
      data: { player, groupeId: this.authService.getGroupe() }
    });

    sheetRef.afterDismissed().subscribe(result => {
      if (result?.success) {
        this.hasVoted.set(true);
        this.snackBar.open('Vote enregistre !', 'OK', { duration: 3000 });
      } else if (result?.error) {
        // C'est ici qu'on gère le message "Desole, il faut 50% de presence"
        this.snackBar.open(result.error, 'Compris', { duration: 5000 });
      }
    });
  }
}