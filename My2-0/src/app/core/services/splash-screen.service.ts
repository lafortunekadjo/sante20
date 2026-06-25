// ============================================================
// SPLASH SCREEN SERVICE - Gestion des publicités splash
// Chemin: src/app/core/services/splash-screen.service.ts
// Compatible avec le LayoutComponent existant de My2-0
// ============================================================

import { Injectable, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, Subscription, interval, filter } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PubliciteAffichageService } from './publicite-affichage.service';
import { AuthService } from './auth.service';
import { PubliciteSplashComponent } from '../../modules/publicite/publicite-splash/publicite-splash.component';

// ============================================================
// CONFIGURATION
// ============================================================

const STORAGE_KEYS = {
  LAST_LOGIN_SPLASH: 'my20_splash_login_date',
  SESSION_SPLASH_COUNT: 'my20_splash_session_count',
  SESSION_START: 'my20_session_start',
  PAGES_VISITED: 'my20_pages_visited'
};

const CONFIG = {
  loginSplash: {
    enabled: true,
    delayMs: 1500,           // Délai avant affichage (1.5s)
    frequencyHours: 24       // Une fois toutes les 24h
  },
  usageSplash: {
    enabled: true,
    triggerAfterMinutes: 10, // Après 10 min d'utilisation
    minPagesVisited: 5,      // Minimum 5 pages visitées
    maxPerSession: 1         // Max 1 fois par session
  },
  gracePeriodDays: 3         // Nouveaux membres: pas de pub pendant 3 jours
};

@Injectable({
  providedIn: 'root'
})
export class SplashScreenService implements OnDestroy {

  private destroy$ = new Subject<void>();
  private usageTimerSubscription?: Subscription;
  private navigationSubscription?: Subscription;
  private dialogRef: MatDialogRef<PubliciteSplashComponent> | null = null;
  
  private sessionStartTime: number = 0;
  private pagesVisited: number = 0;
  private usageSplashShownThisSession: boolean = false;
  private currentUserVille?: string;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private publiciteService: PubliciteAffichageService,
    private authService: AuthService
  ) {
    this.initSession();
    this.setupNavigationTracking();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cancelUsageTimer();
    this.navigationSubscription?.unsubscribe();
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  private initSession(): void {
    const existingStart = sessionStorage.getItem(STORAGE_KEYS.SESSION_START);
    
    if (!existingStart) {
      // Nouvelle session
      this.sessionStartTime = Date.now();
      sessionStorage.setItem(STORAGE_KEYS.SESSION_START, this.sessionStartTime.toString());
      sessionStorage.setItem(STORAGE_KEYS.SESSION_SPLASH_COUNT, '0');
      sessionStorage.setItem(STORAGE_KEYS.PAGES_VISITED, '0');
    } else {
      // Session existante - récupérer les valeurs
      this.sessionStartTime = parseInt(existingStart, 10);
      this.pagesVisited = parseInt(sessionStorage.getItem(STORAGE_KEYS.PAGES_VISITED) || '0', 10);
      this.usageSplashShownThisSession = parseInt(
        sessionStorage.getItem(STORAGE_KEYS.SESSION_SPLASH_COUNT) || '0', 10
      ) >= CONFIG.usageSplash.maxPerSession;
    }
  }

  /**
   * Track automatique des navigations
   */
  private setupNavigationTracking(): void {
    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.trackPageVisit();
    });
  }

  // ============================================================
  // SPLASH À LA CONNEXION (1x par jour)
  // Appelé depuis LayoutComponent.setupPublicites()
  // ============================================================

  /**
   * Vérifie et affiche le splash de connexion si nécessaire
   * @param userVille - Ville de l'utilisateur pour ciblage géo
   */
  checkAndShowLoginSplash(userVille?: string): void {
    this.currentUserVille = userVille;

    if (!CONFIG.loginSplash.enabled) {
      console.log('[SplashService] Login splash désactivé');
      return;
    }

    if (this.shouldSkipAds()) {
      console.log('[SplashService] Utilisateur exempté de pubs (admin/partenaire/nouveau)');
      return;
    }

    if (!this.shouldShowLoginSplash()) {
      console.log('[SplashService] Login splash déjà affiché dans les dernières 24h');
      return;
    }

    // Afficher après un délai pour laisser la page charger
    setTimeout(() => {
      this.showSplash('login', userVille);
    }, CONFIG.loginSplash.delayMs);
  }

  private shouldShowLoginSplash(): boolean {
    const lastShown = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_SPLASH);
    
    if (!lastShown) {
      return true;
    }

    const lastDate = new Date(lastShown);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

    return hoursDiff >= CONFIG.loginSplash.frequencyHours;
  }

  // ============================================================
  // SPLASH APRÈS UTILISATION (après X minutes + Y pages)
  // Appelé depuis LayoutComponent.setupPublicites()
  // ============================================================

  /**
   * Démarre le timer pour le splash après utilisation prolongée
   * @param minutes - Nombre de minutes avant déclenchement (défaut: 10)
   * @param userVille - Ville de l'utilisateur pour ciblage géo
   */
  startUsageTimer(minutes: number = 10, userVille?: string): void {
    this.currentUserVille = userVille;

    if (!CONFIG.usageSplash.enabled) {
      console.log('[SplashService] Usage splash désactivé');
      return;
    }

    if (this.shouldSkipAds()) {
      console.log('[SplashService] Utilisateur exempté de pubs');
      return;
    }

    if (this.usageSplashShownThisSession) {
      console.log('[SplashService] Usage splash déjà affiché cette session');
      return;
    }

    // Annuler tout timer existant
    this.cancelUsageTimer();

    console.log(`[SplashService] Timer usage démarré: vérification toutes les 30s`);

    // Vérifier toutes les 30 secondes
    this.usageTimerSubscription = interval(30000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.checkUsageSplashConditions();
    });
  }

  /**
   * Annule le timer d'utilisation
   */
  cancelUsageTimer(): void {
    if (this.usageTimerSubscription) {
      this.usageTimerSubscription.unsubscribe();
      this.usageTimerSubscription = undefined;
    }
  }

  private checkUsageSplashConditions(): void {
    if (this.usageSplashShownThisSession) {
      this.cancelUsageTimer();
      return;
    }

    if (this.dialogRef) {
      return; // Dialog déjà ouvert
    }

    // Vérifier le temps écoulé
    const minutesElapsed = (Date.now() - this.sessionStartTime) / (1000 * 60);
    
    if (minutesElapsed < CONFIG.usageSplash.triggerAfterMinutes) {
      return;
    }

    // Vérifier le nombre de pages visitées
    if (this.pagesVisited < CONFIG.usageSplash.minPagesVisited) {
      return;
    }

    // Toutes les conditions sont remplies !
    console.log(`[SplashService] Conditions remplies: ${minutesElapsed.toFixed(1)} min, ${this.pagesVisited} pages`);
    this.showSplash('usage', this.currentUserVille);
  }

  /**
   * Incrémente le compteur de pages visitées
   */
  private trackPageVisit(): void {
    this.pagesVisited++;
    sessionStorage.setItem(STORAGE_KEYS.PAGES_VISITED, this.pagesVisited.toString());
  }

  // ============================================================
  // AFFICHAGE DU SPLASH
  // ============================================================

  private showSplash(source: 'login' | 'usage', userVille?: string): void {
    if (this.dialogRef) {
      console.log('[SplashService] Splash déjà ouvert');
      return;
    }

    // Charger une publicité splash
    this.publiciteService.getPublicites('SPLASH_SCREEN', userVille).subscribe({
      next: (publicites) => {
        if (publicites && publicites.length > 0) {
          console.log('[SplashService] Ouverture splash publicitaire...');
          
          this.dialogRef = this.dialog.open(PubliciteSplashComponent, {
            data: {
              publicite: publicites[0],
              source: source
            },
            disableClose: true,
            panelClass: ['splash-dialog', 'splash-fullscreen'],
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: '100vw',
            height: '100vh',
            hasBackdrop: true,
            backdropClass: 'splash-backdrop'
          });

          this.dialogRef.afterClosed().subscribe(() => {
            this.dialogRef = null;
            
            // Marquer comme affiché
            if (source === 'login') {
              localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_SPLASH, new Date().toISOString());
              console.log('[SplashService] Login splash marqué comme affiché');
            } else {
              this.usageSplashShownThisSession = true;
              const currentCount = parseInt(
                sessionStorage.getItem(STORAGE_KEYS.SESSION_SPLASH_COUNT) || '0', 10
              );
              sessionStorage.setItem(STORAGE_KEYS.SESSION_SPLASH_COUNT, (currentCount + 1).toString());
              this.cancelUsageTimer();
              console.log('[SplashService] Usage splash marqué comme affiché');
            }
          });
        } else {
          console.log('[SplashService] Aucune publicité splash disponible');
        }
      },
      error: (err) => {
        console.error('[SplashService] Erreur chargement publicité:', err);
      }
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Vérifie si l'utilisateur doit être exempté de publicités
   */
  private shouldSkipAds(): boolean {
    // Admin ne voit pas les pubs
    // if (this.authService.isAdmin()) {
    //   return true;
    // }

    // Partenaire ne voit pas les pubs
    if (this.authService.isPartenaire()) {
      return true;
    }

    // Nouveau membre (période de grâce de 3 jours)
    const user = this.authService.getUser();
    if (user?.createdAt) {
      const daysSinceCreation = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < CONFIG.gracePeriodDays) {
        return true;
      }
    }

    return false;
  }

  // /**
  //  * Force l'affichage d'un splash (pour tests)
  //  */
  // forceSplash(userVille?: string): void {
  //   this.showSplash('login', userVille);
  // }

  /**
   * Reset tous les compteurs (pour tests/debug)
   */
  resetAllCounters(): void {
    localStorage.removeItem(STORAGE_KEYS.LAST_LOGIN_SPLASH);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_SPLASH_COUNT);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_START);
    sessionStorage.removeItem(STORAGE_KEYS.PAGES_VISITED);
    
    this.usageSplashShownThisSession = false;
    this.pagesVisited = 0;
    this.initSession();
    
    console.log('[SplashService] Tous les compteurs réinitialisés');
  }

  /**
   * Retourne les stats actuelles (pour debug)
   */
  getDebugStats(): object {
    return {
      sessionStart: new Date(this.sessionStartTime).toLocaleString(),
      minutesElapsed: ((Date.now() - this.sessionStartTime) / (1000 * 60)).toFixed(1),
      pagesVisited: this.pagesVisited,
      usageSplashShown: this.usageSplashShownThisSession,
      lastLoginSplash: localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_SPLASH),
      config: CONFIG
    };
  }
}