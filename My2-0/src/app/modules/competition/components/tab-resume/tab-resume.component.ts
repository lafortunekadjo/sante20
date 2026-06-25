// pages/competition-detail/tab-resume/tab-resume.component.ts
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { from } from 'rxjs';
import { CompetitionDetailDTO, CompetitionResumeDTO } from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { MatchCardComponent } from '../match-card/match-card.component';


@Component({
  selector: 'app-tab-resume',
  standalone: true,
  imports: [CommonModule, MatchCardComponent],
  template: `
    <div class="tab-resume" *ngIf="resume()">

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <i class="material-icons kpi-card__icon kpi-card__icon--blue">groups</i>
          <div class="kpi-card__value">{{ competition.nombreParticipants }}</div>
          <div class="kpi-card__label">Équipes</div>
        </div>
        <div class="kpi-card" *ngIf="resume()!.journeeEnCours">
          <i class="material-icons kpi-card__icon kpi-card__icon--green">format_list_numbered</i>
          <div class="kpi-card__value">J{{ resume()!.journeeEnCours }}</div>
          <div class="kpi-card__label">Journée en cours</div>
        </div>
        <div class="kpi-card" *ngIf="resume()!.nombreMatchsRestants != null">
          <i class="material-icons kpi-card__icon kpi-card__icon--orange">sports_soccer</i>
          <div class="kpi-card__value">{{ resume()!.nombreMatchsRestants }}</div>
          <div class="kpi-card__label">Matchs restants</div>
        </div>
        <div class="kpi-card" *ngIf="resume()!.leader">
          <i class="material-icons kpi-card__icon kpi-card__icon--gold">emoji_events</i>
          <div class="kpi-card__value kpi-card__value--sm">
            {{ resume()!.leader!.nomEquipe }}
          </div>
          <div class="kpi-card__label">
            Leader · {{ resume()!.leader!.points }} pts
          </div>
        </div>
      </div>

      <!-- Phase en cours -->
      <div class="resume-section" *ngIf="resume()!.phaseEnCoursNom">
        <div class="resume-section__header">
          <i class="material-icons">flag</i>
          <h3>Phase en cours</h3>
        </div>
        <div class="phase-badge">{{ resume()!.phaseEnCoursNom }}</div>
      </div>

      <!-- Prochains matchs -->
      <div class="resume-section" *ngIf="resume()!.prochainsMatchs?.length">
        <div class="resume-section__header">
          <i class="material-icons">schedule</i>
          <h3>Prochains matchs</h3>
        </div>
        <div class="match-list">
          <app-match-card
            *ngFor="let m of resume()!.prochainsMatchs"
            [match]="m"
            [showActions]="false"/>
        </div>
      </div>

      <!-- Derniers résultats -->
      <div class="resume-section" *ngIf="resume()!.derniersResultats?.length">
        <div class="resume-section__header">
          <i class="material-icons">history</i>
          <h3>Derniers résultats</h3>
        </div>
        <div class="match-list">
          <app-match-card
            *ngFor="let m of resume()!.derniersResultats"
            [match]="m"
            [showActions]="false"/>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./tab-resume.component.scss']
})
export class TabResumeComponent implements OnInit {
  @Input() competitionId!: number;
  @Input() competition!: CompetitionDetailDTO;

  private api = inject(CompetitionApiService);
  resume = signal<CompetitionResumeDTO | null>(null);

  ngOnInit(): void {
    this.api.getResume(this.competitionId)
      .subscribe(r => this.resume.set(r));
  }
}