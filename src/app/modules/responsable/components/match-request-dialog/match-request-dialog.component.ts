// src/app/shared/components/match-request-dialog/match-request-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

export interface MatchRequestDialogData {
  groupeId: number;
  groupeNom: string;
}

@Component({
  selector: 'app-match-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    TranslateModule,
   // ✅ Ajout
      ],
      providers: [
    // ✅ SOLUTION : Ajouter ces providers
    MatNativeDateModule,
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' }, // Optionnel : pour le français
  ],
  templateUrl: './match-request-dialog.component.html',
  styleUrls: ['./match-request-dialog.component.scss']
})
export class MatchRequestDialogComponent implements OnInit {
  matchRequestForm!: FormGroup;
  loading = false;
  minDate: Date;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MatchRequestDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: MatchRequestDialogData
  ) {
    this.minDate = new Date();
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);

    this.matchRequestForm = this.fb.group({
      dateProposee: [defaultDate, Validators.required],
      heureProposee: ['15:00', Validators.required],
      lieuPropose: ['', [Validators.required, Validators.minLength(3)]],
      descriptionMessage: ['', [Validators.maxLength(500)]]
    });
  }

  onSubmit(): void {
    if (this.matchRequestForm.invalid) {
      this.snackBar.open(
        'Veuillez remplir tous les champs requis',
        'OK',
        { duration: 3000 }
      );
      return;
    }

    const formValue = this.matchRequestForm.value;

    const dateProposee = new Date(formValue.dateProposee);
    const [hours, minutes] = formValue.heureProposee.split(':');
    dateProposee.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const requestData = {
      groupeCibleId: this.data.groupeId,
      dateProposee: dateProposee.toISOString(),
      lieuPropose: formValue.lieuPropose,
      descriptionMessage: formValue.descriptionMessage || ''
    };

    this.dialogRef.close(requestData);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  get dateProposee() {
    return this.matchRequestForm.get('dateProposee');
  }

  get heureProposee() {
    return this.matchRequestForm.get('heureProposee');
  }

  get lieuPropose() {
    return this.matchRequestForm.get('lieuPropose');
  }

  get descriptionMessage() {
    return this.matchRequestForm.get('descriptionMessage');
  }
}