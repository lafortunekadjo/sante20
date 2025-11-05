// src/app/modules/chat/components/group-chat-dialog/group-chat-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { User } from '../../../core/models/user';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
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
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ConversationListComponent } from '../conversation-list/conversation-list.component';


export interface GroupChatDialogData {
  groupMembers: User[];
}

@Component({
  selector: 'app-group-chat-dialog',
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
    MatDividerModule],
  templateUrl: './group-chat-dialog.component.html',
  styleUrls: ['./group-chat-dialog.component.scss']
})
export class GroupChatDialogComponent implements OnInit {
  chatForm: FormGroup;
  allMembers: User[] = [];
  selectedMembers: User[] = [];
  selectedAdmins: User[] = [];
  searchControl = new FormControl('');
  filteredMembers: User[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GroupChatDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GroupChatDialogData
  ) {
    this.allMembers = data.groupMembers || [];
    this.filteredMembers = [...this.allMembers];

    this.chatForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    // Filtrer les membres en fonction de la recherche
    this.searchControl.valueChanges.subscribe(searchTerm => {
      this.filterMembers(searchTerm || '');
    });
  }

  private filterMembers(searchTerm: string): void {
    if (!searchTerm || searchTerm.length < 2) {
      this.filteredMembers = this.allMembers.filter(
        member => !this.selectedMembers.find(m => m.id === member.id)
      );
      return;
    }

    const search = searchTerm.toLowerCase().trim();
    
    this.filteredMembers = this.allMembers.filter(member => {
      const fullName = `${member.username}`.toLowerCase();
      const email = member.email.toLowerCase();
      const isNotSelected = !this.selectedMembers.find(m => m.id === member.id);
      
      return isNotSelected && (fullName.includes(search) || email.includes(search));
    });
  }

  selectMember(member: User): void {
    if (!this.selectedMembers.find(m => m.id === member.id)) {
      this.selectedMembers.push(member);
      this.filterMembers(this.searchControl.value || '');
      this.searchControl.setValue('');
    }
  }

  removeMember(member: User): void {
    this.selectedMembers = this.selectedMembers.filter(m => m.id !== member.id);
    this.selectedAdmins = this.selectedAdmins.filter(a => a.id !== member.id);
    this.filterMembers(this.searchControl.value || '');
  }

  toggleAdmin(member: User): void {
    const index = this.selectedAdmins.findIndex(a => a.id === member.id);
    if (index === -1) {
      this.selectedAdmins.push(member);
    } else {
      this.selectedAdmins.splice(index, 1);
    }
  }

  isAdmin(member: User): boolean {
    return this.selectedAdmins.some(a => a.id === member.id);
  }

  getUserDisplayName(user: User): string {
    return `${user.username}`;
  }

  createChat(): void {
    if (this.chatForm.valid && this.selectedMembers.length >= 2) {
      const result = {
        titre: this.chatForm.value.titre,
        participantIds: this.selectedMembers.map(m => m.id),
        adminIds: this.selectedAdmins.map(a => a.id)
      };
      this.dialogRef.close(result);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  get canCreate(): boolean {
    return this.chatForm.valid && this.selectedMembers.length >= 2;
  }
}