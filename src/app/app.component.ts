import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

// Services
import { AuthService }            from './core/services/auth.service';
import { NotificationService, AppNotification } from './core/services/notification.service';
import { RxStompService }         from './rx-stomp.service';
import { PushNotificationService } from './core/services/push-notification.service';
import { BackButtonService }      from './core/services/back-button.service';

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
    private router:                  Router,
    private authService:             AuthService,
    private rxStompService:          RxStompService,
    private notificationService:     NotificationService,
    private snackBar:                MatSnackBar,
    private pushNotificationService: PushNotificationService,
    private backButtonService:       BackButtonService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Application démarrée');

    this.initCapacitor();
    this.initAuthListener();
    this.initNotificationListener();
    this.initNavigationLogger();
    this.backButtonService.init();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.rxStompService.disconnect();
  }

  // ── Capacitor (StatusBar + Keyboard) ─────────────────────
  private initCapacitor(): void {
    if (!Capacitor.isNativePlatform()) return;

    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: '#0f172a' });

    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });
  }

  // ── Auth listener ─────────────────────────────────────────
  // WebSocket + Push FCM initialisés ici au niveau app
  // (en complément du layout qui appelle pushService.init() au login)
  private initAuthListener(): void {
    this.authService.isUserReady$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isReady => {
        if (isReady && this.authService.isLoggedIn()) {
          const token = this.authService.getToken();

          if (token) {
            // WebSocket
            console.log('🔌 Initialisation WebSocket...');
            this.rxStompService.connect(token);

            // Badge notifications initial
            this.notificationService.getBadge().subscribe({
              next:  (badge) => console.log('📬 Badge:', badge.unreadCount, 'non lues'),
              error: (err)   => console.warn('Erreur badge:', err)
            });

            // Push FCM Android — init si pas déjà fait par le layout
            // (cas de rechargement de page sans repasser par login)
            this.pushNotificationService.init();
          }

        } else if (isReady && !this.authService.isLoggedIn()) {
          // Déconnexion → fermer WebSocket
          this.rxStompService.disconnect();
          // Le token FCM est supprimé par layout.logout()
        }
      });
  }

  // ── Notification toast ────────────────────────────────────
  private initNotificationListener(): void {
    this.notificationService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        this.showNotificationToast(notification);
      });
  }

  private showNotificationToast(notification: AppNotification): void {
    const ref = this.snackBar.open(
      notification.title,
      'Voir',
      {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['notification-toast', `toast-${notification.type?.toLowerCase() ?? 'info'}`]
      }
    );

    ref.onAction().subscribe(() => {
      if (notification.actionUrl) {
        this.router.navigateByUrl(notification.actionUrl);
      } else {
        this.router.navigate(['/notifications']);
      }
    });
  }

  // ── Navigation logger (debug) ─────────────────────────────
  private initNavigationLogger(): void {
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          console.log('🔄 NAV START:', event.url);
        } else if (event instanceof NavigationEnd) {
          console.log('✅ NAV END:', event.url);
        } else if (event instanceof NavigationCancel) {
          console.warn('⚠️ NAV CANCELLED:', event.url, '—', event.reason);
        } else if (event instanceof NavigationError) {
          console.error('❌ NAV ERROR:', event.url, event.error);
        }
      });
  }
}