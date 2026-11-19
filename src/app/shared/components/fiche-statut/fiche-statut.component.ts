import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EtatFiche, FicheMatchService } from '../../../core/services/fiche-match.service';

/**
 * Bandeau d'état de la feuille d'un match saisie par un scribe : en saisie, à valider, à corriger ou validée.
 * Le responsable y valide, renvoie (avec un commentaire) ou rouvre la feuille. Invisible pour une feuille ordinaire.
 */
@Component({
  selector: 'app-fiche-statut',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <section class="fs" *ngIf="etat && visible" [ngClass]="'fs--' + etat.statut.toLowerCase()">
      <div class="fs-titre"><mat-icon>{{ icone }}</mat-icon><strong>{{ libelle }}</strong>
        <span *ngIf="etat.saisiPar">· saisie par {{ etat.saisiPar }}</span></div>
      <div class="fs-info" *ngIf="etat.scribes.length || etat.ouvertATous">
        Scribes : {{ noms }}<span *ngIf="etat.ouvertATous"> · saisie ouverte à tout le groupe</span>
      </div>
      <div class="fs-info" *ngIf="etat.commentaire && (etat.statut === 'A_VALIDER' || etat.statut === 'A_CORRIGER')">« {{ etat.commentaire }} »</div>
      <div class="fs-info" *ngIf="etat.statut === 'VALIDEE' && etat.validePar">Validée par {{ etat.validePar }}<span *ngIf="etat.valideLe"> le {{ etat.valideLe | date:'dd/MM/yyyy HH:mm' }}</span></div>

      <div class="fs-actions" *ngIf="etat.estResponsable">
        <button mat-flat-button color="primary" type="button" *ngIf="etat.statut !== 'VALIDEE'" [disabled]="occupe" (click)="valider()">
          <mat-icon>verified</mat-icon> Valider la feuille
        </button>
        <button mat-stroked-button type="button" *ngIf="etat.statut === 'A_VALIDER'" [disabled]="occupe" (click)="renvoi = !renvoi">
          <mat-icon>undo</mat-icon> Renvoyer pour correction
        </button>
        <button mat-stroked-button type="button" *ngIf="etat.statut === 'VALIDEE'" [disabled]="occupe" (click)="rouvrir()">
          <mat-icon>lock_open</mat-icon> Rouvrir
        </button>
      </div>
      <div class="fs-renvoi" *ngIf="renvoi">
        <textarea [(ngModel)]="motif" rows="2" maxlength="500" placeholder="Ce qu'il faut corriger (obligatoire)"></textarea>
        <button mat-flat-button color="warn" type="button" [disabled]="!motif.trim() || occupe" (click)="renvoyer()">Envoyer au scribe</button>
      </div>
    </section>
  `,
  styles: [`
    .fs { margin: 8px 0 12px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(128,128,128,.3); background: rgba(37,99,235,.08); font-size: 13px; }
    .fs--a_valider { background: rgba(245,158,11,.14); }
    .fs--a_corriger { background: rgba(239,68,68,.12); }
    .fs--validee { background: rgba(22,163,74,.12); }
    .fs-titre { display: flex; align-items: center; gap: 6px; font-size: 14px; }
    .fs-titre mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .fs-info { margin-top: 4px; opacity: .9; }
    .fs-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .fs-renvoi { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
    .fs-renvoi textarea { padding: 8px; border-radius: 8px; border: 1px solid rgba(128,128,128,.4); background: transparent; color: inherit; font: inherit; }
  `]
})
export class FicheStatutComponent implements OnChanges {
  @Input({ required: true }) matchId!: number;
  @Output() changed = new EventEmitter<EtatFiche>();

  etat: EtatFiche | null = null;
  occupe = false;
  renvoi = false;
  motif = '';

  constructor(private fiches: FicheMatchService, private snackBar: MatSnackBar) {}

  ngOnChanges(): void { this.charger(); }

  private charger(): void {
    if (!this.matchId) return;
    this.fiches.etat(this.matchId).subscribe({ next: e => this.etat = e, error: () => this.etat = null });
  }

  /** Une feuille ordinaire (sans scribe, déjà validée) n'a rien à afficher. */
  get visible(): boolean {
    const e = this.etat;
    return !!e && (e.statut !== 'VALIDEE' || e.scribes.length > 0 || e.ouvertATous || !!e.validePar);
  }

  get noms(): string { return (this.etat?.scribes ?? []).map(s => s.nom).join(', ') || '—'; }

  get libelle(): string {
    switch (this.etat?.statut) {
      case 'EN_SAISIE': return 'Feuille en cours de saisie';
      case 'A_VALIDER': return 'Feuille à valider';
      case 'A_CORRIGER': return 'Feuille à corriger';
      default: return 'Feuille validée';
    }
  }

  get icone(): string {
    switch (this.etat?.statut) {
      case 'EN_SAISIE': return 'edit_note';
      case 'A_VALIDER': return 'hourglass_top';
      case 'A_CORRIGER': return 'undo';
      default: return 'verified';
    }
  }

  private action(appel: any, message: string): void {
    this.occupe = true;
    appel.subscribe({
      next: (e: EtatFiche) => { this.etat = e; this.occupe = false; this.renvoi = false; this.motif = ''; this.snackBar.open(message, 'OK', { duration: 3000 }); this.changed.emit(e); },
      error: (err: any) => { this.occupe = false; this.snackBar.open(err?.error?.message || 'Action impossible.', 'Fermer', { duration: 4000 }); }
    });
  }

  valider(): void { this.action(this.fiches.valider(this.matchId), 'Feuille validée : elle compte maintenant dans les classements.'); }
  renvoyer(): void { this.action(this.fiches.renvoyer(this.matchId, this.motif.trim()), 'Feuille renvoyée au scribe.'); }
  rouvrir(): void { this.action(this.fiches.rouvrir(this.matchId), 'Feuille rouverte : elle ne compte plus tant qu\'elle n\'est pas revalidée.'); }
}
