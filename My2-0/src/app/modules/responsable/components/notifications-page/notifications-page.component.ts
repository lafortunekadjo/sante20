// ============================================================
// NOTIFICATIONS PAGE COMPONENT
// Fichier: src/app/features/notifications/notifications-page.component.ts
// ============================================================

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

import { 
  NotificationService, 
  AppNotification, 
  NotificationListResponse,
  NotificationSettings,
  NotificationPreference 
} from '../../../../core/services/notification.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatRippleModule,
    MatCardModule
  ],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss'
})
export class NotificationsPageComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // États
  isLoading = true;
  activeTab = 0; // 0 = Notifications, 1 = Paramètres

  // Notifications
  notifications: AppNotification[] = [];
  totalElements = 0;
  pageSize = 20;
  currentPage = 0;
  unreadCount = 0;

  // Filtre
  selectedCategory = 'ALL';
  categories = [
    { value: 'ALL', label: 'Toutes' },
    { value: 'MATCH', label: 'Matchs', icon: 'sports_soccer' },
    { value: 'GROUPE', label: 'Groupe', icon: 'groups' },
    { value: 'COTISATION', label: 'Cotisations', icon: 'payment' },
    { value: 'SANCTION', label: 'Sanctions', icon: 'gavel' },
    { value: 'SYSTEM', label: 'Système', icon: 'settings' }
  ];

  // Sélection
  selectedNotifications: Set<number> = new Set();
  selectAll = false;

  // Paramètres
  settings: NotificationSettings | null = null;
  isSettingsLoading = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    
    // S'abonner au compteur
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.unreadCount = count);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  loadNotifications(): void {
    this.isLoading = true;
    
    // Filtrer par catégorie principale
    let categoryFilter = this.selectedCategory;
    if (categoryFilter !== 'ALL' && !categoryFilter.includes('_')) {
      // Si c'est une catégorie principale (MATCH, GROUPE, etc.), on filtre par préfixe
      categoryFilter = undefined as any; // Le backend gère le filtrage
    }

    this.notificationService.getNotifications(this.currentPage, this.pageSize, categoryFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notifications = response.notifications;
          this.totalElements = response.totalElements;
          this.unreadCount = response.unreadCount;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.showSnackbar('Erreur lors du chargement', 'error');
        }
      });
  }

  loadSettings(): void {
    this.isSettingsLoading = true;
    this.notificationService.getSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.settings = settings;
          this.isSettingsLoading = false;
        },
        error: () => {
          this.isSettingsLoading = false;
          this.showSnackbar('Erreur lors du chargement des paramètres', 'error');
        }
      });
  }

  // ============================================================
  // FILTRES & PAGINATION
  // ============================================================

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 0;
    this.loadNotifications();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadNotifications();
  }

  onTabChange(index: number): void {
    this.activeTab = index;
    if (index === 1 && !this.settings) {
      this.loadSettings();
    }
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  onNotificationClick(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
      notification.isRead = true;
    }

    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  markAsRead(notification: AppNotification, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notification.id).subscribe(() => {
      notification.isRead = true;
      this.showSnackbar('Notification marquée comme lue');
    });
  }

  markSelectedAsRead(): void {
    if (this.selectedNotifications.size === 0) return;

    const ids = Array.from(this.selectedNotifications);
    this.notificationService.markMultipleAsRead(ids).subscribe(() => {
      this.notifications.forEach(n => {
        if (this.selectedNotifications.has(n.id)) {
          n.isRead = true;
        }
      });
      this.clearSelection();
      this.showSnackbar(`${ids.length} notification(s) marquée(s) comme lue(s)`);
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.showSnackbar('Toutes les notifications ont été marquées comme lues');
    });
  }

  deleteNotification(notification: AppNotification, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification.id).subscribe(() => {
      this.notifications = this.notifications.filter(n => n.id !== notification.id);
      this.totalElements--;
      this.showSnackbar('Notification supprimée');
    });
  }

  deleteAllRead(): void {
    this.notificationService.deleteAllRead().subscribe(response => {
      this.notifications = this.notifications.filter(n => !n.isRead);
      this.totalElements -= response.deletedCount;
      this.showSnackbar(`${response.deletedCount} notification(s) supprimée(s)`);
    });
  }

  // ============================================================
  // SÉLECTION
  // ============================================================

  toggleSelection(notification: AppNotification): void {
    if (this.selectedNotifications.has(notification.id)) {
      this.selectedNotifications.delete(notification.id);
    } else {
      this.selectedNotifications.add(notification.id);
    }
    this.updateSelectAllState();
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.notifications.forEach(n => this.selectedNotifications.add(n.id));
    } else {
      this.clearSelection();
    }
  }

  clearSelection(): void {
    this.selectedNotifications.clear();
    this.selectAll = false;
  }

  private updateSelectAllState(): void {
    this.selectAll = this.notifications.length > 0 && 
                     this.notifications.every(n => this.selectedNotifications.has(n.id));
  }

  isSelected(notification: AppNotification): boolean {
    return this.selectedNotifications.has(notification.id);
  }

  // ============================================================
  // PARAMÈTRES
  // ============================================================

  saveSettings(): void {
    if (!this.settings) return;

    this.notificationService.updateSettings(this.settings).subscribe({
      next: () => {
        this.showSnackbar('Paramètres enregistrés', 'success');
      },
      error: () => {
        this.showSnackbar('Erreur lors de la sauvegarde', 'error');
      }
    });
  }

  toggleGlobalNotifications(): void {
    if (this.settings) {
      this.saveSettings();
    }
  }

  togglePreference(pref: NotificationPreference, channel: 'inApp' | 'email' | 'push'): void {
    if (!this.settings) return;

    const preference = this.settings.preferences.find(p => p.category === pref.category);
    if (preference) {
      switch (channel) {
        case 'inApp':
          preference.inAppEnabled = !preference.inAppEnabled;
          break;
        case 'email':
          preference.emailEnabled = !preference.emailEnabled;
          break;
        case 'push':
          preference.pushEnabled = !preference.pushEnabled;
          break;
      }
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getCategoryIcon(category: string): string {
    return this.notificationService.getCategoryIcon(category);
  }

  getTypeColor(type: string): string {
    return this.notificationService.getTypeColor(type);
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => category.startsWith(c.value));
    return cat?.label || category;
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: type === 'error' ? 'snackbar-error' : type === 'success' ? 'snackbar-success' : ''
    });
  }
}