// ============================================================
// MY2-0 - COMPOSANT PUBLICITÉ FEED
// Publicité intégrée dans les listes/fils d'actualités
// Style natif qui s'intègre avec les cards existantes
// ============================================================

import { 
  Component, 
  Input, 
  OnInit, 
  OnDestroy, 
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
  EventEmitter,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PubliciteAffichage, PubliciteAffichageService } from '../../../core/services/publicite-affichage.service';


@Component({
  selector: 'app-publicite-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="feed-ad-container"
      *ngIf="publicite && !hidden"
      [class.compact]="compact">
      
      <a 
        class="feed-ad-card"
        (click)="onClick($event)"
        [attr.href]="publicite.lienCible"
        target="_blank"
        rel="noopener noreferrer sponsored">
        
        <!-- Image -->
        <div class="ad-image-container">
          <img 
            class="ad-image"
            [src]="publicite.imageUrl"
            [alt]="publicite.titre"
            (load)="onImageLoad()"
            (error)="onImageError()">
          <span class="sponsored-tag">Sponsorisé</span>
        </div>
        
        <!-- Contenu -->
        <div class="ad-content">
          <!-- Header avec logo entreprise -->
          <div class="ad-header">
            <div class="company-avatar" *ngIf="publicite.entrepriseLogoUrl">
              <img [src]="publicite.entrepriseLogoUrl" [alt]="publicite.entrepriseNom">
            </div>
            <div class="company-avatar placeholder" *ngIf="!publicite.entrepriseLogoUrl">
              {{ publicite.entrepriseNom?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="company-info">
              <span class="company-name">{{ publicite.entrepriseNom }}</span>
              <span class="ad-label">Publicité</span>
            </div>
          </div>
          
          <!-- Titre -->
          <h4 class="ad-title">{{ publicite.titre }}</h4>
          
          <!-- CTA -->
          <div class="ad-cta">
            <span class="cta-text">Découvrir</span>
            <svg class="cta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </div>
        </div>
      </a>
    </div>
  `,
  styles: [`
    .feed-ad-container {
      margin: 16px 0;
    }
    
    .feed-ad-card {
      display: block;
      background-color: var(--background-primary, #fff);
      border: 1px solid var(--border-color, #e5e5e5);
      border-radius: 12px;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      
      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
      
      &:focus {
        outline: 2px solid var(--primary-color, #3b82f6);
        outline-offset: 2px;
      }
    }
    
    // Image
    .ad-image-container {
      position: relative;
      width: 100%;
      height: 180px;
      overflow: hidden;
      
      .ad-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
      
      .sponsored-tag {
        position: absolute;
        top: 10px;
        left: 10px;
        padding: 4px 10px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-radius: 4px;
      }
    }
    
    .feed-ad-card:hover .ad-image {
      transform: scale(1.05);
    }
    
    // Contenu
    .ad-content {
      padding: 16px;
    }
    
    // Header
    .ad-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .company-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      overflow: hidden;
      flex-shrink: 0;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      &.placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--primary-color, #3b82f6) 0%, #60a5fa 100%);
        color: white;
        font-weight: 600;
        font-size: 16px;
      }
    }
    
    .company-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .company-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary, #1f2937);
      }
      
      .ad-label {
        font-size: 11px;
        color: var(--text-tertiary, #9ca3af);
      }
    }
    
    // Titre
    .ad-title {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary, #1f2937);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    // CTA
    .ad-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background-color: var(--primary-color, #3b82f6);
      color: white;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s ease;
      
      .cta-icon {
        transition: transform 0.2s ease;
      }
    }
    
    .feed-ad-card:hover .ad-cta {
      background-color: #2563eb;
      
      .cta-icon {
        transform: translate(2px, -2px);
      }
    }
    
    // ===== VERSION COMPACT =====
    .feed-ad-container.compact {
      .ad-image-container {
        height: 120px;
      }
      
      .ad-content {
        padding: 12px;
      }
      
      .company-avatar {
        width: 32px;
        height: 32px;
        border-radius: 8px;
      }
      
      .ad-title {
        font-size: 14px;
        -webkit-line-clamp: 1;
      }
      
      .ad-cta {
        padding: 6px 12px;
        font-size: 12px;
      }
    }
    
    // ===== RESPONSIVE =====
    @media (max-width: 600px) {
      .ad-image-container {
        height: 150px;
      }
      
      .ad-content {
        padding: 12px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PubliciteFeedComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() ville?: string;
  @Input() compact = false;
  @Input() pageSource?: string;
  @Input() native: boolean = false;

 @Output() adsLoaded = new EventEmitter<boolean>();
hasAds: boolean = false;

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
  this.publiciteService.getPublicite('FEED', this.ville)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (pub) => {
        this.publicite = pub;
        // Une pub est valide si elle n'est pas nulle et (si c'est un tableau) n'est pas vide
        this.hasAds = !!pub && (!Array.isArray(pub) || pub.length > 0);
        
        if (!this.hasAds) {
          this.hidden = true;
        }
        
        // On émet l'info vers le parent
        this.adsLoaded.emit(this.hasAds);
        this.cdr.markForCheck();
      },
      error: () => {
        this.hidden = true;
        this.adsLoaded.emit(false); // Très important en cas d'erreur !
        this.cdr.markForCheck();
      }
    });
}

  // ============================================================
  // TRACKING
  // ============================================================

  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
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
      this.pageSource || 'feed'
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
    this.cdr.markForCheck();
  }

  onImageError(): void {
    this.hidden = true;
    this.cdr.markForCheck();
  }
}