import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environment';
import { EquipeEspace } from '../equipe-espace/equipe-espace.component';

/** « Mes équipes » : les équipes que l'utilisateur gère comme responsable ou adjoint, avec l'avancement de chaque effectif. */
@Component({
  selector: 'app-mes-equipes',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <header class="hero-header">
      <div class="hero-header__top">
        <div>
          <h1 class="hero-header__title">Mes équipes</h1>
          <p class="hero-header__sub">Effectifs et inscriptions que vous gérez</p>
        </div>
        <div class="hero-header__actions">
          <a class="hero-action" routerLink="/competitions" title="Mes compétitions" aria-label="Mes compétitions">
            <mat-icon>emoji_events</mat-icon>
          </a>
        </div>
      </div>
      <div class="hero-header__stats" *ngIf="equipes().length">
        <div class="hero-stat"><strong>{{ equipes().length }}</strong><span>Équipes</span></div>
        <div class="hero-stat"><strong>{{ nbPrets() }}</strong><span>Effectifs prêts</span></div>
        <div class="hero-stat"><strong>{{ equipes().length - nbPrets() }}</strong><span>À compléter</span></div>
      </div>
    </header>

    <div class="mes page">
      <p class="mes__vide" *ngIf="loading()"><span class="spinner"></span></p>

      <a class="mes__carte" *ngFor="let e of equipes()"
         [routerLink]="['/mes-equipes', e.competitionId, e.participantId]">
        <div class="mes__titre">
          <strong>{{ e.nomEquipe }}</strong>
          <span class="mes__role">{{ e.roleAcces === 'ADJOINT' ? 'Adjoint' : 'Responsable' }}</span>
        </div>
        <div class="mes__sous">{{ e.competitionNom }}</div>
        <div class="mes__echeance" *ngIf="e.dateLimiteEffectif && !e.effectifPret">
          Effectif à compléter avant le {{ e.dateLimiteEffectif | date:'dd/MM/yyyy' }}
          <span *ngIf="e.enRetard"> — dépassé</span>
        </div>
        <div class="mes__ligne">
          <span>{{ e.nbJoueurs }} joueurs</span>
          <span [class.mes__alerte]="e.nbFichesIncompletes + e.nbSansPhoto > 0">
            {{ e.effectifPret ? '✔ Effectif prêt'
               : e.nbFichesIncompletes + ' fiche(s) · ' + e.nbSansPhoto + ' photo(s) à compléter' }}
          </span>
          <span class="mes__statut">{{ e.statutInscription === 'EN_ATTENTE' ? 'En attente de validation'
                                       : e.statutInscription === 'VALIDE' ? 'Validée' : e.statutInscription }}</span>
        </div>
      </a>

      <div class="empty-state" *ngIf="!loading() && !equipes().length">
        <mat-icon>groups</mat-icon>
        <h3>Aucune équipe pour l'instant</h3>
        <p>Inscrivez votre équipe à une compétition pour constituer son effectif ici.</p>
        <a class="btn-primary" routerLink="/competitions/public">Voir les compétitions ouvertes</a>
      </div>
    </div>
  `,
  styles: [`
    .mes { max-width: 720px; padding-bottom: 80px; gap: 10px; }
    .mes__carte { display: block; padding: 14px 16px; border-radius: 12px; text-decoration: none; color: inherit;
                  border: 1px solid rgba(128,128,128,.25); background: var(--surface, #fff); }
    .mes__titre { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    .mes__role { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: rgba(59,130,246,.12); }
    .mes__sous { color: var(--text-secondary); font-size: 13px; margin: 2px 0 8px; }
    .mes__ligne { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 13px; }
    .mes__echeance { font-size: 12px; color: #b45309; margin-bottom: 6px; }
    .mes__alerte { color: #b45309; }
    .mes__statut { margin-left: auto; color: var(--text-secondary); }
    .mes__vide { text-align: center; padding: 24px 0; color: var(--text-secondary); }
  `]
})
export class MesEquipesComponent implements OnInit {
  private http = inject(HttpClient);
  equipes = signal<EquipeEspace[]>([]);
  nbPrets = computed(() => this.equipes().filter(e => e.effectifPret).length);
  loading = signal(true);

  ngOnInit(): void {
    this.http.get<EquipeEspace[]>(`${environment.apiUrl}/competitions/mes-equipes`).subscribe({
      next: e => { this.equipes.set(e); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
