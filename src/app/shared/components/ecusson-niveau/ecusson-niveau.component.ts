import { Component, Input, computed, signal } from '@angular/core';

/** Couleur de chaque niveau de la Ligue des Légendes (identique à la page Ligue). */
export const COULEURS_NIVEAU = ['#6b7280', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f97316'];

/** Écusson du niveau : blason coloré avec le numéro, étoiles ajoutées à chaque niveau, couronne au niveau maximum. */
@Component({
  selector: 'app-ecusson-niveau',
  standalone: true,
  template: `
  <svg [attr.width]="taille" [attr.height]="taille * 1.15" viewBox="0 0 100 115" role="img" [attr.aria-label]="'Niveau ' + niveauBorne()">
    <defs>
      <linearGradient [attr.id]="idDegrade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" [attr.stop-color]="clair()"/>
        <stop offset="1" [attr.stop-color]="couleur()"/>
      </linearGradient>
    </defs>
    <path d="M50 4 L92 18 V58 C92 84 72 102 50 111 C28 102 8 84 8 58 V18 Z"
          [attr.fill]="'url(#' + idDegrade + ')'" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
    <path d="M50 14 L82 25 V57 C82 77 67 91 50 99 C33 91 18 77 18 57 V25 Z" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"/>
    <text x="50" y="66" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="40" fill="#ffffff">{{ niveauBorne() }}</text>
    @if (max()) {
      <path d="M30 22 L36 8 L44 18 L50 4 L56 18 L64 8 L70 22 Z" fill="#fde047" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
    } @else {
      @for (e of etoiles(); track e) {
        <circle [attr.cx]="50 + (e - (niveauBorne() - 1) / 2) * 11" cy="84" r="3.2" fill="#fde047"/>
      }
    }
  </svg>
  `,
  styles: [`:host { display: inline-block; line-height: 0; } svg { filter: drop-shadow(0 2px 4px rgba(0,0,0,.25)); }`]
})
export class EcussonNiveauComponent {
  private static compteur = 0;

  readonly niveau = signal(1);
  @Input({ required: true }) set value(n: number) { this.niveau.set(n || 1); }
  @Input() taille = 56;

  readonly idDegrade = 'ecusson-' + (++EcussonNiveauComponent.compteur);
  readonly niveauBorne = computed(() => Math.max(1, Math.min(6, this.niveau())));
  readonly couleur = computed(() => COULEURS_NIVEAU[this.niveauBorne() - 1]);
  readonly clair = computed(() => this.couleur() + 'bb');
  readonly max = computed(() => this.niveauBorne() === 6);
  /** Une étoile par niveau gagné au-delà du premier (rien au niveau 1). */
  readonly etoiles = computed(() => Array.from({ length: this.niveauBorne() - 1 }, (_, i) => i));
}
