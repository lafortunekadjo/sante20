// ============================================================
// DIALOG - RENOUVELER CONTRAT
// ============================================================

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { PartenaireDTO } from '../../../core/models/partenaire.model';



@Component({
  selector: 'app-renouveler-contrat-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>autorenew</mat-icon>
      Renouveler le contrat
    </h2>
    
    <mat-dialog-content>
      <p class="dialog-description">
        Renouveler le contrat de <strong>{{ data.partenaire.nom }}</strong>
      </p>
      
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nouvelle date de fin</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="dateFinContrat" [min]="minDate">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error *ngIf="form.get('dateFinContrat')?.hasError('required')">
            La date est requise
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nouveau montant (FCFA)</mat-label>
          <input matInput type="number" formControlName="montant" placeholder="Laisser vide pour garder le montant actuel">
          <mat-icon matPrefix>payments</mat-icon>
          <mat-hint>Montant actuel: {{ data.partenaire.montantContrat | number }} FCFA</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="form.invalid">
        <mat-icon>check</mat-icon>
        Renouveler
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      
      mat-icon {
        color: var(--primary-color);
      }
    }
    
    mat-dialog-content {
      padding: 24px !important;
      min-width: 380px;
    }
    
    .dialog-description {
      margin: 0 0 20px;
      color: var(--text-secondary);
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
      
      button mat-icon {
        margin-right: 8px;
      }
    }
  `]
})
export class RenouvelerContratDialogComponent {
  form: FormGroup;
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RenouvelerContratDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { partenaire: PartenaireDTO }
  ) {
    // Date par défaut: +1 an
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);

    this.form = this.fb.group({
      dateFinContrat: [defaultDate, [Validators.required]],
      montant: [null]
    });
  }

  onConfirm(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        dateFinContrat: this.form.value.dateFinContrat.toISOString(),
        montant: this.form.value.montant || undefined
      });
    }
  }
}