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
import { AuthService } from '../../../core/services/auth.service';
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
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadConversations();
    this.setupWebSocket();
    
    // Écouter les changements de route (navigation entre conversations)
    // On n'agit que si les conversations sont déjà chargées (évite la race condition)
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const conversationId = params['conversationId'];
      if (conversationId && !this.loading) {
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
          this.loading = false;

          // Auto-sélection : si l'URL contient un ID de conversation,
          // on sélectionne maintenant que la liste est chargée
          const idFromUrl = this.route.snapshot.params['conversationId'];
          if (idFromUrl) {
            this.selectConversationById(+idFromUrl);
          }
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
    // 1. Chercher dans la liste déjà chargée
    const existing = this.conversations.find(c => c.id === conversationId);
    if (existing) {
      this.selectConversation(existing); // passe par selectConversation pour mettre à jour l'URL aussi
      return;
    }

    // 2. Pas dans la liste → charger depuis l'API (nouveau chat ou navigation directe)
    this.chatService.getConversationById(conversationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conv) => {
          // Ajouter en tête de liste si absente
          if (!this.conversations.find(c => c.id === conversationId)) {
            this.conversations.unshift(conv);
          }
          // Sélectionner sans re-naviguer (on est déjà sur la bonne URL)
          this.selectedConversation = conv;
        },
        error: () => {
          this.router.navigate(['/chat']);
        }
      });
  }

  onConversationCreated(conversation: Conversation): void {
    if (!this.conversations.find(cv => cv.id === conversation.id)) {
      this.conversations.unshift(conversation);
    }
    this.selectConversation(conversation);
  }

  goBackToList(): void {
    this.selectedConversation = null;
    this.router.navigate(['/chat']);
  }

  getSelectedTitle(): string {
    if (!this.selectedConversation) return '';
    if (this.selectedConversation.titre) return this.selectedConversation.titre;
    const currentId = this.authService?.getUserId?.() ?? 0;
    const other = this.selectedConversation.participants?.find(
      p => p.user.id !== currentId
    );
    return other ? `${other.user.nom} ${other.user.prenom}` : 'Conversation';
  }

  onLastMessageUpdated(event: { conversationId: number; message: any }): void {
    const conv = this.conversations.find(cv => cv.id === event.conversationId);
    if (conv) {
      (conv as any).lastMessage = event.message;
      const idx = this.conversations.indexOf(conv);
      if (idx > 0) {
        this.conversations.splice(idx, 1);
        this.conversations.unshift(conv);
      }
    }
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