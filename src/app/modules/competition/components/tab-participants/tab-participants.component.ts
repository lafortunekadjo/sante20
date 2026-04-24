// tab-participants/tab-participants.component.ts
import {
  Component, Input, OnInit, Output, EventEmitter, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CompetitionDetailDTO, CompetitionParticipantDTO, StatutInscription, TypeParticipant } from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';

@Component({
  selector: 'app-tab-participants',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="tab-participants">

      <!-- Header -->
      <div class="tab-participants__header">
        <h3>Équipes inscrites ({{ participants().length }})</h3>
        <button class="btn-primary btn-sm"
                *ngIf="canInscrire()"
                (click)="showForm.set(!showForm())">
          <i class="material-icons">add</i>
          Inscrire une équipe
        </button>
      </div>

      <!-- Formulaire d'inscription -->
      <div class="inscription-form" *ngIf="showForm()">
        <form [formGroup]="form" (ngSubmit)="inscrire()">
          <div class="form-grid">
            <div class="form-field">
              <label>Type</label>
              <select formControlName="type" class="form-select">
                <option value="EXTERNE">Équipe externe</option>
                <option value="GROUPE_MY20">Club My2-0</option>
              </select>
            </div>
            <div class="form-field">
              <label>Nom de l'équipe *</label>
              <input formControlName="nomEquipe"
                     class="form-input"
                     placeholder="Ex: AS Douala FC"/>
            </div>
            <div class="form-field">
              <label>Contact responsable</label>
              <input formControlName="contactResponsable"
                     class="form-input"
                     placeholder="Téléphone ou email"/>
            </div>
            <div class="form-field">
              <label>Tête de série (optionnel)</label>
              <input formControlName="seed"
                     type="number"
                     class="form-input"
                     min="1" placeholder="1, 2, 3..."/>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-ghost btn-sm"
                    (click)="showForm.set(false)">
              Annuler
            </button>
            <button type="submit" class="btn-primary btn-sm"
                    [disabled]="form.invalid || saving()">
              {{ saving() ? 'Enregistrement...' : 'Inscrire' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Filtres statut -->
      <div class="statut-filters">
        <button class="filter-btn"
                [class.active]="filtreStatut() === null"
                (click)="filtreStatut.set(null)">
          Toutes ({{ participants().length }})
        </button>
        <button class="filter-btn"
                *ngFor="let s of statutOptions"
                [class.active]="filtreStatut() === s.value"
                (click)="filtreStatut.set(s.value)">
          {{ s.label }} ({{ countByStatut(s.value) }})
        </button>
      </div>

      <!-- Liste -->
      <div class="participants-list">
        <div class="participant-card"
             *ngFor="let p of filteredParticipants()">

          <div class="participant-card__logo">
            <img *ngIf="p.logoUrl" [src]="p.logoUrl" [alt]="p.nomEquipe"/>
            <span *ngIf="!p.logoUrl">{{ getInitials(p.nomEquipe) }}</span>
          </div>

          <div class="participant-card__info">
            <div class="participant-card__name">
              {{ p.nomEquipe }}
              <span class="seed-badge" *ngIf="p.seed">#{{ p.seed }}</span>
            </div>
            <div class="participant-card__meta">
              <span class="type-badge"
                    [class]="p.type === 'GROUPE_MY20' ? 'type-my20' : 'type-ext'">
                {{ p.type === 'GROUPE_MY20' ? 'My2-0' : 'Externe' }}
              </span>
              <span *ngIf="p.contactResponsable" class="contact">
                <i class="material-icons">phone</i>{{ p.contactResponsable }}
              </span>
            </div>
          </div>

          <div class="participant-card__statut">
            <span class="statut-badge"
                  [class]="'statut-' + p.statutInscription.toLowerCase()">
              {{ statutInscriptionLabel(p.statutInscription) }}
            </span>
          </div>

          <div class="participant-card__actions">
            <button class="btn-icon btn-icon--success"
                    *ngIf="p.statutInscription === 'EN_ATTENTE'"
                    (click)="valider(p)"
                    title="Valider">
              <i class="material-icons">check</i>
            </button>
            <button class="btn-icon btn-icon--danger"
                    *ngIf="p.statutInscription === 'EN_ATTENTE'"
                    (click)="rejeter(p)"
                    title="Rejeter">
              <i class="material-icons">close</i>
            </button>
            <button class="btn-icon btn-icon--ghost"
                    *ngIf="canRetirer(p)"
                    (click)="retirer(p)"
                    title="Retirer">
              <i class="material-icons">remove_circle_outline</i>
            </button>
          </div>
        </div>

        <div class="empty-state" *ngIf="filteredParticipants().length === 0">
          <i class="material-icons">groups</i>
          <p>Aucune équipe dans cette catégorie</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./tab-participants.component.scss']
})
export class TabParticipantsComponent implements OnInit {
  @Input() competition!: CompetitionDetailDTO;
  @Output() updated = new EventEmitter<void>();

  private api = inject(CompetitionApiService);
  private fb  = inject(FormBuilder);

  participants     = signal<CompetitionParticipantDTO[]>([]);
  showForm         = signal(false);
  saving           = signal(false);
  filtreStatut     = signal<StatutInscription | null>(null);

  form = this.fb.group({
    type:                ['EXTERNE'],
    nomEquipe:           ['', Validators.required],
    contactResponsable:  [''],
    seed:                [null as number | null]
  });

  statutOptions = [
    { value: StatutInscription.EN_ATTENTE, label: 'En attente' },
    { value: StatutInscription.VALIDE,     label: 'Validées' },
    { value: StatutInscription.REJETE,     label: 'Rejetées' },
  ];

  filteredParticipants = () => {
    const s = this.filtreStatut();
    if (!s) return this.participants();
    return this.participants().filter(p => p.statutInscription === s);
  };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.getParticipants(this.competition.id)
      .subscribe(p => this.participants.set(p));
  }

  canInscrire(): boolean {
    return ['BROUILLON', 'INSCRIPTION_OUVERTE'].includes(this.competition.statut);
  }

  canRetirer(p: CompetitionParticipantDTO): boolean {
    return p.statutInscription === StatutInscription.VALIDE
        && this.competition.statut !== 'EN_COURS' as any;
  }

  inscrire(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value;
    this.api.inscrire(this.competition.id, {
      type: v.type as TypeParticipant,
      nomEquipe: v.nomEquipe!,
      contactResponsable: v.contactResponsable || undefined,
      seed: v.seed || undefined
    }).subscribe({
      next: () => {
        this.load();
        this.form.reset({ type: 'EXTERNE' });
        this.showForm.set(false);
        this.saving.set(false);
        this.updated.emit();
      },
      error: () => this.saving.set(false)
    });
  }

  valider(p: CompetitionParticipantDTO): void {
    this.api.validerInscription(this.competition.id, p.id)
      .subscribe(() => { this.load(); this.updated.emit(); });
  }

  rejeter(p: CompetitionParticipantDTO): void {
    this.api.rejeterInscription(this.competition.id, p.id)
      .subscribe(() => this.load());
  }

  retirer(p: CompetitionParticipantDTO): void {
    this.api.retirerParticipant(this.competition.id, p.id)
      .subscribe(() => { this.load(); this.updated.emit(); });
  }

  countByStatut(s: StatutInscription): number {
    return this.participants().filter(p => p.statutInscription === s).length;
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  statutInscriptionLabel(s: StatutInscription): string {
    const m: Record<StatutInscription, string> = {
      [StatutInscription.EN_ATTENTE]: 'En attente',
      [StatutInscription.VALIDE]:     'Validée',
      [StatutInscription.REJETE]:     'Rejetée',
      [StatutInscription.RETIRE]:     'Retirée',
    };
    return m[s] ?? s;
  }
}