import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { GroupePublic } from '../../../../core/models/groupe-explorer.model';
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-login-prompt-dialog',
  imports: [CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule],
  templateUrl: './login-prompt-dialog.component.html',
  styleUrl: './login-prompt-dialog.component.scss'
})
export class LoginPromptDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LoginPromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { groupe: GroupePublic }
  ) {}

  login(): void {
    this.dialogRef.close('login');
  }

  signup(): void {
    this.dialogRef.close('signup');
  }

  cancel(): void {
    this.dialogRef.close();
  }

}
