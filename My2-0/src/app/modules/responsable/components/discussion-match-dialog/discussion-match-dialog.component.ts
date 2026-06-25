// src/app/shared/components/discussion-match-dialog/discussion-match-dialog.component.ts

import { Component, Inject, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';

import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { DiscussionMatch, DiscussionMatchService, MessageDiscussionMatch } from '../../../../core/services/discussion-match.service';

export interface DiscussionMatchDialogData {
  defiMatchId: number;
  groupeEmetteurNom: string;
  groupeCibleNom: string;
  isGroupeCible: boolean; // true si l'utilisateur actuel est du groupe cible
}

@Component({
  selector: 'app-discussion-match-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatCardModule
  ],
  templateUrl: './discussion-match-dialog.component.html',
  styleUrls: ['./discussion-match-dialog.component.scss']
})
export class DiscussionMatchDialogComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  discussion: DiscussionMatch | null = null;
  nouveauMessage = '';
  isLoading = true;
  isSending = false;
  currentUserId: number | null = null;
  
  private refreshSubscription?: Subscription;

  constructor(
    public dialogRef: MatDialogRef<DiscussionMatchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DiscussionMatchDialogData,
    private discussionService: DiscussionMatchService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.chargerDiscussion();
    
    // Rafraîchir les messages toutes les 5 secondes
    this.refreshSubscription = interval(5000).pipe(
      switchMap(() => {
        if (this.discussion) {
          return this.discussionService.getDiscussion(this.discussion.id);
        }
        return [];
      })
    ).subscribe({
      next: (discussion: any) => {
        if (discussion && this.discussion) {
          const anciennesTaille = this.discussion.messages.length;
          this.discussion = discussion;
          
          // Scroller si nouveaux messages
          if (discussion.messages.length > anciennesTaille) {
            setTimeout(() => this.scrollToBottom(), 100);
          }
        }
      },
      error: (err) => console.error('Erreur rafraîchissement:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  chargerDiscussion(): void {
    this.isLoading = true;
    
    this.discussionService.creerOuRecupererDiscussion(this.data.defiMatchId).subscribe({
      next: (discussion) => {
        this.discussion = discussion;
        this.isLoading = false;
        
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('Erreur chargement discussion:', err);
        this.snackBar.open('Erreur lors du chargement de la discussion', 'Fermer', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  envoyerMessage(): void {
    if (!this.nouveauMessage.trim() || !this.discussion) {
      return;
    }

    this.isSending = true;

    this.discussionService.envoyerMessage({
      discussionId: this.discussion.id,
      contenu: this.nouveauMessage.trim()
    }).subscribe({
      next: (message) => {
        if (this.discussion) {
          this.discussion.messages.push(message);
          this.nouveauMessage = '';
          this.isSending = false;
          
          setTimeout(() => this.scrollToBottom(), 100);
        }
      },
      error: (err) => {
        console.error('Erreur envoi message:', err);
        this.snackBar.open('Erreur lors de l\'envoi du message', 'Fermer', {
          duration: 3000
        });
        this.isSending = false;
      }
    });
  }

  estMonMessage(message: MessageDiscussionMatch): boolean {
    return message.auteurId === this.currentUserId;
  }

  getAutreGroupe(): string {
    if (!this.discussion) return '';
    
    return this.data.isGroupeCible 
      ? this.discussion.groupeEmetteur.nom 
      : this.discussion.groupeCible.nom;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Erreur scroll:', err);
    }
  }

  fermer(): void {
    this.dialogRef.close();
  }
}