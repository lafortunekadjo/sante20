// src/app/modules/chat/services/websocket.service.ts

import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environment';
import { AuthService } from './auth.service';

export interface MessageNotification {
  message: any;
  type: 'NEW_MESSAGE' | 'MESSAGE_EDITED' | 'MESSAGE_DELETED';
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.client?.active) {
      console.log('⚠️ WebSocket already connected');
      return;
    }

    const token = this.authService.getToken();
    
    console.log('==========================================');
    console.log('🔌 Connecting to WebSocket');
    console.log('Token exists:', !!token);
    console.log('Token:', token ? token.substring(0, 30) + '...' : 'NONE');
    console.log('==========================================');
    
    if (!token) {
      console.error('❌ Cannot connect without token');
      return;
    }

    this.client = new Client({
      webSocketFactory: () => {
        console.log('🏭 Creating WebSocket connection');
        
        // Construction de l'URL à partir de la config environment
        let baseApiUrl = environment.apiUrl; // Récupère '/api'
        let wsEndpoint = `${baseApiUrl}/ws`;  // Devient '/api/ws'

        // Sécurisation stricte : transforme le chemin relatif en URL absolue HTTPS
        if (wsEndpoint.startsWith('/')) {
          wsEndpoint = `https://${window.location.host}${wsEndpoint}`;
        } else {
          // Si une URL absolue incorrecte s'était glissée, on la nettoie pour SockJS
          wsEndpoint = wsEndpoint.replace('http://', 'https://').replace('wss://', 'https://');
        }

        console.log('[WebSocket] URL SockJS sécurisée générée :', wsEndpoint);
        return new SockJS(wsEndpoint) as any;
      },
      
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      
      debug: (str: string) => {
        console.log('📡 STOMP:', str);
      },
      
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: (frame) => {
        console.log('✅ WebSocket Connected!', frame);
        this.connectedSubject.next(true);
      },
      
      onStompError: (frame) => {
        console.error('❌ STOMP Error:', frame);
        this.connectedSubject.next(false);
      },
      
      onWebSocketError: (event) => {
        console.error('❌ WebSocket Error:', event);
        this.connectedSubject.next(false);
      },
      
      onDisconnect: () => {
        console.log('🔌 WebSocket Disconnected');
        this.connectedSubject.next(false);
      }
    });

    console.log('🚀 Activating client...');
    this.client.activate();
  }

  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket');
    
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach((sub, key) => {
      console.log('📤 Unsubscribing from:', key);
      sub.unsubscribe();
    });
    this.subscriptions.clear();
    
    if (this.client) {
      this.client.deactivate();
    }
    
    this.connectedSubject.next(false);
  }

  subscribeToConversation(conversationId: number): Observable<MessageNotification> {
    const subject = new Subject<MessageNotification>();
    const destination = `/topic/conversation/${conversationId}`;
    
    console.log('📥 Subscribing to:', destination);
    
    if (!this.client?.active) {
      console.error('❌ Client not active');
      return subject.asObservable();
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      console.log('📨 Received message on', destination);
      try {
        const notification = JSON.parse(message.body) as MessageNotification;
        subject.next(notification);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    this.subscriptions.set(`conversation-${conversationId}`, subscription);
    
    return subject.asObservable();
  }

  /**
   * Se désabonner d'une conversation
   */
  unsubscribeFromConversation(conversationId: number): void {
    console.log('📤 Unsubscribing from conversation:', conversationId);
    
    // Désabonner des messages
    const conversationKey = `conversation-${conversationId}`;
    const conversationSub = this.subscriptions.get(conversationKey);
    
    if (conversationSub) {
      conversationSub.unsubscribe();
      this.subscriptions.delete(conversationKey);
      console.log('✅ Unsubscribed from conversation messages:', conversationId);
    }
    
    // Désabonner des typing indicators
    const typingKey = `typing-${conversationId}`;
    const typingSub = this.subscriptions.get(typingKey);
    
    if (typingSub) {
      typingSub.unsubscribe();
      this.subscriptions.delete(typingKey);
      console.log('✅ Unsubscribed from typing indicators:', conversationId);
    }
  }

  subscribeToTyping(conversationId: number): Observable<any> {
    const subject = new Subject<any>();
    const destination = `/topic/conversation/${conversationId}/typing`;
    
    console.log('📥 Subscribing to typing:', destination);
    
    if (!this.client?.active) {
      console.error('❌ Client not active');
      return subject.asObservable();
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const indicator = JSON.parse(message.body);
        subject.next(indicator);
      } catch (error) {
        console.error('Error parsing typing indicator:', error);
      }
    });
    
    this.subscriptions.set(`typing-${conversationId}`, subscription);
    
    return subject.asObservable();
  }

  sendMessage(conversationId: number, content: string): void {
    const token = this.authService.getToken();
    
    console.log('==========================================');
    console.log('📤 Sending message');
    console.log('Destination:', `/app/chat/${conversationId}/send`);
    console.log('Content:', content);
    console.log('Token:', token ? 'EXISTS' : 'NONE');
    console.log('Client active:', this.client?.active);
    console.log('==========================================');
    
    if (!this.client?.active) {
      console.error('❌ Cannot send - client not active');
      return;
    }

    this.client.publish({
      destination: `/app/chat/${conversationId}/send`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });
    
    console.log('✅ Message sent' + token);
  }

  sendTypingIndicator(conversationId: number, isTyping: boolean): void {
    const token = this.authService.getToken();
    
    if (!this.client?.active) {
      return;
    }

    this.client.publish({
      destination: `/app/chat/${conversationId}/typing`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ conversationId, isTyping })
    });
  }

  markAsRead(conversationId: number): void {
    const token = this.authService.getToken();
    
    if (!this.client?.active) {
      return;
    }

    this.client.publish({
      destination: `/app/chat/${conversationId}/mark-read`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
  }
}