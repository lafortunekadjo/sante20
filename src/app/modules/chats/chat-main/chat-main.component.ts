// src/app/modules/chat/components/chat-main/chat-main.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Conversation } from '../../../core/models/conversation.model';
import { ChatService } from '../../../core/services/chat.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { PrivateChatDialogComponent } from '../private-chat-dialog/private-chat-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { routes } from '../../../app.routes';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';
import { ConversationListComponent } from '../conversation-list/conversation-list.component';
import { GroupChatDialogComponent } from '../group-chat-dialog/group-chat-dialog.component';
import { User } from '../../../core/models/user';
import { GroupeService } from '../../../core/services/groupe.service';
import { MembreService } from '../../../core/services/membre.service';
import { Membre } from '../../../core/models/membre.model';
import { ConversationDetailComponent } from '../conversation-detail/conversation-detail.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../core/services/user.service';


@Component({
  selector: 'app-chat-main',
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
    ConversationListComponent,
    ConversationDetailComponent,
    MatDividerModule],
  templateUrl: './chat-main.component.html',
  styleUrls: ['./chat-main.component.scss']
})
export class ChatMainComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  loading = false;
  private destroy$ = new Subject<void>();
    groupMembers: User[] = [];

  constructor(
    private chatService: ChatService,
    private websocketService: WebSocketService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private groupService: GroupeService ,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadConversations();
    this.setupWebSocket();
    
    // Écouter les changements de route
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const conversationId = params['conversationId'];
      if (conversationId) {
        console.log(conversationId)
        this.selectConversationById(+conversationId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConversations(): void {
    this.loading = true;
    this.chatService.getUserConversations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversations) => {
          this.conversations = conversations;
          console.log(conversations)
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading conversations:', error);
          this.loading = false;
        }
      });
  }

/**
   * Configurer la connexion WebSocket
   */
  setupWebSocket(): void {
    console.log('Setting up WebSocket connection...');
    
    // Se connecter au WebSocket
    this.websocketService.connect();
    
    // Écouter l'état de connexion
    this.websocketService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        console.log('WebSocket connection status:', connected ? 'CONNECTED' : 'DISCONNECTED');
        
        if (connected && this.selectedConversation) {
          // Si une conversation est sélectionnée, s'y abonner
          console.log('Resubscribing to current conversation:', this.selectedConversation.id);
        }
      });
  }


  handleMessageNotification(notification: any): void {
    const message = notification.message;
    const conversationId = message.conversationId;
    
    // Mettre à jour la conversation correspondante
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.lastMessage = message;
      conversation.updatedAt = new Date(message.createdAt);
      
      // Si ce n'est pas la conversation active, incrémenter le compteur
      if (!this.selectedConversation || this.selectedConversation.id !== conversationId) {
        conversation.unreadCount++;
      }
      
      // Remonter la conversation en haut de la liste
      this.conversations = [
        conversation,
        ...this.conversations.filter(c => c.id !== conversationId)
      ];
    }
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.router.navigate(['/chat', conversation.id]);
    
    // Marquer comme lu
    if (conversation.unreadCount > 0) {
      this.chatService.markAsRead(conversation.id).subscribe(() => {
        conversation.unreadCount = 0;
      });
    }
  }

  selectConversationById(conversationId: number): void {
    console.log(conversationId)
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (conversation) {
      this.selectedConversation = conversation;
    } else {
      // Charger la conversation depuis le serveur
      this.chatService.getConversationById(conversationId).subscribe({
        next: (conv) => {
          this.selectedConversation = conv;
          // Ajouter à la liste si pas déjà présente
          if (!this.conversations.find(c => c.id === conversationId)) {
            this.conversations.unshift(conv);
          }
        },
        error: (error) => {
          console.error('Error loading conversation:', error);
          this.router.navigate(['/chat']);
        }
      });
    }
  }

  onConversationCreated(conversation: Conversation): void {
    this.conversations.unshift(conversation);
    this.selectConversation(conversation);
  }

//   openPrivateChatDialog(): void {
//   const dialogRef = this.dialog.open(PrivateChatDialogComponent, {
//     width: '500px',
//     maxWidth: '90vw'
//   });

//   dialogRef.afterClosed().subscribe(otherUserId => {
//     if (otherUserId) {
//       this.createPrivateConversation(otherUserId);
//     }
//   });
// }



// private createPrivateConversation(otherUserId: number): void {
//   this.chatService.createPrivateConversation(otherUserId).subscribe({
//     next: (conversation) => {
//       this.onConversationCreated(conversation);
//     },
//     error: (error) => {
//       console.error('Error creating private conversation:', error);
//     }
//   });
// }

// private getCurrentUser(): any {
//     // Récupérer l'utilisateur courant depuis le localStorage ou le service d'auth
//     return JSON.parse(localStorage.getItem('currentUser') || '{}');
//   }

openGroupChatDialog(): void {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser.groupeId) {
      alert('Vous devez faire partie d\'un groupe pour créer une discussion de groupe');
      return;
    }

    // Charger les membres si pas déjà chargés
    if (this.groupMembers.length === 0) {
      this.userService.getAllUsers().subscribe({
        next: (members) => {
          this.groupMembers = members.filter((m: { id: any; }) => m.id !== currentUser.id);
          this.openGroupDialog();
        },
        error: (error) => {
          console.error('Error loading group members:', error);
          alert('Erreur lors du chargement des membres');
        }
      });
    } else {
      this.openGroupDialog();
    }
  }

  private openGroupDialog(): void {
    const dialogRef = this.dialog.open(GroupChatDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        groupMembers: this.groupMembers
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createGroupConversation(result);
      }
    });
  }

  private createGroupConversation(data: any): void {
    this.chatService.createGroupConversation(
      data.titre,
      data.participantIds,
      data.adminIds
    ).subscribe({
      next: (conversation) => {
        this.onConversationCreated(conversation);
      },
      error: (error) => {
        console.error('Error creating group conversation:', error);
        alert('Erreur lors de la création du groupe');
      }
    });
  }


  // src/app/modules/chat/components/chat-main/chat-main.component.ts

openPrivateChatDialog(): void {
  const currentUser = this.getCurrentUser();
  
  // Si les membres ne sont pas encore chargés
  if (this.groupMembers.length === 0) {
    this.loadGroupMembersAndOpenDialog();
  } else {
    this.openPrivateDialog();
  }
}

private loadGroupMembersAndOpenDialog(): void {
  const currentUser = this.getCurrentUser();
  
  this.userService.getAllUsers().subscribe({
    next: (members) => {
      // Exclure l'utilisateur courant
      this.groupMembers = members.filter(m => m.id !== currentUser.id);
      
      if (this.groupMembers.length === 0) {
        this.snackBar.open(
          'Aucun membre disponible pour démarrer une conversation',
          'OK',
          { duration: 3000 }
        );
        return;
      }
      
      this.openPrivateDialog();
    },
    error: (error) => {
      console.error('Error loading group members:', error);
      this.snackBar.open(
        'Erreur lors du chargement des membres',
        'OK',
        { duration: 3000 }
      );
    }
  });
}

private openPrivateDialog(): void {
  const dialogRef = this.dialog.open(PrivateChatDialogComponent, {
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    data: {
      groupMembers: this.groupMembers
    }
  });

  dialogRef.afterClosed().subscribe(otherUserId => {
    if (otherUserId) {
      this.createPrivateConversation(otherUserId);
    }
  });
}

private createPrivateConversation(otherUserId: number): void {
  console.log(otherUserId)
  this.chatService.createPrivateConversation(otherUserId).subscribe({
    next: (conversation) => {
      this.snackBar.open('Conversation créée', 'OK', { duration: 2000 });
      this.onConversationCreated(conversation);
    },
    error: (error) => {
      console.error('Error creating private conversation:', error);
      
      // Si la conversation existe déjà
      if (error.status === 409 || error.error?.message?.includes('existe déjà')) {
        this.snackBar.open(
          'Une conversation avec cet utilisateur existe déjà',
          'OK',
          { duration: 3000 }
        );
      } else {
        this.snackBar.open(
          'Erreur lors de la création de la conversation',
          'OK',
          { duration: 3000 }
        );
      }
    }
  });
}

private getCurrentUser(): any {
  return JSON.parse(localStorage.getItem('currentUser') || '{}');
}
}