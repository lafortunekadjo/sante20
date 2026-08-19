import {
  Component, Input, OnInit, inject, signal
} from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Router }         from '@angular/router';
import {
  CompetitionDetailDTO, PhaseDTO, PouleDTO, BracketDTO,
  MatchDTO, JourneeDetailDTO, StadeDTO, TypePhase
} from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { JourneeApiService }     from '../../../../core/services/competition/journee-api.service';
import { MatchApiService }       from '../../../../core/services/competition/match-api.service';
import { StadeApiService }       from '../../../../core/services/competition/stade-api.service';
import { BracketViewComponent }  from '../bracket-view/bracket-view.component';
import { ClassementTableComponent } from '../classement-table/classement-table.component';
import { MatchCardComponent }    from '../match-card/match-card.component';
import { MatchEditComponent }    from '../match-edit/match-edit.component';
import { forkJoin }              from 'rxjs';

@Component({
  selector:    'app-tab-phases',
  standalone:  true,
  imports: [
    CommonModule, FormsModule,
    ClassementTableComponent, BracketViewComponent,
    MatchCardComponent, MatchEditComponent
  ],
  templateUrl: './tab-phases.component.html',
  styleUrls:   ['./tab-phases.component.scss']
})
export class TabPhasesComponent implements OnInit {
  @Input() competition!: CompetitionDetailDTO;

  // ── Services ──────────────────────────────────────────────
  private api        = inject(CompetitionApiService);
  private journeeApi = inject(JourneeApiService);
  private matchApi   = inject(MatchApiService);   // ← injection correcte
  private stadeApi   = inject(StadeApiService);
  private router     = inject(Router);            // ← Router pour navigation

  // ── Signals ───────────────────────────────────────────────
  phases           = signal<PhaseDTO[]>([]);
  activePhaseId    = signal<number | null>(null);
  poules           = signal<PouleDTO[]>([]);
  private classementMap = new Map<number, any[]>();  // groupeId → classement
  bracket          = signal<BracketDTO | null>(null);
  bracketMatchs    = signal<MatchDTO[]>([]);
  loading          = signal(false);
  openJournee      = signal<number | null>(null);
  journeeDetail    = signal<JourneeDetailDTO | null>(null);
  loadingJournee   = signal(false);
  matchSelectionne = signal<MatchDTO | null>(null);
  matchEditOpen    = signal(false);
  planifMasseOpen  = signal(false);
  savingPlanif     = signal(false);
  tousStades       = signal<StadeDTO[]>([]);

  // ── Maps locales ──────────────────────────────────────────
  private pouleTabs   = new Map<number, string>();
  private journeesMap = new Map<number, any[]>();

  // Planification en masse
  planifDates:  Record<number, string>          = {};
  planifStades: Record<number, number | null>   = {};

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.api.getPhases(this.competition.id).subscribe(phases => {
      this.phases.set(phases);
      if (phases.length > 0) this.selectPhase(phases[0]);
    });
    this.stadeApi.lister().subscribe(s => this.tousStades.set(s));
  }

  // ── Navigation entre phases ───────────────────────────────
  selectPhase(phase: PhaseDTO): void {
    this.activePhaseId.set(phase.id);
    this.loading.set(true);
    this.openJournee.set(null);
    this.journeeDetail.set(null);

    if (phase.type === TypePhase.GROUPE) {
      this.api.getPoules(this.competition.id, phase.id)
        .subscribe(poules => {
          this.poules.set(poules);
          poules.forEach(p => {
            // Journées
            this.journeeApi.getJournees(this.competition.id, p.id)
              .subscribe(j => this.journeesMap.set(p.id, j));
            // Classement — passer phaseId ET groupeId
            this.api.getClassement(this.competition.id, phase.id, p.id)
              .subscribe(cl => {
                this.classementMap.set(p.id, cl);
                // Mettre à jour la poule avec le classement
                this.poules.update(list => list.map(poule =>
                  poule.id === p.id
                    ? { ...poule, classement: cl }
                    : poule
                ));
              });
          });
          this.loading.set(false);
        });
    } else {
      forkJoin([
        this.api.getBracket(this.competition.id, phase.id),
        this.matchApi.getMatchs(this.competition.id)
      ]).subscribe(([bracket, matchs]) => {
        this.bracket.set(bracket);
        this.bracketMatchs.set(matchs);
        this.loading.set(false);
      });
    }
  }

  activePhase(): PhaseDTO | undefined {
    return this.phases().find(p => p.id === this.activePhaseId());
  }

  // ── Poule tabs ────────────────────────────────────────────
  getActivePouleTab(id: number): string {
    return this.pouleTabs.get(id) ?? 'classement';
  }

  setPouleTab(id: number, tab: string): void {
    this.pouleTabs.set(id, tab);
  }

  getJournees(pouleId: number): any[] {
    return this.journeesMap.get(pouleId) ?? [];
  }

  // ── Journée accordion ─────────────────────────────────────
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
        // Pré-remplir les maps de planification depuis les dates existantes
        d.matchs.forEach(m => {
          this.planifDates[m.id]  = m.dateHeure?.slice(0, 16) ?? '';
          this.planifStades[m.id] = m.stade?.id ?? null;
        });
        this.loadingJournee.set(false);
      });
  }

  // ── Match edit drawer ─────────────────────────────────────
  ouvrirMatchEdit(match: MatchDTO): void {
    this.matchSelectionne.set(match);
    this.matchEditOpen.set(true);
  }

  fermerMatchEdit(): void {
    this.matchEditOpen.set(false);
    setTimeout(() => this.matchSelectionne.set(null), 300);
  }

  onMatchSaved(match: MatchDTO): void {
    this.fermerMatchEdit();
    // Recharger la journée pour afficher les nouvelles dates
    const jId = this.openJournee();
    if (jId) {
      this.journeeApi.getJourneeDetail(this.competition.id, jId)
        .subscribe(d => {
          this.journeeDetail.set(d);
          // Mettre à jour les maps de planif
          d.matchs.forEach(m => {
            this.planifDates[m.id]  = m.dateHeure?.slice(0, 16) ?? '';
            this.planifStades[m.id] = m.stade?.id ?? null;
          });
        });
    }
  }

  // ── Navigation vers match detail ─────────────────────────
  ouvrirMatchDetail(match: MatchDTO): void {
    this.router.navigate([
      '/competitions', this.competition.id, 'matchs', match.id
    ]);
  }

  // Appelé depuis bracket-view quand un match est cliqué
  onMatchClicked(match: MatchDTO): void {
    if (!match?.id) return;
    this.router.navigate([
      '/competitions', this.competition.id, 'matchs', match.id
    ]);
  }

  // ── Planification en masse ────────────────────────────────
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
          dateHeure: this.planifDates[m.id]  || undefined,
          stadeId:   this.planifStades[m.id] ?? undefined,
        }
      ));

    if (!calls.length) {
      this.savingPlanif.set(false);
      this.planifMasseOpen.set(false);
      return;
    }

    forkJoin(calls).subscribe({
      next: () => {
        const jId = this.openJournee();
        if (jId) {
          this.journeeApi.getJourneeDetail(this.competition.id, jId)
            .subscribe(d => {
              this.journeeDetail.set(d);
              d.matchs.forEach(m => {
                this.planifDates[m.id]  = m.dateHeure?.slice(0, 16) ?? '';
                this.planifStades[m.id] = m.stade?.id ?? null;
              });
            });
        }
        this.savingPlanif.set(false);
        this.planifMasseOpen.set(false);
      },
      error: () => this.savingPlanif.set(false)
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  canEdit(): boolean {
    return ['BROUILLON', 'EN_COURS'].includes(this.competition.statut as string);
  }

  statutJourneeLabel(statut: string): string {
    const m: Record<string, string> = {
      EN_ATTENTE: 'À venir',
      EN_COURS:   'En cours',
      TERMINEE:   'Terminée'
    };
    return m[statut] ?? statut;
  }
}