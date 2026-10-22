import { Component, Inject, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { MatchImageService } from '../../../../core/services/match-image.service';
import { FONDS_FEUILLE } from './feuille-image-dialog.component';

export interface JoueurHdm { membreId: number; nom: string; hdm: boolean; }

type FormatFiche = 'carte' | 'story';

const CLE_FOND = 'feuille-fond';

/**
 * Fiche « Homme du match » : on choisit le joueur, on prend (ou choisit) une photo, on choisit le fond,
 * et le serveur dessine la fiche. La photo est réduite sur l'appareil avant l'envoi.
 */
@Component({
  selector: 'app-fiche-hdm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  template: `
    <div class="fh">
      <header class="fh__tete">
        <h2>{{ 'hdm.title' | translate }}</h2>
        <button class="fh__fermer" (click)="ref.close()" [attr.aria-label]="'hdm.close' | translate"><mat-icon>close</mat-icon></button>
      </header>

      <div class="fh__corps">
        <div class="fh__apercu" [class.fh__apercu--story]="format() === 'story'">
          <mat-spinner *ngIf="chargement()" diameter="36"></mat-spinner>
          <img *ngIf="apercu() && !chargement()" [src]="apercu()" alt="" />
          <p *ngIf="erreur() && !chargement()" class="fh__erreur">{{ erreur() }}</p>
        </div>

        <div class="fh__reglages">
          <h3>{{ 'hdm.player' | translate }}</h3>
          <select class="fh__select" [ngModel]="joueurId()" (ngModelChange)="choisirJoueur($event)" name="joueur">
            <option *ngFor="let j of data.joueurs" [ngValue]="j.membreId">{{ j.nom }}{{ j.hdm ? ' ★' : '' }}</option>
          </select>

          <h3>{{ 'hdm.photo' | translate }}</h3>
          <div class="fh__photo">
            <img *ngIf="photoMiniature()" [src]="photoMiniature()" alt="" class="fh__mini" />
            <div class="fh__photo-actions">
              <label class="fh__bouton">
                <mat-icon>photo_camera</mat-icon>{{ 'hdm.takePhoto' | translate }}
                <input type="file" accept="image/*" capture="user" (change)="photoChoisie($event)" hidden />
              </label>
              <label class="fh__bouton fh__bouton--sec">
                <mat-icon>photo_library</mat-icon>{{ 'hdm.pickPhoto' | translate }}
                <input type="file" accept="image/*" (change)="photoChoisie($event)" hidden />
              </label>
              <button type="button" class="fh__lien" *ngIf="photo()" (click)="retirerPhoto()">{{ 'hdm.removePhoto' | translate }}</button>
            </div>
          </div>
          <p class="fh__aide" *ngIf="!photo()">{{ 'hdm.noPhotoHelp' | translate }}</p>

          <h3>{{ 'hdm.format' | translate }}</h3>
          <div class="fh__segment">
            <button type="button" [class.actif]="format() === 'carte'" (click)="choisirFormat('carte')">{{ 'hdm.formatCard' | translate }}</button>
            <button type="button" [class.actif]="format() === 'story'" (click)="choisirFormat('story')">{{ 'hdm.formatStory' | translate }}</button>
          </div>

          <h3>{{ 'feuille.background' | translate }}</h3>
          <div class="fh__fonds">
            <button type="button" class="fh__fond" *ngFor="let f of fonds" [class.actif]="fond() === f.code" (click)="choisirFond(f.code)">
              <span class="fh__vignette" [style.background]="f.css"></span>
              <span class="fh__nom">{{ 'feuille.fonds.' + f.code | translate }}</span>
            </button>
          </div>
        </div>
      </div>

      <footer class="fh__pied">
        <button class="btn-outline" (click)="telecharger()" [disabled]="!blob()"><mat-icon>download</mat-icon>{{ 'feuille.download' | translate }}</button>
        <button class="btn-primary" (click)="partager()" [disabled]="!blob()"><mat-icon>share</mat-icon>{{ 'feuille.share' | translate }}</button>
      </footer>
    </div>
  `,
  styles: [`
    .fh { display: flex; flex-direction: column; max-height: 94vh; width: min(820px, 100vw); }
    .fh__tete { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 6px; h2 { margin: 0; font-size: 18px; } }
    .fh__fermer { width: 44px; height: 44px; border: 0; background: none; cursor: pointer; border-radius: 12px; }
    .fh__corps { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 8px 16px; overflow-y: auto; }
    .fh__apercu { display: flex; align-items: center; justify-content: center; min-height: 280px; border-radius: 14px; background: var(--background-secondary);
      img { max-width: 100%; max-height: 62vh; border-radius: 10px; box-shadow: 0 6px 22px rgba(0,0,0,.35); } }
    .fh__erreur { margin: 0; padding: 16px; text-align: center; color: #b91c1c; font-size: 13px; }
    .fh__reglages h3 { margin: 12px 0 8px; font-size: 13px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .4px; &:first-child { margin-top: 4px; } }
    .fh__select { width: 100%; min-height: 46px; padding: 0 12px; border-radius: 10px; font-size: 16px; border: 1px solid var(--border-color, #cbd5e1); background: var(--background-primary); color: var(--text-primary); }
    .fh__photo { display: flex; gap: 12px; align-items: center; }
    .fh__mini { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid #facc15; flex-shrink: 0; }
    .fh__photo-actions { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
    .fh__bouton { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: 12px; cursor: pointer; font-weight: 600;
      background: var(--primary-color); color: #fff; &--sec { background: var(--background-secondary); color: var(--text-primary); border: 1px solid var(--border-color, #cbd5e1); } }
    .fh__lien { border: 0; background: none; padding: 4px 0; color: var(--text-secondary); text-decoration: underline; cursor: pointer; min-height: 32px; }
    .fh__aide { margin: 6px 0 0; font-size: 12px; color: var(--text-secondary); }
    .fh__segment { display: flex; padding: 3px; gap: 3px; border-radius: 12px; background: var(--background-secondary);
      button { flex: 1; min-height: 42px; border: 0; border-radius: 10px; background: transparent; cursor: pointer; font-weight: 600; color: var(--text-secondary);
        &.actif { background: var(--primary-color); color: #fff; } } }
    .fh__fonds { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .fh__fond { display: flex; flex-direction: column; gap: 4px; padding: 4px; border: 2px solid transparent; border-radius: 12px; background: none; cursor: pointer; min-height: 44px;
      &.actif { border-color: var(--primary-color); } }
    .fh__vignette { display: block; height: 44px; border-radius: 8px; border: 1px solid rgba(128,128,128,.35); }
    .fh__nom { font-size: 11px; font-weight: 600; text-align: center; color: var(--text-primary); }
    .fh__pied { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px calc(14px + env(safe-area-inset-bottom)); border-top: 1px solid var(--border-color, #e2e8f0); }
    @media (max-width: 640px) {
      .fh__corps { grid-template-columns: 1fr; }
      .fh__apercu { min-height: 220px; }
      .fh__fonds { grid-template-columns: repeat(3, 1fr); }
      .fh__pied button { flex: 1; }
    }
  `]
})
export class FicheHdmDialogComponent implements OnInit, OnDestroy {
  private images = inject(MatchImageService);
  private sanitizer = inject(DomSanitizer);

  readonly fonds = FONDS_FEUILLE;
  joueurId = signal<number>(0);
  photo = signal<Blob | null>(null);
  photoMiniature = signal<SafeUrl | null>(null);
  format = signal<FormatFiche>('carte');
  fond = signal<string>(this.lireFond());
  blob = signal<Blob | null>(null);
  apercu = signal<SafeUrl | null>(null);
  chargement = signal(false);
  erreur = signal<string | null>(null);

  private urlApercu: string | null = null;
  private urlMiniature: string | null = null;
  private minuteur: ReturnType<typeof setTimeout> | null = null;
  private requete = 0;

  constructor(public ref: MatDialogRef<FicheHdmDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { matchId: number; joueurs: JoueurHdm[] }) {}

  ngOnInit(): void {
    const defaut = this.data.joueurs.find(j => j.hdm) ?? this.data.joueurs[0];
    this.joueurId.set(defaut?.membreId ?? 0);
    this.regenerer(0);
  }

  ngOnDestroy(): void {
    if (this.minuteur) clearTimeout(this.minuteur);
    if (this.urlApercu) URL.revokeObjectURL(this.urlApercu);
    if (this.urlMiniature) URL.revokeObjectURL(this.urlMiniature);
  }

  choisirJoueur(id: number): void { this.joueurId.set(id); this.regenerer(); }
  choisirFormat(f: FormatFiche): void { this.format.set(f); this.regenerer(); }
  choisirFond(code: string): void {
    this.fond.set(code);
    try { localStorage.setItem(CLE_FOND, code); } catch { /* choix non mémorisé */ }
    this.regenerer();
  }

  async photoChoisie(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    input.value = '';                       // permet de rechoisir le même fichier
    if (!fichier) return;
    try {
      const reduite = await this.reduire(fichier, 1100);
      this.photo.set(reduite);
      if (this.urlMiniature) URL.revokeObjectURL(this.urlMiniature);
      this.urlMiniature = URL.createObjectURL(reduite);
      this.photoMiniature.set(this.sanitizer.bypassSecurityTrustUrl(this.urlMiniature));
      this.regenerer();
    } catch {
      this.erreur.set("Photo illisible. Essayez une photo JPEG ou PNG.");
    }
  }

  retirerPhoto(): void {
    this.photo.set(null);
    this.photoMiniature.set(null);
    if (this.urlMiniature) { URL.revokeObjectURL(this.urlMiniature); this.urlMiniature = null; }
    this.regenerer();
  }

  telecharger(): void {
    const b = this.blob();
    if (b) this.images.sauvegarderBlob(b, `homme-du-match-${this.data.matchId}.png`);
  }

  partager(): void {
    const b = this.blob();
    if (b) void this.images.partagerBlob(b, `homme-du-match-${this.data.matchId}.png`, 'Homme du match');
  }

  /** Regénère l'aperçu (petit délai pour regrouper les changements rapides ; une réponse tardive est ignorée). */
  private regenerer(delai = 250): void {
    if (this.minuteur) clearTimeout(this.minuteur);
    this.minuteur = setTimeout(() => {
      const numero = ++this.requete;
      this.chargement.set(true);
      this.erreur.set(null);
      this.images.genererFicheHdm(this.data.matchId, {
        membreId: this.joueurId() || null, photo: this.photo(), fond: this.fond(), format: this.format()
      }).subscribe({
        next: blob => {
          if (numero !== this.requete) return;
          if (this.urlApercu) URL.revokeObjectURL(this.urlApercu);
          this.urlApercu = URL.createObjectURL(blob);
          this.blob.set(blob);
          this.apercu.set(this.sanitizer.bypassSecurityTrustUrl(this.urlApercu));
          this.chargement.set(false);
        },
        error: async err => {
          if (numero !== this.requete) return;
          let message = 'Génération impossible.';
          try { const t = await (err?.error as Blob)?.text?.(); if (t) message = JSON.parse(t).message ?? message; } catch { /* message générique */ }
          this.blob.set(null);
          this.erreur.set(message);
          this.chargement.set(false);
        }
      });
    }, delai);
  }

  /** Réduit la photo (côté max 1100 px) en JPEG : envoi léger et orientation EXIF appliquée. */
  private async reduire(fichier: File, max: number): Promise<Blob> {
    const bitmap: ImageBitmap = await createImageBitmap(fichier);
    const echelle = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * echelle);
    canvas.height = Math.round(bitmap.height * echelle);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return new Promise<Blob>((ok, ko) => canvas.toBlob(b => (b ? ok(b) : ko(new Error('photo'))), 'image/jpeg', 0.88));
  }

  private lireFond(): string {
    try { return localStorage.getItem(CLE_FOND) || 'NUIT'; } catch { return 'NUIT'; }
  }
}
