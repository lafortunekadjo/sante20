import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { InvitationService } from '../../../../core/services/invitation.service';
import { VoteActionSheetComponent } from '../vote-action-sheet/vote-action-sheet.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-mvp-vote',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatBottomSheetModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './mvp-vote.component.html',
  styleUrls: ['./mvp-vote.component.scss']
})
export class MvpVoteComponent implements OnInit {
  private voteService  = inject(InvitationService);
  private authService  = inject(AuthService);
  private bottomSheet  = inject(MatBottomSheet);
  private snackBar     = inject(MatSnackBar);
  private translate    = inject(TranslateService);

  // Poids configurables depuis le groupe (défaut 60/40)
  @Input() poidsStatistique = 60;
  @Input() poidsVotePublic  = 40;

  // ── State ─────────────────────────────────────────────────
  nomines          = signal<any[]>([]);
  isLoading        = signal(true);
  hasVoted         = signal(false);
  isEligible       = signal(false);
  currentMonthLabel = signal<string>('');
  statusMessage    = signal<string>('');

  // ── Nominés triés par score pondéré ───────────────────────
  // Score = (buts + pénalties) + (passes × 0.5) + (motm × 2) + (mvpEquipe × 1.5)
  // + contribution des votes (backend renvoie votesCount)
  // On trie uniquement par votesCount car le backend intègre déjà
  // la pondération stats+votes dans le calcul du winner.
  // Ici on affiche le classement "temps réel" basé sur les votes visibles.
  nominesTries = computed(() =>
    [...this.nomines()].sort((a, b) => {
      const scoreA = this.calculerScore(a);
      const scoreB = this.calculerScore(b);
      return scoreB - scoreA; // décroissant
    })
  );

  ngOnInit(): void {
    this.setCurrentMonthLabel();
    this.checkStatusAndLoad();
  }

  // ── Score pondéré côté front (miroir du backend) ──────────
  // statScore = buts + pénalties + (passes × 0.5) + (motm × 2) + (mvpEquipe × 1.5)
  // totalScore = statScore + (votesCount × 1)  ← poids votes simplifié
  // Note : le poids exact (poidsStatistique / poidsVotePublic) est configurable
  // côté groupe. Ici on applique un ratio 60/40 par défaut pour l'affichage.
  private calculerScore(player: any): number {
    // ── calculateStatScore() backend ──────────────────────────
    // MOTM       × 10  → player.motm
    // MVP Équipe × 5   → player.mvpEquipe
    // Buts       × 4   → player.buts (déjà = goals + penalties côté backend)
    // Passes D.  × 3   → player.passes
    // Présences  × 1   → player.presences
    const statScore =
      (player.motm       || 0) * 10 +
      (player.mvpEquipe  || 0) * 5  +
      (player.buts       || 0) * 4  +
      (player.passes     || 0) * 3  +
      (player.presences  || 0) * 1;

    // ── calculateMixedScore() backend ─────────────────────────
    // Score final = (statScore × poidsStatistique/100) + (votes × poidsVotePublic/100)
    // poidsStatistique + poidsVotePublic = 100 (configuré dans le groupe)
    // On applique les poids en @Input() si disponibles, sinon défaut 60/40
    const poidsStat  = this.poidsStatistique / 100;
    const poidsVote  = this.poidsVotePublic  / 100;

    return (statScore * poidsStat) + ((player.currentVotes || 0) * poidsVote);
  }

  // ── Mois courant (aligné logique backend) ────────────────
  private setCurrentMonthLabel(): void {
    const date = new Date();
    if (date.getDate() <= 7) date.setMonth(date.getMonth() - 1);
    const label = date.toLocaleDateString(this.translate.currentLang, {
      month: 'long', year: 'numeric'
    });
    this.currentMonthLabel.set(label.charAt(0).toUpperCase() + label.slice(1));
  }

  // ── Chargement ────────────────────────────────────────────
  checkStatusAndLoad(): void {
    const user = this.authService.getUser();
    const gId  = this.authService.getGroupe();
    if (!user?.userId || !gId) { this.isLoading.set(false); return; }

    this.isLoading.set(true);

    forkJoin({
      eligible: this.voteService.verifierVoteur(gId, user.userId).pipe(catchError(() => of(false))),
      voted:    this.voteService.verifierVote(gId, user.userId).pipe(catchError(() => of(false))),
      players:  this.voteService.getnomines(gId).pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.isEligible.set(!!res.eligible);
        this.hasVoted.set(res.voted === true);
        this.nomines.set(res.players || []);
        this.isLoading.set(false);
        console.log(this.nomines)
      },
      error: () => this.isLoading.set(false)
    });
  }

  // ── Vote ──────────────────────────────────────────────────
  openVoteSheet(player: any): void {
    const sheetRef = this.bottomSheet.open(VoteActionSheetComponent, {
      data: { player, groupeId: this.authService.getGroupe() }
    });
    sheetRef.afterDismissed().subscribe(result => {
      if (result?.success) {
        this.hasVoted.set(true);
        // Incrémenter localement le compteur du joueur voté
        this.nomines.update(list =>
          list.map(p => p.id === player.id
            ? { ...p, votesCount: (p.votesCount || 0) + 1 }
            : p
          )
        );
        this.snackBar.open('Vote enregistré !', 'OK', { duration: 3000 });
      } else if (result?.error) {
        this.snackBar.open(result.error, 'Compris', { duration: 5000 });
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────

  // Barre de progression relative au meilleur score
  calculatePercentage(player: any): number {
    const list = this.nominesTries();
    if (!list.length) return 0;
    const maxScore = this.calculerScore(list[0]);
    if (maxScore === 0) return 0;
    return Math.round((this.calculerScore(player) / maxScore) * 100);
  }

  getInitials(prenom: string, nom: string): string {
    return (prenom?.[0]?.toUpperCase() || '') + (nom?.[0]?.toUpperCase() || '');
  }

  getAvatarColor(playerId: number): string {
    const colors = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'];
    return colors[(playerId || 0) % colors.length];
  }
}