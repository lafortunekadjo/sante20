// ============================================================
// PUSH NOTIFICATION SERVICE - Angular Standalone Corrigé
// Fichier: src/app/core/services/push-notification.service.ts
// ============================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environment';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private readonly API_URL = `${environment.apiUrl}/push`;
  private readonly VAPID_PUBLIC_KEY = environment.vapidPublicKey;

  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSubscribedSubject = new BehaviorSubject<boolean>(false);
  public isSubscribed$ = this.isSubscribedSubject.asObservable();

  // Mode Standalone : Injection moderne
  private http = inject(HttpClient);

  constructor() {
    this.initServiceWorker();
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  /**
   * Initialiser le Service Worker pour les pushs
   */
  private async initServiceWorker(): Promise<void> {
    if (!this.isPushSupported()) {
      console.warn('[Push] Les notifications push ne sont pas supportées par ce navigateur.');
      return;
    }

    try {
      // Attente du Service Worker configuré globalement par 'provideServiceWorker'
      this.swRegistration = await navigator.serviceWorker.ready;
      console.log('[Push] Service Worker prêt et intercepté avec succès.');

      // Vérifier si cet appareil possède déjà un abonnement actif auprès du navigateur
      const subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribedSubject.next(!!subscription);
      
      if (subscription) {
        console.log('[Push] L\'utilisateur possède déjà un abonnement actif sur ce terminal.');
      }
    } catch (error) {
      console.error('[Push] Erreur lors de l\'initialisation du Service Worker:', error);
    }
  }

  // ============================================================
  // GESTION DE L'ABONNEMENT
  // ============================================================

  /**
   * Demander la permission et abonner l'appareil aux notifications push
   */
  public async subscribeToNotifications(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.error('[Push] Impossible d\'abonner : Service worker non initialisé.');
      return null;
    }

    try {
      // Étape 1 : Demande de permission native sur le téléphone
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[Push] L\'utilisateur a refusé les notifications.');
        return null;
      }

      // Étape 2 : Création du Uint8Array pour la clé publique VAPID
      const convertedKey = this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY);

      // Étape 3 : Création de la souscription auprès du serveur de push (FCM, Apple, etc.)
      // Note : On utilise '.buffer' pour fournir un ArrayBuffer pur et corriger l'erreur ts(2322)
      const options: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
        applicationServerKey: convertedKey.buffer as ArrayBuffer
      };

      const subscription = await this.swRegistration.pushManager.subscribe(options);
      console.log('[Push] Nouvelle souscription générée avec succès sur l\'appareil.');

      // Étape 4 : Extraction et conversion des clés de chiffrement pour ton Backend Java
      const p256dhBuffer = subscription.getKey('p256dh');
      const authBuffer = subscription.getKey('auth');

      if (!p256dhBuffer || !authBuffer) {
        throw new Error('Impossible de récupérer les clés de chiffrement de la souscription.');
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(p256dhBuffer),
          auth: this.arrayBufferToBase64(authBuffer)
        }
      };

      // Étape 5 : Transmission au backend Spring Boot
      await this.saveSubscriptionOnBackend(subscriptionData);
      
      this.isSubscribedSubject.next(true);
      return subscription;

    } catch (error) {
      console.error('[Push] Erreur lors du processus d\'abonnement:', error);
      return null;
    }
  }

  /**
   * Envoyer les données de l'abonnement du téléphone au backend
   */
  private saveSubscriptionOnBackend(subscriptionData: PushSubscriptionData): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<void>(`${this.API_URL}/subscribe`, subscriptionData).subscribe({
        next: () => {
          console.log('[Push] Token de l\'appareil enregistré avec succès sur le serveur.');
          resolve();
        },
        error: (err) => {
          console.error('[Push] Erreur lors de la sauvegarde du token sur le serveur:', err);
          reject(err);
        }
      });
    });
  }

  // ============================================================
  // VÉRIFICATIONS & REQUÊTES NATIVES
  // ============================================================

  public isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  public isNotificationGranted(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  // ============================================================
  // CONVERSIONS BINAIRES (Clés VAPID)
  // ============================================================

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // ============================================================
  // TEST LOCAL
  // ============================================================

  /**
   * Envoyer une notification de test (interception locale par le SW)
   */
  async sendTestNotification(): Promise<void> {
    if (!this.isNotificationGranted()) {
      console.warn('[Push] Permission non accordée');
      return;
    }

    if (this.swRegistration) {
      // Casté en 'any' pour éviter les restrictions de l'interface NotificationOptions sur Desktop (vibrate, badge, data)
      const notificationOptions: any = {
        body: 'Ceci est une notification de test 🎉',
        icon: 'assets/icons/icon-192x192.png',
        badge: 'assets/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: { url: '/' }
      };

      await this.swRegistration.showNotification('Test My2-0', notificationOptions);
    }
  }
}