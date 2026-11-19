import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, of, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DirectEvenement, DirectService, MatchDirect } from '../../../core/services/direct.service';

/** Carte « EN DIRECT » de l'actualité : score et derniers événements des matchs en cours de saisie. Se met à jour toute seule. */
@Component({
  selector: 'app-direct-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="dc" *ngFor="let m of matchs; trackBy: suivi">
      <header class="dc-tete">
        <span class="dc-live"><span class="dc-point"></span>EN DIRECT</span>
        <span class="dc-minute" *ngIf="m.minute !== null">{{ m.miTemps && m.minute <= 45 ? 'Mi-temps' : m.minute + '′' }}</span>
        <span class="dc-prov" *ngIf="m.provisoire" title="Saisie par un membre, pas encore validée par le responsable">provisoire</span>
      </header>

      <div class="dc-score">
        <span class="dc-equipe">{{ m.equipe1 }}</span>
        <strong class="dc-chiffres">{{ m.score1 }} <span>-</span> {{ m.score2 }}</strong>
        <span class="dc-equipe dc-droite">{{ m.equipe2 }}</span>
      </div>

      <ul class="dc-evts" *ngIf="m.derniers.length">
        <li *ngFor="let e of m.derniers" [class.dc-e2]="e.equipePosition === 2">
          <span class="dc-ico">{{ icone(e) }}</span>
          <span class="dc-qui">{{ e.joueur || (e.equipePosition === 2 ? m.equipe2 : m.equipe1) }}<small *ngIf="libelle(e)"> · {{ libelle(e) }}</small></span>
          <span class="dc-min" *ngIf="e.minute !== null">{{ e.minute }}′</span>
        </li>
      </ul>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .dc { margin: 0 0 12px; padding: 12px 14px; border-radius: 16px; color: #fff; background: linear-gradient(135deg, var(--primary-dark, #1a3eb5), var(--primary-color, #2563eb)); box-shadow: 0 4px 14px var(--shadow-color, rgba(0,0,0,.18)); }
    .dc-tete { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; }
    .dc-live { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px 3px 8px; border-radius: 999px; background: #dc2626; letter-spacing: .06em; }
    .dc-point { width: 8px; height: 8px; border-radius: 50%; background: #fff; animation: dc-pulse 1.2s ease-in-out infinite; }
    @keyframes dc-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
    .dc-minute { opacity: .95; }
    .dc-prov { margin-left: auto; font-weight: 600; font-size: 11px; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,.2); }
    .dc-score { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; margin: 10px 0 8px; }
    .dc-equipe { font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dc-droite { text-align: right; }
    .dc-chiffres { font-size: 32px; line-height: 1; letter-spacing: .02em; font-variant-numeric: tabular-nums; }
    .dc-chiffres span { opacity: .6; font-weight: 400; }
    .dc-evts { list-style: none; margin: 0; padding: 8px 0 0; border-top: 1px solid rgba(255,255,255,.22); }
    .dc-evts li { display: flex; align-items: center; gap: 8px; min-height: 28px; font-size: 13px; }
    .dc-e2 { flex-direction: row-reverse; text-align: right; }
    .dc-qui { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dc-qui small { opacity: .8; }
    .dc-min { opacity: .85; font-variant-numeric: tabular-nums; }
  `]
})
export class DirectCardComponent implements OnInit, OnDestroy {
  matchs: MatchDirect[] = [];
  private abonnement?: Subscription;

  constructor(private direct: DirectService) {}

  ngOnInit(): void {
    // rafraîchissement toutes les 15 s, en pause quand l'onglet n'est pas visible
    this.abonnement = timer(0, 15000).pipe(
      switchMap(() => document.visibilityState === 'hidden' ? of(null) : this.direct.enDirect().pipe(catchError(() => of(null))))
    ).subscribe(liste => { if (liste) this.matchs = liste; });
  }

  ngOnDestroy(): void { this.abonnement?.unsubscribe(); }

  suivi(_: number, m: MatchDirect): number { return m.matchId; }

  icone(e: DirectEvenement): string {
    switch (e.type) {
      case 'CARTON_JAUNE': return '🟨';
      case 'CARTON_ROUGE': return '🟥';
      case 'PENALTI_RATE': return '❌';
      default: return '⚽';
    }
  }

  libelle(e: DirectEvenement): string {
    switch (e.type) {
      case 'PENALTI_MARQUE': return 'penalty';
      case 'PENALTI_RATE': return 'penalty manqué';
      case 'COUP_FRANC_MARQUE': return 'coup franc';
      case 'CONTRE_SON_CAMP': return 'contre son camp';
      default: return '';
    }
  }
}
