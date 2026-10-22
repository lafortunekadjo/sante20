// tab-statistiques/tab-statistiques.component.ts
import {
  Component, Input, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButeurDTO, PasseurDTO, CartonsDTO, SuspensionDTO, MembreEquipeDTO, CompetitionParticipantDTO } from '../../../../core/models/competition.models';
import { StatistiquesApiService } from '../../../../core/services/competition/statistiques-api.service';
import { MembreEquipeApiService } from '../../../../core/services/competition/membre-equipe-api.service';

type StatTab = 'buteurs' | 'passeurs' | 'cartons' | 'suspensions';

@Component({
  selector: 'app-tab-statistiques',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <!-- Décision disciplinaire (commission) -->
        <div class="susp-actions" *ngIf="canDiscipline">
          <button class="btn-susp" (click)="ouvrirFormSuspension()" *ngIf="!formOuvert()">
            <i class="material-icons">gavel</i> Suspendre un joueur
          </button>
        </div>

        <form class="susp-form" *ngIf="canDiscipline && formOuvert()" (ngSubmit)="suspendre()">
          <label>Équipe
            <select name="equipe" [ngModel]="formParticipantId()" (ngModelChange)="choisirEquipe($event)" required>
              <option [ngValue]="null">— Choisir —</option>
              <option *ngFor="let p of participantsValides()" [ngValue]="p.id">{{ p.nomEquipe }}</option>
            </select>
          </label>
          <label>Joueur
            <select name="joueur" [(ngModel)]="formJoueurId" required [disabled]="!roster().length">
              <option [ngValue]="null">— Choisir —</option>
              <option *ngFor="let m of roster()" [ngValue]="m.id">
                {{ m.numeroDos ? '#' + m.numeroDos + ' ' : '' }}{{ m.prenom }} {{ m.nom }}
              </option>
            </select>
          </label>
          <label>Nombre de matchs
            <input name="nb" type="number" min="1" inputmode="numeric" [(ngModel)]="formNbMatchs" required/>
          </label>
          <label>Motif
            <input name="motif" type="text" maxlength="200" [(ngModel)]="formMotif" required
                   placeholder="Ex. : comportement violent envers l'arbitre"/>
          </label>
          <p class="susp-form__error" *ngIf="formErreur()">{{ formErreur() }}</p>
          <div class="susp-form__actions">
            <button type="button" class="btn-ghost" (click)="fermerFormSuspension()">Annuler</button>
            <button type="submit" class="btn-susp" [disabled]="!formValide() || envoiEnCours()">
              {{ envoiEnCours() ? 'Enregistrement…' : 'Prononcer la suspension' }}
            </button>
          </div>
        </form>

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
              <button class="btn-lever" *ngIf="canDiscipline && s.active" (click)="lever(s)">
                Lever
              </button>
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
  /** Équipes de la compétition (pour la suspension manuelle) */
  @Input() participants: CompetitionParticipantDTO[] = [];
  /** Commission de discipline : peut prononcer et lever des suspensions */
  @Input() canDiscipline = false;

  private api = inject(StatistiquesApiService);
  private membreApi = inject(MembreEquipeApiService);

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

  // ── Suspension manuelle (décision disciplinaire) ──────────
  formOuvert         = signal(false);
  formParticipantId  = signal<number | null>(null);
  roster             = signal<MembreEquipeDTO[]>([]);
  formJoueurId: number | null = null;
  formNbMatchs = 1;
  formMotif = '';
  envoiEnCours = signal(false);
  formErreur   = signal<string | null>(null);

  participantsValides(): CompetitionParticipantDTO[] {
    return this.participants.filter(p => p.statutInscription === 'VALIDE' as any);
  }

  ouvrirFormSuspension(): void {
    this.formOuvert.set(true);
    this.formErreur.set(null);
  }

  fermerFormSuspension(): void {
    this.formOuvert.set(false);
    this.formParticipantId.set(null);
    this.roster.set([]);
    this.formJoueurId = null;
    this.formNbMatchs = 1;
    this.formMotif = '';
    this.formErreur.set(null);
  }

  choisirEquipe(participantId: number | null): void {
    this.formParticipantId.set(participantId);
    this.formJoueurId = null;
    this.roster.set([]);
    if (participantId == null) return;
    this.membreApi.getJoueurs(this.competitionId, participantId)
      .subscribe(j => this.roster.set(j));
  }

  formValide(): boolean {
    return this.formParticipantId() != null && this.formJoueurId != null
      && this.formNbMatchs >= 1 && this.formMotif.trim().length > 0;
  }

  suspendre(): void {
    if (!this.formValide() || this.envoiEnCours()) return;
    const joueur = this.roster().find(m => m.id === this.formJoueurId)!;
    this.envoiEnCours.set(true);
    this.formErreur.set(null);
    this.api.suspendre(this.competitionId, {
      joueurId: joueur.id,                 // identifiant dans l'effectif de la compétition
      joueurNom: joueur.nom,
      joueurPrenom: joueur.prenom,
      participantId: this.formParticipantId()!,
      nbMatchs: this.formNbMatchs,
      motif: this.formMotif.trim()
    }).subscribe({
      next: liste => {
        this.suspensions.set(liste);
        this.envoiEnCours.set(false);
        this.fermerFormSuspension();
      },
      error: err => {
        this.formErreur.set(err?.error?.message ?? 'Impossible de prononcer la suspension');
        this.envoiEnCours.set(false);
      }
    });
  }

  lever(s: SuspensionDTO): void {
    if (!confirm(`Lever la suspension de ${s.joueurNom} ?`)) return;
    this.api.leverSuspension(this.competitionId, s.id)
      .subscribe(liste => this.suspensions.set(liste));
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
            console.log(this.cartons())
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