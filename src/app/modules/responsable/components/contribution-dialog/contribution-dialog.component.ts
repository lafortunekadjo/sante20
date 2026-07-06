import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Contribution, ContributionIndividuelle } from '../../../../core/models/contribution.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-contribution-dialog',
  imports: [FormsModule,CommonModule, MatIconModule],
  templateUrl: './contribution-dialog.component.html',
  styleUrl: './contribution-dialog.component.scss'
})
export class ContributionDialogComponent implements OnInit{
constructor(
    public dialogRef: MatDialogRef<ContributionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { contributions: any[], total: number }
  ) {}

    ngOnInit(): void {
    console.log(this.data);
  }
}
