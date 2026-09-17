import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { XpService, XpProfilDTO } from '../../../core/services/gamification/xp.service';


/**
 * Widget compact intégrable dans le dashboard membre existant.
 * Affiche : niveau, XP, progression, badges récents, missions actives.
 */
@Component({
  selector: 'app-xp-widget',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule,
    MatProgressBarModule, MatButtonModule, MatRippleModule
  ],
  template: `
    <div class="xp-widget" *ngIf="profil" @fadeIn>

      <!-- ── Header niveau ──────────────────────────── -->
      <div class="niveau-header"
           [style.background]="getGradient(profil.niveau)">

        <div class="niveau-left">
          <div class="niveau-badge">{{ profil.titreNiveau }}</div>
          <div class="xp-total">{{ profil.xpTotal | number }} XP total</div>
        </div>

        <div class="niveau-right">
          <div class="niveau-num">Niv. {{ profil.niveau }}</div>
          <div class="rang-info"
               *ngIf="profil.rangSaison > 0">
            🏅 #{{ profil.rangSaison }} ce mois
          </div>
        </div>
      </div>

      <!-- ── Barre progression vers niveau suivant ─── -->
      <div class="progression-zone" *ngIf="profil.niveau < 6">
        <div class="progression-labels">
          <span>{{ profil.xpSaison | number }} XP ce mois</span>
          <span class="next-niveau">{{ profil.prochainNiveau }}</span>
        </div>
        <mat-progress-bar
          mode="determinate"
          [value]="profil.progressionNiveau"
          class="xp-bar">
        </mat-progress-bar>
        <div class="manque-xp">
          {{ profil.xpProchainNiveau - profil.xpTotal | number }} XP avant
          {{ profil.prochainNiveau }}
        </div>
      </div>
      <div class="niveau-max" *ngIf="profil.niveau === 6">
        🏆 Niveau maximum atteint !
      </div>

      <!-- ── Missions actives ───────────────────────── -->
      <div class="missions-zone" *ngIf="missionsActives.length > 0">
        <div class="zone-title">
          <mat-icon>flag</mat-icon> Missions actives
        </div>
        <div class="mission-item"
             *ngFor="let m of missionsActives"
             [class.complete]="m.complete">
          <div class="mission-info">
            <span class="mission-titre">{{ m.titre }}</span>
            <span class="mission-xp">+{{ m.xpBonus }} XP</span>
          </div>
          <div class="mission-progress">
            <mat-progress-bar
              mode="determinate"
              [value]="(m.progression / m.quantiteRequise) * 100"
              [color]="m.complete ? 'accent' : 'primary'">
            </mat-progress-bar>
            <span class="mission-count">
              {{ m.progression }}/{{ m.quantiteRequise }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── Badges récents ─────────────────────────── -->
      <div class="badges-zone" *ngIf="profil.badges.length > 0">
        <div class="zone-title">
          <mat-icon>military_tech</mat-icon>
          Mes badges ({{ profil.badges.length }})
        </div>
        <div class="badges-row">
          <div class="badge-chip"
               *ngFor="let b of profil.badges.slice(0, 5)"
               [title]="b.nom + ' — ' + b.description">
            {{ b.emoji }}
          </div>
          <div class="badge-chip more"
               *ngIf="profil.badges.length > 5"
               routerLink="/membre/ligue">
            +{{ profil.badges.length - 5 }}
          </div>
        </div>
      </div>

      <!-- ── CTA voir tout ──────────────────────────── -->
      <a class="voir-tout-btn" routerLink="/membre/ligue" matRipple>
        <mat-icon>emoji_events</mat-icon>
        Ma progression complète
        <mat-icon>chevron_right</mat-icon>
      </a>

    </div>

    <!-- Loading state -->
    <div class="xp-widget-loading" *ngIf="!profil && isLoading">
      <div class="skeleton-header"></div>
      <div class="skeleton-bar"></div>
      <div class="skeleton-missions"></div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .xp-widget {
      border-radius: 16px;
      overflow: hidden;
      background: var(--background-primary);
      box-shadow: 0 2px 12px rgba(0,0,0,.08);
      margin-bottom: 12px;
      animation: fadeIn .3s ease;
    }

    /* Header */
    .niveau-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      color: white;
    }
    .niveau-badge {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .xp-total {
      font-size: 12px;
      opacity: .85;
    }
    .niveau-num {
      font-size: 28px;
      font-weight: 900;
      text-align: right;
    }
    .rang-info {
      font-size: 12px;
      opacity: .85;
      text-align: right;
    }

    /* Progression */
    .progression-zone {
      padding: 12px 20px 8px;
      border-bottom: 1px solid var(--border-color);
    }
    .progression-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }
    .next-niveau { font-weight: 600; }
    .xp-bar { border-radius: 4px; height: 8px; }
    .manque-xp {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 4px;
      text-align: right;
    }
    .niveau-max {
      padding: 12px 20px;
      text-align: center;
      font-weight: 700;
      color: #f97316;
      border-bottom: 1px solid var(--border-color);
    }

    /* Missions */
    .missions-zone, .badges-zone {
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-color);
    }
    .zone-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: .4px;
      margin-bottom: 10px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .mission-item {
      margin-bottom: 10px;
      &.complete { opacity: .6; }
      &:last-child { margin-bottom: 0; }
    }
    .mission-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .mission-titre { font-size: 13px; font-weight: 500; }
    .mission-xp {
      font-size: 12px;
      font-weight: 700;
      color: #f59e0b;
    }
    .mission-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      mat-progress-bar { flex: 1; border-radius: 3px; }
    }
    .mission-count { font-size: 11px; color: var(--text-secondary); }

    /* Badges */
    .badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .badge-chip {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--background-secondary);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: default;
      &.more {
        font-size: 12px;
        font-weight: 700;
        color: var(--primary-color);
        cursor: pointer;
        &:hover { background: rgba(37,99,235,.08); }
      }
    }

    /* CTA */
    .voir-tout-btn {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-color);
      text-decoration: none;
      cursor: pointer;
      gap: 6px;
      &:hover { background: rgba(37,99,235,.04); }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      mat-icon:last-child { margin-left: auto; }
    }

    /* Skeleton */
    .xp-widget-loading {
      border-radius: 16px;
      overflow: hidden;
      background: var(--background-primary);
      margin-bottom: 12px;
    }
    .skeleton-header {
      height: 72px;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .skeleton-bar { height: 60px; margin: 12px 20px; border-radius: 8px; background: #e2e8f0; }
    .skeleton-missions { height: 80px; margin: 0 20px 12px; border-radius: 8px; background: #f1f5f9; }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class XpWidgetComponent implements OnInit {
  private xpService = inject(XpService);

  profil: XpProfilDTO | null = null;
  isLoading = true;

  get missionsActives() {
    return this.profil?.missions
      .filter(m => !m.complete && m.type === 'HEBDOMADAIRE')
      .slice(0, 3) ?? [];
  }

  ngOnInit(): void {
    // Utiliser le cache si disponible
    const cached = this.xpService.getProfilCache();
    if (cached) { this.profil = cached; this.isLoading = false; return; }

    this.xpService.getMonProfil().subscribe({
      next: p  => { this.profil = p; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  getGradient(niveau: number): string {
    const gradients = [
      'linear-gradient(135deg, #4b5563, #6b7280)',  // Rookie
      'linear-gradient(135deg, #1d4ed8, #3b82f6)',  // Prometteur
      'linear-gradient(135deg, #065f46, #10b981)',  // Confirmé
      'linear-gradient(135deg, #92400e, #f59e0b)',  // Redoutable
      'linear-gradient(135deg, #5b21b6, #8b5cf6)',  // Élite
      'linear-gradient(135deg, #c2410c, #f97316)',  // Légende
    ];
    return gradients[Math.min(niveau - 1, gradients.length - 1)];
  }
}