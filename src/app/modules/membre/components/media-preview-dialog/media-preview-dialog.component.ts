import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-media-preview-dialog',
  imports: [FormsModule,CommonModule],
  templateUrl: './media-preview-dialog.component.html',
  styleUrl: './media-preview-dialog.component.scss'
})
export class MediaPreviewDialogComponent {
   constructor(
    public dialogRef: MatDialogRef<MediaPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { matchId: number; mediaUrl: string }
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

}
