// ============================================================
// RX-STOMP SERVICE - WebSocket Angular (CORRIGÉ)
// Fichier: src/app/core/services/rx-stomp.service.ts
// 
// INSTALLATION REQUISE:
// npm install @stomp/rx-stomp @stomp/stompjs sockjs-client
// npm install --save-dev @types/sockjs-client
// ============================================================

import { Injectable, OnDestroy } from '@angular/core';
import { RxStomp, RxStompConfig, RxStompState } from '@stomp/rx-stomp';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from './environment';


// Import SockJS - Assure-toi d'avoir installé: npm install sockjs-client @types/sockjs-client
declare var SockJS: any;

@Injectable({
  providedIn: 'root'
})
export class RxStompService implements OnDestroy {

  private rxStomp: RxStomp;
  private connectionState$ = new BehaviorSubject<RxStompState>(RxStompState.CLOSED);
  
  // Observable public pour l'état de connexion
  public connected$ = this.connectionState$.asObservable();

  constructor() {
    this.rxStomp = new RxStomp();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Initialiser la connexion WebSocket avec le token JWT
   */
  connect(token: string): void {
    if (this.rxStomp.connected()) {
      console.log('[WebSocket] Déjà connecté');
      return;
    }

    const wsUrl = this.getWsUrl();

    const config: RxStompConfig = {
      // Utiliser SockJS pour la compatibilité navigateurs
      webSocketFactory: () => {
        return new SockJS(wsUrl);
      },

      // Headers de connexion avec le token
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },

      // Heartbeat
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      // Reconnexion automatique (5 secondes)
      reconnectDelay: 5000,

      // Debug logs (désactivés en production)
      debug: (msg: string) => {
        if (!environment.production) {
          console.log('[WebSocket]', msg);
        }
      }
    };

    this.rxStomp.configure(config);

    // Observer l'état de connexion
    this.rxStomp.connectionState$.subscribe(state => {
      this.connectionState$.next(state);
      
      if (!environment.production) {
        const stateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
        console.log('[WebSocket] État:', stateNames[state] || state);
      }
    });

    this.rxStomp.activate();
  }

  /**
   * Déconnecter proprement
   */
  disconnect(): void {
    if (this.rxStomp.active) {
      this.rxStomp.deactivate();
    }
  }

  /**
   * S'abonner à un canal et parser automatiquement le JSON
   */
  watch<T = any>(destination: string): Observable<T> {
    return this.rxStomp.watch(destination).pipe(
      map(message => {
        try {
          return JSON.parse(message.body) as T;
        } catch {
          return message.body as unknown as T;
        }
      })
    );
  }

  /**
   * S'abonner à un canal (message brut)
   */
  watchRaw(destination: string): Observable<any> {
    return this.rxStomp.watch(destination);
  }

  /**
   * Publier un message
   */
  publish(destination: string, body: any): void {
    this.rxStomp.publish({
      destination,
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  }

  /**
   * Vérifier si connecté
   */
  isConnected(): boolean {
    return this.rxStomp.connected();
  }

  /**
   * Obtenir l'URL WebSocket
   */
 /**
 * Obtenir l'URL pour SockJS (Doit impérativement être http ou https)
 */
private getWsUrl(): string {
  // On définit l'URL de base manuellement ou via environment
  const baseUrl = "http://localhost:8000"; 
  
  // On ajoute /api/ws (qui doit correspondre exactement au backend)
  const endpoint = "/api/ws";
  
  return baseUrl + endpoint;
}
}