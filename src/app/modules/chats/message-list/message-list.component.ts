// src/app/modules/chat/components/message-list/message-list.component.ts

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { Message } from '../../../core/models/message.model';
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
import { MessageInputComponent } from '../message-input/message-input.component';
import { MessageItemComponent } from '../message-item/message-item.component';


@Component({
  selector: 'app-message-list',
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
    MessageInputComponent,
    MessageItemComponent,
    MatDividerModule],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponent implements AfterViewChecked, OnChanges {
  @Input() messages: Message[] = [];
  @Input() loading = false;
  @Input() hasMore = true;
  
  @Output() loadMore = new EventEmitter<void>();
  
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      const currentLength = this.messages.length;
      // Scroll vers le bas si un nouveau message a été ajouté
      if (currentLength > this.lastMessageCount) {
        this.shouldScrollToBottom = true;
      }
      this.lastMessageCount = currentLength;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = 
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  onScroll(event: any): void {
    const element = event.target;
    
    // Si on scroll vers le haut et qu'on est proche du début
    if (element.scrollTop === 0 && this.hasMore && !this.loading) {
      const currentScrollHeight = element.scrollHeight;
      
      this.loadMore.emit();
      
      // Après le chargement, maintenir la position de scroll
      setTimeout(() => {
        const newScrollHeight = element.scrollHeight;
        element.scrollTop = newScrollHeight - currentScrollHeight;
      }, 100);
    }
  }

  getCurrentUserId(): number {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.id;
  }

  isOwnMessage(message: Message): boolean {
    return message.sender?.id === this.getCurrentUserId();
  }

  shouldShowDate(index: number): boolean {
    if (index === 0) return true;
    
    const currentMsg = this.messages[index];
    const prevMsg = this.messages[index - 1];
    
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    
    return currentDate !== prevDate;
  }

  formatDate(date: Date): string {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return messageDate.toLocaleDateString('fr-FR', { 
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }
}