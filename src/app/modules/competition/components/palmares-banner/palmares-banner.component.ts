import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Palmarès d'une compétition terminée : champion, finaliste, 3e.
 * Pensé mobile d'abord : empilé sur petit écran, 3 colonnes à partir de la tablette.
 */
@Component({
  selector: 'app-palmares-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="palmares" *ngIf="champion" aria-label="Palmarès">
      <div class="palmares__champion">
        <mat-icon class="palmares__trophy">emoji_events</mat-icon>
        <div>
          <span class="palmares__label">Champion</span>
          <strong class="palmares__nom">{{ champion }}</strong>
        </div>
      </div>
      <div class="palmares__rang palmares__rang--2" *ngIf="finaliste">
        <span class="palmares__medal">2</span>
        <div>
          <span class="palmares__label">Finaliste</span>
          <span class="palmares__nom">{{ finaliste }}</span>
        </div>
      </div>
      <div class="palmares__rang palmares__rang--3" *ngIf="troisieme">
        <span class="palmares__medal">3</span>
        <div>
          <span class="palmares__label">3<sup>e</sup> place</span>
          <span class="palmares__nom">{{ troisieme }}</span>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./palmares-banner.component.scss']
})
export class PalmaresBannerComponent {
  @Input() champion?: string | null;
  @Input() finaliste?: string | null;
  @Input() troisieme?: string | null;
}
