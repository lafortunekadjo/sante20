// ============================================================
// NOTIFICATION BELL COMPONENT
// Fichier: src/app/shared/components/notification-bell/notification-bell.component.ts
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { AppNotification, NotificationService } from '../../../../core/services/notification.service';



@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatRippleModule
  ],
  animations: [
    trigger('bellShake', [
      transition('* => shake', [
        animate('600ms', keyframes([
          style({ transform: 'rotate(0)', offset: 0 }),
          style({ transform: 'rotate(-20deg)', offset: 0.1 }),
          style({ transform: 'rotate(20deg)', offset: 0.2 }),
          style({ transform: 'rotate(-15deg)', offset: 0.3 }),
          style({ transform: 'rotate(15deg)', offset: 0.4 }),
          style({ transform: 'rotate(-10deg)', offset: 0.5 }),
          style({ transform: 'rotate(10deg)', offset: 0.6 }),
          style({ transform: 'rotate(0)', offset: 1 })
        ]))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ],
  template: `
    <!-- Bouton cloche -->
    <button mat-icon-button
            [matMenuTriggerFor]="notificationMenu"
            [matBadge]="unreadCount > 0 ? formatBadge(unreadCount) : null"
            matBadgeColor="warn"
            matBadgeSize="small"
            class="notification-bell"
            [class.has-unread]="unreadCount > 0"
            [@bellShake]="bellState"
            (@bellShake.done)="bellState = 'idle'"
            matTooltip="Notifications">
      <mat-icon>{{ unreadCount > 0 ? 'notifications_active' : 'notifications' }}</mat-icon>
    </button>

    <!-- Menu déroulant -->
    <mat-menu #notificationMenu="matMenu" class="notification-menu" xPosition="before">
      <!-- Header -->
      <div class="menu-header" (click)="$event.stopPropagation()">
        <h3>Notifications</h3>
        <button mat-button 
                *ngIf="unreadCount > 0" 
                (click)="markAllAsRead()"
                class="mark-all-btn">
          Tout marquer comme lu
        </button>
      </div>

      <mat-divider></mat-divider>

      <!-- Loading -->
      <div class="menu-loading" *ngIf="isLoading">
        <mat-spinner diameter="30"></mat-spinner>
      </div>

      <!-- Liste des notifications -->
      <div class="notifications-list" *ngIf="!isLoading">
        <ng-container *ngIf="recentNotifications.length > 0; else emptyState">
          <div class="notification-item"
               *ngFor="let notification of recentNotifications"
               [class.unread]="!notification.isRead"
               matRipple
               (click)="onNotificationClick(notification)"
               [@slideIn]>
            
            <div class="notification-icon" [style.background-color]="getTypeColor(notification.type)">
              <mat-icon>{{ notification.icon || getCategoryIcon(notification.category) }}</mat-icon>
            </div>
            
            <div class="notification-content">
              <p class="notification-title">{{ notification.title }}</p>
              <p class="notification-message">{{ notification.message | slice:0:80 }}{{ notification.message.length > 80 ? '...' : '' }}</p>
              <span class="notification-time">{{ notification.timeAgo }}</span>
            </div>

            <div class="notification-actions" (click)="$event.stopPropagation()">
              <button mat-icon-button 
                      *ngIf="!notification.isRead"
                      (click)="markAsRead(notification)"
                      matTooltip="Marquer comme lu">
                <mat-icon>check</mat-icon>
              </button>
            </div>
          </div>
        </ng-container>

        <!-- État vide -->
        <ng-template #emptyState>
          <div class="empty-state">
            <mat-icon>notifications_none</mat-icon>
            <p>Aucune notification</p>
          </div>
        </ng-template>
      </div>

      <mat-divider *ngIf="recentNotifications.length > 0"></mat-divider>

      <!-- Footer -->
      <div class="menu-footer" *ngIf="recentNotifications.length > 0">
        <button mat-button routerLink="/notifications" class="view-all-btn">
          <mat-icon>open_in_new</mat-icon>
          Voir toutes les notifications
        </button>
      </div>
    </mat-menu>
  `,
  styles: [`
    .notification-bell {
      position: relative;
      
      &.has-unread {
        mat-icon {
          color: #f59e0b;
        }
      }
    }

    ::ng-deep .notification-menu {
      width: 380px;
      max-width: 95vw;
      
      .mat-mdc-menu-content {
        padding: 0;
      }
    }

    .menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      
      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
      }
      
      .mark-all-btn {
        font-size: 0.75rem;
        color: #3b82f6;
      }
    }

    .menu-loading {
      display: flex;
      justify-content: center;
      padding: 32px;
    }

    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.2s;
      
      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }
      
      &.unread {
        background: rgba(59, 130, 246, 0.05);
        border-left: 3px solid #3b82f6;
      }
      
      .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        mat-icon {
          color: white;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
      
      .notification-content {
        flex: 1;
        min-width: 0;
        
        .notification-title {
          margin: 0 0 4px;
          font-weight: 600;
          font-size: 0.875rem;
          color: #1e293b;
        }
        
        .notification-message {
          margin: 0 0 4px;
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.4;
        }
        
        .notification-time {
          font-size: 0.7rem;
          color: #94a3b8;
        }
      }
      
      .notification-actions {
        button {
          width: 28px;
          height: 28px;
          line-height: 28px;
          
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      color: #94a3b8;
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }
      
      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }

    .menu-footer {
      padding: 8px;
      
      .view-all-btn {
        width: 100%;
        justify-content: center;
        color: #3b82f6;
        
        mat-icon {
          margin-right: 8px;
          font-size: 18px;
        }
      }
    }

    // Dark theme
    :host-context(.dark-theme) {
      .notification-item {
        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        &.unread {
          background: rgba(59, 130, 246, 0.1);
        }
        
        .notification-content {
          .notification-title {
            color: #f1f5f9;
          }
          
          .notification-message {
            color: #94a3b8;
          }
        }
      }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  unreadCount = 0;
  recentNotifications: AppNotification[] = [];
  isLoading = false;
  bellState: 'idle' | 'shake' = 'idle';

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner au compteur de non lues
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count: number) => {
        this.unreadCount = count;
      });

    // S'abonner aux nouvelles notifications (pour animation)
    this.notificationService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification: any) => {
        this.recentNotifications = [notification, ...this.recentNotifications.slice(0, 4)];
        this.bellState = 'shake';
        this.playNotificationSound();
      });

    // Charger le badge initial
    this.loadBadge();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBadge(): void {
    this.isLoading = true;
    this.notificationService.getBadge()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (badge: { recentNotifications: AppNotification[]; }) => {
          this.recentNotifications = badge.recentNotifications;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  formatBadge(count: number): string {
    return count > 99 ? '99+' : count.toString();
  }

  onNotificationClick(notification: AppNotification): void {
    // Marquer comme lue
    if (!notification.isRead) {
      this.markAsRead(notification);
    }

    // Naviguer vers l'action
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  markAsRead(notification: AppNotification): void {
    this.notificationService.markAsRead(notification.id).subscribe(() => {
      notification.isRead = true;
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.recentNotifications.forEach(n => n.isRead = true);
    });
  }

  getCategoryIcon(category: string): string {
    return this.notificationService.getCategoryIcon(category);
  }

  getTypeColor(type: string): string {
    return this.notificationService.getTypeColor(type);
  }

  private playNotificationSound(): void {
    // Optionnel: jouer un son
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Ignorer si le son n'est pas disponible
    }
  }
}