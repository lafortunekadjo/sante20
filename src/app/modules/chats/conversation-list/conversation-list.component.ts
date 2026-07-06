// src/app/modules/chat/components/conversation-list/conversation-list.component.tschatconversationSelected

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Conversation } from '../../../core/models/conversation.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

// Angular Material
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent {
  @Input() conversations: Conversation[] = [];
  @Input() selectedConversation: Conversation | null = null;
  @Input() loading = false;

  @Output() conversationSelected = new EventEmitter<Conversation>();

  constructor(private authService: AuthService) {}

  selectConversation(conversation: Conversation): void {
    this.conversationSelected.emit(conversation);
  }

  /**
   * Récupère l'ID de l'utilisateur actuellement connecté
   */
  private getCurrentUserId(): number {
    const user = this.authService.getUserId()!
    return user;
  }

  

  /**
   * Extrait l'interlocuteur pour une conversation privée
   */
  private getOtherParticipant(conversation: Conversation) {
    const currentUserId = this.getCurrentUserId();
    return conversation.participants?.find(p => p.user.id !== currentUserId);
  }

  getConversationTitle(conversation: Conversation): string {
    if (conversation.type === 'PRIVATE') {
      const other = this.getOtherParticipant(conversation);
      if (other?.user) {
        return `${other.user.nom} ${other.user.prenom}`;
      }
      return 'Conversation privée';
    }
    
    // Si c'est un groupe (GROUP), on affiche le titre du groupe
    return conversation.titre || 'Conversation de groupe';
  }

  /**
   * Retourne la photo de l'interlocuteur ou null s'il n'en a pas
   */
  getConversationImage(conversation: Conversation): string | null {
    if (conversation.type === 'PRIVATE') {
      const other = this.getOtherParticipant(conversation);
      return other?.user?.photoUrl || null;
    }
    // Pour un groupe, vous pouvez renvoyer une photo de groupe ou null
    return null; 
  }
  /**
   * Extrait un aperçu du dernier message
   */
  getLastMessagePreview(conversation: Conversation): string {
    if (!conversation.lastMessage) {
      return 'Aucun message';
    }
    
    const msg = conversation.lastMessage;
    
    if (msg.isSystemMessage) {
      return msg.content;
    }
    if (msg.type === 'IMAGE') {
      return '📷 Photo';
    }
    if (msg.type === 'FILE') {
      return '📎 Fichier';
    }
    
    return msg.content.length > 40 
      ? msg.content.substring(0, 40) + '...'
      : msg.content;
  }

  /**
   * Formate la date du dernier message
   */
  getLastMessageTime(conversation: Conversation): string {
    if (!conversation.lastMessage || !conversation.lastMessage.createdAt) {
      return '';
    }
    
    const date = new Date(conversation.lastMessage.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    }
  }
}