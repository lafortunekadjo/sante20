import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, startWith, map } from 'rxjs';
import { User } from '../../../core/models/user';

export interface PrivateChatDialogData {
  groupMembers: User[];
}

@Component({
  selector: 'app-private-chat-dialog',
  templateUrl: './private-chat-dialog.component.html',
  styleUrls: ['./private-chat-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule
  ]
})
export class PrivateChatDialogComponent implements OnInit {
  searchControl = new FormControl('');
  filteredUsers$!: Observable<User[]>;
  selectedUser: User | null = null;
  allMembers: User[] = [];

  constructor(
    private dialogRef: MatDialogRef<PrivateChatDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrivateChatDialogData
  ) {
    this.allMembers = data.groupMembers || [];
        console.log(data)
  }

  ngOnInit(): void {

    this.filteredUsers$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(searchTerm => this.filterUsers(searchTerm || ''))
    );
  }

  private filterUsers(searchTerm: string): User[] {
    if (!searchTerm) {
      return this.allMembers;
    }

    const search = searchTerm.toLowerCase().trim();
    
    return this.allMembers.filter(user => {
      const fullName = `${user.username}`.toLowerCase();
      const email = user.email.toLowerCase();
      
      return fullName.includes(search) || email.includes(search);
    });
  }

  selectUser(user: User): void {
    this.selectedUser = user;
  }

  createChat(): void {
    if (this.selectedUser) {
      this.dialogRef.close(this.selectedUser.id);
    }
  }

  /**
   * Ferme la boîte de dialogue sans renvoyer de données.
   * Résout l'erreur du compilateur : Property 'cancel' does not exist on type 'PrivateChatDialogComponent'
   */
  cancel(): void {
    this.dialogRef.close();
  }

  getUserAvatar(user: User): string {
    return 'assets/images/avatars/default.png';
  }

  getUserDisplayName(user: User): string {
    return user.username;
  }
}