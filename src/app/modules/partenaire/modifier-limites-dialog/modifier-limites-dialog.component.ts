// ============================================================
// DIALOG - MODIFIER LIMITES
// ============================================================

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { PartenaireDTO } from '../../../core/models/partenaire.model';



@Component({
  selector: 'app-modifier-limites-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>tune</mat-icon>
      Modifier les limites
    </h2>
    
    <mat-dialog-content>
      <p class="dialog-description">
        Ajustez les limites pour <strong>{{ data.partenaire.nom }}</strong>
      </p>
      
      <form [formGroup]="form">
        <!-- Max Entreprises -->
        <div class="limit-field">
          <div class="limit-header">
            <mat-icon>business</mat-icon>
            <span class="limit-label">Nombre maximum d'entreprises</span>
          </div>
          <div class="limit-control">
            <mat-slider min="1" max="50" step="1" showTickMarks discrete>
              <input matSliderThumb formControlName="maxEntreprises">
            </mat-slider>
            <span class="limit-value">{{ form.get('maxEntreprises')?.value }}</span>
          </div>
          <p class="limit-hint">
            Actuellement: {{ data.partenaire.nombreEntreprises || 0 }} / {{ data.partenaire.maxEntreprises }}
          </p>
        </div>

        <!-- Max Publicités -->
        <div class="limit-field">
          <div class="limit-header">
            <mat-icon>campaign</mat-icon>
            <span class="limit-label">Nombre maximum de publicités actives</span>
          </div>
          <div class="limit-control">
            <mat-slider min="1" max="100" step="1" showTickMarks discrete>
              <input matSliderThumb formControlName="maxPublicites">
            </mat-slider>
            <span class="limit-value">{{ form.get('maxPublicites')?.value }}</span>
          </div>
          <p class="limit-hint">
            Actuellement: {{ data.partenaire.nombrePublicitesActives || 0 }} / {{ data.partenaire.maxPublicitesActives }}
          </p>
        </div>
      </form>

      <!-- Presets rapides -->
      <div class="presets">
        <span class="presets-label">Presets rapides:</span>
        <button mat-stroked-button (click)="applyPreset('basic')">Basic</button>
        <button mat-stroked-button (click)="applyPreset('standard')">Standard</button>
        <button mat-stroked-button (click)="applyPreset('premium')">Premium</button>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="form.invalid">
        <mat-icon>check</mat-icon>
        Appliquer
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
      min-width: 400px;
    }
    
    .dialog-description {
      margin: 0 0 24px;
      color: var(--text-secondary);
    }
    
    .limit-field {
      margin-bottom: 24px;
      padding: 16px;
      background-color: var(--background-secondary);
      border-radius: 10px;
    }
    
    .limit-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      
      mat-icon {
        color: var(--primary-color);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      
      .limit-label {
        font-weight: 500;
        color: var(--text-primary);
      }
    }
    
    .limit-control {
      display: flex;
      align-items: center;
      gap: 16px;
      
      mat-slider {
        flex: 1;
      }
      
      .limit-value {
        min-width: 40px;
        padding: 8px 12px;
        background-color: var(--background-primary);
        border-radius: 6px;
        font-weight: 600;
        font-size: 1.125rem;
        color: var(--primary-color);
        text-align: center;
      }
    }
    
    .limit-hint {
      margin: 8px 0 0;
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }
    
    .presets {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
      
      .presets-label {
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }
      
      button {
        font-size: 0.75rem;
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
export class ModifierLimitesDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModifierLimitesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { partenaire: PartenaireDTO }
  ) {
    this.form = this.fb.group({
      maxEntreprises: [data.partenaire.maxEntreprises || 5, [Validators.required, Validators.min(1)]],
      maxPublicites: [data.partenaire.maxPublicitesActives || 10, [Validators.required, Validators.min(1)]]
    });
  }

  applyPreset(preset: 'basic' | 'standard' | 'premium'): void {
    const presets = {
      basic: { maxEntreprises: 1, maxPublicites: 3 },
      standard: { maxEntreprises: 3, maxPublicites: 10 },
      premium: { maxEntreprises: 50, maxPublicites: 100 }
    };

    this.form.patchValue(presets[preset]);
  }

  onConfirm(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        maxEntreprises: this.form.value.maxEntreprises,
        maxPublicites: this.form.value.maxPublicites
      });
    }
  }
}