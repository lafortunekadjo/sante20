import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class ConcoursWebSocketService {

  private client: Client | null = null;
  private eventSubject = new Subject<any>();
  private subscription: StompSubscription | null = null;

  connectionStatus$ = new BehaviorSubject<boolean>(false);

  connect(concoursId: number): Observable<any> {
    this.disconnect(); // fermer toute connexion précédente

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiUrl.replace('/api', '')}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        this.connectionStatus$.next(true);

        // Souscrire au canal live du concours
        this.subscription = this.client!.subscribe(
          `/topic/concours/${concoursId}/live`,
          (message: IMessage) => {
            try {
              const event = JSON.parse(message.body);
              this.eventSubject.next(event);
            } catch (e) {
              console.error('Erreur parsing event live:', e);
            }
          }
        );
      },
      onDisconnect: () => {
        this.connectionStatus$.next(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connectionStatus$.next(false);
        this.eventSubject.error(frame);
      }
    });

    this.client.activate();

    return this.eventSubject.asObservable();
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.client?.deactivate();
    this.client = null;
    this.connectionStatus$.next(false);
  }
}