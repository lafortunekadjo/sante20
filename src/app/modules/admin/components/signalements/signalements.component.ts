import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environment';
import { Signalement } from '../../../../core/services/moderation.service';

/** Administrateur : examiner les signalements d'utilisateurs et décider (retenu / rejeté). */
@Component({
  selector: 'app-signalements',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, DatePipe],
  template: `
    <div class="sig">
      <h1>{{ 'moderation.admin.titre' | translate }}</h1>
      <div class="sig__filtres">
        <button *ngFor="let f of filtres" [class.actif]="statut() === f" (click)="changer(f)">{{ 'moderation.admin.statut.' + f | translate }}</button>
      </div>
      <p class="sig__vide" *ngIf="!chargement() && !liste().length">{{ 'moderation.admin.vide' | translate }}</p>
      <article class="sig__carte" *ngFor="let s of liste()">
        <header>
          <strong>{{ 'moderation.admin.cibles.' + s.cible | translate }} #{{ s.cibleId ?? '—' }}</strong>
          <span>{{ 'moderation.motifs.' + s.motif | translate }} · {{ s.createdAt | date:'short' }}</span>
        </header>
        <p *ngIf="s.details">{{ s.details }}</p>
        <p class="sig__meta">{{ 'moderation.admin.auteur' | translate }} #{{ s.auteurId }}<ng-container *ngIf="s.utilisateurSignaleId"> · {{ 'moderation.admin.signale' | translate }} #{{ s.utilisateurSignaleId }}</ng-container></p>
        <div class="sig__actions" *ngIf="s.statut === 'OUVERT'">
          <input [(ngModel)]="decisions[s.id]" [placeholder]="'moderation.admin.decision' | translate" maxlength="500"/>
          <button (click)="traiter(s, true)">{{ 'moderation.admin.retenir' | translate }}</button>
          <button class="ghost" (click)="traiter(s, false)">{{ 'moderation.admin.rejeter' | translate }}</button>
        </div>
        <p class="sig__meta" *ngIf="s.statut !== 'OUVERT'">{{ 'moderation.admin.statut.' + s.statut | translate }}<ng-container *ngIf="s.decision"> — {{ s.decision }}</ng-container></p>
      </article>
    </div>`,
  styles: [`
    .sig { padding: 16px; max-width: 760px; margin: 0 auto; }
    h1 { font-size: 22px; margin: 0 0 12px; }
    .sig__filtres { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .sig__filtres button { min-height: 40px; padding: 0 14px; border-radius: 20px; border: 1.5px solid var(--border-color, #cbd5e1); background: var(--background-primary); color: var(--text-primary); cursor: pointer; }
    .sig__filtres button.actif { border-color: var(--primary-color, #2563eb); color: var(--primary-color, #2563eb); font-weight: 700; }
    .sig__carte { padding: 14px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; margin-bottom: 10px; background: var(--background-primary); }
    .sig__carte header { display: flex; flex-direction: column; gap: 2px; margin-bottom: 6px; }
    .sig__carte header span, .sig__meta { font-size: 12.5px; color: var(--text-secondary); }
    .sig__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .sig__actions input { flex: 1 1 200px; min-height: 44px; padding: 0 10px; border-radius: 10px; border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; }
    .sig__actions button { min-height: 44px; padding: 0 16px; border: 0; border-radius: 10px; background: var(--primary-color, #2563eb); color: #fff; font-weight: 700; cursor: pointer; }
    .sig__actions button.ghost { background: var(--background-secondary); color: var(--text-primary); }
    .sig__vide { color: var(--text-secondary); text-align: center; padding: 24px 0; }
  `]
})
export class SignalementsComponent implements OnInit {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/moderation/signalements`;

  filtres: ('OUVERT' | 'TRAITE' | 'REJETE')[] = ['OUVERT', 'TRAITE', 'REJETE'];
  statut = signal<'OUVERT' | 'TRAITE' | 'REJETE'>('OUVERT');
  liste = signal<Signalement[]>([]);
  chargement = signal(true);
  decisions: Record<number, string> = {};

  ngOnInit(): void { this.charger(); }

  changer(s: 'OUVERT' | 'TRAITE' | 'REJETE'): void { this.statut.set(s); this.charger(); }

  charger(): void {
    this.chargement.set(true);
    this.http.get<{ content: Signalement[] }>(`${this.base}?statut=${this.statut()}&taille=50`).subscribe({
      next: p => { this.liste.set(p.content ?? []); this.chargement.set(false); },
      error: () => { this.liste.set([]); this.chargement.set(false); }
    });
  }

  traiter(s: Signalement, retenu: boolean): void {
    this.http.patch(`${this.base}/${s.id}`, { retenu, decision: this.decisions[s.id] ?? '' }).subscribe({ next: () => this.charger() });
  }
}
