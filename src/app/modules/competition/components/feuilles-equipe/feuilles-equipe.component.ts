import { TranslateModule } from '@ngx-translate/core';
import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FeuilleSignaturesComponent } from '../feuille-signatures/feuille-signatures.component';

interface FeuilleEquipe {
  matchId: number;
  dateHeure?: string;
  domicile: string;
  exterieur: string;
  butsDomicile?: number;
  butsExterieur?: number;
  estDomicile: boolean;
  statut: 'EN_ATTENTE' | 'SIGNEE' | 'OBSOLETE';
  verrouillee: boolean;
}

/** Espace équipe : feuilles des matchs terminés que le responsable (ou l'adjoint) peut signer. */
@Component({
  selector: 'app-feuilles-equipe',
  standalone: true,
  imports: [TranslateModule, CommonModule, FeuilleSignaturesComponent],
  template: `
  <div class="fe">
    <div class="fe__titre"><strong>{{ 'feuilleSignature.equipeTitre' | translate }}</strong></div>
    <p class="fe__aide">{{ 'feuilleSignature.equipeAide' | translate }}</p>
    @if (feuilles().length === 0) {
      <p class="fe__aide">{{ 'feuilleSignature.equipeVide' | translate }}</p>
    }
    @for (f of feuilles(); track f.matchId) {
      <button type="button" class="fe__ligne" (click)="ouvert.set(ouvert() === f.matchId ? null : f.matchId)">
        <span class="fe__affiche">{{ f.domicile }} {{ f.butsDomicile }} - {{ f.butsExterieur }} {{ f.exterieur }}</span>
        <small>{{ f.dateHeure }}</small>
        <span class="fe__etat fe__etat--{{ f.statut }}">{{ 'feuilleSignature.statut.' + f.statut | translate }}</span>
      </button>
      @if (ouvert() === f.matchId) {
        <app-feuille-signatures [base]="apiBase + '/feuilles/' + f.matchId + '/signatures'" [demanderNom]="parLien"
                                (changed)="charger()"/>
      }
    }
  </div>
  `,
  styles: [`
    .fe { display: flex; flex-direction: column; gap: 8px; }
    .fe__aide { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
    .fe__ligne { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; text-align: left; padding: 10px 12px; font: inherit;
                 border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; background: var(--background-primary);
                 color: var(--text-primary); cursor: pointer; }
    .fe__affiche { font-weight: 600; }
    .fe__etat { margin-left: auto; font-size: 12px; font-weight: 700; }
    .fe__etat--SIGNEE { color: #15803d; }
    .fe__etat--OBSOLETE { color: #b91c1c; }
    .fe__etat--EN_ATTENTE { color: var(--text-secondary); }
  `]
})
export class FeuillesEquipeComponent implements OnChanges {
  private http = inject(HttpClient);

  /** Racine : `/api/public/equipe/<jeton>` (lien) ou `/api/competitions/<c>/participants/<p>` (compte). */
  @Input({ required: true }) apiBase!: string;
  @Input() parLien = false;

  feuilles = signal<FeuilleEquipe[]>([]);
  ouvert = signal<number | null>(null);

  ngOnChanges(): void { this.charger(); }

  charger(): void {
    if (!this.apiBase) return;
    this.http.get<FeuilleEquipe[]>(`${this.apiBase}/feuilles`).subscribe({
      next: f => this.feuilles.set(f),
      error: () => this.feuilles.set([])
    });
  }
}
