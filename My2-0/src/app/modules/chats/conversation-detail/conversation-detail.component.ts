// src/app/modules/chat/components/conversation-detail/conversation-detail.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Conversation } from '../../../core/models/conversation.model';
import { Message } from '../../../core/models/message.model';
import { ChatService } from '../../../core/services/chat.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
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
import { TranslateModule } from '@ngx-translate/core';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';


@Component({
  selector: 'app-conversation-detail',
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
    MatDividerModule,
    MessageListComponent,
    MessageInputComponent,
  TranslateModule],
  templateUrl: './conversation-detail.component.html',
  styleUrls: ['./conversation-detail.component.scss']
})
export class ConversationDetailComponent implements OnInit, OnDestroy {
  @Input() conversation!: Conversation;
  
  messages: Message[] = [];
  loading = false;
  page = 0;
  hasMore = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private websocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    console.log(this.conversation!)
    this.loadMessages();
    this.subscribeToMessages();
    this.websocketService.subscribeToConversation(this.conversation.id);
  }

ngOnDestroy(): void {
    console.log('ConversationDetailComponent destroyed for conversation:', this.conversation.id);
    
    // Se désabonner du WebSocket pour cette conversation
    this.websocketService.unsubscribeFromConversation(this.conversation.id);
    
    // Compléter le Subject de destruction
    this.destroy$.next();
    this.destroy$.complete();
  }

  // src/app/modules/chat/components/conversation-detail/conversation-detail.component.ts

loadMessages(): void {
  this.loading = true;
  this.chatService.getMessages(this.conversation.id, this.page, 50)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('Messages response:', response); // Debug
        
        // Vérification et gestion des cas null/undefined
        if (!response || !response.content) {
          console.warn('No content in response');
          this.loading = false;
          this.hasMore = false;
          return;
        }
        
        // Vérifier que content est un tableau
        if (!Array.isArray(response.content)) {
          console.error('response.content is not an array:', response.content);
          this.loading = false;
          return;
        }
        
        // Les messages arrivent du plus récent au plus ancien
        const newMessages = [...response.content].reverse();
        this.messages = [...newMessages, ...this.messages];
        this.hasMore = !response.last;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.loading = false;
      }
    });
}

  loadMoreMessages(): void {
    if (!this.loading && this.hasMore) {
      this.page++;
      this.loadMessages();
    }
  }

 subscribeToMessages(): void {
    this.websocketService.subscribeToConversation(this.conversation.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notification) => {
          if (notification.type === 'NEW_MESSAGE') {
            this.addNewMessage(notification.message);
          } else if (notification.type === 'MESSAGE_EDITED') {
            this.updateMessage(notification.message);
          } else if (notification.type === 'MESSAGE_DELETED') {
            this.updateMessage(notification.message);
          }
        },
        error: (error) => {
          console.error('WebSocket subscription error:', error);
        }
      });
  }


  addNewMessage(message: Message): void {
    // Vérifier si le message n'existe pas déjà
    if (!this.messages.find(m => m.id === message.id)) {
      this.messages.push(message);
      
      // Marquer comme lu automatiquement
      setTimeout(() => {
        this.websocketService.markAsRead(this.conversation.id);
      }, 500);
    }
  }

  updateMessage(message: Message): void {
    const index = this.messages.findIndex(m => m.id === message.id);
    if (index !== -1) {
      this.messages[index] = message;
    }
  }

  onMessageSent(message: Message): void {
    this.addNewMessage(message);
  }

  getConversationTitle(): string {
    if (this.conversation.titre) {
      return this.conversation.titre;
    }
    
    if (this.conversation.type === 'PRIVATE' && this.conversation.participants.length === 2) {
      const otherParticipant = this.conversation.participants.find(
        p => p.user.id !== this.getCurrentUserId()
      );
      return otherParticipant 
        ? `${otherParticipant.user.nom} ${otherParticipant.user.prenom}`
        : 'Conversation privée';
    }
    
    return 'Conversation de groupe';
  }

  getParticipantsInfo(): string {
    const count = this.conversation.participants.length;
    return count === 2 ? '2 participants' : `${count} participants`;
  }

  private getCurrentUserId(): number {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.id;
  }
}