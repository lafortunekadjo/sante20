// pages/competition-detail/competition-detail.component.ts
import {
  Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CompetitionDetailDTO, StatutCompetition } from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { TabParticipantsComponent } from '../tab-participants/tab-participants.component';
import { TabPhasesComponent } from '../tab-phases/tab-phases.component';
import { TabResumeComponent } from '../tab-resume/tab-resume.component';
import { TabStatistiquesComponent } from '../tab-statistiques/tab-statistiques.component';


type Tab = 'resume' | 'participants' | 'phases' | 'statistiques';

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    TabResumeComponent, TabParticipantsComponent,
    TabPhasesComponent, TabStatistiquesComponent
  ],
  template: `
    <div class="comp-detail" *ngIf="competition(); else loadingTpl">

      <!-- Hero -->
      <div class="comp-detail__hero">
        <div class="comp-detail__hero-bg"></div>
        <div class="comp-detail__hero-content">

          <button class="btn-back" routerLink="/competitions">
            <i class="material-icons">arrow_back</i>
            Retour
          </button>

          <div class="comp-detail__identity">
            <div class="comp-detail__logo">
              <img *ngIf="competition()!.logoUrl"
                   [src]="competition()!.logoUrl"
                   [alt]="competition()!.nom"/>
              <i *ngIf="!competition()!.logoUrl" class="material-icons">emoji_events</i>
            </div>
            <div class="comp-detail__info">
              <div class="comp-detail__badges">
                <span class="badge-type">{{ typeLabel(competition()!.type) }}</span>
                <span class="badge-statut" [class]="'statut-' + competition()!.statut.toLowerCase()">
                  {{ statutLabel(competition()!.statut) }}
                </span>
              </div>
              <h1 class="comp-detail__nom">{{ competition()!.nom }}</h1>
              <p class="comp-detail__desc" *ngIf="competition()!.description">
                {{ competition()!.description }}
              </p>
              <div class="comp-detail__meta">
                <span *ngIf="competition()!.organisateurNom">
                  <i class="material-icons">person</i>
                  {{ competition()!.organisateurNom }}
                </span>
                <span *ngIf="competition()!.dateDebut">
                  <i class="material-icons">calendar_today</i>
                  {{ competition()!.dateDebut | date:'dd/MM/yyyy' }}
                  <span *ngIf="competition()!.dateFin">
                    → {{ competition()!.dateFin | date:'dd/MM/yyyy' }}
                  </span>
                </span>
                <span>
                  <i class="material-icons">groups</i>
                  {{ competition()!.nombreParticipants }} équipes
                </span>
              </div>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="comp-detail__actions">
            <button class="btn-action btn-action--success"
                    *ngIf="canLancer()"
                    (click)="lancer()">
              <i class="material-icons">play_arrow</i>
              Lancer
            </button>
            <button class="btn-action btn-action--warning"
                    *ngIf="canPhaseSuivante()"
                    (click)="phaseSuivante()">
              <i class="material-icons">skip_next</i>
              Phase suivante
            </button>
            <button class="btn-action btn-action--ghost"
                    *ngIf="canTerminer()"
                    (click)="terminer()">
              <i class="material-icons">flag</i>
              Terminer
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="comp-detail__tabs">
        <div class="tabs-nav">
          <button class="tab-btn"
                  *ngFor="let tab of tabs"
                  [class.active]="activeTab() === tab.key"
                  (click)="setTab(tab.key)">
            <i class="material-icons">{{ tab.icon }}</i>
            {{ tab.label }}
          </button>
        </div>

        <div class="tabs-content">
          <app-tab-resume
            *ngIf="activeTab() === 'resume'"
            [competitionId]="competition()!.id"
            [competition]="competition()!"/>

          <app-tab-participants
            *ngIf="activeTab() === 'participants'"
            [competition]="competition()!"
            (updated)="reload()"/>

          <app-tab-phases
            *ngIf="activeTab() === 'phases'"
            [competition]="competition()!"/>

          <app-tab-statistiques
            *ngIf="activeTab() === 'statistiques'"
            [competitionId]="competition()!.id"/>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="comp-detail__loading">
        <div class="spinner"></div>
        <span>Chargement de la compétition...</span>
      </div>
    </ng-template>
  `,
  styleUrls: ['./competition-detail.component.scss']
})
export class CompetitionDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private api   = inject(CompetitionApiService);

  competition = signal<CompetitionDetailDTO | null>(null);
  activeTab   = signal<Tab>('resume');

  tabs = [
    { key: 'resume'        as Tab, label: 'Résumé',       icon: 'dashboard' },
    { key: 'participants'  as Tab, label: 'Équipes',       icon: 'groups' },
    { key: 'phases'        as Tab, label: 'Phases',        icon: 'format_list_bulleted' },
    { key: 'statistiques'  as Tab, label: 'Statistiques',  icon: 'bar_chart' },
  ];

  ngOnInit(): void { this.reload(); }

  reload(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe(c => this.competition.set(c));
  }

  setTab(t: Tab): void { this.activeTab.set(t); }

  canLancer():       boolean { return this.competition()?.statut === StatutCompetition.INSCRIPTION_OUVERTE; }
  canPhaseSuivante(): boolean { return this.competition()?.statut === StatutCompetition.EN_COURS && this.competition()?.config?.format === 'MIXTE' as any; }
  canTerminer():     boolean { return this.competition()?.statut === StatutCompetition.EN_COURS; }

  lancer(): void {
    this.api.lancer(this.competition()!.id).subscribe(() => this.reload());
  }
  phaseSuivante(): void {
    this.api.phaseSuivante(this.competition()!.id).subscribe(() => this.reload());
  }
  terminer(): void {
    this.api.terminer(this.competition()!.id).subscribe(() => this.reload());
  }

  typeLabel(t: string): string {
    const m: Record<string, string> = {
      CHAMPIONNAT: 'Championnat', COUPE: 'Coupe', MIXTE: 'Mixte'
    };
    return m[t] ?? t;
  }

  statutLabel(s: StatutCompetition): string {
    const m: Record<StatutCompetition, string> = {
      [StatutCompetition.BROUILLON]:           'Brouillon',
      [StatutCompetition.INSCRIPTION_OUVERTE]: 'Inscriptions ouvertes',
      [StatutCompetition.EN_COURS]:            'En cours',
      [StatutCompetition.TERMINE]:             'Terminée',
      [StatutCompetition.ANNULE]:              'Annulée',
    };
    return m[s] ?? s;
  }
}