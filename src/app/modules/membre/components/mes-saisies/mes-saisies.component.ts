import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FicheMatchService, ResumeFiche } from '../../../../core/services/fiche-match.service';

/** Matchs dont le membre est scribe (ou dont la saisie est ouverte à tous) : il y saisit la feuille pendant le match. */
@Component({
  selector: 'app-mes-saisies',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="ms">
      <h1><mat-icon>edit_note</mat-icon> Mes feuilles à saisir</h1>
      <p class="ms-hint">Pendant le match, pointez les présents puis notez les buts, passes et cartons. Envoyez la feuille au responsable à la fin : il la valide.</p>
      <div class="ms-etat" *ngIf="chargement"><mat-spinner diameter="32"></mat-spinner></div>
      <div class="ms-etat" *ngIf="!chargement && !liste.length">Aucune feuille à saisir pour le moment.</div>
      <article class="ms-carte" *ngFor="let f of liste">
        <div>
          <strong>{{ f.titre }}</strong>
          <span class="ms-sous">{{ f.date | date:'EEEE dd MMMM' }}</span>
          <span class="ms-statut" [ngClass]="'ms-statut--' + f.statut.toLowerCase()">{{ libelle(f.statut) }}</span>
          <p class="ms-commentaire" *ngIf="f.statut === 'A_CORRIGER' && f.commentaire">À corriger : « {{ f.commentaire }} »</p>
        </div>
        <a mat-flat-button color="primary" *ngIf="f.statut !== 'A_VALIDER'" [routerLink]="['/membre/saisie', f.matchId]"><mat-icon>play_arrow</mat-icon> Saisir</a>
      </article>
    </div>
  `,
  styles: [`
    .ms { max-width: 640px; margin: 0 auto; padding: 16px; }
    h1 { display: flex; align-items: center; gap: 8px; font-size: 22px; }
    .ms-hint { font-size: 13px; opacity: .8; }
    .ms-etat { text-align: center; padding: 28px 0; opacity: .75; }
    .ms-carte { display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px solid rgba(128,128,128,.3); border-radius: 14px; padding: 12px 14px; margin: 10px 0; }
    .ms-carte strong { display: block; font-size: 15px; }
    .ms-sous { font-size: 12px; opacity: .75; margin-right: 8px; }
    .ms-statut { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(37,99,235,.15); }
    .ms-statut--a_valider { background: rgba(245,158,11,.2); }
    .ms-statut--a_corriger { background: rgba(239,68,68,.18); }
    .ms-commentaire { font-size: 12px; margin: 6px 0 0; }
  `]
})
export class MesSaisiesComponent implements OnInit {
  liste: ResumeFiche[] = [];
  chargement = true;

  constructor(private fiches: FicheMatchService) {}

  ngOnInit(): void {
    this.fiches.mesSaisies().subscribe({ next: l => { this.liste = l; this.chargement = false; }, error: () => { this.liste = []; this.chargement = false; } });
  }

  libelle(s: string): string {
    return s === 'A_VALIDER' ? 'Envoyée au responsable' : s === 'A_CORRIGER' ? 'À corriger' : 'En saisie';
  }
}
