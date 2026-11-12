import { Component, OnInit, computed, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, RouterModule } from '@angular/router';
import { ScrutinResume, ScrutinService, TypeScrutin } from '../../../../core/services/scrutin.service';

/**
 * Carte du fil d'actualité : les votes ouverts du groupe. On y voit si on a déjà voté ;
 * un clic mène à la page de vote. Plus aucun vote ouvert = message d'attente.
 */
@Component({
  selector: 'app-mvp-vote-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterModule, TranslateModule, MatTooltipModule],
  templateUrl: './mvp-vote-card.component.html',
  styleUrls: ['./mvp-vote-card.component.scss']
})
export class MvpVoteCardComponent implements OnInit {
  @Input() groupeId!: number;

  private api = inject(ScrutinService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  readonly icones: Record<TypeScrutin, string> = {
    MVP_MATCH: 'sports_soccer',
    MVP_MOIS: 'military_tech',
    FAIR_PLAY_MOIS: 'handshake',
    BALLON_OR_ANNEE: 'emoji_events',
    PERSONNALISE: 'how_to_vote'
  };

  isLoading = signal(true);
  scrutins = signal<ScrutinResume[]>([]);
  ouverts = computed(() => this.scrutins().filter(s => s.statut === 'OUVERT'));

  ngOnInit(): void {
    if (!this.groupeId) {
      this.isLoading.set(false);
      return;
    }
    this.api.lister().subscribe({
      next: liste => { this.scrutins.set(liste); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  allerVoter(s: ScrutinResume): void {
    this.router.navigate(['/membre/vote'], { queryParams: { scrutin: s.id } });
  }

  onViewResults(): void {
    this.router.navigate(['/membre/vote/winner']);
  }

  shareVote(s: ScrutinResume): void {
    const appUrl = `${window.location.origin}/membre/vote?scrutin=${s.id}`;
    const text = this.translate.instant('scrutins.member.shareText', { titre: s.titre, url: appUrl });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }
}
