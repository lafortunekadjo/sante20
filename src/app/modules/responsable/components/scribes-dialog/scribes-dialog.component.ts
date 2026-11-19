import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FicheMatchService } from '../../../../core/services/fiche-match.service';
import { MembreService } from '../../../../core/services/membre.service';
import { nomComplet } from '../../../../core/utils/nom';

/** Le responsable désigne les membres qui saisiront la feuille du match (ou ouvre la saisie à tout le groupe). */
@Component({
  selector: 'app-scribes-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title><mat-icon>edit_note</mat-icon> Scribes du match</h2>
    <mat-dialog-content class="sc-content">
      <p class="sc-hint">Un scribe saisit la feuille pendant le match depuis son téléphone (présents, buts, passes, cartons) puis l'envoie.
        <strong>Vous la validez ensuite</strong> : tant qu'elle n'est pas validée, elle ne compte pas dans les classements.</p>

      <label class="sc-tous"><input type="checkbox" [(ngModel)]="ouvertATous"> Ouvrir la saisie à <strong>tous les membres</strong> du groupe</label>

      <input class="sc-recherche" type="search" [(ngModel)]="recherche" placeholder="Rechercher un membre…">
      <ul class="sc-liste">
        <li *ngFor="let m of filtres">
          <label><input type="checkbox" [checked]="choisis.has(m.id)" (change)="basculer(m.id)"> {{ nomDe(m) }}</label>
        </li>
        <li *ngIf="!filtres.length" class="sc-vide">Aucun membre.</li>
      </ul>
      <p class="sc-compte">{{ choisis.size }} scribe(s) désigné(s)</p>
      <p class="sc-erreur" *ngIf="erreur">{{ erreur }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="dialogRef.close(false)">Annuler</button>
      <button mat-stroked-button color="warn" type="button" *ngIf="aDeja" [disabled]="envoi" (click)="retirer()">Retirer la désignation</button>
      <button mat-raised-button color="primary" type="button" [disabled]="envoi || (!choisis.size && !ouvertATous)" (click)="enregistrer()">Enregistrer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .sc-content { min-width: min(480px, 86vw); }
    .sc-hint { font-size: 13px; opacity: .85; margin: 0 0 12px; }
    .sc-tous { display: block; margin-bottom: 10px; font-size: 14px; }
    .sc-recherche { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(128,128,128,.4); background: transparent; color: inherit; margin-bottom: 8px; box-sizing: border-box; }
    .sc-liste { list-style: none; margin: 0; padding: 0; max-height: 280px; overflow: auto; }
    .sc-liste li { padding: 6px 4px; border-bottom: 1px solid rgba(128,128,128,.15); }
    .sc-liste label { display: flex; gap: 8px; align-items: center; font-size: 14px; }
    .sc-vide { opacity: .6; }
    .sc-compte { font-size: 12px; opacity: .7; }
    .sc-erreur { color: #dc2626; font-size: 13px; }
    h2 mat-icon { vertical-align: middle; margin-right: 6px; }
  `]
})
export class ScribesDialogComponent implements OnInit {
  membres: any[] = [];
  choisis = new Set<number>();
  ouvertATous = false;
  aDeja = false;
  recherche = '';
  envoi = false;
  erreur = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { matchId: number },
    public dialogRef: MatDialogRef<ScribesDialogComponent, boolean>,
    private fiches: FicheMatchService,
    private membreService: MembreService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.membreService.getGroupMembers().subscribe(m => this.membres = (m ?? []).filter(x => x?.active !== false));
    this.fiches.etat(this.data.matchId).subscribe(e => {
      this.choisis = new Set(e.scribes.map(s => s.id));
      this.ouvertATous = e.ouvertATous;
      this.aDeja = e.scribes.length > 0 || e.ouvertATous;
    });
  }

  nomDe(m: any): string { return nomComplet(m, true) || '—'; }

  get filtres(): any[] {
    const q = this.recherche.trim().toLowerCase();
    return this.membres.filter(m => !q || this.nomDe(m).toLowerCase().includes(q))
      .sort((a, b) => this.nomDe(a).localeCompare(this.nomDe(b), 'fr'));
  }

  basculer(id: number): void { if (this.choisis.has(id)) this.choisis.delete(id); else this.choisis.add(id); }

  private appliquer(ids: number[], ouvert: boolean, message: string): void {
    this.envoi = true;
    this.erreur = '';
    this.fiches.designer(this.data.matchId, ids, ouvert).subscribe({
      next: () => { this.envoi = false; this.snackBar.open(message, 'OK', { duration: 3500 }); this.dialogRef.close(true); },
      error: err => { this.envoi = false; this.erreur = err?.error?.message || 'Désignation impossible.'; }
    });
  }

  enregistrer(): void { this.appliquer(Array.from(this.choisis), this.ouvertATous, 'Scribes désignés : ils sont prévenus.'); }
  retirer(): void { this.appliquer([], false, 'Désignation retirée.'); }
}
