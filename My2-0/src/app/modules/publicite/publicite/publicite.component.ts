// ============================================================
// MY2-0 - COMPOSANT PUBLICITÉ
// Affichage générique des publicités par emplacement
// ============================================================

import { 
  Component, 
  Input, 
  OnInit, 
  OnDestroy, 
  ElementRef, 
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PubliciteAffichage, PubliciteAffichageService, EMPLACEMENTS_CONFIG } from '../../../core/services/publicite-affichage.service';



@Component({
  selector: 'app-publicite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="publicite-container"
      [class.loading]="isLoading"
      [class.empty]="!publicite && !isLoading"
      [class.has-ad]="publicite"
      [ngClass]="'emplacement-' + emplacement.toLowerCase()"
      [style.width.px]="containerWidth"
      [style.height.px]="containerHeight"
      *ngIf="!hidden">
      
      <!-- Loading skeleton -->
      <div class="publicite-skeleton" *ngIf="isLoading">
        <div class="skeleton-shimmer"></div>
      </div>
      
      <!-- Publicité -->
      <a 
        class="publicite-link"
        *ngIf="publicite && !isLoading"
        (click)="onClick($event)"
        [attr.href]="publicite.lienCible"
        target="_blank"
        rel="noopener noreferrer sponsored">
        
        <img 
          class="publicite-image"
          [src]="publicite.imageUrl"
          [alt]="publicite.titre"
          (load)="onImageLoad()"
          (error)="onImageError()">
        
        <!-- Badge sponsorisé -->
        <span class="sponsored-badge" *ngIf="showBadge">
          Sponsorisé
        </span>
        
        <!-- Overlay hover (desktop) -->
        <div class="publicite-overlay" *ngIf="showOverlay">
          <span class="overlay-text">{{ publicite.entrepriseNom }}</span>
        </div>
      </a>
      
      <!-- Placeholder si pas de pub -->
      <div class="publicite-placeholder" *ngIf="!publicite && !isLoading && showPlaceholder">
        <span class="placeholder-text">Espace publicitaire</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .publicite-container {
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      background-color: var(--background-secondary, #f5f5f5);
      transition: opacity 0.3s ease;
      
      &.empty {
        display: none;
      }
      
      &.loading {
        opacity: 0.7;
      }
    }
    
    // Skeleton loading
    .publicite-skeleton {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, 
        var(--background-secondary, #f0f0f0) 25%, 
        var(--background-tertiary, #e0e0e0) 50%, 
        var(--background-secondary, #f0f0f0) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      
      .skeleton-shimmer {
        width: 100%;
        height: 100%;
      }
    }
    
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    // Lien publicité
    .publicite-link {
      display: block;
      width: 100%;
      height: 100%;
      text-decoration: none;
      cursor: pointer;
      
      &:focus {
        outline: 2px solid var(--primary-color, #3b82f6);
        outline-offset: 2px;
      }
    }
    
    // Image
    .publicite-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .publicite-link:hover .publicite-image {
      transform: scale(1.02);
    }
    
    // Badge sponsorisé
    .sponsored-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 2px 8px;
      background-color: rgba(0, 0, 0, 0.6);
      color: white;
      font-size: 10px;
      font-weight: 500;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    // Overlay
    .publicite-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: flex-end;
      padding: 12px;
      
      .overlay-text {
        color: white;
        font-size: 12px;
        font-weight: 500;
      }
    }
    
    .publicite-link:hover .publicite-overlay {
      opacity: 1;
    }
    
    // Placeholder
    .publicite-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--background-tertiary, #e5e5e5);
      
      .placeholder-text {
        font-size: 11px;
        color: var(--text-tertiary, #9ca3af);
        text-transform: uppercase;
        letter-spacing: 1px;
      }
    }
    
    // ===== EMPLACEMENTS SPÉCIFIQUES =====
    
    // Header banner
    .emplacement-header {
      margin: 0 auto;
      max-width: 728px;
      
      @media (max-width: 768px) {
        max-width: 320px;
        height: 50px !important;
      }
    }
    
    // Sidebar
    .emplacement-sidebar {
      @media (max-width: 1024px) {
        display: none;
      }
    }
    
    // Feed (dans les listes)
    .emplacement-feed {
      margin: 16px auto;
      max-width: 300px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    // Between sections
    .emplacement-between_sections {
      margin: 24px auto;
      max-width: 300px;
    }
    
    // Footer
    .emplacement-footer {
      margin: 0 auto;
      max-width: 468px;
      
      @media (max-width: 768px) {
        max-width: 320px;
        height: 50px !important;
      }
    }
    
    // Explorer top
    .emplacement-explorer_top {
      margin: 0 auto 24px;
      max-width: 728px;
      
      @media (max-width: 768px) {
        max-width: 100%;
        border-radius: 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PubliciteComponent implements OnInit, OnDestroy, AfterViewInit {
  // Inputs
  @Input() emplacement!: string;
  @Input() ville?: string;
  @Input() showBadge = true;
  @Input() showOverlay = true;
  @Input() showPlaceholder = false;
  @Input() autoTrack = true;
  @Input() pageSource?: string;

  // État
  publicite: PubliciteAffichage | null = null;
  isLoading = true;
  hidden = false;
  imageLoaded = false;

  // Dimensions
  containerWidth: number | null = null;
  containerHeight: number | null = null;

  private destroy$ = new Subject<void>();
  private observer?: IntersectionObserver;
  private tracked = false;

  constructor(
    private publiciteService: PubliciteAffichageService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setDimensions();
    this.loadPublicite();
  }

  ngAfterViewInit(): void {
    if (this.autoTrack) {
      this.setupIntersectionObserver();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.observer?.disconnect();
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  private loadPublicite(): void {
    this.isLoading = true;

    this.publiciteService.getPublicite(this.emplacement, this.ville)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pub) => {
          this.publicite = pub;
          this.isLoading = false;
          
          if (!pub) {
            this.hidden = !this.showPlaceholder;
          }
          
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.hidden = true;
          this.cdr.markForCheck();
        }
      });
  }

  // ============================================================
  // DIMENSIONS
  // ============================================================

  private setDimensions(): void {
    const config = EMPLACEMENTS_CONFIG[this.emplacement];
    
    if (config) {
      const isMobile = this.publiciteService.isMobile();
      
      if (isMobile && config.mobileWidth) {
        this.containerWidth = config.mobileWidth;
        // Calculer la hauteur proportionnelle
        const ratio = config.dimensions.height / config.dimensions.width;
        this.containerHeight = Math.round(config.mobileWidth * ratio);
      } else if (config.dimensions.width > 0) {
        this.containerWidth = config.dimensions.width;
        this.containerHeight = config.dimensions.height;
      }
    }
  }

  // ============================================================
  // TRACKING
  // ============================================================

  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback : tracker immédiatement
      this.trackImpressionIfNeeded();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            this.trackImpressionIfNeeded();
          }
        });
      },
      { threshold: 0.5 }
    );

    this.observer.observe(this.elementRef.nativeElement);
  }

  private trackImpressionIfNeeded(): void {
    if (this.tracked || !this.publicite) return;
    
    this.tracked = true;
    this.publiciteService.trackImpression(
      this.publicite, 
      this.pageSource || window.location.pathname
    );
  }

  // ============================================================
  // EVENTS
  // ============================================================

  onClick(event: Event): void {
    event.preventDefault();
    
    if (this.publicite) {
      this.publiciteService.onPubliciteClick(this.publicite);
    }
  }

  onImageLoad(): void {
    this.imageLoaded = true;
    this.cdr.markForCheck();
  }

  onImageError(): void {
    // Cacher si l'image ne charge pas
    this.hidden = true;
    this.cdr.markForCheck();
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  /**
   * Recharger la publicité
   */
  refresh(): void {
    this.tracked = false;
    this.publiciteService.refreshCache(this.emplacement);
    this.loadPublicite();
  }
}