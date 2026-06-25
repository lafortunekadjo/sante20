// src/app/modules/chat/components/message-item/message-item.component.ts

import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Message, MessageType } from '../../../core/models/message.model';
import { ChatService } from '../../../core/services/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { routes } from '../../../app.routes';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-message-item',
    imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    
    // Material
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule],
  templateUrl: './message-item.component.html',
  styleUrls: ['./message-item.component.scss']
})
export class MessageItemComponent {
  @Input() message!: Message;
  @Input() isOwn = false;

  MessageType = MessageType;
  showMenu = false;

  constructor(
    private chatService: ChatService,
    private dialog: MatDialog
  ) {}

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getSenderName(): string {
    if (!this.message.sender) {
      return 'Système';
    }
    return `${this.message.sender.nom} ${this.message.sender.prenom}`;
  }

  getSenderInitials(): string {
    if (!this.message.sender) {
      return 'S';
    }
    return `${this.message.sender.nom.charAt(0)}${this.message.sender.prenom.charAt(0)}`.toUpperCase();
  }

  onEditMessage(): void {
    // Ouvrir un dialog d'édition
    // À implémenter
  }

  onDeleteMessage(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      this.chatService.deleteMessage(this.message.conversationId, this.message.id)
        .subscribe({
          next: () => {
            console.log('Message deleted');
          },
          error: (error) => {
            console.error('Error deleting message:', error);
          }
        });
    }
  }

  onImageClick(url: string): void {
    // Ouvrir l'image en plein écran
    window.open(url, '_blank');
  }

  downloadAttachment(attachment: any): void {
    window.open(attachment.url, '_blank');
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'videocam';
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table_chart';
    return 'insert_drive_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}