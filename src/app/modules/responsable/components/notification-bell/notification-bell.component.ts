// notification-bell.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

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

import {
  AppNotification,
  NotificationService,
} from '../../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    TranslateModule
  ],
  animations: [
    trigger('bellShake', [
      transition('* => shake', [
        animate(
          '600ms',
          keyframes([
            style({ transform: 'rotate(0)',     offset: 0   }),
            style({ transform: 'rotate(-20deg)',offset: 0.1 }),
            style({ transform: 'rotate(20deg)', offset: 0.2 }),
            style({ transform: 'rotate(-15deg)',offset: 0.3 }),
            style({ transform: 'rotate(15deg)', offset: 0.4 }),
            style({ transform: 'rotate(-10deg)',offset: 0.5 }),
            style({ transform: 'rotate(10deg)', offset: 0.6 }),
            style({ transform: 'rotate(0)',     offset: 1   }),
          ])
        ),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
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
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count: number) => (this.unreadCount = count));

    this.notificationService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification: any) => {
        this.recentNotifications = [
          notification,
          ...this.recentNotifications.slice(0, 4),
        ];
        this.bellState = 'shake';
        this.playNotificationSound();
      });

    this.loadBadge();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBadge(): void {
    this.isLoading = true;
    this.notificationService
      .getBadge()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (badge: { recentNotifications: AppNotification[] }) => {
          this.recentNotifications = badge.recentNotifications;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  formatBadge(count: number): string {
    return count > 99 ? '99+' : count.toString();
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.isRead) {
      this.markAsRead(notification);
    }
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
      this.recentNotifications.forEach((n) => (n.isRead = true));
    });
  }

  getCategoryIcon(category: string): string {
    return this.notificationService.getCategoryIcon(category);
  }

  getTypeColor(type: string): string {
    return this.notificationService.getTypeColor(type);
  }

  private playNotificationSound(): void {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {
      // Son non disponible — ignoré silencieusement
    }
  }
}