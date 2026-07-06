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
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

export interface GroupChatDialogData {
  groupMembers: User[];
}

@Component({
  selector: 'app-group-chat-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatBadgeModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    TranslateModule
  ],
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
    });
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe(term => {
      this.filterMembers(term || '');
    });
  }

  private filterMembers(term: string): void {
    const available = this.allMembers.filter(
      m => !this.selectedMembers.find(s => s.id === m.id)
    );

    if (!term || term.length < 2) {
      this.filteredMembers = available;
      return;
    }

    const q = term.toLowerCase().trim();
    this.filteredMembers = available.filter(m =>
      m.username?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  }

  selectMember(member: User): void {
    if (!this.selectedMembers.find(m => m.id === member.id)) {
      this.selectedMembers = [...this.selectedMembers, member];
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
    const idx = this.selectedAdmins.findIndex(a => a.id === member.id);
    if (idx === -1) {
      this.selectedAdmins = [...this.selectedAdmins, member];
    } else {
      this.selectedAdmins = this.selectedAdmins.filter(a => a.id !== member.id);
    }
  }

  isAdmin(member: User): boolean {
    return this.selectedAdmins.some(a => a.id === member.id);
  }

  getUserDisplayName(user: User): string {
    return user.username || `${user.username || ''}`.trim() || 'Membre';
  }

  createChat(): void {
    if (!this.canCreate) return;
    this.dialogRef.close({
      titre: this.chatForm.value.titre,
      participantIds: this.selectedMembers.map(m => m.id),
      adminIds: this.selectedAdmins.map(a => a.id)
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  get canCreate(): boolean {
    return this.chatForm.valid && this.selectedMembers.length >= 2;
  }
}