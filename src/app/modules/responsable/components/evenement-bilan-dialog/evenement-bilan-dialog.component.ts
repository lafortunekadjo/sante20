import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FinancesService } from '../../../../core/services/finances.service';
import { EvenementBilan } from '../../../../core/models/collecte.model';

/**
 * Bilan d'un événement : combien a été collecté pour lui, dépensé, remis, et ce qu'il reste.
 * Permet aussi d'enregistrer une sortie rattachée à l'événement (remise au bénéficiaire ou frais).
 */
@Component({
  selector: 'app-evenement-bilan-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, DatePipe, TranslateModule],
  template: `
    <div class="eb">
      <header class="eb__head">
        <div>
          <h2>{{ bilan()?.nom ?? ('collecte.bilan.event' | translate) }}</h2>
          <p *ngIf="bilan() as b">{{ b.categorie ? (('collecte.types.' + b.categorie) | translate) : '' }} · {{ (b.collecteOuverte ? 'collecte.bilan.open' : 'collecte.bilan.closed') | translate }}</p>
        </div>
        <button class="eb__close" (click)="fermer()" [attr.aria-label]="'collecte.bilan.close' | translate"><mat-icon>close</mat-icon></button>
      </header>

      <div class="eb__loading" *ngIf="chargement()"><span class="spinner"></span></div>
      <p class="eb__erreur" *ngIf="erreurChargement()">{{ erreurChargement() }}</p>

      <ng-container *ngIf="bilan() as b">
        <!-- Chiffres clés -->
        <div class="eb__kpis">
          <div class="eb__kpi"><strong>{{ fcfa(b.totalCollecte) }}</strong><span>{{ 'collecte.bilan.collected' | translate }}</span></div>
          <div class="eb__kpi"><strong>{{ fcfa(b.totalDepense) }}</strong><span>{{ 'collecte.bilan.spent' | translate }}</span></div>
          <div class="eb__kpi eb__kpi--solde" [class.eb__kpi--neg]="b.solde < 0"><strong>{{ fcfa(b.solde) }}</strong><span>{{ 'collecte.bilan.available' | translate }}</span></div>
        </div>

        <!-- Progression -->
        <div class="eb__prog" *ngIf="b.mode === 'OBJECTIF' && b.objectifGlobal">
          <div class="eb__barre"><span [style.width.%]="pourcent(b.totalCollecte, b.objectifGlobal)"></span></div>
          <small>{{ 'collecte.bilan.onGoal' | translate: { collecte: fcfa(b.totalCollecte), objectif: fcfa(b.objectifGlobal) } }}
            <ng-container *ngIf="b.resteAObjectif"> — {{ 'collecte.bilan.remaining' | translate: { montant: fcfa(b.resteAObjectif) } }}</ng-container></small>
        </div>
        <p class="eb__info" *ngIf="b.mode === 'FIXE' && b.montantParMembre">
          {{ 'collecte.bilan.perMember' | translate: { montant: fcfa(b.montantParMembre), n: b.nbContributeurs, total: b.nbMembresAttendus } }}
        </p>
        <p class="eb__info" *ngIf="b.mode === 'LIBRE'">{{ 'collecte.bilan.free' | translate: { n: b.nbContributeurs, total: b.nbMembresAttendus } }}</p>

        <!-- Sortie rattachée à l'événement -->
        <section class="eb__sortie" *ngIf="peutDepenser">
          <button class="btn-outline btn-sm" *ngIf="!formSortie()" (click)="formSortie.set(true)">
            <mat-icon>north_east</mat-icon> {{ 'collecte.bilan.addExit' | translate }}
          </button>
          <form *ngIf="formSortie()" (ngSubmit)="enregistrerSortie()" class="eb__form">
            <div class="eb__nature">
              <label><input type="radio" name="nature" [(ngModel)]="sortie.nature" value="REMISE"/> {{ 'collecte.bilan.handover' | translate }}</label>
              <label><input type="radio" name="nature" [(ngModel)]="sortie.nature" value="FRAIS"/> {{ 'collecte.bilan.fees' | translate }}</label>
            </div>
            <input class="form-input" type="number" min="1" name="montant" [(ngModel)]="sortie.montant" [placeholder]="'collecte.bilan.amount' | translate" required/>
            <input class="form-input" name="libelle" [(ngModel)]="sortie.libelle" [placeholder]="'collecte.bilan.label' | translate"/>
            <input class="form-input" name="benef" [(ngModel)]="sortie.beneficiaire" [placeholder]="'collecte.bilan.beneficiary' | translate"/>
            <p class="eb__erreur" *ngIf="erreurSortie()">{{ erreurSortie() }}</p>
            <div class="eb__actions">
              <button type="button" class="btn-ghost btn-sm" (click)="formSortie.set(false)">{{ 'collecte.bilan.cancel' | translate }}</button>
              <button *ngIf="peutForcer()" type="button" class="btn-warning btn-sm" (click)="enregistrerSortie(true)">{{ 'collecte.bilan.forceAnyway' | translate }}</button>
              <button type="submit" class="btn-primary btn-sm" [disabled]="!sortie.montant || envoi()">{{ 'collecte.bilan.save' | translate }}</button>
            </div>
          </form>
        </section>

        <!-- Contributeurs -->
        <h3 class="eb__titre">{{ 'collecte.bilan.contributors' | translate: { n: b.contributeurs.length } }}</h3>
        <ul class="eb__liste" *ngIf="b.contributeurs.length">
          <li *ngFor="let c of triees(b.contributeurs)"><span>{{ c.nom }}</span><strong>{{ fcfa(c.montant) }}</strong></li>
        </ul>
        <p class="eb__vide" *ngIf="!b.contributeurs.length">{{ 'collecte.bilan.nobody' | translate }}</p>

        <!-- Mouvements -->
        <h3 class="eb__titre">{{ 'collecte.bilan.movements' | translate }}</h3>
        <ul class="eb__liste eb__liste--mvt" *ngIf="b.mouvements.length">
          <li *ngFor="let m of b.mouvements" [class.eb__sortie-ligne]="m.sens === 'SORTIE'">
            <span><small>{{ m.date | date:'dd/MM/yy' }}</small> {{ m.libelle || m.nom }}</span>
            <strong>{{ m.sens === 'SORTIE' ? '−' : '+' }}{{ fcfa(m.montant) }}</strong>
          </li>
        </ul>
        <p class="eb__vide" *ngIf="!b.mouvements.length">{{ 'collecte.bilan.noMovements' | translate }}</p>
      </ng-container>
    </div>
  `,
  styles: [`
    .eb { padding: 18px 18px 22px; max-width: 520px; max-height: 88vh; overflow-y: auto; }
    .eb__head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .eb__head h2 { margin: 0; font-size: 19px; font-weight: 800; }
    .eb__head p { margin: 2px 0 0; font-size: 13px; color: var(--text-secondary); }
    .eb__close { border: 0; background: none; cursor: pointer; min-width: 44px; min-height: 44px; border-radius: 12px; }
    .eb__loading { text-align: center; padding: 24px; }
    .eb__kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 14px 0 10px; }
    .eb__kpi { padding: 10px 6px; border-radius: 12px; text-align: center; background: var(--background-secondary); }
    .eb__kpi strong { display: block; font-size: 15px; } .eb__kpi span { font-size: 11px; color: var(--text-secondary); }
    .eb__kpi--solde { background: rgba(16,185,129,.12); } .eb__kpi--neg { background: rgba(239,68,68,.12); }
    .eb__prog { margin: 6px 0 10px; } .eb__barre { height: 8px; border-radius: 4px; background: rgba(128,128,128,.2); overflow: hidden; }
    .eb__barre span { display: block; height: 100%; background: #22c55e; } .eb__prog small { color: var(--text-secondary); font-size: 12px; }
    .eb__info { margin: 4px 0 10px; font-size: 13px; color: var(--text-secondary); }
    .eb__titre { margin: 16px 0 6px; font-size: 14px; font-weight: 800; }
    .eb__liste { list-style: none; margin: 0; padding: 0; }
    .eb__liste li { display: flex; justify-content: space-between; gap: 10px; padding: 9px 2px; font-size: 14px; border-bottom: 1px solid var(--border-color); }
    .eb__liste small { color: var(--text-tertiary); margin-right: 6px; }
    .eb__sortie-ligne strong { color: #b91c1c; }
    .eb__vide { font-size: 13px; color: var(--text-secondary); }
    .eb__sortie { margin: 6px 0 4px; }
    .eb__form { display: grid; gap: 8px; margin-top: 8px; padding: 12px; border-radius: 12px; background: var(--background-secondary); }
    .eb__nature { display: grid; gap: 6px; font-size: 14px; }
    .eb__actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .eb__erreur { margin: 0; padding: 9px 11px; border-radius: 10px; font-size: 13px; color: #b91c1c; background: rgba(239,68,68,.08); }
  `]
})
export class EvenementBilanDialogComponent implements OnInit {
  private finances = inject(FinancesService);
  private translate = inject(TranslateService);

  bilan = signal<EvenementBilan | null>(null);
  chargement = signal(true);
  erreurChargement = signal<string | null>(null);
  formSortie = signal(false);
  envoi = signal(false);
  erreurSortie = signal<string | null>(null);
  peutForcer = signal(false);
  modifie = false;

  sortie = { nature: 'REMISE' as 'REMISE' | 'FRAIS', montant: null as number | null, libelle: '', beneficiaire: '' };

  constructor(
    private ref: MatDialogRef<EvenementBilanDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: { evenementId: number; peutDepenser?: boolean }
  ) {}

  get peutDepenser(): boolean { return this.data.peutDepenser !== false; }

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.chargement.set(true);
    this.finances.getEvenementBilan(this.data.evenementId).subscribe({
      next: b => { this.bilan.set(b); this.chargement.set(false); },
      error: err => { this.erreurChargement.set(err?.error?.message ?? this.translate.instant('collecte.bilan.unavailable')); this.chargement.set(false); }
    });
  }

  enregistrerSortie(forcer = false): void {
    if (!this.sortie.montant || this.envoi()) return;
    this.envoi.set(true);
    this.erreurSortie.set(null);
    const b = this.bilan()!;
    this.finances.enregistrerSortie({
      evenementId: b.evenementId,
      montant: this.sortie.montant,
      nature: this.sortie.nature,
      libelle: this.sortie.libelle.trim()
        || this.translate.instant(this.sortie.nature === 'REMISE' ? 'collecte.bilan.defaultHandover' : 'collecte.bilan.defaultFees', { nom: b.nom }),
      beneficiaireTexte: this.sortie.beneficiaire.trim() || undefined,
      forcer
    }).subscribe({
      next: () => {
        this.envoi.set(false); this.formSortie.set(false); this.peutForcer.set(false);
        this.sortie = { nature: 'REMISE', montant: null, libelle: '', beneficiaire: '' };
        this.modifie = true;
        this.charger();
      },
      error: err => {
        this.envoi.set(false);
        const message: string = err?.error?.message ?? this.translate.instant('collecte.bilan.saveError');
        this.erreurSortie.set(message);
        // « dépasserait » : l'événement n'a pas assez collecté — on propose de forcer (décision de l'organisateur)
        this.peutForcer.set(/dépasserait/.test(message));
      }
    });
  }

  triees<T extends { montant: number }>(l: T[]): T[] { return [...l].sort((a, b) => b.montant - a.montant); }
  pourcent(v: number, total: number): number { return total > 0 ? Math.min(100, Math.round((v / total) * 100)) : 0; }
  fcfa(n: number | null | undefined): string { return (n ?? 0).toLocaleString('fr-FR') + ' FCFA'; }
  fermer(): void { this.ref.close(this.modifie); }
}
