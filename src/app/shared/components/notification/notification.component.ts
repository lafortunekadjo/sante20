import { Component } from '@angular/core';
import { GeneralService } from '../../../core/services/general.service';

@Component({
  selector: 'app-notification',
  imports: [],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent {

  notifications: any[] = [];

  constructor(private notificationService: GeneralService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (data) => (this.notifications = data),
      error: (err) => console.error('Erreur lors du chargement des notifications:', err),
    });
  }

}
