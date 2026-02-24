// ============================================================
// MY2-0 - SERVICE DE GESTION DES SPLASH SCREENS
// Logique: À la connexion + Après utilisation prolongée
// ============================================================

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { PubliciteSplashComponent } from '../../modules/publicite/publicite-splash/publicite-splash.component';
import { AuthService } from './auth.service';
import { PubliciteAffichageService } from './publicite-affichage.service';


// ============================================================
// CONFIGURATION
// ============================================================

interface SplashConfig {
  // Splash à la connexion
  onLogin: {
    enabled: boolean;
    delayMs: number;           // Délai avant affichage (1500ms)
    frequencyHours: number;    // Une fois toutes les X heures (24h)
  };
  
  // Splash après utilisation prolongée
  onUsage: {
    enabled: boolean;
    triggerAfterMinutes: number;  // Après X minutes d'utilisation
    minPagesVisited: number;      // Minimum de pages visitées
    frequencyPerSession: number;  // Max fois par session (1)
  };
}

const DEFAULT_CONFIG: SplashConfig = {
  onLogin: {
    enabled: true,
    delayMs: 1500,
    frequencyHours: 24
  },
  onUsage: {
    enabled: true,
    triggerAfterMinutes: 10,
    minPagesVisited: 5,
    frequencyPerSession: 1
  }
};

// Clés localStorage
const STORAGE_KEYS = {
  LAST_LOGIN_SPLASH: 'my20_splash_login_date',
  SESSION_SPLASH_COUNT: 'my20_splash_session_count',
  SESSION_START: 'my20_session_start',
  PAGES_VISITED: 'my20_pages_visited_count'
};

// ============================================================
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class SplashScreenService implements OnDestroy {

  private config: SplashConfig = DEFAULT_CONFIG;
  private usageCheckSubscription?: Subscription;
  private isDialogOpen = false;
  
  // Observable pour suivre l'état
  private splashShown$ = new BehaviorSubject<boolean>(false);

  constructor(
    private dialog: MatDialog,
    private publiciteService: PubliciteAffichageService,
    private authService: AuthService
  ) {
    this.initSession();
  }

  ngOnDestroy(): void {
    this.stopUsageTracking();
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  /**
   * Initialise une nouvelle session
   */
  private initSession(): void {
    // Marquer le début de session
    const sessionStart = sessionStorage.getItem(STORAGE_KEYS.SESSION_START);
    if (!sessionStart) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_START, Date.now().toString());
      sessionStorage.setItem(STORAGE_KEYS.SESSION_SPLASH_COUNT, '0');
      sessionStorage.setItem(STORAGE_KEYS.PAGES_VISITED, '0');
    }
  }

  /**
   * Appelé au login réussi
   */
  onUserLogin(): void {
    if (!this.config.onLogin.enabled) return;
    if (this.shouldSkipAds()) return;

    // Vérifier si on doit afficher le splash de connexion
    if (this.shouldShowLoginSplash()) {
      setTimeout(() => {
        this.showSplash('login');
      }, this.config.onLogin.delayMs);
    }

    // Démarrer le tracking d'utilisation
    this.startUsageTracking();
  }

  /**
   * Appelé à chaque navigation
   */
  onPageVisit(): void {
    const currentCount = parseInt(sessionStorage.getItem(STORAGE_KEYS.PAGES_VISITED) || '0', 10);
    sessionStorage.setItem(STORAGE_KEYS.PAGES_VISITED, (currentCount + 1).toString());
  }

  // ============================================================
  // SPLASH À LA CONNEXION
  // ============================================================

  /**
   * Vérifie si on doit afficher le splash de connexion
   */
  private shouldShowLoginSplash(): boolean {
    const lastShown = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_SPLASH);
    
    if (!lastShown) {
      return true;
    }

    const lastDate = new Date(lastShown);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

    return hoursDiff >= this.config.onLogin.frequencyHours;
  }

  /**
   * Marque le splash de connexion comme affiché
   */
  private markLoginSplashShown(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_SPLASH, new Date().toISOString());
  }

  // ============================================================
  // SPLASH APRÈS UTILISATION
  // ============================================================

  /**
   * Démarre le tracking d'utilisation
   */
  private startUsageTracking(): void {
    if (!this.config.onUsage.enabled) return;
    if (this.usageCheckSubscription) return;

    // Vérifier toutes les 30 secondes
    this.usageCheckSubscription = interval(30000).subscribe(() => {
      this.checkUsageSplash();
    });
  }

  /**
   * Arrête le tracking
   */
  private stopUsageTracking(): void {
    if (this.usageCheckSubscription) {
      this.usageCheckSubscription.unsubscribe();
      this.usageCheckSubscription = undefined;
    }
  }

  /**
   * Vérifie si on doit afficher le splash d'utilisation
   */
  private checkUsageSplash(): void {
    if (this.isDialogOpen) return;
    if (this.shouldSkipAds()) return;

    // Vérifier le nombre de splash déjà affichés cette session
    const sessionCount = parseInt(sessionStorage.getItem(STORAGE_KEYS.SESSION_SPLASH_COUNT) || '0', 10);
    if (sessionCount >= this.config.onUsage.frequencyPerSession) {
      this.stopUsageTracking();
      return;
    }

    // Vérifier le temps d'utilisation
    const sessionStart = parseInt(sessionStorage.getItem(STORAGE_KEYS.SESSION_START) || '0', 10);
    const minutesElapsed = (Date.now() - sessionStart) / (1000 * 60);
    
    if (minutesElapsed < this.config.onUsage.triggerAfterMinutes) {
      return;
    }

    // Vérifier le nombre de pages visitées
    const pagesVisited = parseInt(sessionStorage.getItem(STORAGE_KEYS.PAGES_VISITED) || '0', 10);
    if (pagesVisited < this.config.onUsage.minPagesVisited) {
      return;
    }

    // Toutes les conditions sont remplies !
    this.showSplash('usage');
  }

  /**
   * Marque le splash d'utilisation comme affiché
   */
  private markUsageSplashShown(): void {
    const currentCount = parseInt(sessionStorage.getItem(STORAGE_KEYS.SESSION_SPLASH_COUNT) || '0', 10);
    sessionStorage.setItem(STORAGE_KEYS.SESSION_SPLASH_COUNT, (currentCount + 1).toString());
  }

  // ============================================================
  // AFFICHAGE DU SPLASH
  // ============================================================

  /**
   * Affiche le splash screen publicitaire
   */
  private showSplash(source: 'login' | 'usage'): void {
    if (this.isDialogOpen) return;

    // Récupérer la ville de l'utilisateur pour le ciblage
    const userVille = this.getUserVille();

    // Charger une publicité
    this.publiciteService.getPublicites('SPLASH_SCREEN', userVille).subscribe({
      next: (publicites) => {
        if (publicites && publicites.length > 0) {
          this.isDialogOpen = true;

          const dialogRef = this.dialog.open(PubliciteSplashComponent, {
            data: { 
              publicite: publicites[0],
              source: source
            },
            disableClose: true,
            panelClass: 'splash-dialog',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: '100%',
            height: '100%'
          });

          dialogRef.afterClosed().subscribe(() => {
            this.isDialogOpen = false;
            this.splashShown$.next(true);

            // Marquer comme affiché
            if (source === 'login') {
              this.markLoginSplashShown();
            } else {
              this.markUsageSplashShown();
            }
          });
        }
      },
      error: (err) => {
        console.error('Erreur chargement splash:', err);
      }
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Vérifie si on doit sauter les pubs (admin, partenaire, nouveau membre)
   */
  private shouldSkipAds(): boolean {
    // Admin et partenaires ne voient pas les pubs
    if (this.authService.isAdmin() || this.authService.isPartenaire()) {
      return true;
    }

    // Période de grâce pour les nouveaux membres (3 jours)
    const user = this.authService.getUser();
    if (user?.createdAt) {
      const daysSinceCreation = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 3) {
        return true;
      }
    }

    return false;
  }

  /**
   * Récupère la ville de l'utilisateur pour le ciblage géo
   */
  private getUserVille(): string | undefined {
    const user = this.authService.getUser();
    return user?.ville || user?.groupe?.ville;
  }

  /**
   * Permet de forcer l'affichage d'un splash (pour tests)
   */
  forceSplash(): void {
    this.showSplash('login');
  }

  /**
   * Reset tous les compteurs (pour tests)
   */
  resetCounters(): void {
    localStorage.removeItem(STORAGE_KEYS.LAST_LOGIN_SPLASH);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_SPLASH_COUNT);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_START);
    sessionStorage.removeItem(STORAGE_KEYS.PAGES_VISITED);
    this.initSession();
  }
}