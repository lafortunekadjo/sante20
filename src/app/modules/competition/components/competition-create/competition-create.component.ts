// pages/competition-create/competition-create.component.ts
import {
  Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule, FormBuilder,
  Validators, FormGroup, FormArray
} from '@angular/forms';
import { TypeCompetition, CritereClassement, FormatCompetition } from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';


@Component({
  selector: 'app-competition-create',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="create-page">

      <!-- Header -->
      <div class="create-page__header">
        <button class="btn-back" routerLink="/competitions">
          <i class="material-icons">arrow_back</i>
          Retour
        </button>
        <div class="create-page__title">
          <h1>
            <i class="material-icons">emoji_events</i>
            Nouvelle compétition
          </h1>
          <p>Configurez votre compétition en quelques étapes</p>
        </div>
      </div>

      <!-- Stepper -->
      <div class="stepper">
        <div class="stepper__step"
             *ngFor="let step of steps; let i = index"
             [class.active]="activeStep() === i"
             [class.done]="activeStep() > i"
             (click)="activeStep() > i && setStep(i)">
          <div class="stepper__dot">
            <i class="material-icons" *ngIf="activeStep() > i">check</i>
            <span *ngIf="activeStep() <= i">{{ i + 1 }}</span>
          </div>
          <span class="stepper__label">{{ step }}</span>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="soumettre()">

        <!-- ── STEP 1 : Infos générales -->
        <div class="create-card" *ngIf="activeStep() === 0">
          <div class="create-card__header">
            <i class="material-icons">info</i>
            <h2>Informations générales</h2>
          </div>

          <div class="form-grid form-grid--2">
            <div class="form-field form-field--full">
              <label class="form-label required">Nom de la compétition</label>
              <input formControlName="nom"
                     class="form-input"
                     [class.error]="isInvalid('nom')"
                     placeholder="Ex: Championnat de Douala 2026"/>
              <span class="form-error" *ngIf="isInvalid('nom')">
                Le nom est obligatoire
              </span>
            </div>

            <div class="form-field">
              <label class="form-label required">Type</label>
              <div class="type-selector">
                <button type="button"
                        class="type-btn"
                        *ngFor="let t of typeOptions"
                        [class.active]="form.get('type')?.value === t.value"
                        (click)="form.get('type')?.setValue(t.value);
                                 onTypeChange()">
                  <i class="material-icons">{{ t.icon }}</i>
                  <span>{{ t.label }}</span>
                  <small>{{ t.desc }}</small>
                </button>
              </div>
            </div>

            <div class="form-field">
              <label class="form-label required">Format</label>
              <div class="format-selector">
                <button type="button"
                        class="format-btn"
                        *ngFor="let f of formatOptions()"
                        [class.active]="configForm.get('format')?.value === f.value"
                        (click)="configForm.get('format')?.setValue(f.value)">
                  <span class="format-btn__label">{{ f.label }}</span>
                  <small>{{ f.desc }}</small>
                </button>
              </div>
            </div>

            <div class="form-field">
              <label class="form-label">Description</label>
              <textarea formControlName="description"
                        class="form-textarea"
                        rows="3"
                        placeholder="Description optionnelle..."></textarea>
            </div>

            <div class="form-field">
              <label class="form-label required">Date de début</label>
              <input formControlName="dateDebut"
                     type="date"
                     class="form-input"
                     [class.error]="isInvalid('dateDebut')"/>
            </div>

            <div class="form-field">
              <label class="form-label">Date de fin (optionnel)</label>
              <input formControlName="dateFin"
                     type="date"
                     class="form-input"/>
            </div>

            <div class="form-field">
              <label class="form-label">Date limite d'inscription</label>
              <input formControlName="dateLimiteInscription"
                     type="date"
                     class="form-input"/>
            </div>

            <div class="form-field">
              <label class="form-label">Organisateur</label>
              <input formControlName="organisateurNom"
                     class="form-input"
                     placeholder="Nom de l'organisateur"/>
            </div>
          </div>
        </div>

        <!-- ── STEP 2 : Configuration des équipes -->
        <div class="create-card" *ngIf="activeStep() === 1">
          <div class="create-card__header">
            <i class="material-icons">groups</i>
            <h2>Configuration des équipes</h2>
          </div>

          <div class="form-grid form-grid--2" formGroupName="config">

            <div class="form-field">
              <label class="form-label">Nombre minimum d'équipes</label>
              <input formControlName="nombreEquipesMin"
                     type="number" min="2" class="form-input"/>
            </div>

            <div class="form-field">
              <label class="form-label">Nombre maximum d'équipes</label>
              <input formControlName="nombreEquipesMax"
                     type="number" min="2" class="form-input"/>
            </div>

            <!-- Config Championnat -->
            <ng-container *ngIf="isChampionnat()">
              <div class="form-field form-field--full">
                <div class="toggle-field">
                  <div class="toggle-info">
                    <span class="toggle-label">Aller-retour</span>
                    <small>Chaque équipe reçoit et se déplace chez l'adversaire</small>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" formControlName="allerRetour"/>
                    <span class="toggle__slider"></span>
                  </label>
                </div>
              </div>
            </ng-container>

            <!-- Config Mixte -->
            <ng-container *ngIf="isMixte()">
              <div class="form-field">
                <label class="form-label">Nombre de groupes/poules</label>
                <input formControlName="nombreGroupes"
                       type="number" min="2" class="form-input"/>
              </div>

              <div class="form-field">
                <label class="form-label">Équipes par groupe</label>
                <input formControlName="equipesParGroupe"
                       type="number" min="2" class="form-input"/>
              </div>

              <div class="form-field">
                <label class="form-label">Qualifiés par groupe</label>
                <input formControlName="qualifiesParGroupe"
                       type="number" min="1" class="form-input"/>
              </div>

              <div class="form-field form-field--full">
                <div class="toggle-field">
                  <div class="toggle-info">
                    <span class="toggle-label">Meilleurs 3es qualifiés</span>
                    <small>Les meilleurs N-èmes de tous les groupes peuvent se qualifier</small>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" formControlName="meilleursTimesActif"/>
                    <span class="toggle__slider"></span>
                  </label>
                </div>
              </div>

              <div class="form-field"
                   *ngIf="configForm.get('meilleursTimesActif')?.value">
                <label class="form-label">Nombre de meilleurs N-èmes qualifiés</label>
                <input formControlName="nombreMeilleursTimesQualifies"
                       type="number" min="1" class="form-input"/>
              </div>
            </ng-container>

            <!-- Droits d'engagement -->
            <div class="form-field form-field--full">
              <div class="toggle-field">
                <div class="toggle-info">
                  <span class="toggle-label">Droits d'engagement</span>
                  <small>Exiger un paiement à l'inscription</small>
                </div>
                <label class="toggle">
                  <input type="checkbox" formControlName="droitsEngagementActifs"/>
                  <span class="toggle__slider"></span>
                </label>
              </div>
            </div>

            <div class="form-field"
                 *ngIf="configForm.get('droitsEngagementActifs')?.value">
              <label class="form-label">Montant (FCFA)</label>
              <input formControlName="montantEngagement"
                     type="number" min="0" class="form-input"
                     placeholder="Ex: 25000"/>
            </div>
          </div>
        </div>

        <!-- ── STEP 3 : Règlement sportif -->
        <div class="create-card" *ngIf="activeStep() === 2">
          <div class="create-card__header">
            <i class="material-icons">gavel</i>
            <h2>Règlement sportif</h2>
          </div>

          <div formGroupName="config">

            <!-- Système de points -->
            <div class="section-block">
              <h3 class="section-block__title">Système de points</h3>
              <div class="form-grid form-grid--3">
                <div class="form-field">
                  <label class="form-label">Victoire</label>
                  <input formControlName="pointsVictoire"
                         type="number" min="1" class="form-input"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Nul</label>
                  <input formControlName="pointsNul"
                         type="number" min="0" class="form-input"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Défaite</label>
                  <input formControlName="pointsDefaite"
                         type="number" min="0" class="form-input"/>
                </div>
              </div>
            </div>

            <!-- Forfait -->
            <div class="section-block">
              <h3 class="section-block__title">Score de forfait</h3>
              <div class="form-grid form-grid--2">
                <div class="form-field">
                  <label class="form-label">Score vainqueur</label>
                  <input formControlName="scoreForfaitVainqueur"
                         type="number" min="0" class="form-input"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Score perdant</label>
                  <input formControlName="scoreForfaitPerdant"
                         type="number" min="0" class="form-input"/>
                </div>
              </div>
            </div>

            <!-- Critères de départage -->
            <div class="section-block">
              <h3 class="section-block__title">
                Ordre de départage
                <small>Glissez pour réordonner</small>
              </h3>
              <div class="criteres-list">
                <div class="critere-item"
                     *ngFor="let c of criteresSelectionnes(); let i = index">
                  <div class="critere-item__drag">
                    <i class="material-icons">drag_indicator</i>
                  </div>
                  <span class="critere-item__rank">{{ i + 1 }}</span>
                  <span class="critere-item__label">{{ critereLabel(c) }}</span>
                  <div class="critere-item__actions">
                    <button type="button"
                            [disabled]="i === 0"
                            (click)="moveCritere(i, -1)"
                            class="btn-icon-sm">
                      <i class="material-icons">arrow_upward</i>
                    </button>
                    <button type="button"
                            [disabled]="i === criteresSelectionnes().length - 1"
                            (click)="moveCritere(i, 1)"
                            class="btn-icon-sm">
                      <i class="material-icons">arrow_downward</i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Suspensions -->
            <div class="section-block">
              <h3 class="section-block__title">Suspensions</h3>
              <div class="form-grid form-grid--2">
                <div class="form-field">
                  <label class="form-label">
                    Cartons jaunes avant suspension
                  </label>
                  <input formControlName="seuilCartonsJaunesSuspension"
                         type="number" min="1" class="form-input"/>
                </div>
                <div class="form-field">
                  <label class="form-label">
                    Matchs de suspension (carton rouge)
                  </label>
                  <input formControlName="matchsSuspensionCartonRouge"
                         type="number" min="1" class="form-input"/>
                </div>
                <div class="form-field form-field--full">
                  <div class="toggle-field">
                    <div class="toggle-info">
                      <span class="toggle-label">
                        Cumul des cartons entre phases
                      </span>
                      <small>
                        Les cartons de la phase de poules
                        comptent pour la phase finale
                      </small>
                    </div>
                    <label class="toggle">
                      <input type="checkbox"
                             formControlName="cumulCartonsEntrePhases"/>
                      <span class="toggle__slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Prolongations (coupe/mixte uniquement) -->
            <div class="section-block"
                 *ngIf="!isChampionnat()">
              <h3 class="section-block__title">Prolongations & TAB</h3>
              <div class="form-grid form-grid--2">
                <div class="form-field form-field--full">
                  <div class="toggle-field">
                    <div class="toggle-info">
                      <span class="toggle-label">Prolongations actives</span>
                      <small>En cas de nul en phase knockout</small>
                    </div>
                    <label class="toggle">
                      <input type="checkbox"
                             formControlName="prolongationsActives"/>
                      <span class="toggle__slider"></span>
                    </label>
                  </div>
                </div>
                <div class="form-field"
                     *ngIf="configForm.get('prolongationsActives')?.value">
                  <label class="form-label">Durée 1ère prolongation (min)</label>
                  <input formControlName="dureeProlong1"
                         type="number" min="1" class="form-input"/>
                </div>
                <div class="form-field"
                     *ngIf="configForm.get('prolongationsActives')?.value">
                  <label class="form-label">Durée 2ème prolongation (min)</label>
                  <input formControlName="dureeProlong2"
                         type="number" min="1" class="form-input"/>
                </div>
                <div class="form-field form-field--full"
                     *ngIf="configForm.get('prolongationsActives')?.value">
                  <div class="toggle-field">
                    <div class="toggle-info">
                      <span class="toggle-label">Tirs au but</span>
                      <small>Si nul après prolongations</small>
                    </div>
                    <label class="toggle">
                      <input type="checkbox" formControlName="tabActif"/>
                      <span class="toggle__slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── STEP 4 : Récapitulatif -->
        <div class="create-card" *ngIf="activeStep() === 3">
          <div class="create-card__header">
            <i class="material-icons">checklist</i>
            <h2>Récapitulatif</h2>
          </div>

          <div class="recap-grid">
            <div class="recap-block">
              <h3>Compétition</h3>
              <div class="recap-row">
                <span>Nom</span>
                <strong>{{ form.get('nom')?.value }}</strong>
              </div>
              <div class="recap-row">
                <span>Type</span>
                <strong>{{ typeLabel(form.get('type')?.value) }}</strong>
              </div>
              <div class="recap-row">
                <span>Format</span>
                <strong>{{ formatLabel(configForm.get('format')?.value) }}</strong>
              </div>
              <div class="recap-row" *ngIf="form.get('lieu')?.value">
                <span>Lieu</span>
                <strong>{{ form.get('lieu')?.value }}</strong>
              </div>
              <div class="recap-row">
                <span>Visibilité</span>
                <strong>
                  {{ form.get('publique')?.value ? '🌐 Publique' : '🔒 Privée' }}
                </strong>
              </div>
              <div class="recap-row" *ngIf="form.get('dateDebut')?.value">
                <span>Date début</span>
                <strong>{{ form.get('dateDebut')?.value | date:'dd/MM/yyyy' }}</strong>
              </div>
            </div>

            <div class="recap-block">
              <h3>Équipes</h3>
              <div class="recap-row">
                <span>Min / Max</span>
                <strong>
                  {{ configForm.get('nombreEquipesMin')?.value }}
                  –
                  {{ configForm.get('nombreEquipesMax')?.value }}
                </strong>
              </div>
              <div class="recap-row" *ngIf="isMixte()">
                <span>Groupes</span>
                <strong>{{ configForm.get('nombreGroupes')?.value }}</strong>
              </div>
              <div class="recap-row" *ngIf="isMixte()">
                <span>Qualifiés / groupe</span>
                <strong>{{ configForm.get('qualifiesParGroupe')?.value }}</strong>
              </div>
            </div>

            <div class="recap-block">
              <h3>Points</h3>
              <div class="recap-row">
                <span>Victoire</span>
                <strong>{{ configForm.get('pointsVictoire')?.value }} pts</strong>
              </div>
              <div class="recap-row">
                <span>Nul</span>
                <strong>{{ configForm.get('pointsNul')?.value }} pts</strong>
              </div>
              <div class="recap-row">
                <span>Forfait</span>
                <strong>
                  {{ configForm.get('scoreForfaitVainqueur')?.value }}
                  –
                  {{ configForm.get('scoreForfaitPerdant')?.value }}
                </strong>
              </div>
            </div>

            <div class="recap-block">
              <h3>Suspensions</h3>
              <div class="recap-row">
                <span>CJ avant suspension</span>
                <strong>{{ configForm.get('seuilCartonsJaunesSuspension')?.value }}</strong>
              </div>
              <div class="recap-row">
                <span>Matchs susp. CR</span>
                <strong>{{ configForm.get('matchsSuspensionCartonRouge')?.value }}</strong>
              </div>
            </div>
          </div>

          <div class="recap-alert" *ngIf="form.invalid">
            <i class="material-icons">warning</i>
            Certains champs obligatoires sont manquants.
            Vérifiez les étapes précédentes.
          </div>
        </div>

        <!-- Navigation -->
        <div class="create-nav">
          <button type="button"
                  class="btn-ghost"
                  *ngIf="activeStep() > 0"
                  (click)="prevStep()">
            <i class="material-icons">arrow_back</i>
            Précédent
          </button>
          <div class="create-nav__spacer"></div>
          <button type="button"
                  class="btn-primary"
                  *ngIf="activeStep() < steps.length - 1"
                  (click)="nextStep()">
            Suivant
            <i class="material-icons">arrow_forward</i>
          </button>
          <button type="submit"
                  class="btn-success"
                  *ngIf="activeStep() === steps.length - 1"
                  [disabled]="saving()">
            <i class="material-icons">check</i>
            {{ saving() ? 'Création...' : 'Créer la compétition' }}
          </button>
        </div>

      </form>
    </div>
  `,
  styleUrls: ['./competition-create.component.scss']
})
export class CompetitionCreateComponent implements OnInit {

  private fb     = inject(FormBuilder);
  private api    = inject(CompetitionApiService);
  private router = inject(Router);

  activeStep = signal(0);
  saving     = signal(false);

  steps = [
    'Informations', 'Équipes',
    'Règlement', 'Récapitulatif'
  ];

  typeOptions = [
    {
      value: TypeCompetition.CHAMPIONNAT,
      label: 'Championnat',
      icon: 'emoji_events',
      desc: 'Classement général'
    },
    {
      value: TypeCompetition.COUPE,
      label: 'Coupe',
      icon: 'workspace_premium',
      desc: 'Élimination directe'
    },
    {
      value: TypeCompetition.MIXTE,
      label: 'Mixte',
      icon: 'account_tree',
      desc: 'Poules + Knockout'
    },
  ];

  criteresSelectionnes = signal<CritereClassement[]>([
    CritereClassement.CONFRONTATION_DIRECTE,
    CritereClassement.GOAL_AVERAGE_GENERAL,
    CritereClassement.BUTS_MARQUES,
    CritereClassement.TIRAGE
  ]);

  form!: FormGroup;

  get configForm(): FormGroup {
    return this.form.get('config') as FormGroup;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      nom:                    ['', Validators.required],
      description:            [''],
      type:                   [TypeCompetition.CHAMPIONNAT, Validators.required],
      dateDebut:              ['', Validators.required],
      dateFin:                [''],
      dateLimiteInscription:  [''],
      organisateurNom:        [''],
      logoUrl:                [''],
      lieu:                   [''],
      publique:               [true],
      config: this.fb.group({
        format:                         [FormatCompetition.ALLER_RETOUR],
        pointsVictoire:                 [3],
        pointsNul:                      [1],
        pointsDefaite:                  [0],
        scoreForfaitVainqueur:          [3],
        scoreForfaitPerdant:            [0],
        nombreEquipesMin:               [4],
        nombreEquipesMax:               [16],
        allerRetour:                    [true],
        nombreGroupes:                  [4],
        equipesParGroupe:               [4],
        qualifiesParGroupe:             [2],
        meilleursTimesActif:            [false],
        nombreMeilleursTimesQualifies:  [0],
        droitsEngagementActifs:         [false],
        montantEngagement:              [null],
        seuilCartonsJaunesSuspension:   [3],
        matchsSuspensionCartonRouge:    [1],
        cumulCartonsEntrePhases:        [false],
        prolongationsActives:           [true],
        dureeProlong1:                  [15],
        dureeProlong2:                  [15],
        tabActif:                       [true],
      })
    });
  }

  formatOptions() {
    const type = this.form.get('type')?.value;
    if (type === TypeCompetition.CHAMPIONNAT) return [
      { value: FormatCompetition.ALLER_RETOUR, label: 'Aller-retour',
        desc: '2x(N-1) journées' },
      { value: FormatCompetition.ALLER_SIMPLE, label: 'Aller simple',
        desc: 'N-1 journées' },
    ];
    if (type === TypeCompetition.COUPE) return [
      { value: FormatCompetition.ELIMINATION_SIMPLE, label: 'Élimination simple',
        desc: 'Perdant éliminé' },
    ];
    return [
      { value: FormatCompetition.MIXTE, label: 'Poules + Knockout',
        desc: 'Groupes puis bracket' },
    ];
  }

  onTypeChange(): void {
    const type = this.form.get('type')?.value;
    const opts = this.formatOptions();
    if (opts.length > 0)
      this.configForm.get('format')?.setValue(opts[0].value);
  }

  isChampionnat(): boolean {
    return this.form.get('type')?.value === TypeCompetition.CHAMPIONNAT;
  }

  isMixte(): boolean {
    return this.form.get('type')?.value === TypeCompetition.MIXTE;
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  nextStep(): void {
    if (this.activeStep() < this.steps.length - 1)
      this.activeStep.update(s => s + 1);
  }

  prevStep(): void {
    if (this.activeStep() > 0)
      this.activeStep.update(s => s - 1);
  }

  setStep(i: number): void {
    this.activeStep.set(i);
  }

  moveCritere(index: number, dir: -1 | 1): void {
    const list = [...this.criteresSelectionnes()];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    this.criteresSelectionnes.set(list);
  }

  critereLabel(c: CritereClassement): string {
    const m: Record<CritereClassement, string> = {
      [CritereClassement.CONFRONTATION_DIRECTE]: 'Confrontation directe',
      [CritereClassement.GOAL_AVERAGE_GENERAL]:  'Goal average général',
      [CritereClassement.BUTS_MARQUES]:          'Buts marqués',
      [CritereClassement.BUTS_EXTERIEUR]:        'Buts à l\'extérieur',
      [CritereClassement.FAIR_PLAY]:             'Fair-play (cartons)',
      [CritereClassement.TIRAGE]:                'Tirage au sort',
    };
    return m[c] ?? c;
  }

  typeLabel(t: string): string {
    const m: Record<string, string> = {
      CHAMPIONNAT: 'Championnat', COUPE: 'Coupe', MIXTE: 'Mixte'
    };
    return m[t] ?? t;
  }

  formatLabel(f: string): string {
    const m: Record<string, string> = {
      ALLER_SIMPLE:       'Aller simple',
      ALLER_RETOUR:       'Aller-retour',
      ELIMINATION_SIMPLE: 'Élimination directe',
      MIXTE:              'Poules + Knockout',
    };
    return m[f] ?? f;
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.value;
    this.api.creer({
      ...v,
      config: {
        ...v.config,
        criteresClassement: this.criteresSelectionnes()
      }
    }).subscribe({
      next: comp => {
        this.router.navigate(['/competitions', comp.id]);
      },
      error: () => this.saving.set(false)
    });
  }
}