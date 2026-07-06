import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  Token,
  ActionPerformed,
  PushNotificationSchema
} from '@capacitor/push-notifications';
import { AuthService } from './auth.service';
import { environment } from '../../../app/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {

  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http:        HttpClient,
    private router:      Router,
    private authService: AuthService
  ) {}

  // ── Appeler au login ──────────────────────────────────────
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[Push] Web — FCM non disponible');
      return;
    }
    await this.requestPermission();
    this.registerListeners();
  }

  // ── Demander la permission ────────────────────────────────
  private async requestPermission(): Promise<void> {
    let perm = await PushNotifications.checkPermissions();

    if (perm.receive === 'prompt') {
      perm = await PushNotifications.requestPermissions();
    }

    if (perm.receive !== 'granted') {
      console.warn('[Push] Permission refusée par l\'utilisateur');
      return;
    }

    await PushNotifications.register();
  }

  // ── Listeners FCM ─────────────────────────────────────────
  private registerListeners(): void {

    // 1. Token reçu → envoyer au backend
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('[Push] Token FCM reçu');
      this.saveTokenToBackend(token.value);
    });

    // 2. Erreur
    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] Erreur enregistrement FCM:', err);
    });

    // 3. Notification reçue — app OUVERTE (foreground)
    // Ne pas afficher de notification système — Angular gère
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('[Push] Notif foreground:', notification.title);
        // Optionnel : mettre à jour le badge de la cloche sans recharger
        // this.notifBadgeService.increment();
      }
    );

    // 4. Utilisateur tape la notif — app FERMÉE ou arrière-plan
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('[Push] Notif tapée:', action.notification.data);
        this.handleTap(action.notification.data);
      }
    );
  }

  // ── Sauvegarder le token ──────────────────────────────────
  private saveTokenToBackend(token: string): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.http.post(`${this.apiUrl}/notifications/fcm-token`, {
      userId,
      token,
      platform: 'ANDROID'
    }).subscribe({
      next: () => console.log('[Push] Token FCM sauvegardé'),
      error: (e) => console.error('[Push] Erreur save token:', e)
    });
  }

  // ── Supprimer le token au logout ─────────────────────────
  async removeFcmToken(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const userId = this.authService.getUserId();
    if (!userId) return;

    // Supprimer les notifs affichées
    await PushNotifications.removeAllDeliveredNotifications();

    // Supprimer le token côté backend
    this.http.delete(`${this.apiUrl}/notifications/fcm-token/${userId}`)
      .subscribe({ error: (e) => console.error('[Push] Erreur remove token:', e) });
  }

  // ── Navigation selon le type de notif ────────────────────
  private handleTap(data: Record<string, string>): void {
    if (!data) return;

    const routes: Record<string, string> = {
      'GROUPE_INVITATION':      '/responsable/invitations',
      'GROUPE_NEW_MEMBER':      '/responsable/invitations',
      'MATCH_NEW':              '/responsable/matchs',
      'MATCH_REMINDER':         '/responsable/matchs',
      'MATCH_RESULT':           '/responsable/matchs',
      'SANCTION_NEW':           '/responsable/sanctions',
      'SANCTION_REMINDER':      '/responsable/sanctions',
      'COTISATION_REMINDER':    '/responsable/finances/dashboard',
      'COTISATION_OVERDUE':     '/responsable/finances/dashboard',
      'SYSTEM_ANNOUNCEMENT':    '/actualites',
      'SOCIAL_BIRTHDAY':        '/membre',
    };

    const route = routes[data['type']];
    if (route) {
      this.router.navigate([route]);
    } else {
      // Par défaut → page notifications
      this.router.navigate(['/notifications']);
    }
  }
}