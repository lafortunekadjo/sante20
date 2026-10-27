import { TranslateModule } from '@ngx-translate/core';
import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment';
import { EcussonNiveauComponent } from '../ecusson-niveau/ecusson-niveau.component';

interface NiveauDto {
  niveau: number;
  titre: string;
  xpTotal: number;
  xpNiveau: number;
  xpProchainNiveau: number;
  prochainTitre?: string | null;
  progression: number;
  niveauMax: boolean;
}

interface BadgeDto { code: string; nom: string; emoji?: string }

/** Niveau de la Ligue des Légendes d'un joueur (même calcul partout) : titre, XP, avancement et badges. */
@Component({
  selector: 'app-niveau-joueur',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterLink, EcussonNiveauComponent],
  template: `
  @if (niveau(); as n) {
    <a class="nj" [routerLink]="['/ligue']" [class.nj--compact]="compact">
      <app-ecusson-niveau [value]="n.niveau" [taille]="compact ? 26 : 64"/>
      <span class="nj__titre">{{ n.titre }}</span>
      <span class="nj__niv">{{ 'niveauJoueur.niveau' | translate }} {{ n.niveau }}</span>
      <span class="nj__xp">{{ n.xpTotal }} XP</span>
      @if (!compact) {
        <span class="nj__barre"><i [style.width.%]="n.progression"></i></span>
        <small class="nj__suite">
          @if (n.niveauMax) { {{ 'niveauJoueur.max' | translate }} }
          @else { {{ n.xpProchainNiveau - n.xpTotal }} XP {{ 'niveauJoueur.avant' | translate }} {{ n.prochainTitre }} }
        </small>
      }
    </a>
    @if (!compact && badges().length) {
      <div class="nj__badges">
        @for (b of badges(); track b.code) { <span class="nj__badge" [title]="b.nom">{{ b.emoji }} {{ b.nom }}</span> }
      </div>
    }
  }
  `,
  styles: [`
    :host { display: block; }
    .nj { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; padding: 8px 12px; border-radius: 14px; text-decoration: none;
          color: var(--text-primary); background: var(--background-secondary); border: 1px solid var(--border-color, #e2e8f0); max-width: 100%; }
    .nj--compact { padding: 4px 10px; border-radius: 999px; }
    .nj__titre { font-weight: 700; }
    .nj__niv, .nj__xp { font-size: 12.5px; color: var(--text-secondary); }
    .nj__barre { flex-basis: 100%; height: 6px; border-radius: 999px; background: rgba(100,116,139,.25); overflow: hidden; }
    .nj__barre i { display: block; height: 100%; background: linear-gradient(90deg, #1d4ed8, #7c3aed); }
    .nj__suite { flex-basis: 100%; color: var(--text-secondary); font-size: 12px; }
    .nj__badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .nj__badge { font-size: 12px; padding: 2px 8px; border-radius: 999px; background: var(--background-secondary); border: 1px solid var(--border-color, #e2e8f0); }
  `]
})
export class NiveauJoueurComponent implements OnChanges {
  private http = inject(HttpClient);

  @Input({ required: true }) username!: string;
  /** Version courte (titre, niveau, XP) pour les en-têtes. */
  @Input() compact = false;

  niveau = signal<NiveauDto | null>(null);
  badges = signal<BadgeDto[]>([]);

  ngOnChanges(): void {
    if (!this.username) return;
    this.http.get<{ prive: boolean; niveau?: NiveauDto; badges?: BadgeDto[] }>(
      `${environment.apiUrl}/profiles/${encodeURIComponent(this.username)}/niveau`).subscribe({
      next: r => { this.niveau.set(r.prive ? null : r.niveau ?? null); this.badges.set(r.badges ?? []); },
      error: () => { this.niveau.set(null); this.badges.set([]); }
    });
  }
}
