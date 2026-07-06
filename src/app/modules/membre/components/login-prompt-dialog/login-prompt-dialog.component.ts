import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { GroupePublic } from '../../../../core/models/groupe-explorer.model';

@Component({
  selector: 'app-login-prompt-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './login-prompt-dialog.component.html',
  styleUrl: './login-prompt-dialog.component.scss'
})
export class LoginPromptDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LoginPromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { groupe: GroupePublic }
  ) {}

  login():  void { this.dialogRef.close('login');   }
  signup(): void { this.dialogRef.close('signup');  }
  cancel(): void { this.dialogRef.close();          }
}