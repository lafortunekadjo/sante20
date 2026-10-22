import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environment';
import { copierTexte, partagerLien, urlApplication } from '../../../../core/utils/partage';

/**
 * Inscription d'une équipe SANS compte : nom de l'équipe, responsable, téléphone.
 * À la fin, le responsable reçoit son lien de gestion — le seul moyen de revenir sur son équipe : on le lui
 * fait partager/copier tout de suite et on le mémorise sur l'appareil.
 */
@Component({
  selector: 'app-inscription-rapide',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="ir-backdrop" (click)="fermer()">
      <div class="ir-sheet" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="ir-grip"></div>

        <!-- ── Formulaire ── -->
        <form *ngIf="!resultat()" (ngSubmit)="envoyer()" autocomplete="on">
          <h3>Inscrire mon équipe</h3>
          <p class="ir-sous">{{ competitionNom }} · sans compte, une minute.</p>
          <p class="ir-resume" *ngIf="resume">{{ resume }}</p>

          <label>Nom de l'équipe *
            <input name="equipe" [(ngModel)]="form.nomEquipe" maxlength="80" autocomplete="organization" required/>
          </label>
          <label>Votre nom (responsable) *
            <input name="resp" [(ngModel)]="form.responsableNom" maxlength="80" autocomplete="name" required/>
          </label>
          <label>Votre téléphone *
            <input name="tel" type="tel" inputmode="tel" [(ngModel)]="form.responsableTel" maxlength="30"
                   autocomplete="tel" placeholder="6 77 00 00 01" required/>
            <small>L'organisateur vous appellera à ce numéro si besoin.</small>
          </label>
          <label>E-mail (facultatif)
            <input name="email" type="email" [(ngModel)]="form.responsableEmail" maxlength="120" autocomplete="email"/>
          </label>
          <!-- Champ piège : invisible pour une personne, rempli par les robots -->
          <input class="ir-piege" name="siteWeb" [(ngModel)]="form.siteWeb" tabindex="-1" autocomplete="off" aria-hidden="true"/>

          <p class="ir-erreur" *ngIf="erreur()">{{ erreur() }}</p>

          <button type="submit" class="ir-cta" [disabled]="!valide() || envoi()">
            {{ envoi() ? 'Envoi...' : 'Envoyer ma demande' }}
          </button>
          <button type="button" class="ir-lien" (click)="fermer()">Annuler</button>
        </form>

        <!-- ── Succès : le lien de gestion est la clé de l'équipe ── -->
        <div *ngIf="resultat() as r" class="ir-succes">
          <div class="ir-coche">✔</div>
          <h3>Demande envoyée !</h3>
          <p>{{ r.message }}</p>

          <div class="ir-lien-box">
            <small>Votre lien de gestion</small>
            <code>{{ lien() }}</code>
          </div>
          <button class="ir-cta" (click)="partager()">Envoyer le lien (WhatsApp, SMS...)</button>
          <button class="ir-secondaire" (click)="copier()">{{ copie() ? 'Lien copié ✔' : 'Copier le lien' }}</button>
          <a class="ir-secondaire" [routerLink]="['/equipe', r.tokenGestion]" (click)="fermer()">Ouvrir mon espace équipe</a>

          <p class="ir-compte">
            Envie de recevoir les notifications de vos matchs et de retrouver votre équipe la saison prochaine ?
            <a [routerLink]="['/signup']" [queryParams]="{ returnUrl: '/equipe/' + r.tokenGestion }" (click)="fermer()">
              Créer un compte gratuit</a> — facultatif.
          </p>
          <button class="ir-lien" (click)="fermer()">Fermer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ir-backdrop { position: fixed; inset: 0; z-index: 1100; background: rgba(0,0,0,.55);
                   display: flex; align-items: flex-end; justify-content: center; }
    .ir-sheet { width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto;
                padding: 12px 20px calc(20px + env(safe-area-inset-bottom));
                background: var(--background-primary); border-radius: 24px 24px 0 0;
                animation: ir-monte .22s ease-out; }
    @media (min-width: 840px) { .ir-backdrop { align-items: center; } .ir-sheet { border-radius: 24px; } }
    @keyframes ir-monte { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
    .ir-grip { width: 40px; height: 4px; border-radius: 2px; background: var(--border-color); margin: 0 auto 14px; }
    h3 { margin: 0; font-size: 20px; font-weight: 800; }
    .ir-sous { margin: 2px 0 12px; font-size: 13px; color: var(--text-secondary); }
    .ir-resume { margin: 0 0 14px; padding: 10px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;
                 background: var(--background-secondary); }
    label { display: grid; gap: 4px; margin-bottom: 12px; font-size: 12px; font-weight: 700; color: var(--text-secondary); }
    label small { font-weight: 400; }
    input:not(.ir-piege) { width: 100%; min-height: 48px; padding: 0 14px; font-size: 16px; /* 16px : pas de zoom iOS */
                           border-radius: 12px; border: 1px solid var(--border-color);
                           background: var(--background-primary); color: var(--text-primary); }
    .ir-piege { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
    .ir-erreur { margin: 0 0 12px; padding: 10px 12px; border-radius: 10px; font-size: 13px;
                 color: #b91c1c; background: rgba(239,68,68,.08); }
    .ir-cta { width: 100%; min-height: 52px; border: 0; border-radius: 14px; cursor: pointer;
              font-size: 16px; font-weight: 800; color: #1f1300; background: linear-gradient(135deg, #fbbf24, #f59e0b); }
    .ir-cta:disabled { opacity: .5; cursor: not-allowed; }
    .ir-secondaire { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 48px;
                     margin-top: 10px; border-radius: 14px; cursor: pointer; text-decoration: none;
                     font-size: 15px; font-weight: 700; color: var(--primary-color);
                     background: transparent; border: 2px solid var(--primary-color); }
    .ir-lien { width: 100%; min-height: 44px; margin-top: 6px; border: 0; background: none; cursor: pointer;
               font-size: 14px; color: var(--text-secondary); }
    .ir-succes { text-align: center; }
    .ir-succes p { font-size: 14px; line-height: 1.5; color: var(--text-secondary); }
    .ir-coche { width: 56px; height: 56px; margin: 4px auto 8px; border-radius: 50%; display: grid; place-items: center;
                font-size: 28px; color: white; background: #10b981; }
    .ir-lien-box { margin: 12px 0; padding: 12px; border-radius: 12px; background: var(--background-secondary); text-align: left; }
    .ir-lien-box small { display: block; font-size: 11px; color: var(--text-secondary); }
    .ir-lien-box code { display: block; font-size: 12px; word-break: break-all; }
    .ir-compte { margin-top: 16px; font-size: 12px !important; }
  `]
})
export class InscriptionRapideComponent {
  @Input() competitionId!: number;
  @Input() competitionNom = '';
  /** Rappel des droits à payer, affiché au-dessus du formulaire. */
  @Input() resume = '';
  @Output() closed = new EventEmitter<void>();

  private http = inject(HttpClient);

  form = { nomEquipe: '', responsableNom: '', responsableTel: '', responsableEmail: '', siteWeb: '' };
  envoi = signal(false);
  erreur = signal<string | null>(null);
  resultat = signal<{ participantId: number; nomEquipe: string; message: string; tokenGestion?: string } | null>(null);
  copie = signal(false);

  valide(): boolean {
    return !!this.form.nomEquipe.trim() && !!this.form.responsableNom.trim()
        && this.form.responsableTel.replace(/\D/g, '').length >= 8;
  }

  lien(): string { return urlApplication(`/equipe/${this.resultat()?.tokenGestion}`); }

  envoyer(): void {
    if (!this.valide() || this.envoi()) return;
    this.envoi.set(true);
    this.erreur.set(null);
    this.http.post<any>(`${environment.apiUrl}/public/competitions/${this.competitionId}/inscription`, this.form).subscribe({
      next: r => {
        this.resultat.set(r);
        this.envoi.set(false);
        if (r.tokenGestion) this.memoriser(r);
      },
      error: err => {
        this.erreur.set(err?.error?.message ?? 'Envoi impossible. Vérifiez votre connexion et réessayez.');
        this.envoi.set(false);
      }
    });
  }

  /** Garde le lien sur cet appareil : en cas de perte, la page de la compétition le retrouve. */
  private memoriser(r: { participantId: number; nomEquipe: string; tokenGestion?: string }): void {
    try {
      const liste = JSON.parse(localStorage.getItem('equipes_liens') ?? '[]');
      liste.push({ competitionId: this.competitionId, nomEquipe: r.nomEquipe, token: r.tokenGestion });
      localStorage.setItem('equipes_liens', JSON.stringify(liste));
    } catch { /* stockage indisponible : le lien reste affiché à l'écran */ }
  }

  async partager(): Promise<void> {
    await partagerLien('Gestion de mon équipe',
      `Lien de gestion de l'équipe ${this.resultat()?.nomEquipe} (${this.competitionNom}) — à conserver : `, this.lien());
  }

  async copier(): Promise<void> {
    await copierTexte(this.lien());
    this.copie.set(true);
  }

  fermer(): void { this.closed.emit(); }
}
