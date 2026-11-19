import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FicheMatchService, ResumeFiche } from '../../../../core/services/fiche-match.service';

/** Feuilles de match saisies par des scribes et envoyées pour validation. */
@Component({
  selector: 'app-feuilles-a-valider',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="fv">
      <h1><mat-icon>fact_check</mat-icon> Feuilles à valider</h1>
      <p class="fv-hint">Ouvrez une feuille pour la vérifier ou la corriger, puis validez-la : elle compte alors dans les classements et les statistiques.</p>

      <div class="fv-etat" *ngIf="chargement"><mat-spinner diameter="32"></mat-spinner></div>
      <div class="fv-etat" *ngIf="!chargement && !liste.length">Aucune feuille en attente. 🎉</div>

      <article class="fv-carte" *ngFor="let f of liste">
        <div class="fv-tete">
          <div>
            <strong>{{ f.titre }}</strong>
            <span class="fv-sous">{{ f.date | date:'dd/MM/yyyy' }}<span *ngIf="f.saisiPar"> · saisie par {{ f.saisiPar }}</span><span *ngIf="f.soumisLe"> · envoyée le {{ f.soumisLe | date:'dd/MM HH:mm' }}</span></span>
          </div>
        </div>
        <p class="fv-commentaire" *ngIf="f.commentaire">« {{ f.commentaire }} »</p>
        <div class="fv-actions">
          <a mat-stroked-button [routerLink]="['/responsable/presences', f.matchId]"><mat-icon>visibility</mat-icon> Ouvrir la feuille</a>
          <button mat-flat-button color="primary" type="button" [disabled]="occupe === f.matchId" (click)="valider(f)"><mat-icon>verified</mat-icon> Valider</button>
          <button mat-stroked-button type="button" [disabled]="occupe === f.matchId" (click)="renvoi = renvoi === f.matchId ? null : f.matchId; motif = ''"><mat-icon>undo</mat-icon> Renvoyer</button>
        </div>
        <div class="fv-renvoi" *ngIf="renvoi === f.matchId">
          <textarea [(ngModel)]="motif" rows="2" maxlength="500" placeholder="Ce qu'il faut corriger (obligatoire)"></textarea>
          <button mat-flat-button color="warn" type="button" [disabled]="!motif.trim() || occupe === f.matchId" (click)="renvoyer(f)">Envoyer au scribe</button>
        </div>
      </article>
    </div>
  `,
  styles: [`
    .fv { max-width: 760px; margin: 0 auto; padding: 16px; }
    h1 { display: flex; align-items: center; gap: 8px; font-size: 22px; }
    .fv-hint { font-size: 13px; opacity: .8; }
    .fv-etat { text-align: center; padding: 28px 0; opacity: .75; }
    .fv-carte { border: 1px solid rgba(128,128,128,.3); border-radius: 14px; padding: 12px 14px; margin: 10px 0; }
    .fv-tete strong { display: block; font-size: 15px; }
    .fv-sous { font-size: 12px; opacity: .75; }
    .fv-commentaire { font-style: italic; font-size: 13px; margin: 8px 0 0; }
    .fv-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .fv-renvoi { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
    .fv-renvoi textarea { padding: 8px; border-radius: 8px; border: 1px solid rgba(128,128,128,.4); background: transparent; color: inherit; font: inherit; }
  `]
})
export class FeuillesAValiderComponent implements OnInit {
  liste: ResumeFiche[] = [];
  chargement = true;
  occupe: number | null = null;
  renvoi: number | null = null;
  motif = '';

  constructor(private fiches: FicheMatchService, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.charger(); }

  private charger(): void {
    this.chargement = true;
    this.fiches.aValider().subscribe({ next: l => { this.liste = l; this.chargement = false; }, error: () => { this.liste = []; this.chargement = false; } });
  }

  private fin(message: string): void {
    this.occupe = null; this.renvoi = null; this.motif = '';
    this.snackBar.open(message, 'OK', { duration: 3000 });
    this.charger();
  }

  private echec(err: any): void {
    this.occupe = null;
    this.snackBar.open(err?.error?.message || 'Action impossible.', 'Fermer', { duration: 4000 });
  }

  valider(f: ResumeFiche): void {
    this.occupe = f.matchId;
    this.fiches.valider(f.matchId).subscribe({ next: () => this.fin('Feuille validée.'), error: e => this.echec(e) });
  }

  renvoyer(f: ResumeFiche): void {
    this.occupe = f.matchId;
    this.fiches.renvoyer(f.matchId, this.motif.trim()).subscribe({ next: () => this.fin('Feuille renvoyée au scribe.'), error: e => this.echec(e) });
  }
}
