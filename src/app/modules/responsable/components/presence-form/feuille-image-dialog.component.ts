import { Component, Inject, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { MatchImageService } from '../../../../core/services/match-image.service';

export type FormatFeuille = 'full' | 'story';

/** Fonds proposés pour l'image de la feuille de match (les codes sont ceux du serveur ; le CSS n'est qu'un aperçu de la vignette). */
export const FONDS_FEUILLE: { code: string; css: string }[] = [
  { code: 'NUIT', css: 'radial-gradient(circle at 20% 25%, rgba(124,58,237,.65), transparent 45%), radial-gradient(circle at 80% 70%, rgba(6,182,212,.55), transparent 45%), #08080c' },
  { code: 'EQUIPES', css: 'linear-gradient(135deg, rgba(225,29,72,.85) 0%, #09090e 50%, rgba(37,99,235,.85) 100%)' },
  { code: 'TERRAIN', css: 'repeating-linear-gradient(0deg, #106432 0 14px, #0c5429 14px 28px)' },
  { code: 'ROYAL', css: 'radial-gradient(circle at 92% 0, rgba(250,204,21,.45), transparent 40%), linear-gradient(135deg, #080e2e, #182668)' },
  { code: 'BRAISE', css: 'radial-gradient(circle at 20% 100%, rgba(255,96,24,.7), transparent 55%), linear-gradient(180deg, #1c0406, #4e1008)' },
  { code: 'STADE', css: 'linear-gradient(160deg, rgba(255,255,255,.28), transparent 32%), linear-gradient(200deg, rgba(255,255,255,.22), transparent 32%), linear-gradient(180deg, #030612, #0c1830)' },
  { code: 'BLANC', css: 'radial-gradient(circle at 0 0, rgba(225,29,72,.22), transparent 55%), radial-gradient(circle at 100% 100%, rgba(37,99,235,.22), transparent 55%), linear-gradient(180deg, #ffffff, #ecf0f6)' },
  { code: 'PAPIER', css: 'repeating-linear-gradient(0deg, rgba(120,90,40,.06) 0 1px, transparent 1px 8px), linear-gradient(135deg, #fdf9f0, #f1e8d6)' },
  { code: 'CIEL', css: 'radial-gradient(circle at 20% 10%, rgba(255,255,255,.9), transparent 55%), linear-gradient(180deg, #ecf6ff, #c4dcfa)' },
  { code: 'GRAPHITE', css: 'repeating-linear-gradient(45deg, rgba(255,255,255,.05) 0 2px, transparent 2px 10px), linear-gradient(135deg, #0d0d10, #202126)' }
];

const CLE_FOND = 'feuille-fond';
const CLE_FORMAT = 'feuille-format';

/**
 * Choix du fond et du format de l'image de la feuille de match, avec aperçu réel généré par le serveur.
 * Le dernier choix est mémorisé sur l'appareil.
 */
@Component({
  selector: 'app-feuille-image-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  template: `
    <div class="fi">
      <header class="fi__tete">
        <h2>{{ 'feuille.imageTitle' | translate }}</h2>
        <button class="fi__fermer" (click)="ref.close()" [attr.aria-label]="'feuille.close' | translate"><mat-icon>close</mat-icon></button>
      </header>

      <div class="fi__corps">
        <div class="fi__apercu" [class.fi__apercu--story]="format() === 'story'">
          <mat-spinner *ngIf="chargement()" diameter="36"></mat-spinner>
          <img *ngIf="apercu() && !chargement()" [src]="apercu()" alt="" />
          <p *ngIf="erreur() && !chargement()" class="fi__erreur">{{ 'feuille.previewError' | translate }}</p>
        </div>

        <div class="fi__reglages">
          <h3>{{ 'feuille.format' | translate }}</h3>
          <div class="fi__segment">
            <button type="button" [class.actif]="format() === 'full'" (click)="choisirFormat('full')">{{ 'feuille.formatFull' | translate }}</button>
            <button type="button" [class.actif]="format() === 'story'" (click)="choisirFormat('story')">{{ 'feuille.formatStory' | translate }}</button>
          </div>

          <h3>{{ 'feuille.background' | translate }}</h3>
          <div class="fi__fonds">
            <button type="button" class="fi__fond" *ngFor="let f of fonds" [class.actif]="fond() === f.code" (click)="choisirFond(f.code)">
              <span class="fi__vignette" [style.background]="f.css"></span>
              <span class="fi__nom">{{ 'feuille.fonds.' + f.code | translate }}</span>
            </button>
          </div>
        </div>
      </div>

      <footer class="fi__pied">
        <button class="btn-outline" (click)="telecharger()"><mat-icon>download</mat-icon>{{ 'feuille.download' | translate }}</button>
        <button class="btn-primary" (click)="partager()"><mat-icon>share</mat-icon>{{ 'feuille.share' | translate }}</button>
      </footer>
    </div>
  `,
  styles: [`
    .fi { display: flex; flex-direction: column; max-height: 92vh; width: min(760px, 100vw); }
    .fi__tete { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 6px; h2 { margin: 0; font-size: 18px; } }
    .fi__fermer { width: 44px; height: 44px; border: 0; background: none; cursor: pointer; border-radius: 12px; }
    .fi__corps { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 8px 16px; overflow-y: auto; }
    .fi__apercu { display: flex; align-items: center; justify-content: center; min-height: 260px; border-radius: 14px; background: var(--background-secondary);
      img { max-width: 100%; max-height: 56vh; border-radius: 10px; box-shadow: 0 6px 22px rgba(0,0,0,.35); } }
    .fi__apercu--story img { max-height: 62vh; }
    .fi__erreur { margin: 0; padding: 16px; text-align: center; color: #b91c1c; font-size: 13px; }
    .fi__reglages h3 { margin: 4px 0 8px; font-size: 13px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .4px; }
    .fi__segment { display: flex; padding: 3px; gap: 3px; border-radius: 12px; background: var(--background-secondary); margin-bottom: 14px;
      button { flex: 1; min-height: 42px; border: 0; border-radius: 10px; background: transparent; cursor: pointer; font-weight: 600; color: var(--text-secondary);
        &.actif { background: var(--primary-color); color: #fff; } } }
    .fi__fonds { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .fi__fond { display: flex; flex-direction: column; align-items: stretch; gap: 4px; padding: 4px; border: 2px solid transparent; border-radius: 12px; background: none; cursor: pointer; min-height: 44px;
      &.actif { border-color: var(--primary-color); } }
    .fi__vignette { display: block; height: 54px; border-radius: 8px; border: 1px solid rgba(128,128,128,.35); }
    .fi__nom { font-size: 11.5px; font-weight: 600; text-align: center; color: var(--text-primary); }
    .fi__pied { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px calc(14px + env(safe-area-inset-bottom)); border-top: 1px solid var(--border-color, #e2e8f0); }
    @media (max-width: 640px) {
      .fi__corps { grid-template-columns: 1fr; }
      .fi__apercu { min-height: 200px; }
      .fi__pied button { flex: 1; }
    }
  `]
})
export class FeuilleImageDialogComponent implements OnInit, OnDestroy {
  private images = inject(MatchImageService);
  private sanitizer = inject(DomSanitizer);

  readonly fonds = FONDS_FEUILLE;
  format = signal<FormatFeuille>(this.lire(CLE_FORMAT, 'full') === 'story' ? 'story' : 'full');
  fond = signal<string>(this.lire(CLE_FOND, 'NUIT'));
  apercu = signal<SafeUrl | null>(null);
  chargement = signal(false);
  erreur = signal(false);
  private urlObjet: string | null = null;
  private requete = 0;

  constructor(public ref: MatDialogRef<FeuilleImageDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { matchId: number }) {}

  ngOnInit(): void { this.rafraichir(); }

  ngOnDestroy(): void { this.liberer(); }

  choisirFond(code: string): void { this.fond.set(code); this.ecrire(CLE_FOND, code); this.rafraichir(); }

  choisirFormat(f: FormatFeuille): void { this.format.set(f); this.ecrire(CLE_FORMAT, f); this.rafraichir(); }

  telecharger(): void { this.images.downloadMatchImage(this.data.matchId, this.format(), this.fond()); }

  partager(): void { void this.images.shareMatchImage(this.data.matchId, this.format(), this.fond()); }

  /** Aperçu réel : c'est le serveur qui dessine ; une réponse tardive d'un ancien choix est ignorée. */
  private rafraichir(): void {
    const numero = ++this.requete;
    this.chargement.set(true);
    this.erreur.set(false);
    this.images.obtenirImage(this.data.matchId, this.format(), this.fond()).subscribe({
      next: blob => {
        if (numero !== this.requete) return;
        this.liberer();
        this.urlObjet = URL.createObjectURL(blob);
        this.apercu.set(this.sanitizer.bypassSecurityTrustUrl(this.urlObjet));
        this.chargement.set(false);
      },
      error: () => { if (numero === this.requete) { this.chargement.set(false); this.erreur.set(true); } }
    });
  }

  private liberer(): void { if (this.urlObjet) { URL.revokeObjectURL(this.urlObjet); this.urlObjet = null; } }

  private lire(cle: string, defaut: string): string {
    try { return localStorage.getItem(cle) || defaut; } catch { return defaut; }
  }

  private ecrire(cle: string, valeur: string): void {
    try { localStorage.setItem(cle, valeur); } catch { /* stockage indisponible : le choix n'est pas mémorisé */ }
  }
}
