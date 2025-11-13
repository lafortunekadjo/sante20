// src/app/modules/chat/components/match-request-chat-button/match-request-chat-button.component.ts

import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChatService } from '../../../core/services/chat.service';
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
import { routes } from '../../../app.routes';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-match-request-chat-button',
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
  templateUrl: './match-request-chat-button.component.html',
  styleUrls: ['./match-request-chat-button.component.scss']
})
export class MatchRequestChatButtonComponent {
  @Input() matchRequestId!: number;
  @Input() responsableIds: number[] = [];
  @Input() existingConversationId?: number;

  loading = false;

  constructor(
    private chatService: ChatService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  openChat(): void {
    if (this.existingConversationId) {
      // Si la conversation existe déjà, y naviguer directement
      this.router.navigate(['/chat', this.existingConversationId]);
    } else {
      // Créer une nouvelle conversation
      this.createConversation();
    }
  }

  private createConversation(): void {
    this.loading = true;
    
    this.chatService.createMatchRequestConversation(
      this.matchRequestId,
      this.responsableIds
    ).subscribe({
      next: (conversation) => {
        this.loading = false;
        this.router.navigate(['/chat', conversation.id]);
        this.snackBar.open('Conversation créée avec succès', 'OK', { duration: 3000 });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating conversation:', error);
        this.snackBar.open('Erreur lors de la création de la conversation', 'OK', { duration: 3000 });
      }
    });
  }
}