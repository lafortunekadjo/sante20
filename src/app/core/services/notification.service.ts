import { Injectable } from "@angular/core";
import { Stomp } from "@stomp/stompjs";
import { Subject } from "rxjs";
import SockJS from "sockjs-client";

// notification.service.ts
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private stompClient: any;
  private notifications$ = new Subject<Notification>();

  connect(userId: number) {
    const socket = new SockJS('/ws');
    this.stompClient = Stomp.over(socket);
    this.stompClient.connect({}, () => {
      this.stompClient.subscribe('/topic/user/' + userId, (msg: any) => {
        const notif = JSON.parse(msg.body);
        this.notifications$.next(notif);
        this.playSound();
        this.showToast(notif);
      });
    });
  }

  getNotifications() { return this.notifications$.asObservable(); }
}