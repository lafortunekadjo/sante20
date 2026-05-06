// tab-phases.component.ts — version mise à jour
import {
  Component, Input, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompetitionDetailDTO, PhaseDTO, PouleDTO, BracketDTO, MatchDTO, JourneeDetailDTO, StadeDTO, TypePhase } from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { JourneeApiService } from '../../../../core/services/competition/journee-api.service';
import { MatchApiService } from '../../../../core/services/competition/match-api.service';
import { StadeApiService } from '../../../../core/services/competition/stade-api.service';
import { BracketViewComponent } from '../bracket-view/bracket-view.component';
import { ClassementTableComponent } from '../classement-table/classement-table.component';
import { MatchCardComponent } from '../match-card/match-card.component';
import { MatchEditComponent } from '../match-edit/match-edit.component';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-tab-phases',
  standalone: true,
  imports: [
    CommonModule,
    ClassementTableComponent,
    BracketViewComponent,
    MatchCardComponent,
    MatchEditComponent,
    FormsModule
  ],
  template: `
    <div class="tab-phases">

      <!-- Sélecteur de phase -->
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
        <div class="poules-container">
          <div class="poule-section"
               *ngFor="let poule of poules()">

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
            <div class="poule-content"
                 *ngIf="getActivePouleTab(poule.id) === 'classement'">
              <app-classement-table
                [classement]="poule.classement"
                [nombreQualifies]="competition.config?.qualifiesParGroupe ?? 0"/>
            </div>

            <!-- Journées -->
            <div class="poule-content"
                 *ngIf="getActivePouleTab(poule.id) === 'journees'">
              <div class="journees-container">
                <div class="journee-accordion"
                     *ngFor="let j of getJournees(poule.id)">

                  <!-- Header journée -->
                  <button class="journee-header"
                          (click)="toggleJournee(j.id)">
                    <div class="journee-header__left">
                      <span class="journee-nom">{{ j.nom }}</span>
                      <span class="journee-statut"
                            [class]="'statut-' + j.statut.toLowerCase()">
                        {{ j.statut }}
                      </span>
                    </div>
                    <div class="journee-header__right">
                      <span class="journee-progress">
                        {{ j.matchsTermines }}/{{ j.nombreMatchs }} matchs
                      </span>
                      <i class="material-icons">
                        {{ openJournee() === j.id ? 'expand_less' : 'expand_more' }}
                      </i>
                    </div>
                  </button>

                  <!-- Contenu journée -->
                  <div class="journee-content"
                       *ngIf="openJournee() === j.id">

                    <div class="journee-loading"
                         *ngIf="loadingJournee()">
                      <div class="spinner-sm"></div>
                    </div>

                    <ng-container *ngIf="!loadingJournee() && journeeDetail()">

                      <!-- Actions journée -->
                      <div class="journee-actions"
                           *ngIf="canEdit()">
                        <button class="btn-outline btn-sm"
                                (click)="ouvrirPlanificationMasse(j.id)">
                          <i class="material-icons">date_range</i>
                          Planifier les matchs
                        </button>
                      </div>

                      <!-- Liste des matchs -->
                      <div class="matchs-grid">
                        <div class="match-row"
                             *ngFor="let m of journeeDetail()!.matchs">
                          <app-match-card
                            [match]="m"
                            [showActions]="true"
                            [canEdit]="canEdit()"
                            (onEdit)="ouvrirMatchEdit($event)"
                            (onDetail)="ouvrirMatchDetail($event)"/>
                        </div>

                        <div class="no-matchs"
                             *ngIf="!journeeDetail()!.matchs?.length">
                          <i class="material-icons">sports_soccer</i>
                          <span>Aucun match dans cette journée</span>
                        </div>
                      </div>

                    </ng-container>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Phase éliminatoire -->
      <ng-container *ngIf="activePhase()?.type === 'ELIMINATOIRE'">
        <div class="bracket-section">

          <!-- Matchs du bracket -->
          <div class="bracket-matchs" *ngIf="bracketMatchs().length">
            <h3 class="section-title">
              <i class="material-icons">sports_soccer</i>
              Matchs
            </h3>
            <div class="matchs-grid">
              <div class="match-row"
                   *ngFor="let m of bracketMatchs()">
                <app-match-card
                  [match]="m"
                  [showActions]="true"
                  [canEdit]="canEdit()"
                  (onEdit)="ouvrirMatchEdit($event)"
                  (onDetail)="ouvrirMatchDetail($event)"/>
              </div>
            </div>
          </div>

          <!-- Bracket visuel -->
          <h3 class="section-title" style="margin-top: 32px">
            <i class="material-icons">account_tree</i>
            Tableau
          </h3>
          <app-bracket-view [bracket]="bracket() ?? undefined"/>
        </div>
      </ng-container>

      <!-- Chargement -->
      <div class="phases-loading" *ngIf="loading()">
        <div class="spinner"></div>
        <span>Chargement...</span>
      </div>

      <!-- ── DRAWER MATCH EDIT ──────────────── -->
      <div class="drawer-overlay"
           [class.open]="matchEditOpen()"
           (click)="fermerMatchEdit()">
      </div>

      <div class="drawer drawer--right"
           [class.open]="matchEditOpen()">
        <app-match-edit
          *ngIf="matchSelectionne() && matchEditOpen()"
          [match]="matchSelectionne()!"
          [competitionId]="competition.id"
          (onClose)="fermerMatchEdit()"
          (onSaved)="onMatchSaved($event)"/>
      </div>

      <!-- ── MODAL PLANIFICATION EN MASSE ────── -->
      <div class="modal-overlay"
           *ngIf="planifMasseOpen()"
           (click)="planifMasseOpen.set(false)">
        <div class="modal modal--large"
             (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h3>
              <i class="material-icons">date_range</i>
              Planifier les matchs — {{ journeeDetail()?.nom }}
            </h3>
            <button class="btn-close"
                    (click)="planifMasseOpen.set(false)">
              <i class="material-icons">close</i>
            </button>
          </div>

          <div class="modal__body modal__body--scroll">
            <div class="planif-match"
                 *ngFor="let m of journeeDetail()?.matchs; let i = index">
              <div class="planif-match__teams">
                <span>{{ m.domicile?.nomEquipe }}</span>
                <span class="planif-vs">vs</span>
                <span>{{ m.exterieur?.nomEquipe }}</span>
              </div>
              <div class="planif-match__inputs">
                <input type="datetime-local"
                       [(ngModel)]="planifDates[m.id]"
                       class="form-input planif-input"/>
                <select [(ngModel)]="planifStades[m.id]"
                        class="form-select planif-input">
                  <option [ngValue]="null">Stade...</option>
                  <option *ngFor="let s of tousStades()"
                          [ngValue]="s.id">
                    {{ s.nom }}
                    {{ s.ville ? '(' + s.ville + ')' : '' }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal__footer">
            <button class="btn-ghost"
                    (click)="planifMasseOpen.set(false)">
              Annuler
            </button>
            <button class="btn-primary"
                    [disabled]="savingPlanif()"
                    (click)="sauvegarderPlanifMasse()">
              <i class="material-icons">save</i>
              {{ savingPlanif() ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styleUrls: ['./tab-phases.component.scss']
})
export class TabPhasesComponent implements OnInit {
  @Input() competition!: CompetitionDetailDTO;

  private api        = inject(CompetitionApiService);
  private journeeApi = inject(JourneeApiService);
  private stadeApi   = inject(StadeApiService);

  phases         = signal<PhaseDTO[]>([]);
  activePhaseId  = signal<number | null>(null);
  poules         = signal<PouleDTO[]>([]);
  bracket        = signal<BracketDTO | null>(null);
  bracketMatchs  = signal<MatchDTO[]>([]);
  loading        = signal(false);
  openJournee    = signal<number | null>(null);
  journeeDetail  = signal<JourneeDetailDTO | null>(null);
  loadingJournee = signal(false);
  matchSelectionne = signal<MatchDTO | null>(null);
  matchEditOpen  = signal(false);
  planifMasseOpen = signal(false);
  savingPlanif   = signal(false);
  tousStades     = signal<StadeDTO[]>([]);

  // Maps locales
  private pouleTabs  = new Map<number, string>();
  private journeesMap = new Map<number, any[]>();

  // Planification en masse
  planifDates:  Record<number, string> = {};
  planifStades: Record<number, number | null> = {};

  ngOnInit(): void {
    this.api.getPhases(this.competition.id).subscribe(phases => {
      this.phases.set(phases);
      if (phases.length > 0) this.selectPhase(phases[0]);
    });
    this.stadeApi.lister().subscribe(s => this.tousStades.set(s));
  }

  selectPhase(phase: PhaseDTO): void {
    this.activePhaseId.set(phase.id);
    this.loading.set(true);

    if (phase.type === TypePhase.GROUPE) {
      this.api.getPoules(this.competition.id, phase.id)
        .subscribe(poules => {
          this.poules.set(poules);
          poules.forEach(p => {
            this.journeeApi.getJournees(this.competition.id, p.id)
              .subscribe(j => this.journeesMap.set(p.id, j));
          });
          this.loading.set(false);
        });
    } else {
      // Bracket
      this.api.getBracket(this.competition.id, phase.id)
        .subscribe(b => {
          this.bracket.set(b);
          this.loading.set(false);
        });
      // Matchs du bracket
      this.matchApi.getMatchs(this.competition.id)
        .subscribe(matchs => this.bracketMatchs.set(matchs));
    }
  }

  activePhase(): PhaseDTO | undefined {
    return this.phases().find(p => p.id === this.activePhaseId());
  }

  getActivePouleTab(id: number): string {
    return this.pouleTabs.get(id) ?? 'classement';
  }

  setPouleTab(id: number, tab: string): void {
    this.pouleTabs.set(id, tab);
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
        // Init planif maps
        d.matchs.forEach(m => {
          this.planifDates[m.id]  = m.dateHeure?.slice(0, 16) ?? '';
          this.planifStades[m.id] = m.stade?.id ?? null;
        });
        this.loadingJournee.set(false);
      });
  }

  // ── Match edit
  ouvrirMatchEdit(match: MatchDTO): void {
    this.matchSelectionne.set(match);
    this.matchEditOpen.set(true);
  }

  ouvrirMatchDetail(match: MatchDTO): void {
    // Navigation vers match-detail
    window.location.href =
      `/competitions/${this.competition.id}/matchs/${match.id}`;
  }

  fermerMatchEdit(): void {
    this.matchEditOpen.set(false);
    setTimeout(() => this.matchSelectionne.set(null), 300);
  }

  onMatchSaved(match: MatchDTO): void {
    this.fermerMatchEdit();
    // Recharger la journée ouverte
    const jId = this.openJournee();
    if (jId) {
      this.journeeApi.getJourneeDetail(this.competition.id, jId)
        .subscribe(d => this.journeeDetail.set(d));
    }
  }

  // ── Planification en masse
  ouvrirPlanificationMasse(journeeId: number): void {
    this.planifMasseOpen.set(true);
  }

  sauvegarderPlanifMasse(): void {
    this.savingPlanif.set(true);
    const matchs = this.journeeDetail()?.matchs ?? [];
    const calls = matchs
      .filter(m => this.planifDates[m.id] || this.planifStades[m.id])
      .map(m => this.matchApi.planifier(
        this.competition.id, m.id, {
          matchId:   m.id,
          dateHeure: this.planifDates[m.id] || undefined,
          stadeId:   this.planifStades[m.id] ?? undefined,
        }
      ));

    if (!calls.length) {
      this.savingPlanif.set(false);
      this.planifMasseOpen.set(false);
      return;
    }

    // Exécuter tous les appels en parallèle
    import('rxjs').then(({ forkJoin }) => {
      forkJoin(calls).subscribe({
        next: () => {
          const jId = this.openJournee();
          if (jId) {
            this.journeeApi.getJourneeDetail(this.competition.id, jId)
              .subscribe(d => this.journeeDetail.set(d));
          }
          this.savingPlanif.set(false);
          this.planifMasseOpen.set(false);
        },
        error: () => this.savingPlanif.set(false)
      });
    });
  }

  canEdit(): boolean {
    return this.competition.statut === 'EN_COURS' as any;
  }

  // ── Injection manquante
  private get matchApi() {
    return inject(MatchApiService);
  }
}