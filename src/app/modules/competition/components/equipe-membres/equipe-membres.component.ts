// components/equipe-membres/equipe-membres.component.ts
import {
  Component, Input, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembreEquipeDTO, MembreEquipeCreateDTO, StatutMembre, RoleMembre } from '../../../../core/models/competition.models';
import { MembreEquipeApiService } from '../../../../core/services/competition/membre-equipe-api.service';

@Component({
  selector: 'app-equipe-membres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="equipe-membres">

      <!-- Header -->
      <div class="equipe-membres__header">
        <div class="tabs-mini">
          <button class="tab-mini"
                  [class.active]="onglet() === 'joueurs'"
                  (click)="onglet.set('joueurs')">
            <i class="material-icons">sports_soccer</i>
            Joueurs ({{ joueurs().length }})
          </button>
          <button class="tab-mini"
                  [class.active]="onglet() === 'staff'"
                  (click)="onglet.set('staff')">
            <i class="material-icons">people</i>
            Staff ({{ staff().length }})
          </button>
        </div>
        <button class="btn-primary btn-sm"
                (click)="ouvrirForm()">
          <i class="material-icons">person_add</i>
          Ajouter
        </button>
      </div>

      <!-- Liste joueurs -->
      <div *ngIf="onglet() === 'joueurs'">
        <div class="membres-table" *ngIf="joueurs().length">
          <div class="membres-table__header">
            <span class="col-num">#</span>
            <span class="col-name">Joueur</span>
            <span class="col-poste">Poste</span>
            <span class="col-statut">Statut</span>
            <span class="col-actions"></span>
          </div>
          <div class="membre-row"
               *ngFor="let m of joueurs()"
               [class]="'statut-row-' + m.statut.toLowerCase()">
            <span class="col-num">
              <span class="num-badge">{{ m.numeroDos ?? '–' }}</span>
            </span>
            <span class="col-name">
              <div class="membre-identity">
                <div class="membre-avatar">
                  <img *ngIf="m.photoUrl" [src]="m.photoUrl"/>
                  <span *ngIf="!m.photoUrl">
                    {{ m.prenom?.[0] }}{{ m.nom[0] }}
                  </span>
                </div>
                <div class="membre-info">
                  <span class="membre-nom">
                    {{ m.prenom }} {{ m.nom }}
                    <i class="material-icons captain-icon"
                       *ngIf="m.role === 'CAPITAINE'"
                       title="Capitaine">star</i>
                  </span>
                  <span class="membre-nation"
                        *ngIf="m.nationalite">
                    {{ m.nationalite }}
                  </span>
                </div>
              </div>
            </span>
            <span class="col-poste">
              <span class="poste-badge">{{ m.poste ?? '–' }}</span>
            </span>
            <span class="col-statut">
              <select class="statut-select"
                      [value]="m.statut"
                      (change)="changerStatut(m, $any($event.target).value)">
                <option *ngFor="let s of statutOptions"
                        [value]="s.value">
                  {{ s.label }}
                </option>
              </select>
            </span>
            <span class="col-actions">
              <button class="btn-icon" (click)="editer(m)">
                <i class="material-icons">edit</i>
              </button>
              <button class="btn-icon btn-icon--danger"
                      (click)="retirer(m)">
                <i class="material-icons">person_remove</i>
              </button>
            </span>
          </div>
        </div>

        <div class="empty-membres"
             *ngIf="!joueurs().length">
          <i class="material-icons">sports_soccer</i>
          <p>Aucun joueur enregistré</p>
          <button class="btn-primary btn-sm"
                  (click)="ouvrirForm()">
            Ajouter des joueurs
          </button>
        </div>
      </div>

      <!-- Liste staff -->
      <div *ngIf="onglet() === 'staff'">
        <div class="staff-list" *ngIf="staff().length">
          <div class="staff-card"
               *ngFor="let m of staff()">
            <div class="staff-card__avatar">
              <img *ngIf="m.photoUrl" [src]="m.photoUrl"/>
              <span *ngIf="!m.photoUrl">
                {{ m.prenom?.[0] }}{{ m.nom[0] }}
              </span>
            </div>
            <div class="staff-card__info">
              <span class="staff-card__nom">
                {{ m.prenom }} {{ m.nom }}
              </span>
              <span class="role-badge"
                    [class]="'role-' + m.role.toLowerCase()">
                {{ roleLabel(m.role) }}
              </span>
              <span *ngIf="m.telephone" class="staff-contact">
                <i class="material-icons">phone</i>{{ m.telephone }}
              </span>
            </div>
            <div class="staff-card__actions">
              <button class="btn-icon" (click)="editer(m)">
                <i class="material-icons">edit</i>
              </button>
              <button class="btn-icon btn-icon--danger"
                      (click)="retirer(m)">
                <i class="material-icons">close</i>
              </button>
            </div>
          </div>
        </div>

        <div class="empty-membres" *ngIf="!staff().length">
          <i class="material-icons">people</i>
          <p>Aucun staff enregistré</p>
        </div>
      </div>

      <!-- ── DRAWER FORM ──────────── -->
      <div class="drawer-overlay"
           [class.open]="formOpen()"
           (click)="fermerForm()">
      </div>

      <div class="drawer" [class.open]="formOpen()">
        <div class="drawer__header">
          <h3>
            <i class="material-icons">person_add</i>
            {{ editingId() ? 'Modifier' : 'Ajouter un membre' }}
          </h3>
          <button class="btn-close" (click)="fermerForm()">
            <i class="material-icons">close</i>
          </button>
        </div>

        <div class="drawer__body">

          <!-- Rôle en premier -->
          <div class="form-field">
            <label class="form-label required">Rôle *</label>
            <div class="role-selector">
              <button class="role-btn"
                      *ngFor="let r of rolesJoueur"
                      [class.active]="formData.role === r.value"
                      (click)="formData.role = r.value">
                <i class="material-icons">{{ r.icon }}</i>
                {{ r.label }}
              </button>
            </div>
            <div class="role-selector role-selector--staff"
                 *ngIf="isStaffRole()">
              <select [(ngModel)]="formData.role"
                      class="form-select">
                <option *ngFor="let r of rolesStaff"
                        [value]="r.value">
                  {{ r.label }}
                </option>
              </select>
            </div>
            <label class="checkbox-label">
              <input type="checkbox"
                     [(ngModel)]="modeStaff"
                     (change)="onModeStaffChange()"/>
              Membre du staff (entraîneur, médecin...)
            </label>
          </div>

          <div class="form-grid form-grid--2">
            <div class="form-field">
              <label class="form-label required">Nom *</label>
              <input [(ngModel)]="formData.nom"
                     class="form-input" placeholder="Nom"/>
            </div>
            <div class="form-field">
              <label class="form-label">Prénom</label>
              <input [(ngModel)]="formData.prenom"
                     class="form-input" placeholder="Prénom"/>
            </div>
          </div>

          <!-- Infos joueur uniquement -->
          <ng-container *ngIf="!modeStaff">
            <div class="form-grid form-grid--2">
              <div class="form-field">
                <label class="form-label">Numéro de dos</label>
                <input [(ngModel)]="formData.numeroDos"
                       type="number" min="1" max="99"
                       class="form-input" placeholder="Ex: 10"/>
              </div>
              <div class="form-field">
                <label class="form-label">Poste</label>
                <select [(ngModel)]="formData.poste"
                        class="form-select">
                  <option value="">– Choisir –</option>
                  <option *ngFor="let p of postesOptions"
                          [value]="p">{{ p }}</option>
                </select>
              </div>
            </div>
            <div class="form-grid form-grid--2">
              <div class="form-field">
                <label class="form-label">Nationalité</label>
                <input [(ngModel)]="formData.nationalite"
                       class="form-input" placeholder="Ex: Camerounais"/>
              </div>
              <div class="form-field">
                <label class="form-label">Date de naissance</label>
                <input [(ngModel)]="formData.dateNaissance"
                       type="date" class="form-input"/>
              </div>
            </div>
          </ng-container>

          <div class="form-field">
            <label class="form-label">Téléphone</label>
            <input [(ngModel)]="formData.telephone"
                   class="form-input" placeholder="6X XXX XXXX"/>
          </div>
          <div class="form-field">
            <label class="form-label">Photo (URL)</label>
            <input [(ngModel)]="formData.photoUrl"
                   class="form-input" placeholder="https://..."/>
          </div>
        </div>

        <div class="drawer__footer">
          <button class="btn-ghost" (click)="fermerForm()">
            Annuler
          </button>
          <button class="btn-primary"
                  [disabled]="!formData.nom || saving()"
                  (click)="sauvegarder()">
            <i class="material-icons">save</i>
            {{ saving() ? '...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./equipe-membres.component.scss']
})
export class EquipeMembresComponent implements OnInit {

  @Input() competitionId!: number;
  @Input() participantId!: number;

  private api = inject(MembreEquipeApiService);

  joueurs  = signal<MembreEquipeDTO[]>([]);
  staff    = signal<MembreEquipeDTO[]>([]);
  onglet   = signal<'joueurs' | 'staff'>('joueurs');
  formOpen = signal(false);
  saving   = signal(false);
  editingId = signal<number | null>(null);
  modeStaff = false;

  formData: Partial<MembreEquipeCreateDTO> = {};

  statutOptions = [
    { value: StatutMembre.ACTIF,        label: 'Actif' },
    { value: StatutMembre.SUSPENDU,     label: 'Suspendu' },
    { value: StatutMembre.BLESSE,       label: 'Blessé' },
    { value: StatutMembre.NON_CONVOQUE, label: 'Non convoqué' },
  ];

  rolesJoueur = [
    { value: RoleMembre.JOUEUR,    label: 'Joueur',   icon: 'sports_soccer' },
    { value: RoleMembre.GARDIEN,   label: 'Gardien',  icon: 'sports_handball' },
    { value: RoleMembre.CAPITAINE, label: 'Capitaine',icon: 'star' },
  ];

  rolesStaff = [
    { value: RoleMembre.ENTRAINEUR,          label: 'Entraîneur' },
    { value: RoleMembre.ASSISTANT_COACH,     label: 'Assistant coach' },
    { value: RoleMembre.PREPARATEUR_PHYSIQUE,label: 'Préparateur physique' },
    { value: RoleMembre.MEDECIN,             label: 'Médecin' },
    { value: RoleMembre.DIRIGEANT,           label: 'Dirigeant' },
    { value: RoleMembre.AUTRE,               label: 'Autre' },
  ];

  postesOptions = [
    'Gardien', 'Défenseur central', 'Arrière droit',
    'Arrière gauche', 'Milieu défensif', 'Milieu central',
    'Milieu offensif', 'Ailier droit', 'Ailier gauche',
    'Avant-centre', 'Attaquant'
  ];

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.api.getJoueurs(this.competitionId, this.participantId)
      .subscribe(j => this.joueurs.set(j));
    this.api.getStaff(this.competitionId, this.participantId)
      .subscribe(s => this.staff.set(s));
  }

  ouvrirForm(): void {
    this.formData  = { role: RoleMembre.JOUEUR };
    this.editingId.set(null);
    this.modeStaff = false;
    this.formOpen.set(true);
  }

  editer(m: MembreEquipeDTO): void {
    this.formData = {
      nom:          m.nom,
      prenom:       m.prenom,
      role:         m.role,
      numeroDos:    m.numeroDos,
      poste:        m.poste,
      telephone:    m.telephone,
      photoUrl:     m.photoUrl,
      nationalite:  m.nationalite,
      dateNaissance:m.dateNaissance,
    };
    this.modeStaff = !this.rolesJoueur
      .some(r => r.value === m.role);
    this.editingId.set(m.id);
    this.formOpen.set(true);
  }

  fermerForm(): void { this.formOpen.set(false); }

  isStaffRole(): boolean { return this.modeStaff; }

  onModeStaffChange(): void {
    this.formData.role = this.modeStaff
      ? RoleMembre.ENTRAINEUR
      : RoleMembre.JOUEUR;
  }

  sauvegarder(): void {
    if (!this.formData.nom) return;
    this.saving.set(true);
    const dto = this.formData as MembreEquipeCreateDTO;
    const call = this.editingId()
      ? this.api.modifier(
          this.competitionId,
          this.participantId,
          this.editingId()!,
          dto)
      : this.api.ajouter(
          this.competitionId,
          this.participantId,
          dto);

    call.subscribe({
      next: () => {
        this.charger();
        this.fermerForm();
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  changerStatut(m: MembreEquipeDTO,
                statut: StatutMembre): void {
    this.api.changerStatut(
      this.competitionId,
      this.participantId,
      m.id,
      statut
    ).subscribe(() => this.charger());
  }

  retirer(m: MembreEquipeDTO): void {
    if (confirm(`Retirer ${m.prenom} ${m.nom} ?`)) {
      this.api.retirer(
        this.competitionId,
        this.participantId,
        m.id
      ).subscribe(() => this.charger());
    }
  }

  roleLabel(r: RoleMembre): string {
    return [...this.rolesJoueur, ...this.rolesStaff]
      .find(x => x.value === r)?.label ?? r;
  }
}