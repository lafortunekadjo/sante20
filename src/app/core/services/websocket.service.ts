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

  // Flux de notification global requis par ChatMainComponent
  private messageNotificationSubject = new Subject<MessageNotification>();

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
        
        let baseApiUrl = environment.apiUrl; 
        let wsEndpoint = `${baseApiUrl}/ws`;  

        if (wsEndpoint.startsWith('/')) {
          wsEndpoint = `http://${window.location.host}${wsEndpoint}`;
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
        // S'abonner aux notifications personnelles globales dès la connexion
        this.subscribeToUserNotifications();
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

  /**
   * Retourne le flux global de notifications de messages (Requis par ChatMainComponent)
   */
  onMessageNotification(): Observable<MessageNotification> {
    return this.messageNotificationSubject.asObservable();
  }

  /**
   * S'abonne au canal utilisateur spécifique pour recevoir les notifications hors-conversation
   */
  private subscribeToUserNotifications(): void {
    if (!this.client?.active) return;

    const destination = '/user/queue/notifications';
    console.log('📥 Subscribing to global user notifications:', destination);

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      console.log('📨 Received global user notification');
      try {
        const notification = JSON.parse(message.body) as MessageNotification;
        this.messageNotificationSubject.next(notification);
      } catch (error) {
        console.error('Error parsing global notification:', error);
      }
    });

    this.subscriptions.set('user-notifications', subscription);
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
        
        // On pousse également dans le flux général au cas où le composant parent écoute
        this.messageNotificationSubject.next(notification);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    this.subscriptions.set(`conversation-${conversationId}`, subscription);
    
    return subject.asObservable();
  }

  unsubscribeFromConversation(conversationId: number): void {
    console.log('📤 Unsubscribing from conversation:', conversationId);
    
    const conversationKey = `conversation-${conversationId}`;
    const conversationSub = this.subscriptions.get(conversationKey);
    
    if (conversationSub) {
      conversationSub.unsubscribe();
      this.subscriptions.delete(conversationKey);
      console.log('✅ Unsubscribed from conversation messages:', conversationId);
    }
    
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