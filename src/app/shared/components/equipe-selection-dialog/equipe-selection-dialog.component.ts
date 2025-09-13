import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Equipe } from '../../../core/models/groupe.model copy';
import { Membre } from '../../../core/models/membre.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-equipe-selection-dialog',
  imports: [CommonModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,
      MatTableModule,
      MatInputModule,
      MatFormFieldModule,
      MatSelectModule,
      MatCheckboxModule,
      MatPaginatorModule,
      MatSortModule,
      MatProgressSpinnerModule,
      MatDialogModule,
      FormsModule, 
      ReactiveFormsModule],
  templateUrl: './equipe-selection-dialog.component.html',
  styleUrl: './equipe-selection-dialog.component.scss'
})
export class EquipeSelectionDialogComponent {
selectedEquipeId: number | null;

  constructor(
    public dialogRef: MatDialogRef<EquipeSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      equipes: Equipe[],
      defaultEquipeId?: number,
      joueur?: Membre
    }
  ) {
    this.selectedEquipeId = data.defaultEquipeId ?? null;
  }

  confirmSelection() {
    const selectedEquipe = this.data.equipes.find(e => e.id === this.selectedEquipeId);
    this.dialogRef.close(selectedEquipe);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
