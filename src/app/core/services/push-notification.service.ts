// ============================================================
// PUSH NOTIFICATION SERVICE - Angular
// Fichier: src/app/core/services/push-notification.service.ts
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from } from 'rxjs';
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

  constructor(private http: HttpClient) {
    this.initServiceWorker();
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  /**
   * Initialiser le Service Worker pour les push
   */
  private async initServiceWorker(): Promise<void> {
    if (!this.isPushSupported()) {
      console.warn('[Push] Les notifications push ne sont pas supportées');
      return;
    }

    try {
      // Enregistrer le Service Worker
      this.swRegistration = await navigator.serviceWorker.register('/sw-push.js');
      console.log('[Push] Service Worker enregistré:', this.swRegistration);

      // Vérifier si déjà abonné
      const subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribedSubject.next(!!subscription);

      if (subscription) {
        console.log('[Push] Déjà abonné aux notifications');
      }
    } catch (error) {
      console.error('[Push] Erreur initialisation:', error);
    }
  }

  // ============================================================
  // VÉRIFICATIONS
  // ============================================================

  /**
   * Vérifier si les notifications push sont supportées
   */
  isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  /**
   * Vérifier si les notifications sont autorisées
   */
  isNotificationGranted(): boolean {
    return Notification.permission === 'granted';
  }

  /**
   * Vérifier si les notifications sont refusées
   */
  isNotificationDenied(): boolean {
    return Notification.permission === 'denied';
  }

  /**
   * Obtenir le statut actuel de la permission
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // ============================================================
  // ABONNEMENT
  // ============================================================

  /**
   * Demander la permission et s'abonner aux notifications push
   */
  async subscribeToPush(): Promise<boolean> {
    if (!this.isPushSupported()) {
      console.error('[Push] Non supporté sur ce navigateur');
      return false;
    }

    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.warn('[Push] Permission refusée');
        return false;
      }

      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.ready;
      }

      // Créer l'abonnement push
     const convertedKey = this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY);

    const subscription = await this.swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey.buffer as ArrayBuffer // On passe directement le buffer
    });

      console.log('[Push] Abonnement créé:', subscription);

      // Envoyer l'abonnement au backend
      await this.saveSubscription(subscription);

      this.isSubscribedSubject.next(true);
      return true;

    } catch (error) {
      console.error('[Push] Erreur abonnement:', error);
      return false;
    }
  }

  /**
   * Se désabonner des notifications push
   */
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        // Supprimer du backend
        await this.deleteSubscription(subscription.endpoint);
        
        // Désabonner localement
        await subscription.unsubscribe();
        
        this.isSubscribedSubject.next(false);
        console.log('[Push] Désabonnement réussi');
        return true;
      }

      return false;

    } catch (error) {
      console.error('[Push] Erreur désabonnement:', error);
      return false;
    }
  }

  // ============================================================
  // COMMUNICATION AVEC LE BACKEND
  // ============================================================

  /**
   * Enregistrer l'abonnement sur le serveur
   */
  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const subscriptionData = this.formatSubscription(subscription);
    
    await this.http.post(`${this.API_URL}/subscribe`, subscriptionData).toPromise();
    console.log('[Push] Abonnement enregistré sur le serveur');
  }

  /**
   * Supprimer l'abonnement du serveur
   */
  private async deleteSubscription(endpoint: string): Promise<void> {
    await this.http.post(`${this.API_URL}/unsubscribe`, { endpoint }).toPromise();
    console.log('[Push] Abonnement supprimé du serveur');
  }

  /**
   * Formater l'abonnement pour l'API
   */
  private formatSubscription(subscription: PushSubscription): PushSubscriptionData {
    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: key ? this.arrayBufferToBase64(key) : '',
        auth: auth ? this.arrayBufferToBase64(auth) : ''
      }
    };
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  /**
   * Convertir une clé VAPID base64 en Uint8Array
   */
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

  /**
   * Convertir un ArrayBuffer en base64
   */
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
   * Envoyer une notification de test (local uniquement)
   */
  async sendTestNotification(): Promise<void> {
    if (!this.isNotificationGranted()) {
      console.warn('[Push] Permission non accordée');
      return;
    }

      if (this.swRegistration) {
      await this.swRegistration.showNotification('Test My2-0', {
        body: 'Ceci est une notification de test 🎉',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [200, 100, 200], // TypeScript ne râlera plus
        tag: 'test',
        data: {
          url: '/notifications'
        }
      } as any); // Ajoute "as any" ici
    }
  }
}