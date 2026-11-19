import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MembreService, OccasionnelResume } from '../../../../core/services/membre.service';
import { nomComplet } from '../../../../core/utils/nom';

/**
 * Joueurs occasionnels du groupe (invités saisis par leur nom) et passage au statut de membre :
 * leurs matchs passés et leurs statistiques sont rattachés à leur fiche, avec la période pendant laquelle ils étaient occasionnels.
 */
@Component({
  selector: 'app-occasionnels-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title><mat-icon>person_search</mat-icon> Joueurs occasionnels</h2>
    <mat-dialog-content class="oc-content">

      <ng-container *ngIf="!choisi">
        <p class="oc-hint">Un joueur occasionnel qui rejoint le groupe devient membre <strong>sans rien perdre</strong> : ses matchs et ses statistiques passés sont conservés,
          et son parcours garde la trace de la période où il était occasionnel.</p>

        <div class="oc-etat" *ngIf="chargement"><mat-spinner diameter="30"></mat-spinner></div>
        <div class="oc-etat" *ngIf="!chargement && !liste.length">Aucun joueur occasionnel sur les fiches de match.</div>

        <ul class="oc-liste" *ngIf="!chargement && liste.length">
          <li *ngFor="let o of liste">
            <div class="oc-info">
              <strong>{{ o.nom }}</strong>
              <span>{{ o.matchs }} match(s) · {{ o.buts }} but(s) · {{ o.passes }} passe(s)</span>
              <span class="oc-dates" *ngIf="o.premierMatch">du {{ o.premierMatch | date:'dd/MM/yyyy' }} au {{ o.dernierMatch | date:'dd/MM/yyyy' }}</span>
            </div>
            <button mat-stroked-button color="primary" type="button" (click)="choisir(o)">
              <mat-icon>how_to_reg</mat-icon> Devenir membre
            </button>
          </li>
        </ul>
      </ng-container>

      <ng-container *ngIf="choisi">
        <p class="oc-hint"><strong>{{ choisi.nom }}</strong> — {{ choisi.matchs }} match(s), {{ choisi.buts }} but(s), du {{ choisi.premierMatch | date:'dd/MM/yyyy' }}
          au {{ choisi.dernierMatch | date:'dd/MM/yyyy' }}.</p>

        <div class="oc-mode">
          <label><input type="radio" name="mode" [(ngModel)]="mode" value="nouveau"> Créer un nouveau membre</label>
          <label><input type="radio" name="mode" [(ngModel)]="mode" value="existant"> Rattacher à un membre existant</label>
        </div>

        <div class="oc-champs" *ngIf="mode === 'nouveau'">
          <label>Nom <input type="text" [(ngModel)]="nom" name="nom" maxlength="60"></label>
          <label>Prénom <input type="text" [(ngModel)]="prenom" name="prenom" maxlength="60"></label>
          <label>Sexe
            <select [(ngModel)]="sexe" name="sexe">
              <option value="masculin">Masculin</option>
              <option value="feminin">Féminin</option>
            </select>
          </label>
        </div>

        <div class="oc-champs" *ngIf="mode === 'existant'">
          <label>Membre
            <select [(ngModel)]="membreId" name="membreId">
              <option [ngValue]="null">— choisir —</option>
              <option *ngFor="let m of membres" [ngValue]="m.id">{{ nomDe(m) }}</option>
            </select>
          </label>
        </div>

        <div class="oc-champs">
          <label>Devenu membre le <input type="date" [(ngModel)]="dateAdhesion" name="dateAdhesion" [max]="aujourdhui"></label>
        </div>
        <p class="oc-erreur" *ngIf="erreur">{{ erreur }}</p>
      </ng-container>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" *ngIf="choisi" (click)="choisi = null; erreur = ''">Retour</button>
      <button mat-stroked-button type="button" (click)="fermer()">Fermer</button>
      <button mat-raised-button color="primary" type="button" *ngIf="choisi" [disabled]="!valide || envoi" (click)="valider()">
        <mat-spinner *ngIf="envoi" diameter="18"></mat-spinner>
        <span *ngIf="!envoi">Confirmer</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .oc-content { min-width: min(520px, 86vw); }
    .oc-hint { font-size: 13px; opacity: .85; margin: 0 0 12px; }
    .oc-etat { padding: 18px 0; text-align: center; opacity: .7; }
    .oc-liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .oc-liste li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid rgba(128,128,128,.25); border-radius: 12px; }
    .oc-info { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
    .oc-info strong { font-size: 15px; }
    .oc-dates { opacity: .7; }
    .oc-mode { display: flex; flex-direction: column; gap: 6px; margin: 8px 0 12px; }
    .oc-champs { display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; }
    .oc-champs label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
    .oc-champs input, .oc-champs select { padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(128,128,128,.4); background: transparent; color: inherit; font-size: 14px; }
    .oc-erreur { color: #dc2626; font-size: 13px; }
    h2 mat-icon { vertical-align: middle; margin-right: 6px; }
  `]
})
export class OccasionnelsDialogComponent implements OnInit {
  liste: OccasionnelResume[] = [];
  membres: any[] = [];
  chargement = true;
  envoi = false;
  erreur = '';
  /** Vrai dès qu'une conversion a eu lieu : la liste des membres doit alors être rechargée. */
  modifie = false;

  choisi: OccasionnelResume | null = null;
  mode: 'nouveau' | 'existant' = 'nouveau';
  nom = '';
  prenom = '';
  sexe = 'masculin';
  membreId: number | null = null;
  readonly aujourdhui = new Date().toISOString().substring(0, 10);
  dateAdhesion = this.aujourdhui;

  constructor(
    private membreService: MembreService,
    private dialogRef: MatDialogRef<OccasionnelsDialogComponent, boolean>,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.charger();
    this.membreService.getGroupMembers().subscribe({ next: m => this.membres = m ?? [], error: () => this.membres = [] });
  }

  private charger(): void {
    this.chargement = true;
    this.membreService.getOccasionnels().subscribe({
      next: l => { this.liste = l; this.chargement = false; },
      error: () => { this.liste = []; this.chargement = false; }
    });
  }

  nomDe(m: any): string { return nomComplet(m, true) || '—'; }

  choisir(o: OccasionnelResume): void {
    this.choisi = o;
    this.mode = 'nouveau';
    // On propose le nom saisi sur les fiches : « Prénom Nom » ou un seul mot (nom)
    const mots = o.nom.trim().split(/\s+/);
    this.prenom = mots.length > 1 ? mots.slice(0, -1).join(' ') : '';
    this.nom = mots[mots.length - 1];
    this.membreId = null;
    this.dateAdhesion = this.aujourdhui;
    this.erreur = '';
  }

  get valide(): boolean {
    if (!this.choisi || !this.dateAdhesion) return false;
    return this.mode === 'nouveau' ? !!this.nom.trim() : this.membreId != null;
  }

  valider(): void {
    if (!this.choisi || !this.valide || this.envoi) return;
    this.envoi = true;
    this.erreur = '';
    const o = this.choisi;
    this.membreService.convertirOccasionnel({
      nom: o.nom,
      membreId: this.mode === 'existant' ? this.membreId : null,
      nouveauMembre: this.mode === 'nouveau' ? { nom: this.nom.trim(), prenom: this.prenom.trim(), sexe: this.sexe } : null,
      dateAdhesion: this.dateAdhesion
    }).subscribe({
      next: r => {
        this.envoi = false;
        this.modifie = true;
        const conflit = r.presencesEnConflit ? ` (${r.presencesEnConflit} présence(s) déjà saisie(s) pour ce membre, laissée(s) telles quelles)` : '';
        this.snackBar.open(`${r.nomMembre} est maintenant membre : ${r.presencesTransferees} match(s) rattaché(s)${conflit}`, 'OK', { duration: 6000 });
        this.choisi = null;
        this.charger();
      },
      error: err => {
        this.envoi = false;
        this.erreur = err?.error?.message || 'Conversion impossible pour le moment.';
      }
    });
  }

  fermer(): void { this.dialogRef.close(this.modifie); }
}
