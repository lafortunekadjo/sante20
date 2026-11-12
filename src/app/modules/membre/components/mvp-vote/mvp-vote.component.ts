import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScrutinDetail, ScrutinResume, ScrutinService, TypeScrutin } from '../../../../core/services/scrutin.service';
import { VoteActionSheetComponent } from '../vote-action-sheet/vote-action-sheet.component';

/**
 * Votes du groupe côté membre : liste des votes ouverts (on y vote) et des votes clos (on y voit le classement).
 * Les votes sont anonymes et les résultats ne sont montrés qu'à la clôture.
 */
@Component({
  selector: 'app-mvp-vote',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatBottomSheetModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './mvp-vote.component.html',
  styleUrls: ['./mvp-vote.component.scss']
})
export class MvpVoteComponent implements OnInit {
  private api = inject(ScrutinService);
  private bottomSheet = inject(MatBottomSheet);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);

  readonly icones: Record<TypeScrutin, string> = {
    MVP_MATCH: 'sports_soccer',
    MVP_MOIS: 'military_tech',
    FAIR_PLAY_MOIS: 'handshake',
    BALLON_OR_ANNEE: 'emoji_events',
    PERSONNALISE: 'how_to_vote'
  };

  isLoading = signal(true);
  scrutins = signal<ScrutinResume[]>([]);
  /** Vote actuellement déplié (nominés ou classement). */
  detail = signal<ScrutinDetail | null>(null);
  isLoadingDetail = signal(false);

  ouverts = computed(() => this.scrutins().filter(s => s.statut === 'OUVERT'));
  clos = computed(() => this.scrutins().filter(s => s.statut === 'CLOS'));

  ngOnInit(): void {
    const cible = Number(this.route.snapshot.queryParamMap.get('scrutin')) || null;
    this.charger(cible);
  }

  charger(ouvrirId: number | null = null): void {
    this.isLoading.set(true);
    this.api.lister().subscribe({
      next: liste => {
        this.scrutins.set(liste);
        this.isLoading.set(false);
        // Lien direct depuis le fil d'actualité, ou un seul vote ouvert : on le déplie tout de suite
        const aOuvrir = ouvrirId ?? (liste.filter(s => s.statut === 'OUVERT').length === 1
          ? liste.find(s => s.statut === 'OUVERT')!.id : null);
        if (aOuvrir && liste.some(s => s.id === aOuvrir)) this.ouvrir(aOuvrir);
      },
      error: () => this.isLoading.set(false)
    });
  }

  ouvrir(id: number): void {
    if (this.detail()?.scrutin.id === id) { this.detail.set(null); return; }
    this.isLoadingDetail.set(true);
    this.api.detail(id).subscribe({
      next: d => { this.detail.set(d); this.isLoadingDetail.set(false); },
      error: () => this.isLoadingDetail.set(false)
    });
  }

  /** Vrai si le membre peut encore donner une voix à ce nominé. */
  peutVoterPour(nomineId: number): boolean {
    const d = this.detail();
    // Le vote pour soi-même éventuellement interdit est refusé par le serveur, qui renvoie un message clair.
    return !!d && d.scrutin.peutVoter && !d.mesChoix.includes(nomineId);
  }

  voter(nomine: { membreId: number; prenom: string; nom: string; photoUrl: string | null }): void {
    const d = this.detail();
    if (!d || !this.peutVoterPour(nomine.membreId)) return;

    const sheetRef = this.bottomSheet.open(VoteActionSheetComponent, {
      data: { player: nomine, scrutinId: d.scrutin.id, titre: d.scrutin.titre, commentaire: d.regles.commentaire }
    });
    sheetRef.afterDismissed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open(this.translate.instant('mvpVote.votedTitle'), 'OK', { duration: 3000 });
        this.api.detail(d.scrutin.id).subscribe(maj => this.detail.set(maj));
        this.api.lister().subscribe(liste => this.scrutins.set(liste));
      } else if (result?.error) {
        this.snackBar.open(result.error, this.translate.instant('scrutins.close'), { duration: 5000 });
      }
    });
  }

  /** Nombre de voix qu'il reste à donner (scrutins à plusieurs voix). */
  voixRestantes(): number {
    const d = this.detail();
    return d ? Math.max(0, d.regles.voixParVotant - d.mesChoix.length) : 0;
  }

  getInitials(prenom: string, nom: string): string {
    return (prenom?.[0]?.toUpperCase() || '') + (nom?.[0]?.toUpperCase() || '');
  }

  getAvatarColor(id: number): string {
    const colors = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'];
    return colors[(id || 0) % colors.length];
  }
}
