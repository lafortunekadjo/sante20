// ============================================================
// NOTIFICATION SERVICE - Angular Frontend
// Fichier: src/app/core/services/notification.service.ts
// ============================================================

import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

import { IMessage } from '@stomp/rx-stomp';
import { environment } from '../../environment';
import { RxStompService } from '../../rx-stomp.service';

// ============ INTERFACES ============

/**
 * Interface pour une notification de l'application
 * Nommée AppNotification pour éviter le conflit avec l'API Web Notification native
 */
export interface AppNotification {
  id: number;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER';
  category: string;
  title: string;
  message: string;
  actionUrl?: string;
  icon?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  timeAgo: string;
  groupeId?: number;
  groupeNom?: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  unreadCount: number;
}

export interface NotificationBadge {
  unreadCount: number;
  recentNotifications: AppNotification[];
}

export interface NotificationPreference {
  category: string;
  categoryLabel: string;
  categoryDescription: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface NotificationSettings {
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  emailDigestFrequency: string;
  preferences: NotificationPreference[];
}

export interface CreateNotificationRequest {
  userId?: number;
  userIds?: number[];
  groupeId?: number;
  type: string;
  category: string;
  title: string;
  message: string;
  actionUrl?: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {

  private apiUrl = `${environment.apiUrl}/notifications`;
  private destroy$ = new Subject<void>();

  // État réactif
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  private newNotificationSubject = new Subject<AppNotification>();

  // Observables publics
  unreadCount$ = this.unreadCountSubject.asObservable();
  notifications$ = this.notificationsSubject.asObservable();
  newNotification$ = this.newNotificationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private rxStompService: RxStompService
  ) {
    this.initWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // WEBSOCKET - Temps réel
  // ============================================================

  private initWebSocket(): void {
    // Vérifier si le service WebSocket est disponible
    if (!this.rxStompService) {
      console.warn('RxStompService non disponible');
      return;
    }

    // S'abonner aux notifications en temps réel
    this.rxStompService.watch('/user/queue/notifications')
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: IMessage) => {
        try {
          const notification: AppNotification = JSON.parse(message.body);
          this.handleNewNotification(notification);
        } catch (e) {
          console.error('Erreur parsing notification:', e);
        }
      });

    // S'abonner aux mises à jour du badge
    this.rxStompService.watch('/user/queue/notifications/badge')
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          this.unreadCountSubject.next(data.unreadCount);
        } catch (e) {
          console.error('Erreur parsing badge:', e);
        }
      });
  }

  private handleNewNotification(notification: AppNotification): void {
    // Ajouter au début de la liste
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);

    // Incrémenter le compteur
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);

    // Émettre pour les abonnés (toast, son, etc.)
    this.newNotificationSubject.next(notification);
  }

  // ============================================================
  // API - Lecture
  // ============================================================

  /**
   * Récupérer les notifications (paginées)
   */
  getNotifications(page = 0, size = 20, category?: string): Observable<NotificationListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (category && category !== 'ALL') {
      params = params.set('category', category);
    }

    return this.http.get<NotificationListResponse>(this.apiUrl, { params }).pipe(
      tap(response => {
        this.notificationsSubject.next(response.notifications);
        this.unreadCountSubject.next(response.unreadCount);
      })
    );
  }

  /**
   * Récupérer le badge (compteur + aperçu)
   */
  getBadge(): Observable<NotificationBadge> {
    return this.http.get<NotificationBadge>(`${this.apiUrl}/badge`).pipe(
      tap(badge => {
        this.unreadCountSubject.next(badge.unreadCount);
      })
    );
  }

  /**
   * Récupérer les non lues uniquement
   */
  getUnread(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/unread`);
  }

  /**
   * Compter les non lues
   */
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread/count`).pipe(
      tap(response => this.unreadCountSubject.next(response.count))
    );
  }

  // ============================================================
  // API - Actions
  // ============================================================

  /**
   * Marquer une notification comme lue
   */
  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Mettre à jour localement
        const notifications = this.notificationsSubject.value.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
      })
    );
  }

  /**
   * Marquer plusieurs notifications comme lues
   */
  markMultipleAsRead(notificationIds: number[]): Observable<{ markedCount: number }> {
    return this.http.put<{ markedCount: number }>(`${this.apiUrl}/read`, { notificationIds }).pipe(
      tap(response => {
        const notifications = this.notificationsSubject.value.map(n =>
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        );
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - response.markedCount));
      })
    );
  }

  /**
   * Marquer toutes comme lues
   */
  markAllAsRead(): Observable<{ markedCount: number }> {
    return this.http.put<{ markedCount: number }>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(0);
      })
    );
  }

  /**
   * Supprimer une notification
   */
  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(notifications);
      })
    );
  }

  /**
   * Supprimer toutes les notifications lues
   */
  deleteAllRead(): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(`${this.apiUrl}/read`).pipe(
      tap(() => {
        const notifications = this.notificationsSubject.value.filter(n => !n.isRead);
        this.notificationsSubject.next(notifications);
      })
    );
  }

  // ============================================================
  // API - Préférences
  // ============================================================

  /**
   * Récupérer les paramètres
   */
  getSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${this.apiUrl}/settings`);
  }

  /**
   * Mettre à jour les paramètres
   */
  updateSettings(settings: NotificationSettings): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/settings`, settings);
  }

  // ============================================================
  // API - Envoi (Admin/Responsable)
  // ============================================================

  /**
   * Envoyer une notification
   */
  sendNotification(request: CreateNotificationRequest): Observable<AppNotification> {
    return this.http.post<AppNotification>(`${this.apiUrl}/send`, request);
  }

  /**
   * Envoyer à un groupe
   */
  sendToGroupe(groupeId: number, request: CreateNotificationRequest): Observable<AppNotification[]> {
    return this.http.post<AppNotification[]>(`${this.apiUrl}/send/groupe/${groupeId}`, request);
  }

  // ============================================================
  // Helpers
  // ============================================================

  /**
   * Obtenir l'icône Material pour une catégorie
   */
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'MATCH_NEW': 'sports_soccer',
      'MATCH_REMINDER': 'alarm',
      'MATCH_CANCELLED': 'event_busy',
      'MATCH_UPDATED': 'edit_calendar',
      'MATCH_RESULT': 'scoreboard',
      'GROUPE_INVITATION': 'group_add',
      'GROUPE_NEW_MEMBER': 'person_add',
      'GROUPE_MEMBER_LEFT': 'person_remove',
      'GROUPE_ROLE_CHANGED': 'manage_accounts',
      'GROUPE_SETTINGS': 'settings',
      'COTISATION_REMINDER': 'payment',
      'COTISATION_RECEIVED': 'paid',
      'COTISATION_CONFIRMED': 'check_circle',
      'COTISATION_OVERDUE': 'warning',
      'SANCTION_NEW': 'gavel',
      'SANCTION_PAID': 'check_circle',
      'SANCTION_REMINDER': 'notification_important',
      'SYSTEM_MAINTENANCE': 'build',
      'SYSTEM_UPDATE': 'system_update',
      'SYSTEM_ANNOUNCEMENT': 'campaign',
      'SOCIAL_MENTION': 'alternate_email',
      'SOCIAL_WELCOME': 'waving_hand',
      'ADMIN_NEW_GROUPE': 'add_business',
      'ADMIN_NEW_USER': 'person_add',
      'ADMIN_ALERT': 'warning'
    };
    return icons[category] || 'notifications';
  }

  /**
   * Obtenir la couleur pour un type
   */
  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'INFO': '#3b82f6',
      'SUCCESS': '#22c55e',
      'WARNING': '#f59e0b',
      'ERROR': '#ef4444',
      'REMINDER': '#8b5cf6'
    };
    return colors[type] || '#64748b';
  }

  /**
   * Forcer la mise à jour du compteur
   */
  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }
}