import {
  Component, Input, OnInit, OnDestroy,
  ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit
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
  templateUrl: './publicite-banner.component.html',
  styleUrls: ['./publicite-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PubliciteBannerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() position: BannerPosition = 'HEADER';
  @Input() ville?: string;
  @Input() closable = false;
  @Input() pageSource?: string;
  @Input() sticky = false;

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

  ngOnInit(): void { this.loadPublicite(); }
  ngAfterViewInit(): void { this.setupIntersectionObserver(); }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.observer?.disconnect();
  }

  private loadPublicite(): void {
    this.publiciteService.getPublicite(this.position, this.ville)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pub) => { this.publicite = pub; if (!pub) this.hidden = true; this.cdr.markForCheck(); },
        error: () => { this.hidden = true; this.cdr.markForCheck(); }
      });
  }

  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) { this.trackImpressionIfNeeded(); return; }
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= 0.5) this.trackImpressionIfNeeded(); });
    }, { threshold: 0.5 });
    this.observer.observe(this.elementRef.nativeElement);
  }

  private trackImpressionIfNeeded(): void {
    if (this.tracked || !this.publicite) return;
    this.tracked = true;
    this.publiciteService.trackImpression(this.publicite, this.pageSource || this.position.toLowerCase());
  }

  onClick(event: Event): void {
    event.preventDefault();
    if (this.publicite) this.publiciteService.onPubliciteClick(this.publicite);
  }

  onClose(event: Event): void { event.stopPropagation(); this.hidden = true; this.cdr.markForCheck(); }
  onImageLoad(): void { this.cdr.markForCheck(); }
  onImageError(): void { this.hidden = true; this.cdr.markForCheck(); }
}