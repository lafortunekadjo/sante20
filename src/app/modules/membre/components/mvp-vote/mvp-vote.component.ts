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

  if (!user?.userId || !gId) {
    this.isLoading.set(false);
    return;
  }

  // 1. Vérification de l'éligibilité (Règle des 50% de présence)
  this.voteService.verifierVoteur(gId, user.userId).pipe(
    switchMap((eligible: boolean) => {
      this.isEligible.set(eligible);
      
      // 2. Vérification si l'utilisateur a déjà voté
      // On continue le flux même si non éligible pour charger les résultats
      return this.voteService.verifierVote(gId, user.userId);
    }),
    switchMap((voted) => {
      // On met à jour le signal du vote
      this.hasVoted.set(voted === true);

      // 3. Chargement systématique des nominés
      // Cela permet d'afficher les votesCount pour le mode "Tendances"
      return this.voteService.getnomines(gId);
    })
  ).subscribe({
    next: (players) => {
      if (players && players.length > 0) {
        // Met à jour la liste des nominés (incluant les votesCount du backend)
        this.nomines.set(players);
      }
      this.isLoading.set(false);
    },
    error: (err) => {
      console.error("Erreur My2-0:", err);
      this.statusMessage.set("Erreur lors de la récupération des données de vote.");
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

  // À ajouter dans la classe MvpVoteComponent
calculatePercentage(votes: number): number {
  if (!this.nomines() || this.nomines().length === 0) return 0;
  
  // On trouve le maximum de votes parmi les nominés pour définir l'échelle
  const maxVotes = Math.max(...this.nomines().map(p => p.votesCount || 0));
  
  if (maxVotes === 0) return 0;
  return (votes / maxVotes) * 100;
}

getInitials(prenom: string, nom: string): string {
  const p = prenom ? prenom.charAt(0).toUpperCase() : '';
  const n = nom ? nom.charAt(0).toUpperCase() : '';
  return p + n;
}

// Génère une couleur de fond stable basée sur l'ID du joueur
getAvatarColor(playerId: number): string {
  const colors = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'];
  return colors[playerId % colors.length];
}
}