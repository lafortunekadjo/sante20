// components/classement-table/classement-table.component.ts
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassementDTO, StatutClassement } from '../../../../core/models/competition.models';


@Component({
  selector: 'app-classement-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="classement">
      <div class="classement__header" *ngIf="titre">
        <h3 class="classement__titre">{{ titre }}</h3>
      </div>

      <div class="classement__table-wrapper">
        <table class="classement__table">
          <thead>
            <tr>
              <th class="col-pos">#</th>
              <th class="col-team">Équipe</th>
              <th class="col-num" title="Matchs joués">MJ</th>
              <th class="col-num" title="Victoires">V</th>
              <th class="col-num" title="Nuls">N</th>
              <th class="col-num" title="Défaites">D</th>
              <th class="col-num" title="Buts pour">BP</th>
              <th class="col-num" title="Buts contre">BC</th>
              <th class="col-num" title="Goal average">GA</th>
              <th class="col-pts">Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ligne of classement"
                [class]="getRowClass(ligne)"
                [class.highlighted]="highlightedId === ligne.participantId">

              <td class="col-pos">
                <span class="pos-badge" [class]="getPosClass(ligne)">
                  {{ ligne.position }}
                </span>
              </td>

              <td class="col-team">
                <div class="team-cell">
                  <div class="team-logo">
                    <img *ngIf="ligne.logoUrl"
                         [src]="ligne.logoUrl"
                         [alt]="ligne.nomEquipe"/>
                   <span *ngIf="!ligne.logoUrl" class="team-initials">
                      {{ getInitials(ligne.nomEquipe ?? '') }}
                    </span>
                  </div>
                  <span class="team-name">{{ ligne.nomEquipe }}</span>
                  <span class="statut-badge"
                        *ngIf="ligne.statutSpecial"
                        [class]="'badge-' + ligne.statutSpecial?.toLowerCase()">
                    {{ statutLabel(ligne.statutSpecial) }}
                  </span>
                  <span class="penalite" *ngIf="ligne.penalitePoints < 0"
                        [title]="'Pénalité: ' + ligne.penalitePoints + ' pts'">
                    ⚠
                  </span>
                </div>
              </td>

              <td class="col-num">{{ ligne.matchsJoues }}</td>
              <td class="col-num col-v">{{ ligne.victoires }}</td>
              <td class="col-num">{{ ligne.nuls }}</td>
              <td class="col-num col-d">{{ ligne.defaites }}</td>
              <td class="col-num">{{ ligne.butsPour }}</td>
              <td class="col-num">{{ ligne.butsContre }}</td>
              <td class="col-num"
                  [class.positive]="ligne.goalAverage > 0"
                  [class.negative]="ligne.goalAverage < 0">
                {{ ligne.goalAverage > 0 ? '+' : '' }}{{ ligne.goalAverage }}
              </td>
              <td class="col-pts">
                <strong>{{ ligne.points }}</strong>
              </td>
            </tr>

            <tr *ngIf="!classement?.length">
              <td colspan="10" class="empty-state">
                Aucun résultat disponible
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Légende -->
      <div class="classement__legend" *ngIf="showLegend">
        <span class="legend-item legend-item--qualifie">
          <span class="dot"></span> Qualifié
        </span>
        <span class="legend-item legend-item--barrage">
          <span class="dot"></span> Barrage
        </span>
        <span class="legend-item legend-item--relegate">
          <span class="dot"></span> Relégué
        </span>
      </div>
    </div>
  `,
  styleUrls: ['./classement-table.component.scss']
})
export class ClassementTableComponent implements OnChanges {
  @Input() classement: ClassementDTO[] = [];
  @Input() titre?: string;
  @Input() highlightedId?: number;
  @Input() showLegend = true;
  @Input() nombreQualifies = 0;
  @Input() nombreBarrages = 0;

  ngOnChanges(): void {}

  getRowClass(ligne: ClassementDTO): string {
    if (ligne.statutSpecial === StatutClassement.CHAMPION) return 'row-champion';
    if (ligne.statutSpecial === StatutClassement.QUALIFIE) return 'row-qualifie';
    if (ligne.statutSpecial === StatutClassement.BARRAGE)  return 'row-barrage';
    if (ligne.statutSpecial === StatutClassement.RELEGATE) return 'row-relegate';
    if (this.nombreQualifies > 0 && ligne.position <= this.nombreQualifies)
      return 'row-qualifie';
    if (this.nombreBarrages > 0 &&
        ligne.position <= this.nombreQualifies + this.nombreBarrages)
      return 'row-barrage';
    return '';
  }

  getPosClass(ligne: ClassementDTO): string {
    if (ligne.position === 1) return 'pos-gold';
    if (ligne.position === 2) return 'pos-silver';
    if (ligne.position === 3) return 'pos-bronze';
    return '';
  }

getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}
  statutLabel(statut?: StatutClassement): string {
    const labels: Partial<Record<StatutClassement, string>> = {
      [StatutClassement.QUALIFIE]: 'Q',
      [StatutClassement.CHAMPION]: '🏆',
      [StatutClassement.RELEGATE]: 'R',
      [StatutClassement.BARRAGE]:  'B',
      [StatutClassement.PENALISE]: 'P',
    };
    return statut ? (labels[statut] ?? statut) : '';
  }
}