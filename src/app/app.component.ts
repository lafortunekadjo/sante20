import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

// Services
import { SettingsService } from './core/services/settings.service';
import { AuthService } from './core/services/auth.service';
import { NotificationService, AppNotification } from './core/services/notification.service';
import { RxStompService } from './rx-stomp.service';
import { PushNotificationService } from './core/services/push-notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatSnackBarModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private rxStompService: RxStompService,
    private notificationService: NotificationService,
    private pushNotificationService: PushNotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('🚀 Application started');
    
    // Initialiser les listeners
    this.initAuthListener();
    this.initNotificationListener();
    this.initNavigationLogger();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.rxStompService.disconnect();
  }

  /**
   * Écouter les changements d'authentification pour initialiser WebSocket
   */
  private initAuthListener(): void {
    // Observer quand l'utilisateur est prêt
    this.authService.isUserReady$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isReady => {
        if (isReady) {
          const token = this.authService.getToken();
          if (token) {
            console.log('🔌 Initialisation WebSocket...');
            
            // Initialiser la connexion WebSocket
            this.rxStompService.connect(token);
            
            // Charger le badge initial des notifications
            this.notificationService.getBadge().subscribe({
              next: (badge) => {
                console.log('📬 Badge notifications chargé:', badge.unreadCount, 'non lues');
              },
              error: (err) => {
                console.warn('Erreur chargement badge:', err);
              }
            });
          }
        } else {
          // Utilisateur déconnecté -> Fermer WebSocket
          this.rxStompService.disconnect();
        }
      });
  }

  /**
   * Écouter les nouvelles notifications pour afficher un toast
   */
  private initNotificationListener(): void {
    this.notificationService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        this.showNotificationToast(notification);
      });
  }

  private async checkAndRequestPushPermission(): Promise<void> {
    try {
      // Si la permission n'est pas encore accordée ou bloquée, on force l'abonnement
      // Ta méthode 'subscribeToNotifications' appellera 'requestPermission()' nativement
      if (Notification.permission !== 'granted') {
        console.log('[PWA] Demande de permission push suite à la connexion ou l\'ouverture du raccourci...');
        await this.pushNotificationService.subscribeToNotifications();
      } else {
        console.log('[PWA] Permission déjà accordée. Le téléphone est prêt à recevoir des pushs.');
      }
    } catch (err) {
      console.error('[PWA] Échec de l\'activation automatique des notifications', err);
    }
  }

  /**
   * Afficher un toast pour une nouvelle notification
   */
  private showNotificationToast(notification: AppNotification): void {
    const snackBarRef = this.snackBar.open(
      notification.title,
      'Voir',
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['notification-toast', `toast-${notification.type.toLowerCase()}`]
      }
    );

    // Naviguer vers l'action quand l'utilisateur clique sur "Voir"
    snackBarRef.onAction().subscribe(() => {
      if (notification.actionUrl) {
        this.router.navigateByUrl(notification.actionUrl);
      } else {
        this.router.navigate(['/notifications']);
      }
    });
  }

  /**
   * Logger les navigations (debug)
   */
  private initNavigationLogger(): void {
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          console.log('==========================================');
          console.log('🔄 NAVIGATION START:', event.url);
          console.log('Navigation ID:', event.id);
          console.log('Trigger:', event.navigationTrigger);
          console.log('==========================================');
        } 
        else if (event instanceof NavigationEnd) {
          console.log('✅ NAVIGATION END:', event.url);
        } 
        else if (event instanceof NavigationCancel) {
          console.log('⚠️ NAVIGATION CANCELLED:', event.url);
          console.log('Reason:', event.reason);
        } 
        else if (event instanceof NavigationError) {
          console.error('❌ NAVIGATION ERROR:', event.url);
          console.error('Error:', event.error);
        }
      });
  }
}