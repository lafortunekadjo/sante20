// ============================================================
// MY2-0 - SERVICE PUBLICITÉS AFFICHAGE
// Gestion de l'affichage, cache et tracking des publicités
// ============================================================

import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject, timer } from 'rxjs';
import { map, catchError, tap, takeUntil, shareReplay } from 'rxjs/operators';
import { environment } from '../../environment';


// ============================================================
// INTERFACES
// ============================================================

export interface PubliciteAffichage {
  id: number;
  imageUrl: string;
  titre: string;
  lienCible: string;
  format: string;
  entrepriseNom: string;
  entrepriseLogoUrl?: string;
  trackingId: string;
}

export interface EmplacementConfig {
  value: string;
  dimensions: { width: number; height: number };
  mobileWidth?: number;
  refreshInterval?: number; // en secondes
  maxAds?: number;
}

export const EMPLACEMENTS_CONFIG: Record<string, EmplacementConfig> = {
  HEADER: { value: 'HEADER', dimensions: { width: 728, height: 90 }, mobileWidth: 320 },
  SIDEBAR: { value: 'SIDEBAR', dimensions: { width: 160, height: 600 } },
  FEED: { value: 'FEED', dimensions: { width: 300, height: 250 }, refreshInterval: 60 },
  BETWEEN_SECTIONS: { value: 'BETWEEN_SECTIONS', dimensions: { width: 300, height: 250 } },
  FOOTER: { value: 'FOOTER', dimensions: { width: 468, height: 60 }, mobileWidth: 320 },
  SPLASH_SCREEN: { value: 'SPLASH_SCREEN', dimensions: { width: 0, height: 0 } }, // Fullscreen
  PDF_FOOTER: { value: 'PDF_FOOTER', dimensions: { width: 200, height: 50 } },
  IMAGE_MATCH: { value: 'IMAGE_MATCH', dimensions: { width: 150, height: 40 } },
  EXPLORER_TOP: { value: 'EXPLORER_TOP', dimensions: { width: 728, height: 90 }, mobileWidth: 320 },
  MODAL: { value: 'MODAL', dimensions: { width: 400, height: 300 } }
};

// ============================================================
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class PubliciteAffichageService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/publicites`;
  
  // Cache des publicités par emplacement
  private cache = new Map<string, { data: PubliciteAffichage[]; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  // Tracking des impressions déjà envoyées (éviter doublons)
  private impressionsTracked = new Set<string>();
  
  // Splash screen
  private splashShown$ = new BehaviorSubject<boolean>(false);
  private splashDismissed = false;
  
  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {
    // Nettoyer le cache périodiquement
    timer(this.cacheTimeout, this.cacheTimeout)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cleanCache());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // RÉCUPÉRATION DES PUBLICITÉS
  // ============================================================

  /**
   * Récupérer les publicités pour un emplacement
   */
  getPublicites(emplacement: string, ville?: string, limit: number = 1): Observable<PubliciteAffichage[]> {
    const cacheKey = `${emplacement}_${ville || 'all'}_${limit}`;
    
    // Vérifier le cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return of(cached.data);
    }

    // Appel API
    const params: any = { emplacement, limit: limit.toString() };
    if (ville) params.ville = ville;

    return this.http.get<PubliciteAffichage[]>(`${this.apiUrl}/affichage`, { params }).pipe(
      tap(data => {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }),
      catchError(err => {
        console.warn('Erreur chargement publicités:', err);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  /**
   * Récupérer une seule publicité pour un emplacement
   */
  getPublicite(emplacement: string, ville?: string): Observable<PubliciteAffichage | null> {
    return this.getPublicites(emplacement, ville, 1).pipe(
      map(pubs => pubs.length > 0 ? pubs[0] : null)
    );
  }

  /**
   * Récupérer la publicité splash screen
   */
  getSplashPublicite(): Observable<PubliciteAffichage | null> {
    if (this.splashDismissed || this.hasSeenSplashToday()) {
      return of(null);
    }
    return this.getPublicite('SPLASH_SCREEN');
  }

  // ============================================================
  // TRACKING
  // ============================================================

  /**
   * Tracker une impression
   */
  trackImpression(publicite: PubliciteAffichage, pageSource?: string): void {
    const trackKey = `${publicite.id}_${publicite.trackingId}`;
    
    // Éviter les doublons
    if (this.impressionsTracked.has(trackKey)) {
      return;
    }
    
    this.impressionsTracked.add(trackKey);

    const payload = {
      publiciteId: publicite.id,
      trackingId: publicite.trackingId,
      pageSource: pageSource || window.location.pathname,
      deviceType: this.getDeviceType()
    };

    this.http.post(`${this.apiUrl}/track/impression`, payload).pipe(
      catchError(err => {
        console.warn('Erreur tracking impression:', err);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Tracker un clic
   */
  trackClic(publicite: PubliciteAffichage): void {
    const payload = {
      publiciteId: publicite.id,
      trackingId: publicite.trackingId
    };

    this.http.post(`${this.apiUrl}/track/clic`, payload).pipe(
      catchError(err => {
        console.warn('Erreur tracking clic:', err);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Handler de clic sur publicité
   */
  onPubliciteClick(publicite: PubliciteAffichage): void {
    this.trackClic(publicite);
    
    if (publicite.lienCible) {
      // Ouvrir dans un nouvel onglet
      window.open(publicite.lienCible, '_blank', 'noopener,noreferrer');
    }
  }

  // ============================================================
  // SPLASH SCREEN
  // ============================================================

  /**
   * Marquer le splash comme vu
   */
  dismissSplash(): void {
    this.splashDismissed = true;
    this.splashShown$.next(false);
    this.setSplashSeenToday();
  }

  /**
   * Observable pour savoir si le splash est affiché
   */
  get splashVisible$(): Observable<boolean> {
    return this.splashShown$.asObservable();
  }

  /**
   * Afficher le splash
   */
  showSplash(): void {
    if (!this.splashDismissed && !this.hasSeenSplashToday()) {
      this.splashShown$.next(true);
    }
  }

  private hasSeenSplashToday(): boolean {
    const lastSeen = localStorage.getItem('my20_splash_seen');
    if (!lastSeen) return false;
    
    const today = new Date().toDateString();
    return lastSeen === today;
  }

  private setSplashSeenToday(): void {
    localStorage.setItem('my20_splash_seen', new Date().toDateString());
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Obtenir la config d'un emplacement
   */
  getEmplacementConfig(emplacement: string): EmplacementConfig | null {
    return EMPLACEMENTS_CONFIG[emplacement] || null;
  }

  /**
   * Vérifier si on est sur mobile
   */
  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  /**
   * Obtenir le type de device
   */
  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Nettoyer le cache expiré
   */
  private cleanCache(): void {
    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    });
    
    // Limiter la taille du set d'impressions
    if (this.impressionsTracked.size > 1000) {
      this.impressionsTracked.clear();
    }
  }

  /**
   * Forcer le rafraîchissement du cache pour un emplacement
   */
  refreshCache(emplacement: string): void {
    this.cache.forEach((_, key) => {
      if (key.startsWith(emplacement)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Vider tout le cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}