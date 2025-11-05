// src/app/modules/chat/components/message-input/message-input.component.ts

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { Message } from '../../../core/models/message.model';
import { ChatService } from '../../../core/services/chat.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { CommonModule } from '@angular/common';
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


@Component({
  selector: 'app-message-input',
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
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss']
})
export class MessageInputComponent implements OnDestroy {
  @Input() conversationId!: number;
  @Output() messageSent = new EventEmitter<Message>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('messageTextarea') messageTextarea!: ElementRef<HTMLTextAreaElement>;

  messageControl = new FormControl('');
  selectedFile: File | null = null;
  selectedFilePreview: string | null = null;
  sending = false;
  
  private typingTimeout: any;
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private websocketService: WebSocketService
  ) {
    // Indicateur de frappe
    this.messageControl.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        if (value && value.trim()) {
          this.sendTypingIndicator(true);
          this.resetTypingTimeout();
        }
      });
  }

  ngOnDestroy(): void {
    this.sendTypingIndicator(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendMessage(): void {
    const content = this.messageControl.value?.trim();
    
    if ((!content && !this.selectedFile) || this.sending) {
      return;
    }

    this.sending = true;
    this.sendTypingIndicator(false);

    if (this.selectedFile) {
      // Envoyer avec pièce jointe
      this.chatService.sendMessageWithAttachment(
        this.conversationId,
        content || '',
        this.selectedFile
      ).subscribe({
        next: (message) => {
          this.messageSent.emit(message);
          this.resetInput();
        },
        error: (error) => {
          console.error('Error sending message with attachment:', error);
          this.sending = false;
        }
      });
    } else if (content) {
      console.log("ici")
      this.websocketService.sendMessage(this.conversationId, content);
      this.resetInput();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Vérifier la taille du fichier (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximale : 10MB');
        return;
      }

      this.selectedFile = file;

      // Créer une prévisualisation pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedFilePreview = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.selectedFilePreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Envoyer le message avec Ctrl+Enter ou Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage();
    }
  }

  resetInput(): void {
    this.messageControl.setValue('');
    this.removeSelectedFile();
    this.sending = false;
    
    // Réinitialiser la hauteur du textarea
    if (this.messageTextarea) {
      this.messageTextarea.nativeElement.style.height = 'auto';
    }
  }

  autoResizeTextarea(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }

  private sendTypingIndicator(isTyping: boolean): void {
    this.websocketService.sendTypingIndicator(this.conversationId, isTyping);
  }

  private resetTypingTimeout(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.sendTypingIndicator(false);
    }, 3000);
  }
}