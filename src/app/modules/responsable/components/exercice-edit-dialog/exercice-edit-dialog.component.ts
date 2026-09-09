// exercice-edit-dialog/exercice-edit-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Exercice, FinancesService } from '../../../../core/services/finances.service';

export interface ExerciceEditDialogData {
  exercice: Exercice;
}

@Component({
  selector: 'app-exercice-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './exercice-edit-dialog.component.html',
  styleUrls: ['./exercice-edit-dialog.component.scss']
})
export class ExerciceEditDialogComponent {
  form: FormGroup;
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<ExerciceEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExerciceEditDialogData,
    private fb: FormBuilder,
    private financesService: FinancesService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    const ex = data.exercice;
    this.form = this.fb.group({
      libelle: [ex.libelle, Validators.required],
      annee: [ex.annee, [Validators.required, Validators.min(2000), Validators.max(2100)]],
      dateDebut: [new Date(ex.dateDebut), Validators.required],
      dateFin: [new Date(ex.dateFin), Validators.required]
    });
  }

  /** Recalcule les dates par défaut (1er janvier → 31 décembre) sur la nouvelle année. */
  reinitialiserDatesDepuisAnnee(): void {
    const annee = this.form.get('annee')?.value;
    if (annee) {
      this.form.patchValue({
        dateDebut: new Date(annee, 0, 1),
        dateFin: new Date(annee, 11, 31)
      });
    }
  }

  private formatDate(date: Date): string {
    const datePipe = new DatePipe('fr-FR');
    return datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  enregistrer(): void {
    if (this.form.invalid) return;

    this.isSaving = true;
    const formValue = this.form.value;

    const payload = {
      libelle: formValue.libelle,
      annee: formValue.annee,
      dateDebut: this.formatDate(formValue.dateDebut),
      dateFin: this.formatDate(formValue.dateFin)
    };

    this.financesService.modifierExercice(this.data.exercice.id!, payload).subscribe({
      next: (exercice) => {
        this.isSaving = false;
        this.snackBar.open(
          this.translate.instant('exercice.edit.success'), '✕', { duration: 4000 }
        );
        this.dialogRef.close(exercice);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Erreur modification exercice:', err);
        const message = err.error?.message || this.translate.instant('exercice.edit.error');
        this.snackBar.open(message, '✕', { duration: 5000 });
      }
    });
  }

  annuler(): void {
    this.dialogRef.close();
  }
}