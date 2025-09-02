import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Contribution } from '../../../../core/models/contribution.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contribution-dialog',
  imports: [FormsModule,CommonModule],
  templateUrl: './contribution-dialog.component.html',
  styleUrl: './contribution-dialog.component.scss'
})
export class ContributionDialogComponent {
constructor(
    public dialogRef: MatDialogRef<ContributionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { contributions: Contribution[], total: number }
  ) {}
}
