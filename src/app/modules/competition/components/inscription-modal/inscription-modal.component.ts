import { RouterLink } from '@angular/router';
import {
  Component, EventEmitter, Input, OnInit, Output, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { AuthService } from '../../../../core/services/auth.service'; // adapter selon ton chemin


interface GroupeResume {
  id:      number;
  nom:     string;
  logoUrl?: string;
  sport?:  string;
}

@Component({
  selector:   'app-inscription-modal',
  standalone: true,
  imports:    [CommonModule, FormsModule, MatIconModule, RouterLink],
  template: `
  <div class="ins-backdrop" 
     (click)="backdropActif() && fermer()">
      <div class="ins-modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="ins-modal__header">
          <div class="ins-modal__title">
            <mat-icon>sports_soccer</mat-icon>
            <span>Inscrire mon équipe</span>
          </div>
          <button class="ins-close" (click)="fermer()" [disabled]="loading()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="ins-modal__comp">{{ competitionNom }}</div>

        <!-- Profil connecté -->
        <div class="ins-user-info" *ngIf="currentUser()">
          <mat-icon>account_circle</mat-icon>
          <span>Inscrit en tant que <strong>{{ currentUser()!.prenom }} {{ currentUser()!.nom }}</strong></span>
        </div>

        <!-- Form -->
        <form class="ins-form" #f="ngForm" (ngSubmit)="soumettre(f.valid)">

          <!-- ── Sélection groupe My2-0 ──────────────────────────── -->
          <div *ngIf="mesGroupes().length > 0">
            <div class="ins-section-title">
              <mat-icon>group</mat-icon>
              Inscrire un groupe My2-0
            </div>

            <!-- Cartes groupes -->
            <div class="ins-groupes-list">
              <button type="button"
                      class="ins-groupe-card"
                      [class.ins-groupe-card--selected]="groupeSelectionneId() === g.id"
                      *ngFor="let g of mesGroupes()"
                      (click)="selectionnerGroupe(g)">
                <div class="ins-groupe-card__logo" *ngIf="g.logoUrl; else initG">
                  <img [src]="g.logoUrl" [alt]="g.nom"/>
                </div>
                <ng-template #initG>
                  <div class="ins-groupe-card__initiales">{{ getInitials(g.nom) }}</div>
                </ng-template>
                <div class="ins-groupe-card__info">
                  <span class="ins-groupe-card__nom">{{ g.nom }}</span>
                  <span class="ins-groupe-card__sport" *ngIf="g.sport">{{ g.sport }}</span>
                </div>
                <mat-icon class="ins-groupe-card__check"
                          *ngIf="groupeSelectionneId() === g.id">check_circle</mat-icon>
              </button>

              <!-- Option saisie manuelle -->
              <button type="button"
                      class="ins-groupe-card ins-groupe-card--manual"
                      [class.ins-groupe-card--selected]="groupeSelectionneId() === 0"
                      (click)="selectionnerManuel()">
                <div class="ins-groupe-card__initiales ins-groupe-card__initiales--manual">
                  <mat-icon>edit</mat-icon>
                </div>
                <div class="ins-groupe-card__info">
                  <span class="ins-groupe-card__nom">Autre équipe</span>
                  <span class="ins-groupe-card__sport">Saisir manuellement</span>
                </div>
              </button>
            </div>

            <div class="ins-divider"></div>
          </div>

          <!-- ── Nom de l'équipe ────────────────────────────────── -->
          <div class="ins-field">
            <label class="ins-label">
              Nom de l'équipe <span class="req">*</span>
              <span class="ins-label-hint" *ngIf="groupeSelectionne()">
                (depuis votre groupe)
              </span>
            </label>
            <input class="ins-input"
                   name="nomEquipe"
                   [(ngModel)]="form.nomEquipe"
                   required
                   maxlength="100"
                   placeholder="Ex : FC Étoile de Douala"
                   [readonly]="!!groupeSelectionne()"
                   [class.ins-input--readonly]="!!groupeSelectionne()"
                   [class.ins-input--error]="f.submitted && !form.nomEquipe"/>
            <span class="ins-error" *ngIf="f.submitted && !form.nomEquipe">
              Champ obligatoire
            </span>
          </div>

          <!-- ── Responsable ───────────────────────────────────── -->
          <div class="ins-field">
            <label class="ins-label">Votre nom (responsable) <span class="req">*</span></label>
            <input class="ins-input"
                   name="responsableNom"
                   [(ngModel)]="form.responsableNom"
                   required
                   maxlength="100"
                   placeholder="Prénom et nom"
                   [class.ins-input--error]="f.submitted && !form.responsableNom"/>
            <span class="ins-error" *ngIf="f.submitted && !form.responsableNom">
              Champ obligatoire
            </span>
          </div>

          <div class="ins-row">
            <div class="ins-field">
              <label class="ins-label">Email de contact <span class="req">*</span></label>
              <input class="ins-input"
                     type="email"
                     name="responsableEmail"
                     [(ngModel)]="form.responsableEmail"
                     required
                     placeholder="email@exemple.com"
                     [class.ins-input--error]="f.submitted && !form.responsableEmail"/>
            </div>
            <div class="ins-field">
              <label class="ins-label">Téléphone</label>
              <input class="ins-input"
                     name="responsableTel"
                     [(ngModel)]="form.responsableTel"
                     placeholder="+237 6XX XXX XXX"/>
            </div>
          </div>

          <div class="ins-field">
            <label class="ins-label">Message / infos complémentaires</label>
            <textarea class="ins-textarea"
                      name="message"
                      [(ngModel)]="form.message"
                      rows="3"
                      maxlength="500"
                      placeholder="Catégorie d'âge, effectif, infos utiles...">
            </textarea>
          </div>

          <!-- Info droits -->
          <div class="ins-info-droits">
            <mat-icon>info</mat-icon>
            <span *ngIf="groupeSelectionne(); else infoManuel">
              Votre groupe <strong>{{ groupeSelectionne()!.nom }}</strong> sera lié à cette
              inscription. Vous resterez <strong>responsable</strong> et pourrez gérer les
              membres dès validation.
            </span>
            <ng-template #infoManuel>
              <span>
                Vous serez désigné <strong>responsable</strong> de cette équipe :
                vous pourrez ajouter vos joueurs dès que votre inscription sera validée.
              </span>
            </ng-template>
          </div>

          <!-- Erreur serveur -->
          <div class="ins-server-error" *ngIf="erreur()">
            <mat-icon>error_outline</mat-icon>
            {{ erreur() }}
          </div>

          <!-- Succès -->
          <div class="ins-success" *ngIf="succes()">
            <mat-icon>check_circle</mat-icon>
            <div>
              <strong>Demande envoyée !</strong><br>
              L'organisateur examinera votre dossier et vous contactera.
              Vous pouvez déjà préparer votre effectif : ajoutez vos joueurs, ou invitez-les à remplir
              eux-mêmes leur fiche depuis leur téléphone.
              <br><a routerLink="/mes-equipes" (click)="fermer()" class="ins-lien">Constituer mon effectif</a>
            </div>
          </div>

          <!-- Actions -->
          <div class="ins-actions" *ngIf="!succes()">
            <button type="button" class="ins-btn ins-btn--cancel"
                    (click)="fermer()" [disabled]="loading()">
              Annuler
            </button>
            <button type="submit" class="ins-btn ins-btn--submit"
                    [disabled]="loading()">
              <span class="ins-spinner" *ngIf="loading()"></span>
              <mat-icon *ngIf="!loading()">send</mat-icon>
              {{ loading() ? 'Envoi en cours...' : 'Envoyer la demande' }}
            </button>
          </div>

          <div class="ins-actions" *ngIf="succes()">
            <button type="button" class="ins-btn ins-btn--submit" (click)="fermer()">
              <mat-icon>check</mat-icon>
              Fermer
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .ins-backdrop {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,.55);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: fadeIn .15s ease;
    }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

    .ins-modal {
      background: var(--background-primary, #fff);
      border-radius: 16px;
      width: 100%; max-width: 560px;
      max-height: 92vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      animation: slideUp .2s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(24px); opacity: 0 }
      to   { transform: translateY(0);    opacity: 1 }
    }

    .ins-modal__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 20px 0;
    }
    .ins-modal__title {
      display: flex; align-items: center; gap: 8px;
      font-size: 16px; font-weight: 700;
      .material-icons { color: #1e3a5f; font-size: 20px; }
    }
    .ins-close {
      width: 32px; height: 32px; border-radius: 50%;
      border: none; background: var(--background-secondary, #f3f4f6);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      &:disabled { opacity: .5; cursor: not-allowed; }
      .material-icons { font-size: 18px; }
    }
    .ins-modal__comp {
      padding: 6px 20px 0;
      font-size: 12px; color: var(--text-secondary, #6b7280);
    }

    .ins-user-info {
      margin: 10px 20px 0;
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-radius: 8px;
      background: rgba(30,58,95,.07);
      font-size: 13px; color: var(--text-secondary, #374151);
      .material-icons { font-size: 20px; color: #1e3a5f; }
    }

    .ins-form { padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 14px; }

    /* ── Sélection groupe ── */
    .ins-section-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .6px;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 8px;
      .material-icons { font-size: 16px; }
    }

    .ins-groupes-list {
      display: flex; flex-direction: column; gap: 6px;
    }

    .ins-groupe-card {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      border: 1.5px solid var(--border-color, #e5e7eb);
      background: var(--background-primary, #fff);
      cursor: pointer; text-align: left; width: 100%;
      transition: all .15s;
      &:hover { border-color: #1e3a5f; background: rgba(30,58,95,.03); }
      &--selected {
        border-color: #1e3a5f;
        background: rgba(30,58,95,.06);
      }
      &--manual {
        border-style: dashed;
        &:hover { border-color: #6b7280; background: rgba(107,114,128,.04); }
        &.ins-groupe-card--selected {
          border-color: #6b7280; background: rgba(107,114,128,.06);
        }
      }
    }

    .ins-groupe-card__logo {
      width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
      img { width: 100%; height: 100%; object-fit: cover; }
    }

    .ins-groupe-card__initiales {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: #1e3a5f; color: white;
      font-size: 13px; font-weight: 700;
      &--manual {
        background: var(--background-secondary, #f3f4f6);
        color: var(--text-secondary, #6b7280);
        .material-icons { font-size: 18px; }
      }
    }

    .ins-groupe-card__info {
      flex: 1; display: flex; flex-direction: column; gap: 1px;
    }
    .ins-groupe-card__nom  { font-size: 14px; font-weight: 600; color: var(--text-primary, #111); }
    .ins-groupe-card__sport { font-size: 11px; color: var(--text-secondary, #6b7280); }

    .ins-groupe-card__check { font-size: 20px; color: #1e3a5f; flex-shrink: 0; }

    .ins-divider {
      height: 1px; background: var(--border-color, #e5e7eb); margin: 4px 0;
    }

    /* ── Champs ── */
    .ins-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      @media (max-width: 480px) { grid-template-columns: 1fr; }
    }

    .ins-field { display: flex; flex-direction: column; gap: 5px; }

    .ins-label {
      font-size: 12px; font-weight: 600;
      color: var(--text-secondary, #6b7280);
      display: flex; align-items: center; gap: 6px;
      .req { color: #ef4444; }
    }
    .ins-label-hint { font-weight: 400; font-style: italic; }

    .ins-input, .ins-textarea {
      padding: 10px 12px;
      border: 1.5px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      font-size: 14px;
      background: var(--background-primary, #fff);
      color: var(--text-primary, #111);
      transition: border-color .15s; outline: none;
      &:focus { border-color: #1e3a5f; }
      &--error   { border-color: #ef4444; }
      &--readonly {
        background: var(--background-secondary, #f3f4f6);
        color: var(--text-secondary, #374151);
        cursor: default;
      }
    }
    .ins-textarea { resize: vertical; font-family: inherit; }

    .ins-error { font-size: 11px; color: #ef4444; font-weight: 500; }

    .ins-info-droits {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 10px 12px; border-radius: 8px;
      background: rgba(245,158,11,.08); color: #92400e;
      font-size: 12px; line-height: 1.5;
      .material-icons { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
    }

    .ins-server-error {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; border-radius: 8px;
      background: rgba(239,68,68,.08); color: #dc2626;
      font-size: 13px;
      .material-icons { font-size: 18px; flex-shrink: 0; }
    }

    .ins-success {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 14px 16px; border-radius: 10px;
      background: rgba(16,185,129,.1); color: #065f46;
      font-size: 13px; line-height: 1.5;
      .material-icons { font-size: 22px; flex-shrink: 0; color: #10b981; }
    }

    .ins-actions {
      display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px;
    }

    .ins-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 8px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      border: none; transition: all .15s;
      &--cancel {
        background: var(--background-secondary, #f3f4f6);
        color: var(--text-secondary, #6b7280);
        &:hover:not(:disabled) { background: var(--border-color, #e5e7eb); }
        &:disabled { opacity: .5; cursor: not-allowed; }
      }
      &--submit {
        background: #1e3a5f; color: white;
        .material-icons { font-size: 18px; }
        &:hover:not(:disabled) { background: #16304f; }
        &:disabled { opacity: .6; cursor: not-allowed; }
      }
    }

    .ins-spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: white;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class InscriptionModalComponent implements OnInit {

  @Input()  competitionId!: number;
  @Input()  competitionNom = '';

  @Output() closed = new EventEmitter<boolean>(); // true = succès

  private api       = inject(CompetitionApiService);
  private auth      = inject(AuthService);
  private router    = inject(Router);
  private http      = inject(HttpClient);
  backdropActif = signal(false);

  loading     = signal(false);
  erreur      = signal<string | null>(null);
  succes      = signal(false);
  currentUser = signal<{ nom: string; prenom: string; email: string } | null>(null);

  // Groupes dont l'utilisateur est responsable
  mesGroupes          = signal<any[]>([]);
  groupeSelectionneId = signal<number | null>(null); // null = pas encore choisi, 0 = manuel

  groupeSelectionne = computed(() => {
    const id = this.groupeSelectionneId();
    if (!id || id === 0) return null;
    return this.mesGroupes().find(g => g.id === id) ?? null;
  });

  form: {
    nomEquipe:        string;
    responsableNom:   string;
    responsableEmail: string;
    responsableTel:   string;
    message:          string;
    clubId?:          number;
  } = {
    nomEquipe:        '',
    responsableNom:   '',
    responsableEmail: '',
    responsableTel:   '',
    message:          ''
  };

 ngOnInit(): void {
  setTimeout(() => this.backdropActif.set(true), 50);

  // Redirection si non connecté
  if (!this.auth.isLoggedIn()) {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: `/competitions/${this.competitionId}/public` }
    });
    return;
  }

  // Pré-remplir depuis le profil connecté
  const user = this.auth.getUser();
  if (user) {
    this.currentUser.set({
      nom: user.nom ?? '',
      prenom: user.prenom ?? '',
      email: user.email ?? ''
    });
    this.form.responsableNom = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim();
    this.form.responsableEmail = user.email ?? '';
  }

  // Charger les groupes synchretement depuis le cache
  try {
    // Seuls les groupes que la personne administre peuvent être inscrits (le serveur le vérifie aussi).
    // Le cache contient des « MonGroupeDTO » (groupeId, profilePhotoUrl, discipline) : on les met au format du formulaire.
    const groupes = (this.auth.getMesGroupesCache() ?? [])
      .filter((g: any) => g.actif !== false && (g.estResponsableGroupe || g.isAdminGlobal))
      .map((g: any) => ({
        id: g.groupeId ?? g.id, nom: g.nom, logoUrl: g.profilePhotoUrl ?? g.logoUrl,
        sport: g.discipline ?? g.sport, membreId: g.membreId
      }))
      .filter((g: any) => !!g.id);
    this.mesGroupes.set(groupes);

    if (!groupes.length) {
      // aucun groupe administré : équipe saisie à la main
      this.groupeSelectionneId.set(0);
    } else if (groupes.length === 1) {
      // un seul groupe : on le propose d'emblée (« Autre équipe » reste possible)
      this.selectionnerGroupe(groupes[0]);
    }
  } catch (error) {
    // Fail silencieux en cas d'erreur de parse JSON
    console.error('Erreur lors de la récupération des groupes en cache:', error);
    this.groupeSelectionneId.set(0);
  }
}

  /** Choisir un groupe 2-0 : nom de l'équipe, responsable, e-mail et téléphone se remplissent ; le groupe est lié à l'inscription. */
  selectionnerGroupe(g: GroupeResume & { membreId?: number }): void {
    this.groupeSelectionneId.set(g.id);
    this.form.nomEquipe = g.nom;
    this.form.clubId    = g.id;

    // téléphone du responsable : celui de sa fiche de membre dans ce groupe (s'il n'a rien saisi)
    if (g.membreId && !this.form.responsableTel) {
      this.http.get<any>(`${environment.apiUrl}/membres/${g.membreId}`).subscribe({
        next: m => { if (m?.tel && !this.form.responsableTel) this.form.responsableTel = m.tel; },
        error: () => { /* facultatif : le serveur complète aussi */ }
      });
    }
  }

  selectionnerManuel(): void {
    this.groupeSelectionneId.set(0);
    this.form.nomEquipe = '';
    this.form.clubId    = undefined;
  }

  soumettre(valid: boolean | null): void {
    if (!valid) return;
    this.erreur.set(null);
    this.loading.set(true);

    this.api.inscrireEquipe(this.competitionId, this.form).subscribe({
      next: () => {
        this.loading.set(false);
        this.succes.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? err?.error?.error ?? null;
        this.erreur.set(msg ?? 'Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  fermer(): void {
    if (!this.loading()) this.closed.emit(this.succes());
  }
}