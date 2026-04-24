// components/match-card/match-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatchDTO, StatutMatch } from '../../../../core/models/competition.models';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="match-card" [class]="'statut-' + match.statut.toLowerCase()">

      <div class="match-card__header" *ngIf="match.dateHeure || match.tourNom">
        <span class="match-card__tour" *ngIf="match.tourNom">
          {{ match.tourNom }}
        </span>
        <span class="match-card__journee" *ngIf="match.journeeNumero > 0 && !match.tourNom">
          J{{ match.journeeNumero }}
        </span>
        <span class="match-card__date" *ngIf="match.dateHeure">
          {{ match.dateHeure | date:'dd/MM/yyyy · HH:mm' }}
        </span>
        <span class="match-card__lieu" *ngIf="match.lieu">
          <i class="material-icons">location_on</i>{{ match.lieu }}
        </span>
      </div>

      <div class="match-card__body">

        <!-- Équipe domicile -->
        <div class="match-card__team match-card__team--home"
             [class.winner]="isWinner('home')">
          <div class="match-card__team-logo">
            <img *ngIf="match.domicile?.logoUrl"
                 [src]="match.domicile.logoUrl"
                 [alt]="match.domicile.nomEquipe"/>
            <span *ngIf="!match.domicile?.logoUrl" class="match-card__team-initials">
              {{ getInitials(match.domicile?.nomEquipe) }}
            </span>
          </div>
          <span class="match-card__team-name">
            {{ match.domicile?.nomEquipe }}
          </span>
        </div>

        <!-- Score / Statut -->
        <div class="match-card__score">
          <ng-container *ngIf="isTermine(); else notPlayed">
            <span class="match-card__score-num"
                  [class.winner-score]="isWinner('home')">
              {{ match.butsDomicile ?? 0 }}
            </span>
            <span class="match-card__score-sep">–</span>
            <span class="match-card__score-num"
                  [class.winner-score]="isWinner('away')">
              {{ match.butsExterieur ?? 0 }}
            </span>
            <div class="match-card__score-extra" *ngIf="hasProlong()">
              <span>ap. {{ totalDom() }} – {{ totalExt() }}</span>
            </div>
            <div class="match-card__score-extra" *ngIf="hasTab()">
              <span>tab {{ match.tabDomicile }} – {{ match.tabExterieur }}</span>
            </div>
          </ng-container>
          <ng-template #notPlayed>
            <span class="match-card__statut-badge"
                  [class]="'badge-' + match.statut.toLowerCase()">
              {{ statutLabel() }}
            </span>
          </ng-template>
        </div>

        <!-- Équipe extérieur -->
        <div class="match-card__team match-card__team--away"
             [class.winner]="isWinner('away')">
          <span class="match-card__team-name">
            {{ match.exterieur?.nomEquipe }}
          </span>
          <div class="match-card__team-logo">
            <img *ngIf="match.exterieur?.logoUrl"
                 [src]="match.exterieur.logoUrl"
                 [alt]="match.exterieur.nomEquipe"/>
            <span *ngIf="!match.exterieur?.logoUrl" class="match-card__team-initials">
              {{ getInitials(match.exterieur?.nomEquipe) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="match-card__actions" *ngIf="showActions">
        <button class="btn-action btn-action--ghost"
                (click)="onDetail.emit(match)">
          <i class="material-icons">visibility</i>
        </button>
        <button class="btn-action btn-action--primary"
                *ngIf="canEdit"
                (click)="onEdit.emit(match)">
          <i class="material-icons">edit</i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./match-card.component.scss']
})
export class MatchCardComponent {
  @Input() match!: MatchDTO;
  @Input() showActions = true;
  @Input() canEdit = false;
  @Output() onDetail = new EventEmitter<MatchDTO>();
  @Output() onEdit   = new EventEmitter<MatchDTO>();

  isTermine(): boolean {
    return [StatutMatch.TERMINE,
            StatutMatch.FORFAIT_DOMICILE,
            StatutMatch.FORFAIT_EXTERIEUR,
            StatutMatch.FORFAIT_DOUBLE].includes(this.match.statut);
  }

  isWinner(side: 'home' | 'away'): boolean {
    if (!this.isTermine()) return false;
    const dom = this.totalDom();
    const ext = this.totalExt();
    if (side === 'home') {
      if (this.match.tabDomicile != null)
        return this.match.tabDomicile! > this.match.tabExterieur!;
      return dom > ext;
    } else {
      if (this.match.tabExterieur != null)
        return this.match.tabExterieur! > this.match.tabDomicile!;
      return ext > dom;
    }
  }

  totalDom(): number {
    return (this.match.butsDomicile ?? 0)
         + (this.match.butsDomicileProlong ?? 0);
  }

  totalExt(): number {
    return (this.match.butsExterieur ?? 0)
         + (this.match.butsExterieurProlong ?? 0);
  }

  hasProlong(): boolean {
    return this.match.butsDomicileProlong != null;
  }

  hasTab(): boolean {
    return this.match.tabDomicile != null;
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  statutLabel(): string {
    const labels: Record<StatutMatch, string> = {
      [StatutMatch.PLANIFIE]: 'À venir',
      [StatutMatch.EN_COURS]: 'En cours',
      [StatutMatch.TERMINE]: 'Terminé',
      [StatutMatch.REPORTE]: 'Reporté',
      [StatutMatch.FORFAIT_DOMICILE]: 'Forfait dom.',
      [StatutMatch.FORFAIT_EXTERIEUR]: 'Forfait ext.',
      [StatutMatch.FORFAIT_DOUBLE]: 'Double forfait',
      [StatutMatch.ANNULE]: 'Annulé'
    };
    return labels[this.match.statut] ?? this.match.statut;
  }
}