import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Imports des modules Angular Material nécessaires pour le formulaire
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-validation-match-dialog',
  standalone: true, // 🔥 Déclaration en mode Standalone
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule // Requis pour le fonctionnement du matDatepicker
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>⚽ Validation du Match Amical</h2>
      
      <form [formGroup]="validationForm" mat-dialog-content class="form-content">
        <p class="subtitle">Veuillez confirmer ou ajuster les informations finales du match avant la création officielle.</p>

        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Date du match</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="dateMatch">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Heure du match</mat-label>
            <input matInput type="time" formControlName="heureMatch">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Lieu / Stade</mat-label>
          <mat-icon matPrefix>place</mat-icon>
          <input matInput formControlName="lieu">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Commentaire ou consignes (Optionnel)</mat-label>
          <textarea matInput rows="3" formControlName="commentaire" placeholder="Ex: Rendez-vous 30 min avant le coup d'envoi..."></textarea>
        </mat-form-field>
      </form>

      <div mat-dialog-actions class="actions">
        <button mat-button (click)="onCancel()">Annuler</button>
        <button mat-raised-button color="primary" [disabled]="validationForm.invalid" (click)="onConfirm()">
          Confirmer & Créer le match
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container { padding: 12px; max-width: 500px; }
    .form-content { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { width: 100%; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `]
})
export class ValidationMatchDialogComponent {
  validationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ValidationMatchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

 // Valeurs par défaut initiales
  let dateParDefaut: Date | string = new Date();
  let heureParDefaut = '06:00';


  // Si une date combinée est reçue (ex: "2026-06-25 14:00:00" ou "2026-06-25T14:00:00")
  if (data.demande?.dateProposee) {
    const dateBrute = data.demande.dateProposee; // Ta chaîne brute
    console.log("Date brute reçue :", dateBrute);

    // 1. On normalise le format en remplaçant l'espace par un 'T' si nécessaire
    const dateNormalisee = typeof dateBrute === 'string' ? dateBrute.replace(' ', 'T') : dateBrute;
    
    // 2. On crée un vrai objet Date JavaScript basé sur cette chaîne
    const objetDate = new Date(dateNormalisee);

    // 3. On vérifie que la date est valide (pour éviter le "Invalid Date")
    if (!isNaN(objetDate.getTime())) {
      dateParDefaut = objetDate; // Prêt pour le MatDatepicker

      // 4. On extrait l'heure et les minutes de manière ultra propre
      const heures = String(objetDate.getHours()).padStart(2, '0');
      const minutes = String(objetDate.getMinutes()).padStart(2, '0');
      heureParDefaut = `${heures}:${minutes}`; // Donne exactement "14:00"
    }
  }

  // Initialisation du formulaire réactif
  this.validationForm = this.fb.group({
    dateMatch: [dateParDefaut, Validators.required],
    heureMatch: [heureParDefaut, Validators.required],
    lieu: [data.demande?.lieuPropose || data.demande?.stade?.nom || '', Validators.required],
    commentaire: [data.demande?.descriptionMessage || '']
  });
}
  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (this.validationForm.valid) {
      this.dialogRef.close(this.validationForm.value);
    }
  }
}