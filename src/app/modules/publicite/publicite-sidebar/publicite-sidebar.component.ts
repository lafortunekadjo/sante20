// ============================================================
// MY2-0 - COMPOSANT PUBLICITÉ SIDEBAR
// Publicité verticale pour la colonne latérale (desktop)
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



@Component({
  selector: 'app-publicite-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside 
      class="sidebar-ad-container"
      *ngIf="publicite && !hidden"
      [class.sticky]="sticky">
      
      <a 
        class="sidebar-ad"
        (click)="onClick($event)"
        [attr.href]="publicite.lienCible"
        target="_blank"
        rel="noopener noreferrer sponsored">
        
        <!-- Badge -->
        <span class="ad-badge">Pub</span>
        
        <!-- Image principale -->
        <div class="ad-image-wrapper">
          <img 
            class="ad-image"
            [src]="publicite.imageUrl"
            [alt]="publicite.titre"
            (load)="onImageLoad()"
            (error)="onImageError()">
        </div>
        
        <!-- Info -->
        <div class="ad-info">
          <div class="company-row">
            <img 
              *ngIf="publicite.entrepriseLogoUrl"
              class="company-logo"
              [src]="publicite.entrepriseLogoUrl"
              [alt]="publicite.entrepriseNom">
            <span class="company-name">{{ publicite.entrepriseNom }}</span>
          </div>
          <p class="ad-title">{{ publicite.titre }}</p>
        </div>
        
        <!-- CTA -->
        <div class="ad-cta">
          <span>Voir plus</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </a>
    </aside>
  `,
  styles: [`
    .sidebar-ad-container {
      width: 160px;
      
      &.sticky {
        position: sticky;
        top: 80px;
      }
      
      // Cacher sur mobile/tablette
      @media (max-width: 1024px) {
        display: none;
      }
    }
    
    .sidebar-ad {
      display: flex;
      flex-direction: column;
      background-color: var(--background-primary, #fff);
      border: 1px solid var(--border-color, #e5e5e5);
      border-radius: 12px;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      
      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
      }
      
      &:focus {
        outline: 2px solid var(--primary-color, #3b82f6);
        outline-offset: 2px;
      }
    }
    
    // Badge
    .ad-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 2px 6px;
      background-color: rgba(0, 0, 0, 0.6);
      color: white;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      border-radius: 3px;
      z-index: 1;
    }
    
    // Image
    .ad-image-wrapper {
      position: relative;
      width: 100%;
      height: 400px;
      overflow: hidden;
      
      .ad-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
    }
    
    .sidebar-ad:hover .ad-image {
      transform: scale(1.05);
    }
    
    // Info
    .ad-info {
      padding: 12px;
      
      .company-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        
        .company-logo {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          object-fit: cover;
        }
        
        .company-name {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      
      .ad-title {
        margin: 0;
        font-size: 12px;
        font-weight: 500;
        color: var(--text-primary, #1f2937);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
    
    // CTA
    .ad-cta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 10px 12px;
      background-color: var(--primary-color, #3b82f6);
      color: white;
      font-size: 11px;
      font-weight: 600;
      transition: background-color 0.2s ease;
      
      svg {
        transition: transform 0.2s ease;
      }
    }
    
    .sidebar-ad:hover .ad-cta {
      background-color: #2563eb;
      
      svg {
        transform: translateX(2px);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PubliciteSidebarComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() ville?: string;
  @Input() sticky = true;
  @Input() pageSource?: string;

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
    // Ne pas charger sur mobile
    if (window.innerWidth <= 1024) {
      this.hidden = true;
      return;
    }
    
    this.loadPublicite();
  }

  ngAfterViewInit(): void {
    if (!this.hidden) {
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
    this.publiciteService.getPublicite('SIDEBAR', this.ville)
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
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            this.trackImpressionIfNeeded();
          }
        });
      },
      { threshold: 0.3 }
    );

    this.observer.observe(this.elementRef.nativeElement);
  }

  private trackImpressionIfNeeded(): void {
    if (this.tracked || !this.publicite) return;
    
    this.tracked = true;
    this.publiciteService.trackImpression(
      this.publicite, 
      this.pageSource || 'sidebar'
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