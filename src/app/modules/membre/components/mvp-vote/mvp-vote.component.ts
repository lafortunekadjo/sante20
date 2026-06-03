import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { InvitationService } from '../../../../core/services/invitation.service';
import { VoteActionSheetComponent } from '../vote-action-sheet/vote-action-sheet.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


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
    private translate = inject(TranslateService);

  nomines = signal<any[]>([]);
  isLoading = signal(true);
  hasVoted = signal(false); // Directement lie au boolean du backend
  isEligible = signal(false); 
  currentMonthLabel = signal<string>('');

  ngOnInit() {
    this.checkStatusAndLoad();
     this.setCurrentMonthLabel();
  }

  private setCurrentMonthLabel() {
  const date = new Date();
  
  // 🔥 Alignement avec la logique backend :
  // Si on est entre le 1er et le 7 du mois, on affiche le mois précédent
  if (date.getDate() <= 7) {
    date.setMonth(date.getMonth() - 1);
  }

  // Formatage localisé (affichera "mai 2026" au lieu de "juin 2026" si on est le 2 juin)
  const formattedLabel = date.toLocaleDateString(this.translate.currentLang, { 
    month: 'long', 
    year: 'numeric' 
  });

  // Capitalisation de la première lettre (ex: "Mai 2026")
  const capitalizedLabel = formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);

  this.currentMonthLabel.set(capitalizedLabel);
}

// Définition d'un type pour la clarté du message
statusMessage = signal<string>('');

checkStatusAndLoad(): void {
  const user = this.authService.getUser();
  const gId = this.authService.getGroupe();

  // 1. Sécurité : on s'assure que les IDs ne sont pas nuls
  if (!user?.userId || !gId) {
    this.isLoading.set(false);
    return;
  }

  this.isLoading.set(true);

  // 2. Création de l'objet de requêtes typé
  const sources = {
    eligible: this.voteService.verifierVoteur(gId, user.userId).pipe(catchError(() => of(false))),
    voted: this.voteService.verifierVote(gId, user.userId).pipe(catchError(() => of(false))),
    players: this.voteService.getnomines(gId).pipe(catchError(() => of([])))
  };

  

  // 3. Exécution avec forkJoin
  forkJoin(sources).subscribe({
    next: (res) => {
      this.isEligible.set(res.eligible);
      this.hasVoted.set(res.voted === true);
      this.nomines.set(res.players || []);
      this.isLoading.set(false);
      console.log(res)
    },
    error: (err) => {
      console.error("Erreur My2-0:", err);
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




