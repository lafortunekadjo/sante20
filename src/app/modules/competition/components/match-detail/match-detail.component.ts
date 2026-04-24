// pages/match-detail/match-detail.component.ts
import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule, FormsModule,
  FormBuilder, Validators
} from '@angular/forms';
import { Cote, MatchDetailDTO, PosteJoueur, TypeEvent, StatutMatch, MatchEventDTO, MatchCompositionDTO } from '../../../../core/models/competition.models';
import { MatchApiService } from '../../../../core/services/competition/match-api.service';


type MatchTab = 'apercu' | 'composition' | 'evenements' | 'saisie';

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="match-detail" *ngIf="match(); else loadingTpl">

      <!-- Header match -->
      <div class="match-detail__hero">
        <button class="btn-back" (click)="goBack()">
          <i class="material-icons">arrow_back</i>
        </button>

        <div class="match-hero">

          <!-- Équipe domicile -->
          <div class="team-display team-display--home"
               [class.winner]="isWinner('home')">
            <div class="team-display__logo">
              <img *ngIf="match()!.domicile?.logoUrl"
                   [src]="match()!.domicile.logoUrl"
                   [alt]="match()!.domicile.nomEquipe"/>
              <span *ngIf="!match()!.domicile?.logoUrl">
                {{ getInitials(match()!.domicile?.nomEquipe) }}
              </span>
            </div>
            <span class="team-display__name">
              {{ match()!.domicile?.nomEquipe }}
            </span>
            <span class="team-display__label">Domicile</span>
          </div>

          <!-- Score central -->
          <div class="score-display">
            <div class="score-display__context">
              <span *ngIf="match()!.journeeNumero > 0">
                J{{ match()!.journeeNumero }}
              </span>
              <span *ngIf="match()!.tourNom">{{ match()!.tourNom }}</span>
            </div>

            <div class="score-display__main">
              <span class="score-num"
                    [class.winner-score]="isWinner('home')">
                {{ isTermine() ? (match()!.butsDomicile ?? 0) : '–' }}
              </span>
              <span class="score-sep">:</span>
              <span class="score-num"
                    [class.winner-score]="isWinner('away')">
                {{ isTermine() ? (match()!.butsExterieur ?? 0) : '–' }}
              </span>
            </div>

            <div class="score-display__extra"
                 *ngIf="match()!.butsDomicileProlong != null">
              ap. {{ totalDom() }} – {{ totalExt() }}
            </div>
            <div class="score-display__extra"
                 *ngIf="match()!.tabDomicile != null">
              TAB {{ match()!.tabDomicile }} – {{ match()!.tabExterieur }}
            </div>

            <div class="score-display__statut"
                 [class]="'statut-' + match()!.statut.toLowerCase()">
              {{ statutLabel() }}
            </div>

            <div class="score-display__infos">
              <span *ngIf="match()!.dateHeure">
                <i class="material-icons">schedule</i>
                {{ match()!.dateHeure | date:'dd/MM/yyyy HH:mm' }}
              </span>
              <span *ngIf="match()!.lieu">
                <i class="material-icons">location_on</i>
                {{ match()!.lieu }}
              </span>
            </div>
          </div>

          <!-- Équipe extérieur -->
          <div class="team-display team-display--away"
               [class.winner]="isWinner('away')">
            <div class="team-display__logo">
              <img *ngIf="match()!.exterieur?.logoUrl"
                   [src]="match()!.exterieur.logoUrl"
                   [alt]="match()!.exterieur.nomEquipe"/>
              <span *ngIf="!match()!.exterieur?.logoUrl">
                {{ getInitials(match()!.exterieur?.nomEquipe) }}
              </span>
            </div>
            <span class="team-display__name">
              {{ match()!.exterieur?.nomEquipe }}
            </span>
            <span class="team-display__label">Extérieur</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="match-detail__tabs">
        <div class="tabs-nav">
          <button class="tab-btn"
                  *ngFor="let t of tabs"
                  [class.active]="activeTab() === t.key"
                  (click)="setTab(t.key)">
            <i class="material-icons">{{ t.icon }}</i>
            {{ t.label }}
          </button>
        </div>

        <div class="tabs-content">

          <!-- ── APERÇU -->
          <div *ngIf="activeTab() === 'apercu'" class="apercu-tab">

            <!-- Timeline des événements -->
            <div class="timeline" *ngIf="match()!.evenements?.length">
              <h3 class="section-title">Résumé du match</h3>
              <div class="timeline__content">
                <div class="timeline__event"
                     *ngFor="let e of sortedEvents()"
                     [class]="'event-' + e.type.toLowerCase()">

                  <div class="timeline__minute">
                    {{ e.minute }}'
                    <span *ngIf="e.minuteAdditionnel">+{{ e.minuteAdditionnel }}</span>
                  </div>

                  <div class="timeline__icon">
                    {{ eventIcon(e.type) }}
                  </div>

                  <div class="timeline__info"
                       [class.align-right]="isExterieurEvent(e)">
                    <span class="event-player">{{ e.joueurNom }}</span>
                    <span class="event-team">{{ e.equipeNom }}</span>
                    <span class="event-assist"
                          *ngIf="e.passeurNom">
                      ↳ {{ e.passeurNom }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="no-events"
                 *ngIf="!match()!.evenements?.length && isTermine()">
              <i class="material-icons">sports_soccer</i>
              <p>Aucun événement enregistré</p>
            </div>

            <div class="not-played"
                 *ngIf="!isTermine()">
              <i class="material-icons">schedule</i>
              <p>Match {{ statutLabel().toLowerCase() }}</p>
            </div>
          </div>

          <!-- ── COMPOSITION -->
          <div *ngIf="activeTab() === 'composition'" class="composition-tab">
            <div class="compo-grid">

              <!-- Domicile -->
              <div class="compo-team">
                <div class="compo-team__header">
                  <div class="compo-team__logo">
                    <img *ngIf="match()!.domicile?.logoUrl"
                         [src]="match()!.domicile.logoUrl"/>
                    <span *ngIf="!match()!.domicile?.logoUrl">
                      {{ getInitials(match()!.domicile?.nomEquipe) }}
                    </span>
                  </div>
                  <span>{{ match()!.domicile?.nomEquipe }}</span>
                </div>
                <div class="compo-list">
                  <ng-container *ngFor="let poste of postes">
                    <div class="compo-poste-header"
                         *ngIf="getByPoste(match()!.compositionDomicile, poste.value).length">
                      {{ poste.label }}
                    </div>
                    <div class="compo-player"
                         *ngFor="let p of getByPoste(match()!.compositionDomicile, poste.value)"
                         [class.remplacant]="p.statut === 'REMPLACANT'"
                         [class.ineligible]="!p.eligible">
                      <span class="player-num">{{ p.numeroDos ?? '–' }}</span>
                      <span class="player-name">
                        {{ p.joueurNom }}
                        <i class="material-icons captain"
                           *ngIf="p.capitaine"
                           title="Capitaine">star</i>
                      </span>
                      <span class="player-entry"
                            *ngIf="p.minuteEntree">
                        ↑ {{ p.minuteEntree }}'
                      </span>
                      <span class="player-exit"
                            *ngIf="p.minuteSortie">
                        ↓ {{ p.minuteSortie }}'
                      </span>
                      <span class="ineligible-badge"
                            *ngIf="!p.eligible"
                            [title]="p.raisonIneligibilite ?? ''">
                        ⚠
                      </span>
                    </div>
                  </ng-container>
                  <div class="compo-empty"
                       *ngIf="!match()!.compositionDomicile?.length">
                    Composition non saisie
                  </div>
                </div>
              </div>

              <!-- Extérieur -->
              <div class="compo-team">
                <div class="compo-team__header">
                  <div class="compo-team__logo">
                    <img *ngIf="match()!.exterieur?.logoUrl"
                         [src]="match()!.exterieur.logoUrl"/>
                    <span *ngIf="!match()!.exterieur?.logoUrl">
                      {{ getInitials(match()!.exterieur?.nomEquipe) }}
                    </span>
                  </div>
                  <span>{{ match()!.exterieur?.nomEquipe }}</span>
                </div>
                <div class="compo-list">
                  <ng-container *ngFor="let poste of postes">
                    <div class="compo-poste-header"
                         *ngIf="getByPoste(match()!.compositionExterieur, poste.value).length">
                      {{ poste.label }}
                    </div>
                    <div class="compo-player"
                         *ngFor="let p of getByPoste(match()!.compositionExterieur, poste.value)"
                         [class.remplacant]="p.statut === 'REMPLACANT'"
                         [class.ineligible]="!p.eligible">
                      <span class="player-num">{{ p.numeroDos ?? '–' }}</span>
                      <span class="player-name">
                        {{ p.joueurNom }}
                        <i class="material-icons captain"
                           *ngIf="p.capitaine">star</i>
                      </span>
                      <span class="player-entry" *ngIf="p.minuteEntree">
                        ↑ {{ p.minuteEntree }}'
                      </span>
                      <span class="player-exit" *ngIf="p.minuteSortie">
                        ↓ {{ p.minuteSortie }}'
                      </span>
                      <span class="ineligible-badge"
                            *ngIf="!p.eligible">⚠</span>
                    </div>
                  </ng-container>
                  <div class="compo-empty"
                       *ngIf="!match()!.compositionExterieur?.length">
                    Composition non saisie
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── ÉVÉNEMENTS -->
          <div *ngIf="activeTab() === 'evenements'" class="evenements-tab">
            <div class="section-header">
              <h3 class="section-title">Événements du match</h3>
              <button class="btn-primary btn-sm"
                      *ngIf="canEdit()"
                      (click)="showEventForm.set(!showEventForm())">
                <i class="material-icons">add</i>
                Ajouter
              </button>
            </div>

            <!-- Formulaire ajout événement -->
            <div class="event-form" *ngIf="showEventForm() && canEdit()">
              <form [formGroup]="eventForm" (ngSubmit)="ajouterEvenement()">
                <div class="form-grid form-grid--3">
                  <div class="form-field">
                    <label class="form-label">Type *</label>
                    <select formControlName="type" class="form-select">
                      <option *ngFor="let e of eventTypes"
                              [value]="e.value">{{ e.label }}</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Équipe *</label>
                    <select formControlName="equipeId" class="form-select">
                      <option [value]="match()!.domicile?.id">
                        {{ match()!.domicile?.nomEquipe }}
                      </option>
                      <option [value]="match()!.exterieur?.id">
                        {{ match()!.exterieur?.nomEquipe }}
                      </option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Nom du joueur *</label>
                    <input formControlName="joueurNom"
                           class="form-input"
                           placeholder="Nom du joueur"/>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Minute *</label>
                    <input formControlName="minute"
                           type="number" min="1" max="120"
                           class="form-input" placeholder="Ex: 45"/>
                  </div>
                  <div class="form-field">
                    <label class="form-label">+ tps additionnel</label>
                    <input formControlName="minuteAdditionnel"
                           type="number" min="1"
                           class="form-input" placeholder="Ex: 3"/>
                  </div>
                  <div class="form-field"
                       *ngIf="isBut()">
                    <label class="form-label">Passeur</label>
                    <input formControlName="passeurNom"
                           class="form-input"
                           placeholder="Nom du passeur"/>
                  </div>
                </div>
                <div class="form-actions">
                  <button type="button" class="btn-ghost btn-sm"
                          (click)="showEventForm.set(false)">
                    Annuler
                  </button>
                  <button type="submit" class="btn-primary btn-sm"
                          [disabled]="eventForm.invalid || savingEvent()">
                    {{ savingEvent() ? '...' : 'Ajouter' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- Liste événements -->
            <div class="events-list">
              <div class="event-row"
                   *ngFor="let e of sortedEvents()"
                   [class]="'event-' + e.type.toLowerCase()">
                <span class="event-row__minute">
                  {{ e.minute }}'
                  <span *ngIf="e.minuteAdditionnel"
                        class="additional">
                    +{{ e.minuteAdditionnel }}
                  </span>
                </span>
                <span class="event-row__icon">{{ eventIcon(e.type) }}</span>
                <div class="event-row__info">
                  <span class="event-row__player">{{ e.joueurNom }}</span>
                  <span class="event-row__team">{{ e.equipeNom }}</span>
                  <span class="event-row__assist"
                        *ngIf="e.passeurNom">
                    ↳ {{ e.passeurNom }}
                  </span>
                </div>
                <button class="btn-icon--danger"
                        *ngIf="canEdit()"
                        (click)="supprimerEvenement(e.id!)"
                        title="Supprimer">
                  <i class="material-icons">delete_outline</i>
                </button>
              </div>

              <div class="no-events-list"
                   *ngIf="!match()!.evenements?.length">
                <i class="material-icons">sports</i>
                Aucun événement enregistré
              </div>
            </div>
          </div>

          <!-- ── SAISIE SCORE -->
          <div *ngIf="activeTab() === 'saisie'" class="saisie-tab">

            <!-- Résultat -->
            <div class="saisie-section">
              <h3 class="section-title">
                <i class="material-icons">scoreboard</i>
                Saisir le score
              </h3>

              <form [formGroup]="scoreForm" (ngSubmit)="saisirScore()">
                <div class="score-inputs">
                  <div class="score-input-group">
                    <label>{{ match()!.domicile?.nomEquipe }}</label>
                    <input formControlName="butsDomicile"
                           type="number" min="0" class="score-big-input"/>
                  </div>
                  <span class="score-vs">–</span>
                  <div class="score-input-group">
                    <label>{{ match()!.exterieur?.nomEquipe }}</label>
                    <input formControlName="butsExterieur"
                           type="number" min="0" class="score-big-input"/>
                  </div>
                </div>

                <!-- Prolongations -->
                <div class="prolong-section"
                     *ngIf="scoreForm.get('avecProlong')?.value">
                  <h4>Prolongations</h4>
                  <div class="score-inputs score-inputs--sm">
                    <input formControlName="butsDomicileProlong"
                           type="number" min="0" class="score-big-input score-big-input--sm"/>
                    <span class="score-vs">–</span>
                    <input formControlName="butsExterieurProlong"
                           type="number" min="0" class="score-big-input score-big-input--sm"/>
                  </div>
                </div>

                <!-- TAB -->
                <div class="prolong-section"
                     *ngIf="scoreForm.get('avecTab')?.value">
                  <h4>Tirs au but</h4>
                  <div class="score-inputs score-inputs--sm">
                    <input formControlName="tabDomicile"
                           type="number" min="0" class="score-big-input score-big-input--sm"/>
                    <span class="score-vs">–</span>
                    <input formControlName="tabExterieur"
                           type="number" min="0" class="score-big-input score-big-input--sm"/>
                  </div>
                </div>

                <div class="saisie-options">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="avecProlong"/>
                    Avec prolongations
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="avecTab"/>
                    Avec tirs au but
                  </label>
                </div>

                <div class="saisie-actions">
                  <button type="submit"
                          class="btn-success"
                          [disabled]="scoreForm.invalid || savingScore()">
                    <i class="material-icons">check</i>
                    {{ savingScore() ? 'Enregistrement...' : 'Valider le score' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- Forfait -->
            <div class="saisie-section saisie-section--danger">
              <h3 class="section-title">
                <i class="material-icons">warning</i>
                Déclarer un forfait
              </h3>
              <div class="forfait-actions">
                <button class="btn-danger btn-sm"
                        (click)="declarerForfait(Cote.DOMICILE)">
                  Forfait {{ match()!.domicile?.nomEquipe }}
                </button>
                <button class="btn-danger btn-sm"
                        (click)="declarerForfait(Cote.EXTERIEUR)">
                  Forfait {{ match()!.exterieur?.nomEquipe }}
                </button>
                <button class="btn-danger btn-sm"
                        (click)="declarerForfait(Cote.LES_DEUX)">
                  Double forfait
                </button>
              </div>
            </div>

            <!-- Reporter -->
            <div class="saisie-section">
              <h3 class="section-title">
                <i class="material-icons">event_busy</i>
                Reporter le match
              </h3>
              <div class="reporter-form">
                <input type="datetime-local"
                       [(ngModel)]="nouvelleDateHeure"
                       class="form-input"/>
                <button class="btn-warning btn-sm"
                        [disabled]="!nouvelleDateHeure"
                        (click)="reporter()">
                  <i class="material-icons">event</i>
                  Reporter
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="match-detail__loading">
        <div class="spinner"></div>
        <span>Chargement du match...</span>
      </div>
    </ng-template>
  `,
  styleUrls: ['./match-detail.component.scss']
})
export class MatchDetailComponent implements OnInit {

  Cote = Cote;

  private route  = inject(ActivatedRoute);
  private api    = inject(MatchApiService);
  private fb     = inject(FormBuilder);

  match           = signal<MatchDetailDTO | null>(null);
  activeTab       = signal<MatchTab>('apercu');
  showEventForm   = signal(false);
  savingEvent     = signal(false);
  savingScore     = signal(false);
  nouvelleDateHeure = '';

  tabs = [
    { key: 'apercu'      as MatchTab, label: 'Aperçu',      icon: 'visibility' },
    { key: 'composition' as MatchTab, label: 'Composition', icon: 'people' },
    { key: 'evenements'  as MatchTab, label: 'Événements',  icon: 'sports_soccer' },
    { key: 'saisie'      as MatchTab, label: 'Saisie',      icon: 'edit' },
  ];

  postes = [
    { value: PosteJoueur.GARDIEN,   label: 'Gardien' },
    { value: PosteJoueur.DEFENSEUR, label: 'Défenseurs' },
    { value: PosteJoueur.MILIEU,    label: 'Milieux' },
    { value: PosteJoueur.ATTAQUANT, label: 'Attaquants' },
  ];

  eventTypes = [
    { value: TypeEvent.BUT,                    label: '⚽ But' },
    { value: TypeEvent.PENALTY_MARQUE,         label: '⚽ Penalty marqué' },
    { value: TypeEvent.PENALTY_RATE,           label: '❌ Penalty raté' },
    { value: TypeEvent.CONTRE_SON_CAMP,        label: '⚽ CSC' },
    { value: TypeEvent.CARTON_JAUNE,           label: '🟨 Carton jaune' },
    { value: TypeEvent.CARTON_ROUGE,           label: '🟥 Carton rouge' },
    { value: TypeEvent.CARTON_ROUGE_DOUBLE_JAUNE, label: '🟥 2 jaunes = rouge' },
    { value: TypeEvent.REMPLACEMENT,           label: '🔄 Remplacement' },
    { value: TypeEvent.BUT_ANNULE,             label: '❌ But annulé' },
  ];

  scoreForm = this.fb.group({
    butsDomicile:         [0, [Validators.required, Validators.min(0)]],
    butsExterieur:        [0, [Validators.required, Validators.min(0)]],
    butsDomicileProlong:  [null as number | null],
    butsExterieurProlong: [null as number | null],
    tabDomicile:          [null as number | null],
    tabExterieur:         [null as number | null],
    avecProlong:          [false],
    avecTab:              [false],
  });

  eventForm = this.fb.group({
    type:             [TypeEvent.BUT, Validators.required],
    equipeId:         [null as number | null, Validators.required],
    joueurNom:        ['', Validators.required],
    minute:           [null as number | null, [Validators.required, Validators.min(1)]],
    minuteAdditionnel:[null as number | null],
    passeurNom:       [''],
  });

  get competitionId(): number {
    return Number(this.route.snapshot.paramMap.get('competitionId'));
  }

  get matchId(): number {
    return Number(this.route.snapshot.paramMap.get('matchId'));
  }

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.api.getById(this.competitionId, this.matchId)
      .subscribe(m => {
        this.match.set(m);
        // Pré-remplir le score si déjà saisi
        if (m.butsDomicile != null) {
          this.scoreForm.patchValue({
            butsDomicile:  m.butsDomicile,
            butsExterieur: m.butsExterieur,
          });
        }
      });
  }

  setTab(t: MatchTab): void { this.activeTab.set(t); }

  isTermine(): boolean {
    return [StatutMatch.TERMINE, StatutMatch.FORFAIT_DOMICILE,
            StatutMatch.FORFAIT_EXTERIEUR, StatutMatch.FORFAIT_DOUBLE]
      .includes(this.match()!.statut);
  }

  canEdit(): boolean {
    return ![StatutMatch.TERMINE, StatutMatch.ANNULE].includes(this.match()!.statut);
  }

  isWinner(side: 'home' | 'away'): boolean {
    if (!this.isTermine()) return false;
    const m = this.match()!;
    if (m.tabDomicile != null) {
      return side === 'home'
        ? m.tabDomicile! > m.tabExterieur!
        : m.tabExterieur! > m.tabDomicile!;
    }
    const dom = this.totalDom();
    const ext = this.totalExt();
    return side === 'home' ? dom > ext : ext > dom;
  }

  totalDom(): number {
    const m = this.match()!;
    return (m.butsDomicile ?? 0) + (m.butsDomicileProlong ?? 0);
  }

  totalExt(): number {
    const m = this.match()!;
    return (m.butsExterieur ?? 0) + (m.butsExterieurProlong ?? 0);
  }

  sortedEvents(): MatchEventDTO[] {
    return [...(this.match()?.evenements ?? [])]
      .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
  }

  isExterieurEvent(e: MatchEventDTO): boolean {
    return e.equipeId === this.match()?.exterieur?.id;
  }

  getByPoste(compo: MatchCompositionDTO[] | undefined,
             poste: PosteJoueur): MatchCompositionDTO[] {
    return (compo ?? []).filter(p => p.poste === poste);
  }

  isBut(): boolean {
    return [TypeEvent.BUT, TypeEvent.PENALTY_MARQUE,
            TypeEvent.CONTRE_SON_CAMP].includes(
      this.eventForm.get('type')?.value as TypeEvent);
  }

  eventIcon(type: TypeEvent): string {
    const icons: Partial<Record<TypeEvent, string>> = {
      [TypeEvent.BUT]:                       '⚽',
      [TypeEvent.PENALTY_MARQUE]:            '⚽',
      [TypeEvent.PENALTY_RATE]:              '❌',
      [TypeEvent.CONTRE_SON_CAMP]:           '⚽',
      [TypeEvent.CARTON_JAUNE]:              '🟨',
      [TypeEvent.CARTON_ROUGE]:              '🟥',
      [TypeEvent.CARTON_ROUGE_DOUBLE_JAUNE]: '🟥',
      [TypeEvent.REMPLACEMENT]:              '🔄',
      [TypeEvent.BUT_ANNULE]:                '❌',
    };
    return icons[type] ?? '•';
  }

  statutLabel(): string {
    const labels: Record<StatutMatch, string> = {
      [StatutMatch.PLANIFIE]:          'À venir',
      [StatutMatch.EN_COURS]:          'En cours',
      [StatutMatch.TERMINE]:           'Terminé',
      [StatutMatch.REPORTE]:           'Reporté',
      [StatutMatch.FORFAIT_DOMICILE]:  'Forfait domicile',
      [StatutMatch.FORFAIT_EXTERIEUR]: 'Forfait extérieur',
      [StatutMatch.FORFAIT_DOUBLE]:    'Double forfait',
      [StatutMatch.ANNULE]:            'Annulé',
    };
    return labels[this.match()!.statut] ?? this.match()!.statut;
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  // ── Actions
  saisirScore(): void {
    if (this.scoreForm.invalid) return;
    this.savingScore.set(true);
    const v = this.scoreForm.value;
    this.api.saisirResultat(this.competitionId, this.matchId, {
      butsDomicile:         v.butsDomicile!,
      butsExterieur:        v.butsExterieur!,
      butsDomicileProlong:  v.avecProlong ? (v.butsDomicileProlong ?? undefined) : undefined,
      butsExterieurProlong: v.avecProlong ? (v.butsExterieurProlong ?? undefined) : undefined,
      tabDomicile:          v.avecTab ? (v.tabDomicile ?? undefined) : undefined,
      tabExterieur:         v.avecTab ? (v.tabExterieur ?? undefined) : undefined,
    }).subscribe({
      next: m => { this.match.set(m); this.savingScore.set(false); },
      error: () => this.savingScore.set(false)
    });
  }

  declarerForfait(equipe: Cote): void {
    this.api.declarerForfait(this.competitionId, this.matchId, {
      equipeForfait: equipe
    }).subscribe(m => this.match.set(m));
  }

  reporter(): void {
    if (!this.nouvelleDateHeure) return;
    this.api.reporter(this.competitionId, this.matchId, {
      nouvelleDate: this.nouvelleDateHeure
    }).subscribe(m => this.match.set(m));
  }

  ajouterEvenement(): void {
    if (this.eventForm.invalid) return;
    this.savingEvent.set(true);
    const v = this.eventForm.value;
    const equipe = v.equipeId === this.match()!.domicile?.id
      ? this.match()!.domicile
      : this.match()!.exterieur;
    this.api.ajouterEvenement(this.competitionId, this.matchId, {
      type:              v.type as TypeEvent,
      joueurNom:         v.joueurNom!,
      equipeId:          v.equipeId!,
      equipeNom:         equipe?.nomEquipe,
      minute:            v.minute!,
      minuteAdditionnel: v.minuteAdditionnel ?? undefined,
      passeurNom:        v.passeurNom || undefined,
    }).subscribe({
      next: () => {
        this.reload();
        this.eventForm.reset({ type: TypeEvent.BUT });
        this.showEventForm.set(false);
        this.savingEvent.set(false);
      },
      error: () => this.savingEvent.set(false)
    });
  }

  supprimerEvenement(eventId: number): void {
    this.api.supprimerEvenement(this.competitionId, this.matchId, eventId)
      .subscribe(() => this.reload());
  }

  goBack(): void { history.back(); }
}