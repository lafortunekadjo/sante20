// src/app/modules/chat/components/conversation-list/conversation-list.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Conversation } from '../../../core/models/conversation.model';
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


@Component({
  selector: 'app-conversation-list',
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
    TranslateModule,
    MatDividerModule],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent {
  @Input() conversations: Conversation[] = [];
  @Input() selectedConversation: Conversation | null = null;
  @Input() loading = false;
  
  @Output() conversationSelected = new EventEmitter<Conversation>();

  selectConversation(conversation: Conversation): void {
    this.conversationSelected.emit(conversation);
  }

  getConversationTitle(conversation: Conversation): string {
    if (conversation.titre) {
      return conversation.titre;
    }
    
    // Pour les conversations privées, afficher le nom de l'autre utilisateur
    if (conversation.type === 'PRIVATE' && conversation.participants.length === 2) {
      // Supposons que getCurrentUserId() retourne l'ID de l'utilisateur courant
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== this.getCurrentUserId()
      );
      return otherParticipant 
        ? `${otherParticipant.user.nom} ${otherParticipant.user.prenom}`
        : 'Conversation privée';
    }
    
    return 'Conversation de groupe';
  }

  getConversationImage(conversation: Conversation): string {
    if (conversation.imageUrl) {
      return conversation.imageUrl;
    }
    
    // Pour les conversations privées, afficher la photo de l'autre utilisateur
    if (conversation.type === 'PRIVATE' && conversation.participants.length === 2) {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== this.getCurrentUserId()
      );
      return otherParticipant?.user.photoUrl || 'assets/default-avatar.png';
    }
    
    return 'assets/default-group.png';
  }

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
    
    return msg.content.length > 50 
      ? msg.content.substring(0, 50) + '...'
      : msg.content;
  }

  getLastMessageTime(conversation: Conversation): string {
    if (!conversation.lastMessage) {
      return '';
    }
    
    const date = new Date(conversation.lastMessage.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  }

  private getCurrentUserId(): number {
    // Récupérer depuis le service d'authentification
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.id;
  }
}