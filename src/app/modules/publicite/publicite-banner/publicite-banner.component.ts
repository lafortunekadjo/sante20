// ============================================================
// MY2-0 - COMPOSANT PUBLICITÉ BANNER
// Bannière horizontale pour Header/Footer
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
import { PubliciteAffichage, PubliciteAffichageService } from '../../../core/services/publicite-affichage.service';



type BannerPosition = 'HEADER' | 'FOOTER' | 'EXPLORER_TOP';

@Component({
  selector: 'app-publicite-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="banner-container"
      *ngIf="publicite && !hidden"
      [class.header]="position === 'HEADER'"
      [class.footer]="position === 'FOOTER'"
      [class.explorer]="position === 'EXPLORER_TOP'">
      
      <a 
        class="banner-ad"
        (click)="onClick($event)"
        [attr.href]="publicite.lienCible"
        target="_blank"
        rel="noopener noreferrer sponsored">
        
        <!-- Image bannière -->
        <img 
          class="banner-image"
          [src]="publicite.imageUrl"
          [alt]="publicite.titre"
          (load)="onImageLoad()"
          (error)="onImageError()">
        
        <!-- Overlay info (hover) -->
        <div class="banner-overlay">
          <span class="sponsor-text">{{ publicite.entrepriseNom }} • Sponsorisé</span>
        </div>
        
        <!-- Badge discret -->
        <span class="ad-indicator">Ad</span>
      </a>
      
      <!-- Bouton fermer (optionnel) -->
      <button 
        class="close-btn"
        *ngIf="closable"
        (click)="onClose($event)"
        aria-label="Fermer la publicité">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .banner-container {
      position: relative;
      width: 100%;
      display: flex;
      justify-content: center;
      background-color: var(--background-secondary, #f5f5f5);
      
      &.header {
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color, #e5e5e5);
      }
      
      &.footer {
        padding: 8px 0;
        border-top: 1px solid var(--border-color, #e5e5e5);
      }
      
      &.explorer {
        padding: 0;
        margin-bottom: 16px;
        background-color: transparent;
      }
    }
    
    .banner-ad {
      position: relative;
      display: block;
      max-width: 728px;
      width: 100%;
      height: 90px;
      overflow: hidden;
      border-radius: 8px;
      text-decoration: none;
      
      @media (max-width: 768px) {
        max-width: 320px;
        height: 50px;
        border-radius: 6px;
      }
      
      &:focus {
        outline: 2px solid var(--primary-color, #3b82f6);
        outline-offset: 2px;
      }
    }
    
    .banner-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .banner-ad:hover .banner-image {
      transform: scale(1.02);
    }
    
    // Overlay
    .banner-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%);
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: flex-end;
      padding: 8px 12px;
      
      .sponsor-text {
        color: white;
        font-size: 11px;
        font-weight: 500;
      }
      
      @media (max-width: 768px) {
        display: none;
      }
    }
    
    .banner-ad:hover .banner-overlay {
      opacity: 1;
    }
    
    // Indicateur Ad
    .ad-indicator {
      position: absolute;
      top: 6px;
      right: 6px;
      padding: 2px 6px;
      background-color: rgba(255, 255, 255, 0.9);
      color: var(--text-secondary, #6b7280);
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 3px;
      
      @media (max-width: 768px) {
        top: 4px;
        right: 4px;
        padding: 1px 4px;
        font-size: 8px;
      }
    }
    
    // Bouton fermer
    .close-btn {
      position: absolute;
      top: 50%;
      right: 8px;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.5);
      border: none;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.7);
      }
    }
    
    .banner-container:hover .close-btn {
      opacity: 1;
    }
    
    // Position spécifiques
    .banner-container.header {
      @media (max-width: 768px) {
        padding: 6px 8px;
      }
    }
    
    .banner-container.explorer {
      .banner-ad {
        border-radius: 12px;
        
        @media (max-width: 768px) {
          max-width: 100%;
          border-radius: 0;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PubliciteBannerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() position: BannerPosition = 'HEADER';
  @Input() ville?: string;
  @Input() closable = false;
  @Input() pageSource?: string;
  @Input() sticky: boolean = false;

  publicite: PubliciteAffichage | null = null;
  hidden = false;

  private destroy$ = new Subject<void>();
  private observer?: IntersectionObserver;
  private tracked = false;

  constructor(
    private publiciteService: PubliciteAffichageService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPublicite();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
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
    this.publiciteService.getPublicite(this.position, this.ville)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pub) => {
          this.publicite = pub;
          if (!pub) this.hidden = true;
          this.cdr.markForCheck();
        },
        error: () => {
          this.hidden = true;
          this.cdr.markForCheck();
        }
      });
  }

  // ============================================================
  // TRACKING
  // ============================================================

  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
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
      this.pageSource || this.position.toLowerCase()
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

  onClose(event: Event): void {
    event.stopPropagation();
    this.hidden = true;
    this.cdr.markForCheck();
  }

  onImageLoad(): void {
    this.cdr.markForCheck();
  }

  onImageError(): void {
    this.hidden = true;
    this.cdr.markForCheck();
  }
}