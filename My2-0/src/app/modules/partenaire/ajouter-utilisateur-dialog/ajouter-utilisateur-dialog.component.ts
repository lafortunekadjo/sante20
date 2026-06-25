// ============================================================
// DIALOG - AJOUTER UTILISATEUR
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
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-ajouter-utilisateur-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>person_add</mat-icon>
      Ajouter un utilisateur
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Prénom *</mat-label>
            <input matInput formControlName="prenom" placeholder="Prénom">
            <mat-icon matPrefix>person</mat-icon>
            <mat-error *ngIf="form.get('prenom')?.hasError('required')">Requis</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nom *</mat-label>
            <input matInput formControlName="nom" placeholder="Nom">
            <mat-icon matPrefix>person</mat-icon>
            <mat-error *ngIf="form.get('nom')?.hasError('required')">Requis</mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email *</mat-label>
          <input matInput type="email" formControlName="email" placeholder="email@exemple.com">
          <mat-icon matPrefix>email</mat-icon>
          <mat-error *ngIf="form.get('email')?.hasError('required')">L'email est requis</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Format invalide</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Téléphone</mat-label>
          <input matInput formControlName="telephone" placeholder="+237 6XX XXX XXX">
          <mat-icon matPrefix>phone</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Rôle *</mat-label>
          <mat-select formControlName="role">
            <mat-option value="ADMIN">
              <div class="role-option">
                <mat-icon>admin_panel_settings</mat-icon>
                <div>
                  <strong>Administrateur</strong>
                  <span>Accès complet à toutes les fonctionnalités</span>
                </div>
              </div>
            </mat-option>
            <mat-option value="EDITEUR">
              <div class="role-option">
                <mat-icon>edit</mat-icon>
                <div>
                  <strong>Éditeur</strong>
                  <span>Peut créer et modifier les publicités</span>
                </div>
              </div>
            </mat-option>
            <mat-option value="LECTEUR">
              <div class="role-option">
                <mat-icon>visibility</mat-icon>
                <div>
                  <strong>Lecteur</strong>
                  <span>Consultation uniquement</span>
                </div>
              </div>
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('role')?.hasError('required')">Le rôle est requis</mat-error>
        </mat-form-field>

        <div class="checkbox-field">
          <mat-checkbox formControlName="envoyerCredentials" color="primary">
            Envoyer les identifiants par email
          </mat-checkbox>
          <p class="checkbox-hint">
            L'utilisateur recevra un email avec ses identifiants de connexion
          </p>
        </div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="form.invalid">
        <mat-icon>person_add</mat-icon>
        Ajouter
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
      min-width: 450px;
      
      @media (max-width: 600px) {
        min-width: unset;
      }
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      
      @media (max-width: 500px) {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
    
    .full-width {
      width: 100%;
    }
    
    mat-form-field {
      margin-bottom: 8px;
    }
    
    .role-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;
      
      mat-icon {
        color: var(--primary-color);
      }
      
      div {
        display: flex;
        flex-direction: column;
        
        strong {
          font-size: 0.875rem;
        }
        
        span {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      }
    }
    
    .checkbox-field {
      margin-top: 16px;
      padding: 16px;
      background-color: var(--background-secondary);
      border-radius: 8px;
      
      .checkbox-hint {
        margin: 8px 0 0 32px;
        font-size: 0.75rem;
        color: var(--text-tertiary);
      }
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
export class AjouterUtilisateurDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AjouterUtilisateurDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { partenaireId: number }
  ) {
    this.form = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      role: ['EDITEUR', [Validators.required]],
      envoyerCredentials: [true]
    });
  }

  onConfirm(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        prenom: this.form.value.prenom.trim(),
        nom: this.form.value.nom.trim(),
        email: this.form.value.email.trim(),
        telephone: this.form.value.telephone?.trim() || undefined,
        role: this.form.value.role,
        envoyerCredentials: this.form.value.envoyerCredentials
      });
    }
  }
}