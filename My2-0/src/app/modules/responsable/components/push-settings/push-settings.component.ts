// ============================================================
// PUSH SETTINGS COMPONENT - Angular
// Fichier: src/app/shared/components/push-settings/push-settings.component.ts
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PushNotificationService } from '../../../../core/services/push-notification.service';



@Component({
  selector: 'app-push-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card class="push-settings-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>notifications_active</mat-icon>
        <mat-card-title>Notifications Push</mat-card-title>
        <mat-card-subtitle>
          Recevez des alertes même quand l'application est fermée
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- État non supporté -->
        <div *ngIf="!isSupported" class="status-message warning">
          <mat-icon>warning</mat-icon>
          <span>Les notifications push ne sont pas supportées sur ce navigateur.</span>
        </div>

        <!-- État refusé -->
        <div *ngIf="isSupported && isDenied" class="status-message error">
          <mat-icon>block</mat-icon>
          <div>
            <span>Les notifications sont bloquées.</span>
            <p class="hint">Modifiez les paramètres de votre navigateur pour les autoriser.</p>
          </div>
        </div>

        <!-- État normal -->
        <div *ngIf="isSupported && !isDenied" class="toggle-container">
          <mat-slide-toggle
            [checked]="isSubscribed"
            [disabled]="isLoading"
            (change)="togglePushNotifications($event.checked)"
            color="primary">
            <span class="toggle-label">
              {{ isSubscribed ? 'Notifications activées' : 'Activer les notifications' }}
            </span>
          </mat-slide-toggle>

          <p class="description" *ngIf="!isSubscribed">
            Activez les notifications pour être informé des matchs, cotisations et événements importants.
          </p>

          <p class="description success" *ngIf="isSubscribed">
            <mat-icon>check_circle</mat-icon>
            Vous recevrez des notifications même quand l'application est fermée.
          </p>
        </div>
      </mat-card-content>

      <mat-card-actions *ngIf="isSubscribed">
        <button mat-button color="primary" (click)="sendTestNotification()" [disabled]="isLoading">
          <mat-icon>science</mat-icon>
          Tester
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .push-settings-card {
      max-width: 500px;
      margin: 16px auto;

      mat-card-header {
        mat-icon[mat-card-avatar] {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: var(--primary-color);
        }
      }
    }

    .status-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;

      &.warning {
        background-color: #fff3e0;
        color: #e65100;

        mat-icon {
          color: #ff9800;
        }
      }

      &.error {
        background-color: #ffebee;
        color: #c62828;

        mat-icon {
          color: #f44336;
        }
      }

      .hint {
        font-size: 0.85rem;
        margin-top: 4px;
        opacity: 0.8;
      }
    }

    .toggle-container {
      padding: 16px 0;

      .toggle-label {
        font-weight: 500;
        margin-left: 8px;
      }

      .description {
        margin-top: 12px;
        color: #666;
        font-size: 0.9rem;

        &.success {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #2e7d32;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }
    }

    mat-card-actions {
      padding: 8px 16px;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class PushSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isSupported = false;
  isSubscribed = false;
  isDenied = false;
  isLoading = false;

  constructor(
    private pushService: PushNotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isSupported = this.pushService.isPushSupported();
    this.isDenied = this.pushService.isNotificationDenied();

    this.pushService.isSubscribed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(subscribed => {
        this.isSubscribed = subscribed;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async togglePushNotifications(enable: boolean): Promise<void> {
    this.isLoading = true;

    try {
      if (enable) {
        const success = await this.pushService.subscribeToPush();
        
        if (success) {
          this.snackBar.open('Notifications push activées ! 🔔', 'OK', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
        } else {
          this.snackBar.open('Impossible d\'activer les notifications', 'OK', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
          // Vérifier si refusé
          this.isDenied = this.pushService.isNotificationDenied();
        }
      } else {
        await this.pushService.unsubscribeFromPush();
        this.snackBar.open('Notifications push désactivées', 'OK', {
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Erreur toggle push:', error);
      this.snackBar.open('Une erreur est survenue', 'OK', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    } finally {
      this.isLoading = false;
    }
  }

  async sendTestNotification(): Promise<void> {
    await this.pushService.sendTestNotification();
    this.snackBar.open('Notification de test envoyée !', 'OK', {
      duration: 2000
    });
  }
}