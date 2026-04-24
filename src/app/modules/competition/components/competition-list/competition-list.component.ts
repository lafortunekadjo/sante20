// pages/competition-list/competition-list.component.ts
import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CompetitionDTO, StatutCompetition, TypeCompetition } from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';

@Component({
  selector: 'app-competition-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="comp-list">

      <!-- Header -->
      <div class="comp-list__header">
        <div class="comp-list__header-left">
          <h1 class="comp-list__title">
            <i class="material-icons">emoji_events</i>
            Compétitions
          </h1>
          <span class="comp-list__count" *ngIf="totalElements() > 0">
            {{ totalElements() }} résultat{{ totalElements() > 1 ? 's' : '' }}
          </span>
        </div>
        <button class="btn-primary" routerLink="/competitions/new">
          <i class="material-icons">add</i>
          Nouvelle compétition
        </button>
      </div>

      <!-- Filtres -->
      <div class="comp-list__filters">
        <div class="filter-group">
          <button class="filter-btn"
                  [class.active]="filtreStatut() === null"
                  (click)="setFiltreStatut(null)">
            Toutes
          </button>
          <button class="filter-btn"
                  *ngFor="let s of statutOptions"
                  [class.active]="filtreStatut() === s.value"
                  (click)="setFiltreStatut(s.value)">
            <span class="filter-dot" [class]="'dot-' + s.value.toLowerCase()"></span>
            {{ s.label }}
          </button>
        </div>

        <div class="filter-group">
          <button class="filter-btn"
                  [class.active]="filtreType() === null"
                  (click)="setFiltreType(null)">
            Tous types
          </button>
          <button class="filter-btn"
                  *ngFor="let t of typeOptions"
                  [class.active]="filtreType() === t.value"
                  (click)="setFiltreType(t.value)">
            {{ t.label }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div class="comp-list__loading" *ngIf="loading()">
        <div class="spinner"></div>
        <span>Chargement...</span>
      </div>

      <!-- Liste -->
      <div class="comp-list__grid" *ngIf="!loading()">
        <div class="comp-card"
             *ngFor="let comp of competitions()"
             [routerLink]="['/competitions', comp.id]">

          <!-- Logo + statut -->
          <div class="comp-card__top">
            <div class="comp-card__logo">
              <img *ngIf="comp.logoUrl"
                   [src]="comp.logoUrl" [alt]="comp.nom"/>
              <i *ngIf="!comp.logoUrl" class="material-icons">emoji_events</i>
            </div>
            <span class="comp-card__statut"
                  [class]="'statut-' + comp.statut.toLowerCase()">
              {{ statutLabel(comp.statut) }}
            </span>
          </div>

          <!-- Infos -->
          <div class="comp-card__body">
            <h3 class="comp-card__nom">{{ comp.nom }}</h3>
            <div class="comp-card__meta">
              <span class="comp-card__type">
                <i class="material-icons">category</i>
                {{ typeLabel(comp.type) }}
              </span>
              <span class="comp-card__format">
                {{ formatLabel(comp.format) }}
              </span>
            </div>
            <div class="comp-card__dates" *ngIf="comp.dateDebut">
              <i class="material-icons">calendar_today</i>
              {{ comp.dateDebut | date:'dd/MM/yyyy' }}
              <span *ngIf="comp.dateFin"> → {{ comp.dateFin | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="comp-card__footer">
            <span class="comp-card__teams">
              <i class="material-icons">groups</i>
              {{ comp.nombreParticipants }} équipe{{ comp.nombreParticipants > 1 ? 's' : '' }}
            </span>
            <i class="material-icons comp-card__arrow">chevron_right</i>
          </div>
        </div>

        <!-- Empty state -->
        <div class="comp-list__empty" *ngIf="competitions().length === 0">
          <i class="material-icons">emoji_events</i>
          <h3>Aucune compétition</h3>
          <p>Créez votre première compétition pour commencer.</p>
          <button class="btn-primary" routerLink="/competitions/new">
            <i class="material-icons">add</i>
            Créer une compétition
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="comp-list__pagination"
           *ngIf="totalPages() > 1 && !loading()">
        <button class="page-btn"
                [disabled]="page() === 0"
                (click)="setPage(page() - 1)">
          <i class="material-icons">chevron_left</i>
        </button>
        <span class="page-info">
          Page {{ page() + 1 }} / {{ totalPages() }}
        </span>
        <button class="page-btn"
                [disabled]="page() >= totalPages() - 1"
                (click)="setPage(page() + 1)">
          <i class="material-icons">chevron_right</i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./competition-list.component.scss']
})
export class CompetitionListComponent implements OnInit {

  private api = inject(CompetitionApiService);

  competitions  = signal<CompetitionDTO[]>([]);
  loading       = signal(false);
  totalElements = signal(0);
  totalPages    = signal(0);
  page          = signal(0);
  filtreStatut  = signal<StatutCompetition | null>(null);
  filtreType    = signal<TypeCompetition | null>(null);

  statutOptions = [
    { value: StatutCompetition.BROUILLON,           label: 'Brouillon' },
    { value: StatutCompetition.INSCRIPTION_OUVERTE, label: 'Inscriptions' },
    { value: StatutCompetition.EN_COURS,            label: 'En cours' },
    { value: StatutCompetition.TERMINE,             label: 'Terminée' },
  ];

  typeOptions = [
    { value: TypeCompetition.CHAMPIONNAT, label: 'Championnat' },
    { value: TypeCompetition.COUPE,       label: 'Coupe' },
    { value: TypeCompetition.MIXTE,       label: 'Mixte' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.lister({
      statut: this.filtreStatut() ?? undefined,
      type:   this.filtreType()   ?? undefined,
      page:   this.page(),
      size:   12
    }).subscribe({
      next: res => {
        this.competitions.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setFiltreStatut(s: StatutCompetition | null): void {
    this.filtreStatut.set(s);
    this.page.set(0);
    this.load();
  }

  setFiltreType(t: TypeCompetition | null): void {
    this.filtreType.set(t);
    this.page.set(0);
    this.load();
  }

  setPage(p: number): void {
    this.page.set(p);
    this.load();
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

  typeLabel(t: TypeCompetition): string {
    const m: Record<TypeCompetition, string> = {
      [TypeCompetition.CHAMPIONNAT]: 'Championnat',
      [TypeCompetition.COUPE]:       'Coupe',
      [TypeCompetition.MIXTE]:       'Mixte',
    };
    return m[t] ?? t;
  }

  formatLabel(f: string): string {
    const m: Record<string, string> = {
      ALLER_SIMPLE:      'Aller simple',
      ALLER_RETOUR:      'Aller-retour',
      ELIMINATION_SIMPLE:'Élimination directe',
      MIXTE:             'Poules + Knockout',
    };
    return m[f] ?? f;
  }
}