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
import { catchError, forkJoin, of } from 'rxjs';
import { Router } from '@angular/router';

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
  private router =  inject(Router);

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

onViewResults() {
    console.log('L’utilisateur souhaite voir les résultats');
    
    // 3. Redirection vers la route 'membre/vote'
    this.router.navigate(['/membre/vote']);
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
      },
      error: (err) => {
        console.error("Erreur My2-0:", err);
        this.isLoading.set(false);
      }
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
  // Lien direct vers la page de vote de ton application (à adapter avec ton vrai domaine)
  const appUrl = `${window.location.origin}/membre/vote`; 
  
  // Un texte accrocheur et communautaire pour pousser à l'action
  const text = `🏆 *MVP ${this.currentMonthLabel()}* 🏆\n\n` +
               `Les nominations pour le joueur du mois sont en ligne ! 🔥\n` +
               `Viens soutenir tes performances collectives et vote pour ton favori dès maintenant. Ton vote compte pour le classement final ! 🗳️⚽\n\n` +
               `👉 Clique ici pour voter : ${appUrl}`;

  // Encodage propre pour WhatsApp
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  
  // Ouverture sécurisée du lien WhatsApp
  window.open(whatsappUrl, '_blank');
}
}