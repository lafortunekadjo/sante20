// ============================================================
// DIALOG - REJET PUBLICITÉ
// ============================================================

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PubliciteDTO } from '../../../core/models/partenaire.model';



@Component({
  selector: 'app-rejet-publicite-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="warn">cancel</mat-icon>
      Rejeter la publicité
    </h2>
    
    <mat-dialog-content>
      <div class="pub-preview">
        <div class="pub-image">
          <img *ngIf="data.publicite.imageUrl" [src]="data.publicite.imageUrl" [alt]="data.publicite.titre">
          <mat-icon *ngIf="!data.publicite.imageUrl">image</mat-icon>
        </div>
        <div class="pub-info">
          <span class="pub-title">{{ data.publicite.titre }}</span>
          <span class="pub-meta">{{ data.publicite.entrepriseNom }} • {{ data.publicite.partenaireNom }}</span>
        </div>
      </div>
      
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motif du rejet</mat-label>
          <mat-select formControlName="motifType">
            <mat-option value="IMAGE_NON_CONFORME">Image non conforme</mat-option>
            <mat-option value="CONTENU_INAPPROPRIE">Contenu inapproprié</mat-option>
            <mat-option value="QUALITE_INSUFFISANTE">Qualité insuffisante</mat-option>
            <mat-option value="INFORMATIONS_MANQUANTES">Informations manquantes</mat-option>
            <mat-option value="VIOLATION_REGLES">Violation des règles</mat-option>
            <mat-option value="AUTRE">Autre</mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('motifType')?.hasError('required')">Le motif est requis</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Détails / Message au partenaire</mat-label>
          <textarea matInput formControlName="motifDetails" rows="4" 
            placeholder="Expliquez la raison du rejet pour aider le partenaire à corriger..."></textarea>
          <mat-hint>Ce message sera envoyé au partenaire</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="warn" (click)="onConfirm()" [disabled]="form.invalid">
        <mat-icon>cancel</mat-icon>
        Rejeter
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
    }
    
    mat-dialog-content {
      padding: 24px !important;
      min-width: 400px;
      
      @media (max-width: 500px) {
        min-width: unset;
      }
    }
    
    .pub-preview {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      margin-bottom: 24px;
      background-color: var(--background-secondary);
      border-radius: 10px;
      
      .pub-image {
        width: 80px;
        height: 60px;
        border-radius: 8px;
        overflow: hidden;
        background-color: var(--background-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        mat-icon {
          color: var(--text-tertiary);
        }
      }
      
      .pub-info {
        display: flex;
        flex-direction: column;
        
        .pub-title {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .pub-meta {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }
      }
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
export class RejetPubliciteDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RejetPubliciteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { publicite: PubliciteDTO }
  ) {
    this.form = this.fb.group({
      motifType: ['', [Validators.required]],
      motifDetails: ['']
    });
  }

  onConfirm(): void {
    if (this.form.valid) {
      const motifs: Record<string, string> = {
        'IMAGE_NON_CONFORME': 'Image non conforme aux spécifications',
        'CONTENU_INAPPROPRIE': 'Contenu inapproprié',
        'QUALITE_INSUFFISANTE': 'Qualité visuelle insuffisante',
        'INFORMATIONS_MANQUANTES': 'Informations manquantes',
        'VIOLATION_REGLES': 'Violation des règles publicitaires',
        'AUTRE': 'Autre raison'
      };

      const motifType = this.form.value.motifType;
      const motifDetails = this.form.value.motifDetails?.trim();
      
      let motif = motifs[motifType];
      if (motifDetails) {
        motif += `: ${motifDetails}`;
      }

      this.dialogRef.close({ motif });
    }
  }
}