// src/app/modules/chat/components/conversation-detail/conversation-detail.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Conversation } from '../../../core/models/conversation.model';
import { Message } from '../../../core/models/message.model';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { CryptoService } from '../../../core/services/crypto.service';
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
export class ConversationDetailComponent implements OnInit, OnDestroy, OnChanges {
  @Input() conversation!: Conversation;
  @Output() lastMessageUpdated = new EventEmitter<{ conversationId: number; message: any }>();
  
  messages: Message[] = [];
  loading = false;
  page = 0;
  hasMore = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private websocketService: WebSocketService,
    private authService: AuthService,
    private cryptoService: CryptoService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversation'] && !changes['conversation'].firstChange) {
      // Désabonner de l'ancienne conversation
      this.websocketService.unsubscribeFromConversation(
        changes['conversation'].previousValue?.id
      );
      // Reset état
      this.messages = [];
      this.page = 0;
      this.hasMore = true;
      // Charger la nouvelle
      this.loadMessages();
      this.subscribeToMessages();
      this.websocketService.subscribeToConversation(this.conversation.id);
    }
  }

  ngOnInit(): void {
    this.loadMessages();
    this.subscribeToMessages(); // seul appel — subscribeToMessages() gère l'abonnement WS
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

async loadMessages(): Promise<void> {
  this.loading = true;
  this.chatService.getMessages(this.conversation.id, this.page, 50)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: async (response) => {
        // Cas 1 : backend retourne un objet paginé Spring { content: [], last: bool }
        // Cas 2 : backend retourne un tableau direct Message[]
        let rawMessages: any[];
        let isLast = true;

        if (!response) {
          this.loading = false;
          this.hasMore = false;
          return;
        }

        if (Array.isArray(response)) {
          // Tableau direct
          rawMessages = response;
          isLast = true;
        } else if (Array.isArray(response.content)) {
          // Objet paginé Spring
          rawMessages = response.content;
          isLast = response.last ?? true;
        } else {
          // Format inconnu — ne pas bloquer l'UI
          console.warn('Format de réponse inattendu:', response);
          this.loading = false;
          this.hasMore = false;
          return;
        }

        // Les messages arrivent du plus récent au plus ancien → inverser
        const newMessages = [...rawMessages].reverse();

        // Déchiffrer en batch avant affichage
        const decrypted = await Promise.all(
          newMessages.map(async (m: Message) => {
            if (m.content && !m.isSystemMessage) {
              return { ...m, content: await this.cryptoService.decrypt(m.content, m.conversationId) };
            }
            return m;
          })
        );

        this.messages = [...decrypted, ...this.messages];
        this.hasMore = !isLast;
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
    if (this.messages.find(m => m.id === message.id)) return;

    // Déchiffrer le contenu avant affichage
    if (message.content && !message.isSystemMessage) {
      this.cryptoService.decrypt(message.content, message.conversationId)
        .then(decrypted => {
          this.messages.push({ ...message, content: decrypted });
          setTimeout(() => {
            this.websocketService.markAsRead(this.conversation.id);
          }, 500);
        });
    } else {
      this.messages.push(message);
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
    // Notifier le parent pour mettre à jour la preview dans la liste
    this.lastMessageUpdated.emit({
      conversationId: this.conversation.id,
      message
    });
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
    return this.authService.getUserId() ?? 0;
  }
}