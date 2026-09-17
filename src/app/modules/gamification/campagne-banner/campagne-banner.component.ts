import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CampagneService, CampagneDTO } from '../../../core/services/gamification/campagne.service';


@Component({
  selector: 'app-campagne-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="banners-wrap" *ngIf="campagnes.length > 0">
      <div class="campagne-banner"
           *ngFor="let c of campagnes"
           (click)="goTo(c.slug)">

        <!-- Logo partenaire si dispo -->
        <div class="banner-left">
          <div class="trophy-icon">🏆</div>
          <div class="banner-text">
            <span class="banner-title">{{ c.nom }}</span>
            <span class="banner-sub">
              Gagne jusqu'à
              <strong>{{ getPrixMax(c) }}</strong>
              · {{ joursRestants(c) }} jours restants
            </span>
          </div>
        </div>

        <div class="banner-right">
          <button mat-stroked-button class="voir-btn">
            Voir <mat-icon>chevron_right</mat-icon>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .banners-wrap {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0 16px 8px;
    }

    .campagne-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%);
      border-radius: 16px;
      cursor: pointer;
      animation: fadeIn .3s ease;
      box-shadow: 0 4px 12px rgba(124,58,237,.3);

      @media (max-width: 480px) { padding: 10px 12px; }
    }

    .banner-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .trophy-icon { font-size: 28px; flex-shrink: 0; }

    .banner-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .banner-title {
      font-size: 13px;
      font-weight: 700;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .banner-sub {
      font-size: 11px;
      color: rgba(255,255,255,.8);
      strong { color: #fde68a; }
    }

    .voir-btn {
      color: white !important;
      border-color: rgba(255,255,255,.4) !important;
      font-size: 12px;
      height: 32px;
      white-space: nowrap;
      flex-shrink: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CampagneBannerComponent implements OnInit {
  private campagneService = inject(CampagneService);
  private router          = inject(Router);

  campagnes: CampagneDTO[] = [];

  ngOnInit(): void {
    this.campagneService.getCampagnesActives().subscribe({
      next: c => this.campagnes = c,
      error: () => {}  // silencieux — la bannière est optionnelle
    });
  }

  goTo(slug: string): void {
    this.router.navigate(['/c', slug]);
  }

  getPrixMax(c: CampagneDTO): string {
    const r = c.recompenses?.[0];
    return r ? r.valeur : '?';
  }

  joursRestants(c: CampagneDTO): number {
    const fin  = new Date(c.dateFin);
    const now  = new Date();
    const diff = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }
}