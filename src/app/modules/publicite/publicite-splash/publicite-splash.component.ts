// ============================================================
// MY2-0 - COMPOSANT SPLASH SCREEN PUBLICITAIRE
// Modal plein écran au lancement de l'app
// ============================================================

import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PubliciteAffichage, PubliciteAffichageService } from '../../../core/services/publicite-affichage.service';



@Component({
  selector: 'app-publicite-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="splash-overlay"
      *ngIf="isVisible && publicite"
      [@fadeInOut]
      (click)="onOverlayClick($event)">
      
      <div class="splash-container" (click)="$event.stopPropagation()">
        <!-- Header avec countdown -->
        <div class="splash-header">
          <span class="sponsor-label">Publicité</span>
          <button 
            class="close-btn"
            [disabled]="countdown > 0"
            (click)="close()">
            <span *ngIf="countdown > 0">{{ countdown }}s</span>
            <span *ngIf="countdown === 0">✕ Fermer</span>
          </button>
        </div>
        
        <!-- Contenu publicitaire -->
        <a 
          class="splash-content"
          (click)="onAdClick($event)"
          [attr.href]="publicite.lienCible"
          target="_blank"
          rel="noopener noreferrer sponsored">
          
          <img 
            class="splash-image"
            [src]="publicite.imageUrl"
            [alt]="publicite.titre"
            (load)="onImageLoad()"
            (error)="onImageError()">
          
          <!-- Info entreprise -->
          <div class="splash-info">
            <img 
              *ngIf="publicite.entrepriseLogoUrl"
              class="company-logo"
              [src]="publicite.entrepriseLogoUrl"
              [alt]="publicite.entrepriseNom">
            <div class="company-info">
              <span class="company-name">{{ publicite.entrepriseNom }}</span>
              <span class="ad-title">{{ publicite.titre }}</span>
            </div>
          </div>
          
          <!-- CTA -->
          <div class="splash-cta">
            <span class="cta-text">En savoir plus</span>
            <svg class="cta-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </a>
        
        <!-- Skip button mobile -->
        <button 
          class="skip-btn-mobile"
          *ngIf="countdown === 0"
          (click)="close()">
          Passer
        </button>
      </div>
    </div>
  `,
  styles: [`
    // Overlay
    .splash-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background-color: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    // Container
    .splash-container {
      position: relative;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      background-color: var(--background-primary, #fff);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.4s ease-out;
    }
    
    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    // Header
    .splash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background-color: var(--background-secondary, #f5f5f5);
      border-bottom: 1px solid var(--border-color, #e5e5e5);
    }
    
    .sponsor-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-tertiary, #9ca3af);
    }
    
    .close-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
      border: none;
      background-color: var(--background-tertiary, #e5e5e5);
      color: var(--text-primary, #1f2937);
      font-size: 13px;
      font-weight: 500;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
      
      &:not(:disabled):hover {
        background-color: var(--primary-color, #3b82f6);
        color: white;
      }
    }
    
    // Content
    .splash-content {
      display: block;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }
    
    .splash-image {
      width: 100%;
      height: auto;
      max-height: 400px;
      object-fit: cover;
      display: block;
    }
    
    // Info entreprise
    .splash-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: var(--background-primary, #fff);
    }
    
    .company-logo {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
    }
    
    .company-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      
      .company-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary, #1f2937);
      }
      
      .ad-title {
        font-size: 13px;
        color: var(--text-secondary, #6b7280);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    // CTA
    .splash-cta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      background: linear-gradient(135deg, var(--primary-color, #3b82f6) 0%, #60a5fa 100%);
      color: white;
      transition: all 0.2s ease;
      
      .cta-text {
        font-size: 15px;
        font-weight: 600;
      }
      
      .cta-arrow {
        transition: transform 0.2s ease;
      }
    }
    
    .splash-content:hover .splash-cta {
      background: linear-gradient(135deg, #2563eb 0%, var(--primary-color, #3b82f6) 100%);
      
      .cta-arrow {
        transform: translateX(4px);
      }
    }
    
    // Skip button mobile
    .skip-btn-mobile {
      display: none;
      width: 100%;
      padding: 14px;
      border: none;
      background-color: transparent;
      color: var(--text-secondary, #6b7280);
      font-size: 14px;
      cursor: pointer;
      
      @media (max-width: 600px) {
        display: block;
      }
    }
    
    // Mobile adjustments
    @media (max-width: 600px) {
      .splash-overlay {
        padding: 0;
        align-items: flex-end;
      }
      
      .splash-container {
        max-width: 100%;
        max-height: 85vh;
        border-radius: 20px 20px 0 0;
      }
      
      .splash-image {
        max-height: 300px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PubliciteSplashComponent implements OnInit, OnDestroy {
  publicite: PubliciteAffichage | null = null;
  isVisible = false;
  countdown = 3; // Secondes avant de pouvoir fermer
  imageLoaded = false;

  private destroy$ = new Subject<void>();
  private tracked = false;

  constructor(
    private publiciteService: PubliciteAffichageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSplashAd();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // KEYBOARD
  // ============================================================

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.countdown === 0) {
      this.close();
    }
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  private loadSplashAd(): void {
    this.publiciteService.getSplashPublicite()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pub) => {
          if (pub) {
            this.publicite = pub;
            this.isVisible = true;
            this.startCountdown();
            this.cdr.markForCheck();
          }
        }
      });
  }

  private startCountdown(): void {
    timer(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(tick => {
        this.countdown = Math.max(0, 3 - tick);
        this.cdr.markForCheck();
        
        if (this.countdown === 0) {
          // Plus besoin de continuer le timer
        }
      });
  }

  // ============================================================
  // TRACKING
  // ============================================================

  private trackImpression(): void {
    if (this.tracked || !this.publicite) return;
    
    this.tracked = true;
    this.publiciteService.trackImpression(this.publicite, 'splash_screen');
  }

  // ============================================================
  // EVENTS
  // ============================================================

  onImageLoad(): void {
    this.imageLoaded = true;
    this.trackImpression();
    this.cdr.markForCheck();
  }

  onImageError(): void {
    // Fermer si l'image ne charge pas
    this.close();
  }

  onAdClick(event: Event): void {
    event.preventDefault();
    
    if (this.publicite) {
      this.publiciteService.onPubliciteClick(this.publicite);
      this.close();
    }
  }

  onOverlayClick(event: Event): void {
    // Fermer si on clique en dehors (seulement si countdown terminé)
    if (this.countdown === 0) {
      this.close();
    }
  }

  close(): void {
    this.isVisible = false;
    this.publiciteService.dismissSplash();
    this.cdr.markForCheck();
  }
}