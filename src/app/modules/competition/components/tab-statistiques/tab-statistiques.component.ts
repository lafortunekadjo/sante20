// tab-statistiques/tab-statistiques.component.ts
import {
  Component, Input, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButeurDTO, PasseurDTO, CartonsDTO, SuspensionDTO } from '../../../../core/models/competition.models';
import { StatistiquesApiService } from '../../../../core/services/competition/statistiques-api.service';

type StatTab = 'buteurs' | 'passeurs' | 'cartons' | 'suspensions';

@Component({
  selector: 'app-tab-statistiques',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tab-stats">

      <!-- Sous-tabs -->
      <div class="stats-tabs">
        <button class="stats-tab"
                *ngFor="let t of statTabs"
                [class.active]="activeTab() === t.key"
                (click)="setTab(t.key)">
          <i class="material-icons">{{ t.icon }}</i>
          {{ t.label }}
        </button>
      </div>

      <!-- Buteurs -->
      <div *ngIf="activeTab() === 'buteurs'" class="stats-section">
        <div class="stats-table" *ngIf="buteurs().length; else empty">
          <div class="stats-row stats-row--header">
            <span class="col-rank">#</span>
            <span class="col-player">Joueur</span>
            <span class="col-num">Buts</span>
            <span class="col-num">Pen.</span>
            <span class="col-num">CSC</span>
          </div>
          <div class="stats-row"
               *ngFor="let b of buteurs(); let i = index">
            <span class="col-rank">
              <span class="rank-badge" [class]="getRankClass(i+1)">{{ i+1 }}</span>
            </span>
            <span class="col-player">
              <div class="player-info">
                <span class="player-name">{{ b.joueurNom }}</span>
                <span class="player-team">{{ b.nomEquipe }}</span>
              </div>
            </span>
            <span class="col-num col-num--bold">{{ b.nbButs }}</span>
            <span class="col-num">{{ b.nbPenalties }}</span>
            <span class="col-num">{{ b.nbContresSonCamp }}</span>
          </div>
        </div>
      </div>

      <!-- Passeurs -->
      <div *ngIf="activeTab() === 'passeurs'" class="stats-section">
        <div class="stats-table" *ngIf="passeurs().length; else empty">
          <div class="stats-row stats-row--header">
            <span class="col-rank">#</span>
            <span class="col-player">Joueur</span>
            <span class="col-num">Passes D.</span>
          </div>
          <div class="stats-row"
               *ngFor="let p of passeurs(); let i = index">
            <span class="col-rank">
              <span class="rank-badge" [class]="getRankClass(i+1)">{{ i+1 }}</span>
            </span>
            <span class="col-player">
              <div class="player-info">
                <span class="player-name">{{ p.joueurNom }}</span>
                <span class="player-team">{{ p.nomEquipe }}</span>
              </div>
            </span>
            <span class="col-num col-num--bold">{{ p.nbPasses }}</span>
          </div>
        </div>
      </div>

      <!-- Cartons -->
      <div *ngIf="activeTab() === 'cartons'" class="stats-section">
        <div class="cartons-grid" *ngIf="cartons()">
          <!-- Cartons jaunes -->
          <div class="cartons-col">
            <div class="cartons-col__header">
              <span class="carton-icon jaune">🟨</span>
              <span>Cartons jaunes
                <strong>{{ cartons()!.totalCartonsJaunes }}</strong>
              </span>
            </div>
            <div class="stats-table">
              <div class="stats-row"
                   *ngFor="let c of cartons()!.classementCartonsJaunes; let i = index">
                <span class="col-rank">
                  <span class="rank-badge" [class]="getRankClass(i+1)">{{ i+1 }}</span>
                </span>
                <span class="col-player">
                  <div class="player-info">
                    <span class="player-name">{{ c.joueurNom }}</span>
                    <span class="player-team">{{ c.nomEquipe }}</span>
                  </div>
                </span>
                <span class="col-num col-num--bold col-jaune">
                  {{ c.nbCartonsJaunes }}
                </span>
              </div>
            </div>
          </div>

          <!-- Cartons rouges -->
          <div class="cartons-col">
            <div class="cartons-col__header">
              <span class="carton-icon rouge">🟥</span>
              <span>Cartons rouges
                <strong>{{ cartons()!.totalCartonsRouges }}</strong>
              </span>
            </div>
            <div class="stats-table">
              <div class="stats-row"
                   *ngFor="let c of cartons()!.classementCartonsRouges; let i = index">
                <span class="col-rank">
                  <span class="rank-badge" [class]="getRankClass(i+1)">{{ i+1 }}</span>
                </span>
                <span class="col-player">
                  <div class="player-info">
                    <span class="player-name">{{ c.joueurNom }}</span>
                    <span class="player-team">{{ c.nomEquipe }}</span>
                  </div>
                </span>
                <span class="col-num col-num--bold col-rouge">
                  {{ c.nbCartonsRouges }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Suspensions -->
      <div *ngIf="activeTab() === 'suspensions'" class="stats-section">
        <div class="suspension-list" *ngIf="suspensions().length; else empty">
          <div class="suspension-card"
               *ngFor="let s of suspensions()"
               [class.inactive]="!s.active">

            <div class="suspension-card__left">
              <div class="suspension-card__joueur">
                <span class="joueur-nom">{{ s.joueurNom }}</span>
                <span class="joueur-team">{{ s.nomEquipe }}</span>
              </div>
              <div class="suspension-card__raison">
                <span class="raison-badge" [class]="getRaisonClass(s)">
                  {{ raisonLabel(s) }}
                </span>
                <span class="motif" *ngIf="s.motifManuel">{{ s.motifManuel }}</span>
              </div>
            </div>

            <div class="suspension-card__right">
              <div class="suspension-matchs"
                   [class.active-susp]="s.active">
                <span class="matchs-restants">{{ s.nbMatchsRestants }}</span>
                <span class="matchs-label">
                  match{{ s.nbMatchsRestants > 1 ? 's' : '' }} restant
                </span>
              </div>
              <span class="suspension-statut"
                    [class]="s.active ? 'active' : 'inactive'">
                {{ s.active ? 'Active' : 'Purgée' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ng-template #empty>
        <div class="empty-state">
          <i class="material-icons">sentiment_neutral</i>
          <p>Aucune donnée disponible</p>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./tab-statistiques.component.scss']
})
export class TabStatistiquesComponent implements OnInit {
  @Input() competitionId!: number;

  private api = inject(StatistiquesApiService);

  buteurs     = signal<ButeurDTO[]>([]);
  passeurs    = signal<PasseurDTO[]>([]);
  cartons     = signal<CartonsDTO | null>(null);
  suspensions = signal<SuspensionDTO[]>([]);
  activeTab   = signal<StatTab>('buteurs');

  statTabs = [
    { key: 'buteurs'     as StatTab, label: 'Buteurs',     icon: 'sports_soccer' },
    { key: 'passeurs'    as StatTab, label: 'Passeurs',    icon: 'assistant' },
    { key: 'cartons'     as StatTab, label: 'Cartons',     icon: 'style' },
    { key: 'suspensions' as StatTab, label: 'Suspensions', icon: 'block' },
  ];

  ngOnInit(): void {
    this.loadTab('buteurs');
  }

  setTab(tab: StatTab): void {
    this.activeTab.set(tab);
    this.loadTab(tab);
  }

  loadTab(tab: StatTab): void {
    switch (tab) {
      case 'buteurs':
        if (!this.buteurs().length)
          this.api.getButeurs(this.competitionId)
            .subscribe(b => this.buteurs.set(b));
        break;
      case 'passeurs':
        if (!this.passeurs().length)
          this.api.getPasseurs(this.competitionId)
            .subscribe(p => this.passeurs.set(p));
        break;
      case 'cartons':
        if (!this.cartons())
          this.api.getCartons(this.competitionId)
            .subscribe(c => this.cartons.set(c));
        break;
      case 'suspensions':
        this.api.getSuspensions(this.competitionId)
          .subscribe(s => this.suspensions.set(s));
        break;
    }
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  }

  getRaisonClass(s: SuspensionDTO): string {
    if (s.manuelle) return 'raison-manuelle';
    if (['CARTON_ROUGE', 'CARTON_ROUGE_DOUBLE_JAUNE'].includes(s.raison)) return 'raison-rouge';
    return 'raison-jaune';
  }

  raisonLabel(s: SuspensionDTO): string {
    if (s.manuelle) return 'Disciplinaire';
    if (s.raison === 'CARTON_ROUGE') return 'Carton rouge';
    if (s.raison === 'CARTON_ROUGE_DOUBLE_JAUNE') return '2 jaunes = rouge';
    return `${s.nbMatchsInitial} CJ cumulés`;
  }
}