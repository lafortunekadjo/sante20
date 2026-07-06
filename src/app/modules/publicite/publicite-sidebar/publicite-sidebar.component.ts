import {
  Component, Input, OnInit, OnDestroy,
  ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PubliciteAffichage, PubliciteAffichageService } from '../../../core/services/publicite-affichage.service';

@Component({
  selector: 'app-publicite-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publicite-sidebar.component.html',
  styleUrls: ['./publicite-sidebar.component.scss'],
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
    // Ne pas appeler l'API sur mobile — CSS gère déjà le display:none
    // mais on évite l'appel réseau inutile
    if (window.innerWidth < 768) { this.hidden = true; return; }
    this.loadPublicite();
  }

  ngAfterViewInit(): void {
    if (!this.hidden) this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.observer?.disconnect();
  }

  private loadPublicite(): void {
    this.publiciteService.getPublicite('SIDEBAR', this.ville)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pub) => { this.publicite = pub; if (!pub) this.hidden = true; this.cdr.markForCheck(); },
        error: () => { this.hidden = true; this.cdr.markForCheck(); }
      });
  }

  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) return;
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= 0.3) this.trackImpressionIfNeeded(); });
    }, { threshold: 0.3 });
    this.observer.observe(this.elementRef.nativeElement);
  }

  private trackImpressionIfNeeded(): void {
    if (this.tracked || !this.publicite) return;
    this.tracked = true;
    this.publiciteService.trackImpression(this.publicite, this.pageSource || 'sidebar');
  }

  onClick(event: Event): void {
    event.preventDefault();
    if (this.publicite) this.publiciteService.onPubliciteClick(this.publicite);
  }

  onImageLoad(): void { this.cdr.markForCheck(); }
  onImageError(): void { this.hidden = true; this.cdr.markForCheck(); }
}