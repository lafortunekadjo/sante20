// tab-phases/tab-phases.component.ts
import {
  Component, Input, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompetitionDetailDTO, PhaseDTO, PouleDTO, BracketDTO, JourneeDetailDTO, TypePhase } from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { JourneeApiService } from '../../../../core/services/competition/journee-api.service';
import { BracketViewComponent } from '../bracket-view/bracket-view.component';
import { ClassementTableComponent } from '../classement-table/classement-table.component';
import { MatchCardComponent } from '../match-card/match-card.component';

@Component({
  selector: 'app-tab-phases',
  standalone: true,
  imports: [
    CommonModule,
    ClassementTableComponent,
    BracketViewComponent,
    MatchCardComponent
  ],
  template: `
    <div class="tab-phases">

      <!-- Sélecteur de phase si plusieurs -->
      <div class="phase-selector" *ngIf="phases().length > 1">
        <button class="phase-btn"
                *ngFor="let p of phases()"
                [class.active]="activePhaseId() === p.id"
                (click)="selectPhase(p)">
          <span class="phase-btn__dot"
                [class]="'dot-' + p.statut.toLowerCase()"></span>
          {{ p.nom }}
        </button>
      </div>

      <!-- Phase de groupe / Championnat -->
      <ng-container *ngIf="activePhase()?.type === 'GROUPE'">

        <!-- Poules -->
        <div class="poules-container">
          <div class="poule-section"
               *ngFor="let poule of poules(); let i = index">

            <!-- Tabs : Classement / Journées -->
            <div class="poule-header">
              <h3 class="poule-nom">{{ poule.nom }}</h3>
              <div class="poule-tabs">
                <button class="poule-tab"
                        [class.active]="getActivePouleTab(poule.id) === 'classement'"
                        (click)="setPouleTab(poule.id, 'classement')">
                  Classement
                </button>
                <button class="poule-tab"
                        [class.active]="getActivePouleTab(poule.id) === 'journees'"
                        (click)="setPouleTab(poule.id, 'journees')">
                  Journées
                  <span class="poule-tab__badge">
                    {{ poule.journeesTerminees }}/{{ poule.nombreJournees }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Classement -->
            <app-classement-table
              *ngIf="getActivePouleTab(poule.id) === 'classement'"
              [classement]="poule.classement"
              [nombreQualifies]="competition.config?.qualifiesParGroupe ?? 0"/>

            <!-- Journées -->
            <div *ngIf="getActivePouleTab(poule.id) === 'journees'"
                 class="journees-container">
              <div class="journee-accordion"
                   *ngFor="let j of getJournees(poule.id)">
                <button class="journee-header"
                        (click)="toggleJournee(j.id)">
                  <span class="journee-nom">{{ j.nom }}</span>
                  <span class="journee-progress">
                    {{ j.matchsTermines }}/{{ j.nombreMatchs }} matchs
                  </span>
                  <span class="journee-statut"
                        [class]="'statut-' + j.statut.toLowerCase()">
                    {{ j.statut }}
                  </span>
                  <i class="material-icons">
                    {{ openJournee() === j.id ? 'expand_less' : 'expand_more' }}
                  </i>
                </button>

                <div class="journee-matchs"
                     *ngIf="openJournee() === j.id">
                  <div class="journee-loading"
                       *ngIf="loadingJournee()">
                    <div class="spinner-sm"></div>
                  </div>
                  <ng-container *ngIf="!loadingJournee()">
                    <app-match-card
                      *ngFor="let m of journeeDetail()?.matchs"
                      [match]="m"
                      [showActions]="true"
                      [canEdit]="canEdit()"/>
                    <div *ngIf="!journeeDetail()?.matchs?.length"
                         class="no-matchs">
                      Aucun match dans cette journée
                    </div>
                  </ng-container>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Phase éliminatoire -->
      <ng-container *ngIf="activePhase()?.type === 'ELIMINATOIRE'">
        <app-bracket-view [bracket]="bracket() ?? undefined"/>
      </ng-container>

      <!-- Chargement -->
      <div class="phases-loading" *ngIf="loading()">
        <div class="spinner"></div>
        <span>Chargement...</span>
      </div>
    </div>
  `,
  styleUrls: ['./tab-phases.component.scss']
})
export class TabPhasesComponent implements OnInit {
  @Input() competition!: CompetitionDetailDTO;

  private api         = inject(CompetitionApiService);
  private journeeApi  = inject(JourneeApiService);

  phases        = signal<PhaseDTO[]>([]);
  activePhaseId = signal<number | null>(null);
  poules        = signal<PouleDTO[]>([]);
  bracket       = signal<BracketDTO | null>(null);
  loading       = signal(false);
  openJournee   = signal<number | null>(null);
  journeeDetail = signal<JourneeDetailDTO | null>(null);
  loadingJournee = signal(false);

  // Map pouleId → tab actif ('classement' | 'journees')
  private pouleTabs = new Map<number, string>();
  // Map pouleId → journées
  private journeesMap = new Map<number, any[]>();

  ngOnInit(): void {
    this.api.getPhases(this.competition.id).subscribe(phases => {
      this.phases.set(phases);
      if (phases.length > 0) this.selectPhase(phases[0]);
    });
  }

  selectPhase(phase: PhaseDTO): void {
    this.activePhaseId.set(phase.id);
    this.loading.set(true);

    if (phase.type === TypePhase.GROUPE) {
      this.api.getPoules(this.competition.id, phase.id).subscribe(poules => {
        this.poules.set(poules);
        // Charger les journées de chaque poule
        poules.forEach(p => {
          this.journeeApi.getJournees(this.competition.id, p.id)
            .subscribe(j => this.journeesMap.set(p.id, j));
        });
        this.loading.set(false);
      });
    } else {
      this.api.getBracket(this.competition.id, phase.id).subscribe(b => {
        this.bracket.set(b);
        this.loading.set(false);
      });
    }
  }

  activePhase(): PhaseDTO | undefined {
    return this.phases().find(p => p.id === this.activePhaseId());
  }

  getActivePouleTab(pouleId: number): string {
    return this.pouleTabs.get(pouleId) ?? 'classement';
  }

  setPouleTab(pouleId: number, tab: string): void {
    this.pouleTabs.set(pouleId, tab);
  }

  getJournees(pouleId: number): any[] {
    return this.journeesMap.get(pouleId) ?? [];
  }

  toggleJournee(journeeId: number): void {
    if (this.openJournee() === journeeId) {
      this.openJournee.set(null);
      return;
    }
    this.openJournee.set(journeeId);
    this.loadingJournee.set(true);
    this.journeeApi.getJourneeDetail(this.competition.id, journeeId)
      .subscribe(d => {
        this.journeeDetail.set(d);
        this.loadingJournee.set(false);
      });
  }

  canEdit(): boolean {
    return this.competition.statut === 'EN_COURS' as any;
  }
}