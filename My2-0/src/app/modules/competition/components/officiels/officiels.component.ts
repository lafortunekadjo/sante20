// pages/officiels/officiels.component.ts
import {
  Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfficielDTO, RoleOfficiel, OfficielCreateDTO } from '../../../../core/models/competition.models';
import { OfficielApiService } from '../../../../core/services/competition/officiel-api.service';


@Component({
  selector: 'app-officiels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="crud-page">

      <div class="crud-page__header">
        <div>
          <h1>
            <i class="material-icons">badge</i>
            Officiels
          </h1>
          <p>Arbitres, délégués et observateurs</p>
        </div>
        <button class="btn-primary" (click)="ouvrirForm()">
          <i class="material-icons">person_add</i>
          Ajouter
        </button>
      </div>

      <!-- Filtres -->
      <div class="crud-page__filters">
        <div class="search-input">
          <i class="material-icons">search</i>
          <input [(ngModel)]="searchQuery"
                 (input)="filtrer()"
                 placeholder="Rechercher..."/>
        </div>
        <div class="role-filters">
          <button class="filter-btn"
                  [class.active]="filtreRole() === null"
                  (click)="filtreRole.set(null); filtrer()">
            Tous
          </button>
          <button class="filter-btn"
                  *ngFor="let r of rolesOptions"
                  [class.active]="filtreRole() === r.value"
                  (click)="filtreRole.set(r.value); filtrer()">
            {{ r.label }}
          </button>
        </div>
      </div>

      <!-- Liste -->
      <div class="items-list">
        <div class="officiel-card"
             *ngFor="let o of officielsFiltres()">

          <div class="officiel-card__avatar">
            <img *ngIf="o.photoUrl" [src]="o.photoUrl"/>
            <span *ngIf="!o.photoUrl">
              {{ o.prenom?.[0] }}{{ o.nom[0] }}
            </span>
          </div>

          <div class="officiel-card__info">
            <span class="officiel-card__nom">
              {{ o.prenom }} {{ o.nom }}
            </span>
            <span class="role-badge"
                  [class]="'role-' + o.role.toLowerCase()">
              {{ roleLabel(o.role) }}
            </span>
            <div class="officiel-card__contacts">
              <span *ngIf="o.telephone">
                <i class="material-icons">phone</i>{{ o.telephone }}
              </span>
              <span *ngIf="o.email">
                <i class="material-icons">email</i>{{ o.email }}
              </span>
            </div>
          </div>

          <div class="officiel-card__actions">
            <button class="btn-icon" (click)="editer(o)">
              <i class="material-icons">edit</i>
            </button>
            <button class="btn-icon btn-icon--danger"
                    (click)="confirmerSuppression(o)">
              <i class="material-icons">person_off</i>
            </button>
          </div>
        </div>

        <div class="empty-state"
             *ngIf="officielsFiltres().length === 0">
          <i class="material-icons">badge</i>
          <h3>Aucun officiel</h3>
          <p>Ajoutez des arbitres et officiels.</p>
        </div>
      </div>

      <!-- Drawer form -->
      <div class="drawer-overlay"
           [class.open]="formOpen()"
           (click)="fermerForm()">
      </div>

      <div class="drawer" [class.open]="formOpen()">
        <div class="drawer__header">
          <h2>
            <i class="material-icons">badge</i>
            {{ editingId() ? 'Modifier' : 'Nouvel officiel' }}
          </h2>
          <button class="btn-close" (click)="fermerForm()">
            <i class="material-icons">close</i>
          </button>
        </div>

        <div class="drawer__body">
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
          <div class="form-field">
            <label class="form-label required">Rôle *</label>
            <select [(ngModel)]="formData.role" class="form-select">
              <option *ngFor="let r of rolesOptions"
                      [value]="r.value">{{ r.label }}</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label">Téléphone</label>
            <input [(ngModel)]="formData.telephone"
                   class="form-input" placeholder="6X XXX XXXX"/>
          </div>
          <div class="form-field">
            <label class="form-label">Email</label>
            <input [(ngModel)]="formData.email"
                   class="form-input" placeholder="email@..."/>
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
  styleUrls: ['./officiels.component.scss']
})
export class OfficielsComponent implements OnInit {

  private api = inject(OfficielApiService);

  officiels        = signal<OfficielDTO[]>([]);
  officielsFiltres = signal<OfficielDTO[]>([]);
  filtreRole       = signal<RoleOfficiel | null>(null);
  formOpen         = signal(false);
  saving           = signal(false);
  editingId        = signal<number | null>(null);
  searchQuery      = '';
  formData: Partial<OfficielCreateDTO> = {};

  rolesOptions = [
    { value: RoleOfficiel.ARBITRE_PRINCIPAL,   label: 'Arbitre principal' },
    { value: RoleOfficiel.ARBITRE_ASSISTANT_1, label: 'Assistant 1' },
    { value: RoleOfficiel.ARBITRE_ASSISTANT_2, label: 'Assistant 2' },
    { value: RoleOfficiel.QUATRIEME_ARBITRE,   label: '4ème arbitre' },
    { value: RoleOfficiel.DELEGUE,             label: 'Délégué' },
    { value: RoleOfficiel.OBSERVATEUR,         label: 'Observateur' },
  ];

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.api.lister().subscribe(o => {
      this.officiels.set(o);
      this.officielsFiltres.set(o);
    });
  }

  filtrer(): void {
    const q    = this.searchQuery.toLowerCase();
    const role = this.filtreRole();
    this.officielsFiltres.set(
      this.officiels().filter(o => {
        const matchNom  = !q || o.nom.toLowerCase().includes(q)
                               || o.prenom?.toLowerCase().includes(q);
        const matchRole = !role || o.role === role;
        return matchNom && matchRole;
      })
    );
  }

  ouvrirForm(): void {
    this.formData  = { role: RoleOfficiel.ARBITRE_PRINCIPAL };
    this.editingId.set(null);
    this.formOpen.set(true);
  }

  editer(o: OfficielDTO): void {
    this.formData  = { ...o };
    this.editingId.set(o.id);
    this.formOpen.set(true);
  }

  fermerForm(): void { this.formOpen.set(false); }

  sauvegarder(): void {
    if (!this.formData.nom) return;
    this.saving.set(true);
    const dto = this.formData as OfficielCreateDTO;
    const call = this.editingId()
      ? this.api.modifier(this.editingId()!, dto)
      : this.api.creer(dto);
    call.subscribe({
      next: () => {
        this.charger();
        this.fermerForm();
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  confirmerSuppression(o: OfficielDTO): void {
    if (confirm(`Désactiver ${o.prenom} ${o.nom} ?`)) {
      this.api.desactiver(o.id).subscribe(() => this.charger());
    }
  }

  roleLabel(r: RoleOfficiel): string {
    return this.rolesOptions.find(x => x.value === r)?.label ?? r;
  }
}