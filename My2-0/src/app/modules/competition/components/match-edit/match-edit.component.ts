// components/match-edit/match-edit.component.ts
import {
  Component, Input, Output, EventEmitter,
  OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormsModule,
  FormBuilder, Validators
} from '@angular/forms';
import { MatchDTO, StadeDTO, OfficielDTO, RoleOfficiel } from '../../../../core/models/competition.models';
import { MatchApiService } from '../../../../core/services/competition/match-api.service';
import { OfficielApiService } from '../../../../core/services/competition/officiel-api.service';
import { StadeApiService } from '../../../../core/services/competition/stade-api.service';


@Component({
  selector: 'app-match-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="match-edit">

      <!-- Header -->
      <div class="match-edit__header">
        <div class="match-edit__teams">
          <span class="team-name">{{ match.domicile?.nomEquipe }}</span>
          <span class="vs">vs</span>
          <span class="team-name">{{ match.exterieur?.nomEquipe }}</span>
        </div>
        <button class="btn-close" (click)="onClose.emit()">
          <i class="material-icons">close</i>
        </button>
      </div>

      <div class="match-edit__body">

        <!-- ── Date et heure -->
        <div class="edit-section">
          <h3 class="edit-section__title">
            <i class="material-icons">schedule</i>
            Date et heure
          </h3>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Date et heure du match</label>
              <input [(ngModel)]="dateHeure"
                     type="datetime-local"
                     class="form-input"/>
            </div>
          </div>
        </div>

        <!-- ── Stade -->
        <div class="edit-section">
          <h3 class="edit-section__title">
            <i class="material-icons">stadium</i>
            Stade / Lieu
          </h3>

          <!-- Recherche stade -->
          <div class="stade-search">
            <input [(ngModel)]="stadeSearch"
                   (input)="rechercherStades()"
                   class="form-input"
                   placeholder="Rechercher un stade..."/>

            <!-- Resultats -->
            <div class="stade-results"
                 *ngIf="stadesFiltres().length && stadeSearch">
              <button class="stade-result-item"
                      *ngFor="let s of stadesFiltres()"
                      (click)="selectionnerStade(s)">
                <div class="stade-result-item__info">
                  <span class="stade-nom">{{ s.nom }}</span>
                  <span class="stade-ville">{{ s.ville }}</span>
                </div>
                <span class="stade-capacite"
                      *ngIf="s.capacite">
                  {{ s.capacite | number }} pl.
                </span>
              </button>
            </div>
          </div>

          <!-- Stade selectionne -->
          <div class="stade-selected" *ngIf="stadeSelectionne()">
            <div class="stade-selected__info">
              <i class="material-icons">place</i>
              <div>
                <span class="stade-selected__nom">
                  {{ stadeSelectionne()!.nom }}
                </span>
                <span class="stade-selected__ville"
                      *ngIf="stadeSelectionne()!.ville">
                  {{ stadeSelectionne()!.ville }}
                </span>
              </div>
            </div>
            <button class="btn-remove"
                    (click)="retirerStade()">
              <i class="material-icons">close</i>
            </button>
          </div>

          <!-- Lieu libre si pas de stade -->
          <div class="form-field" *ngIf="!stadeSelectionne()">
            <label class="form-label">
              Ou saisir un lieu manuellement
            </label>
            <input [(ngModel)]="lieuLibre"
                   class="form-input"
                   placeholder="Ex: Terrain synthetique de Bonanjo"/>
          </div>
        </div>

        <!-- ── Officiels -->
        <div class="edit-section">
          <h3 class="edit-section__title">
            <i class="material-icons">badge</i>
            Officiels
          </h3>

          <!-- Officiels selectionnes -->
          <div class="officiels-list">
            <div class="officiel-item"
                 *ngFor="let o of officielsSelectionnes(); let i = index">
              <div class="officiel-item__info">
                <span class="officiel-role-badge"
                      [class]="'role-' + o.role.toLowerCase()">
                  {{ roleLabel(o.role) }}
                </span>
                <span class="officiel-nom">
                  {{ o.prenom }} {{ o.nom }}
                </span>
              </div>
              <button class="btn-remove"
                      (click)="retirerOfficiel(i)">
                <i class="material-icons">close</i>
              </button>
            </div>

            <div class="officiel-empty"
                 *ngIf="!officielsSelectionnes().length">
              Aucun officiel designe
            </div>
          </div>

          <!-- Ajouter un officiel -->
          <div class="add-officiel">
            <div class="form-grid form-grid--2">
              <div class="form-field">
                <label class="form-label">Rôle</label>
                <select [(ngModel)]="nouveauRole"
                        class="form-select">
                  <option *ngFor="let r of rolesOptions"
                          [value]="r.value">
                    {{ r.label }}
                  </option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">
                  Rechercher un officiel
                </label>
                <input [(ngModel)]="officielSearch"
                       (input)="rechercherOfficiels()"
                       class="form-input"
                       placeholder="Nom de l'arbitre..."/>
              </div>
            </div>

            <!-- Resultats officiels -->
            <div class="stade-results"
                 *ngIf="officielsFiltres().length && officielSearch">
              <button class="stade-result-item"
                      *ngFor="let o of officielsFiltres()"
                      (click)="ajouterOfficiel(o)">
                <div class="stade-result-item__info">
                  <span class="stade-nom">
                    {{ o.prenom }} {{ o.nom }}
                  </span>
                  <span class="stade-ville">
                    {{ roleLabel(o.role) }}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="match-edit__footer">
        <button class="btn-ghost" (click)="onClose.emit()">
          Annuler
        </button>
        <button class="btn-primary"
                [disabled]="saving()"
                (click)="sauvegarder()">
          <i class="material-icons">save</i>
          {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./match-edit.component.scss']
})
export class MatchEditComponent implements OnInit {

  @Input() match!: MatchDTO;
  @Input() competitionId!: number;
  @Output() onClose   = new EventEmitter<void>();
  @Output() onSaved   = new EventEmitter<MatchDTO>();

  private matchApi    = inject(MatchApiService);
  private stadeApi    = inject(StadeApiService);
  private officielApi = inject(OfficielApiService);

  // ── State
  saving              = signal(false);
  stadeSelectionne    = signal<StadeDTO | null>(null);
  officielsSelectionnes = signal<(OfficielDTO & { role: RoleOfficiel })[]>([]);
  stadesFiltres       = signal<StadeDTO[]>([]);
  officielsFiltres    = signal<OfficielDTO[]>([]);

  // ── Form fields
  dateHeure  = '';
  stadeSearch = '';
  lieuLibre  = '';
  officielSearch = '';
  nouveauRole: RoleOfficiel = RoleOfficiel.ARBITRE_PRINCIPAL;

  // ── Listes complètes
  private tousStades:    StadeDTO[]    = [];
  private tousOfficiels: OfficielDTO[] = [];

  rolesOptions = [
    { value: RoleOfficiel.ARBITRE_PRINCIPAL,   label: 'Arbitre principal' },
    { value: RoleOfficiel.ARBITRE_ASSISTANT_1, label: 'Arbitre assistant 1' },
    { value: RoleOfficiel.ARBITRE_ASSISTANT_2, label: 'Arbitre assistant 2' },
    { value: RoleOfficiel.QUATRIEME_ARBITRE,   label: '4ème arbitre' },
    { value: RoleOfficiel.DELEGUE,             label: 'Delegue' },
    { value: RoleOfficiel.OBSERVATEUR,         label: 'Observateur' },
  ];

  ngOnInit(): void {
    // Pre-remplir depuis le match existant
    if (this.match.dateHeure) {
      // Convertir en format datetime-local
      this.dateHeure = this.match.dateHeure.slice(0, 16);
    }
    if (this.match.stade) {
      this.stadeSelectionne.set(this.match.stade);
    }
    if (this.match.lieu && !this.match.stade) {
      this.lieuLibre = this.match.lieu;
    }
    if (this.match.officiels?.length) {
      // Charger les officiels existants
      this.match.officiels.forEach(o => {
        this.officielApi.getById(o.officielId).subscribe(off => {
          this.officielsSelectionnes.update(list => [
            ...list,
            { ...off, role: o.role }
          ]);
        });
      });
    }

    // Charger les listes
    this.stadeApi.lister().subscribe(s => this.tousStades = s);
    this.officielApi.lister().subscribe(o => this.tousOfficiels = o);
  }

  rechercherStades(): void {
    if (!this.stadeSearch.trim()) {
      this.stadesFiltres.set([]);
      return;
    }
    const q = this.stadeSearch.toLowerCase();
    this.stadesFiltres.set(
      this.tousStades.filter(s =>
        s.nom.toLowerCase().includes(q) ||
        s.ville?.toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }

  selectionnerStade(s: StadeDTO): void {
    this.stadeSelectionne.set(s);
    this.stadeSearch  = '';
    this.stadesFiltres.set([]);
  }

  retirerStade(): void {
    this.stadeSelectionne.set(null);
  }

  rechercherOfficiels(): void {
    if (!this.officielSearch.trim()) {
      this.officielsFiltres.set([]);
      return;
    }
    const q = this.officielSearch.toLowerCase();
    this.officielsFiltres.set(
      this.tousOfficiels.filter(o =>
        o.nom.toLowerCase().includes(q) ||
        o.prenom?.toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }

  ajouterOfficiel(o: OfficielDTO): void {
    // eviter les doublons pour le même rôle
    const existant = this.officielsSelectionnes()
      .find(x => x.role === this.nouveauRole);
    if (existant) {
      this.officielsSelectionnes.update(list =>
        list.filter(x => x.role !== this.nouveauRole)
      );
    }
    this.officielsSelectionnes.update(list => [
      ...list,
      { ...o, role: this.nouveauRole }
    ]);
    this.officielSearch = '';
    this.officielsFiltres.set([]);
  }

  retirerOfficiel(index: number): void {
    this.officielsSelectionnes.update(list =>
      list.filter((_, i) => i !== index)
    );
  }

  roleLabel(role: RoleOfficiel): string {
    return this.rolesOptions.find(r => r.value === role)?.label ?? role;
  }

  sauvegarder(): void {
    this.saving.set(true);
    this.matchApi.planifier(this.competitionId, this.match.id, {
      matchId:   this.match.id,
      dateHeure: this.dateHeure || undefined,
      stadeId:   this.stadeSelectionne()?.id,
      lieu:      !this.stadeSelectionne() ? this.lieuLibre || undefined : undefined,
      officiels: this.officielsSelectionnes().map(o => ({
        officielId: o.id,
        nom:        o.nom,
        prenom:     o.prenom,
        role:       o.role
      }))
    }).subscribe({
      next: m => {
        this.saving.set(false);
        this.onSaved.emit(m as any);
      },
      error: () => this.saving.set(false)
    });
  }
}