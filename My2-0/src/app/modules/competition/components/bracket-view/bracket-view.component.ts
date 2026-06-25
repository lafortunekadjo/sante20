// components/bracket-view/bracket-view.component.ts
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BracketDTO, NomTour, BracketNoeudDTO } from '../../../../core/models/competition.models';

interface BracketRound {
  nom: string;
  noeuds: BracketNoeudDTO[];
}


@Component({
  selector: 'app-bracket-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bracket" *ngIf="bracket">

      <div class="bracket__rounds">
        <div class="bracket__round" *ngFor="let round of rounds">
          <div class="bracket__round-header">
            <span>{{ round.nom }}</span>
          </div>
          <div class="bracket__round-matches">
            <div class="bracket__match"
                 *ngFor="let noeud of round.noeuds"
                 [class.bye]="noeud.bye">

              <!-- Équipe 1 -->
              <div class="bracket__team"
                   [class.winner]="isWinner(noeud, 1)"
                   [class.loser]="isLoser(noeud, 1)">
                <ng-container *ngIf="noeud.bye && !noeud.participant1">
                  <span class="bracket__team-name bracket__team--tbd">–</span>
                </ng-container>
                <ng-container *ngIf="noeud.participant1">
                  <div class="bracket__team-logo">
                    <img *ngIf="noeud.participant1.logoUrl"
                         [src]="noeud.participant1.logoUrl"
                         [alt]="noeud.participant1.nomEquipe"/>
                    <span *ngIf="!noeud.participant1.logoUrl">
                      {{ getInitials(noeud.participant1.nomEquipe) }}
                    </span>
                  </div>
                  <span class="bracket__team-name">
                    {{ noeud.participant1.nomEquipe }}
                  </span>
                  <span class="bracket__team-score"
                        *ngIf="noeud.matchAller && hasScore(noeud)">
                    {{ getScore(noeud, 1) }}
                  </span>
                </ng-container>
                <ng-container *ngIf="!noeud.participant1 && !noeud.bye">
                  <span class="bracket__team-name bracket__team--tbd">À déterminer</span>
                </ng-container>
              </div>

              <!-- Séparateur -->
              <div class="bracket__divider"></div>

              <!-- Équipe 2 -->
              <div class="bracket__team"
                   [class.winner]="isWinner(noeud, 2)"
                   [class.loser]="isLoser(noeud, 2)">
                <ng-container *ngIf="noeud.participant2">
                  <div class="bracket__team-logo">
                    <img *ngIf="noeud.participant2.logoUrl"
                         [src]="noeud.participant2.logoUrl"
                         [alt]="noeud.participant2.nomEquipe"/>
                    <span *ngIf="!noeud.participant2.logoUrl">
                      {{ getInitials(noeud.participant2.nomEquipe) }}
                    </span>
                  </div>
                  <span class="bracket__team-name">
                    {{ noeud.participant2.nomEquipe }}
                  </span>
                  <span class="bracket__team-score"
                        *ngIf="noeud.matchAller && hasScore(noeud)">
                    {{ getScore(noeud, 2) }}
                  </span>
                </ng-container>
                <ng-container *ngIf="!noeud.participant2">
                  <span class="bracket__team-name bracket__team--tbd">
                    {{ noeud.bye ? '–' : 'À déterminer' }}
                  </span>
                </ng-container>
              </div>

              <!-- Badge bye -->
              <div class="bracket__bye-badge" *ngIf="noeud.bye">
                Qualifié direct
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vainqueur final -->
      <div class="bracket__winner" *ngIf="vainqueurFinal">
        <div class="bracket__winner-crown">🏆</div>
        <div class="bracket__winner-logo">
          <img *ngIf="vainqueurFinal.logoUrl"
               [src]="vainqueurFinal.logoUrl"
               [alt]="vainqueurFinal.nomEquipe"/>
          <span *ngIf="!vainqueurFinal.logoUrl">
            {{ getInitials(vainqueurFinal.nomEquipe) }}
          </span>
        </div>
        <span class="bracket__winner-name">{{ vainqueurFinal.nomEquipe }}</span>
      </div>
    </div>

    <div class="bracket__empty" *ngIf="!bracket">
      <i class="material-icons">account_tree</i>
      <p>Le tableau n'est pas encore disponible</p>
    </div>
  `,
  styleUrls: ['./bracket-view.component.scss']
})
export class BracketViewComponent implements OnChanges {
  @Input() bracket?: BracketDTO;

  rounds: BracketRound[] = [];
  vainqueurFinal: any = null;

  ngOnChanges(): void {
    if (this.bracket) {
      this.buildRounds();
      this.findVainqueur();
    }
  }

  private buildRounds(): void {
    if (!this.bracket?.noeuds?.length) return;

    const noeuds = this.bracket.noeuds;
    const total  = noeuds.length;
    // Arbre binaire : feuilles = taille/2, niveaux = log2(taille+1)
    const niveaux = Math.ceil(Math.log2(total + 1));
    const rounds: BracketRound[] = [];

    const tourLabels: Record<NomTour, string> = {
      [NomTour.TOUR_PRELIMINAIRE]: 'Préliminaires',
      [NomTour.SEIZIEME]:          '16es de finale',
      [NomTour.HUITIEME]:          '8es de finale',
      [NomTour.QUART_DE_FINALE]:   'Quarts',
      [NomTour.DEMI_FINALE]:       'Demis',
      [NomTour.FINALE]:            'Finale'
    };

    // Grouper par niveau dans l'arbre (les feuilles sont au niveau niveaux-1)
    for (let level = niveaux - 1; level >= 0; level--) {
      const startPos = Math.pow(2, level);
      const endPos   = Math.pow(2, level + 1) - 1;
      const noeudsDuNiveau = noeuds.filter(
        n => n.position >= startPos && n.position <= endPos);

      if (noeudsDuNiveau.length > 0) {
        const tourIndex = niveaux - 1 - level;
        const nomTours = Object.values(NomTour);
        const tourKey  = nomTours[Math.max(0, nomTours.length - 1 - tourIndex)];
        rounds.push({
          nom: tourLabels[tourKey as NomTour] ?? `Tour ${tourIndex + 1}`,
          noeuds: noeudsDuNiveau.sort((a, b) => a.position - b.position)
        });
      }
    }

    this.rounds = rounds;
  }

  private findVainqueur(): void {
    if (!this.bracket?.noeuds) return;
    const finale = this.bracket.noeuds.find(n => n.noeudSuivantId == null);
    this.vainqueurFinal = finale?.vainqueur ?? null;
  }

  isWinner(noeud: BracketNoeudDTO, num: 1 | 2): boolean {
    if (!noeud.vainqueur) return false;
    const p = num === 1 ? noeud.participant1 : noeud.participant2;
    return p?.id === noeud.vainqueur.id;
  }

  isLoser(noeud: BracketNoeudDTO, num: 1 | 2): boolean {
    if (!noeud.vainqueur) return false;
    return !this.isWinner(noeud, num);
  }

  hasScore(noeud: BracketNoeudDTO): boolean {
    return noeud.matchAller?.butsDomicile != null;
  }

  getScore(noeud: BracketNoeudDTO, num: 1 | 2): string {
    const m = noeud.matchAller;
    if (!m) return '–';
    return num === 1
      ? String(m.butsDomicile ?? '–')
      : String(m.butsExterieur ?? '–');
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
}