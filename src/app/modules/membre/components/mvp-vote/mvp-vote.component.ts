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
  const user = this.authService.getUser();
  const gId = this.authService.getGroupe();

  if (!user?.id || !gId) {
    console.log(user)
    console.log(gId)
    this.isLoading.set(false);
    return;
  }

  // 1. On vérifie d'abord l'éligibilité (Règle des 50% de présence)
  this.voteService.verifierVoteur(gId, user.id).pipe(
    switchMap((eligible: boolean) => {
      this.isEligible.set(true);
      
      // if (!eligible) {
      //   this.statusMessage.set("Vous n'êtes pas éligible pour ce vote. Critère : participation à au moins 50% des matchs du mois.");
      //   return of(null); // On arrête là si pas éligible
      // }

      // 2. Si éligible, on vérifie s'il a déjà voté
      return this.voteService.verifierVote(gId, user.id);
    }),
    switchMap((voted) => {
      console.log("peux voter" + voted)
      // Si l'utilisateur est inéligible, voted sera null (venant de l'of(null) précédent)
      if (voted === null) return of([]);

      this.hasVoted.set(voted);
      if (voted) {
        this.statusMessage.set("Vous avez déjà enregistré votre vote pour ce mois.");
        return of([]);
      }

      // 3. Éligible et n'a pas voté : on charge les nominés
      return this.voteService.getnomines(gId);
    })
  ).subscribe({
    next: (players) => {
      if (players && players.length > 0) {
        this.nomines.set(players);
      }
      this.isLoading.set(false);
    },
    error: () => {
      this.statusMessage.set("Erreur lors de la vérification de vos droits de vote.");
      this.isLoading.set(false);
    }
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