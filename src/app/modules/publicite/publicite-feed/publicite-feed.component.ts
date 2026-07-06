import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy, ElementRef,
  ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PubliciteAffichage, PubliciteAffichageService } from '../../../core/services/publicite-affichage.service';

@Component({
  selector: 'app-publicite-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publicite-feed.component.html',
  styleUrls: ['./publicite-feed.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PubliciteFeedComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() ville?: string;
  @Input() compact = false;
  @Input() pageSource?: string;
  @Input() native = false;
  @Output() adsLoaded = new EventEmitter<boolean>();

  publicite: PubliciteAffichage | null = null;
  hidden = false;
  hasAds = false;

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
    this.publiciteService.getPublicite('FEED', this.ville)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pub) => {
          this.publicite = pub;
          this.hasAds = !!pub;
          if (!this.hasAds) this.hidden = true;
          this.adsLoaded.emit(this.hasAds);
          this.cdr.markForCheck();
        },
        error: () => {
          this.hidden = true;
          this.adsLoaded.emit(false);
          this.cdr.markForCheck();
        }
      });
  }

  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) return;
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= 0.5) this.trackImpressionIfNeeded(); });
    }, { threshold: 0.5 });
    this.observer.observe(this.elementRef.nativeElement);
  }

  private trackImpressionIfNeeded(): void {
    if (this.tracked || !this.publicite) return;
    this.tracked = true;
    this.publiciteService.trackImpression(this.publicite, this.pageSource || 'feed');
  }

  onClick(event: Event): void {
    event.preventDefault();
    if (this.publicite) this.publiciteService.onPubliciteClick(this.publicite);
  }

  onImageLoad(): void { this.cdr.markForCheck(); }
  onImageError(): void { this.hidden = true; this.cdr.markForCheck(); }
}