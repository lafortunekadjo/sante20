import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LigneExportClassement, TypeClassementExport } from '../../../core/models/stats.model';
import { PartageImageService } from '../../../core/services/partage-image.service';
import { StatsService } from '../../../core/services/stats.service';

const NOMS_FICHIER: Record<TypeClassementExport, string> = {
  EQUIPES: 'classement-equipes', BUTEURS: 'top-buteurs', PASSEURS: 'top-passeurs', ASSIDUITE: 'assiduite'
};

/**
 * Bouton « Partager en image » d'un classement : le serveur met en forme les lignes affichées à l'écran
 * (style My2-0, logo du groupe) ; l'utilisateur choisit combien de lignes figurent sur l'image.
 */
@Component({
  selector: 'app-export-classement',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <ng-container *ngIf="lignes.length">
      <button mat-stroked-button type="button" class="ec-btn" [matMenuTriggerFor]="menu" [disabled]="enCours"
              [attr.aria-label]="'Partager ce classement en image'">
        <mat-spinner *ngIf="enCours" diameter="18"></mat-spinner>
        <mat-icon *ngIf="!enCours">ios_share</mat-icon>
        <span>Partager en image</span>
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item *ngFor="let n of choix" (click)="exporter(n)">
          {{ n === lignes.length && lignes.length !== 5 && !tailles.includes(n) ? 'Tout (' + n + ')' : (type === 'EQUIPES' ? n + ' premières équipes' : 'Top ' + n) }}
        </button>
      </mat-menu>
    </ng-container>
  `,
  styles: [`
    :host { display: inline-block; }
    .ec-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
    .ec-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class ExportClassementComponent {
  @Input({ required: true }) type!: TypeClassementExport;
  /** Libellé de la période (saison, dates choisies…), tel qu'affiché à l'écran. */
  @Input() periode = '';
  /** Intitulés des colonnes d'un tableau d'équipes (le dernier est celui des points). */
  @Input() colonnes: string[] = [];
  /** Toutes les lignes disponibles, déjà triées : l'utilisateur en garde les N premières. */
  @Input() lignes: LigneExportClassement[] = [];

  readonly tailles = [5, 10, 15, 20, 30];
  enCours = false;

  constructor(private stats: StatsService, private partage: PartageImageService, private snackBar: MatSnackBar) {}

  /** Nombres proposés : les tailles usuelles jusqu'à ce qui existe, plus « tout » s'il tombe entre deux. */
  get choix(): number[] {
    const total = Math.min(this.lignes.length, 30);
    const liste = this.tailles.filter(n => n < total);
    liste.push(total);
    return liste;
  }

  exporter(n: number): void {
    if (this.enCours) return;
    this.enCours = true;
    this.stats.exporterClassementImage({
      type: this.type, periode: this.periode, colonnes: this.colonnes, lignes: this.lignes.slice(0, n), limite: n
    }).subscribe({
      next: async blob => {
        const nom = `${NOMS_FICHIER[this.type]}${n < this.lignes.length ? '-top' + n : ''}.jpg`;
        try {
          const resultat = await this.partage.partager(blob, nom, 'Classement My2-0');
          if (resultat === 'telecharge') this.snackBar.open('Image téléchargée', 'OK', { duration: 2500 });
        } finally {
          this.enCours = false;
        }
      },
      error: () => {
        this.enCours = false;
        this.snackBar.open("Impossible de générer l'image pour le moment", 'Fermer', { duration: 3500 });
      }
    });
  }
}
