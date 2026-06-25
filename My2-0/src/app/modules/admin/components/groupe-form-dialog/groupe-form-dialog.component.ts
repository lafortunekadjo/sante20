// ============================================================
// GROUPE FORM DIALOG COMPONENT
// Fichier: src/app/features/admin/components/groupe-form-dialog/groupe-form-dialog.component.ts
// ============================================================

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Groupe } from '../../../../core/models/groupe.model';
import { Ville } from '../../../../core/models/ville';
import { Stade } from '../../../../core/models/stade';

interface DialogData {
  groupe: Groupe | null;
  villes: Ville[];
  stades: Stade[];
  isEdit: boolean;
}

@Component({
  selector: 'app-groupe-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>
          <mat-icon>{{ data.isEdit ? 'edit' : 'add' }}</mat-icon>
          {{ data.isEdit ? 'Modifier le groupe' : 'Créer un groupe' }}
        </h2>
        <button mat-icon-button (click)="onCancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" class="dialog-content">
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nom du groupe</mat-label>
            <input matInput formControlName="nom" placeholder="Ex: FC United Douala">
            <mat-error *ngIf="form.get('nom')?.hasError('required')">Le nom est requis</mat-error>
          </mat-form-field>
        </div>

        <div class="form-row two-columns">
          <mat-form-field appearance="outline">
            <mat-label>Abréviation</mat-label>
            <input matInput formControlName="abreviation" placeholder="Ex: FCUD" maxlength="10">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Discipline</mat-label>
            <input matInput formControlName="discipline" placeholder="Ex: Football">
            <mat-error *ngIf="form.get('discipline')?.hasError('required')">La discipline est requise</mat-error>
          </mat-form-field>
        </div>

        <div class="form-row two-columns">
          <mat-form-field appearance="outline">
            <mat-label>Ville</mat-label>
            <mat-select formControlName="ville">
              <mat-option *ngFor="let ville of data.villes" [value]="ville.id">
                {{ ville.nom }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('ville')?.hasError('required')">La ville est requise</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Stade</mat-label>
            <mat-select formControlName="stade">
              <mat-option *ngFor="let stade of data.stades" [value]="stade.id">
                {{ stade.nom }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('stade')?.hasError('required')">Le stade est requis</mat-error>
          </mat-form-field>
        </div>

        <div class="form-row two-columns">
          <mat-form-field appearance="outline">
            <mat-label>Jour de match</mat-label>
            <mat-select formControlName="jourMatch">
              <mat-option value="Lundi">Lundi</mat-option>
              <mat-option value="Mardi">Mardi</mat-option>
              <mat-option value="Mercredi">Mercredi</mat-option>
              <mat-option value="Jeudi">Jeudi</mat-option>
              <mat-option value="Vendredi">Vendredi</mat-option>
              <mat-option value="Samedi">Samedi</mat-option>
              <mat-option value="Dimanche">Dimanche</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Heure de match</mat-label>
            <input matInput type="time" formControlName="heureMatch">
          </mat-form-field>
        </div>

        <div class="form-row two-columns">
          <mat-form-field appearance="outline">
            <mat-label>Type d'équipe</mat-label>
            <input matInput formControlName="typeEquipe" placeholder="Ex: Amateur">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mode d'équipe</mat-label>
            <mat-select formControlName="modeEquipe">
              <mat-option value="STATIQUE">Statique</mat-option>
              <mat-option value="DYNAMIQUE">Dynamique</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Frais d'adhésion (XAF)</mat-label>
            <input matInput type="number" formControlName="fraisAdhesion" placeholder="0">
            <span matSuffix>XAF</span>
          </mat-form-field>
        </div>

        <div class="form-row checkboxes">
          <mat-checkbox formControlName="isActive" color="primary">
            Groupe actif
          </mat-checkbox>
          <mat-checkbox formControlName="isPublic" color="primary">
            Groupe public (visible dans la recherche)
          </mat-checkbox>
        </div>
      </form>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()">Annuler</button>
        <button mat-raised-button color="primary" 
                [disabled]="form.invalid"
                (click)="onSubmit()">
          <mat-icon>{{ data.isEdit ? 'save' : 'add' }}</mat-icon>
          {{ data.isEdit ? 'Enregistrer' : 'Créer' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 500px;
      max-width: 600px;

      @media (max-width: 768px) {
        min-width: 100%;
      }
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: linear-gradient(135deg, #1a3c6d 0%, #0f2847 100%);
      color: white;
      margin: -24px -24px 0;

      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }

      button {
        color: white;
      }
    }

    .dialog-content {
      padding: 24px 0;
    }

    .form-row {
      margin-bottom: 16px;

      &.two-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;

        @media (max-width: 500px) {
          grid-template-columns: 1fr;
        }
      }

      &.checkboxes {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
      }

      mat-form-field {
        width: 100%;
      }

      .full-width {
        width: 100%;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;

      button {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  `]
})
export class GroupeFormDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GroupeFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const groupe = this.data.groupe;
    
    this.form = this.fb.group({
      id: [groupe?.id || 0],
      nom: [groupe?.nom || '', Validators.required],
      abreviation: [groupe?.abreviation || ''],
      discipline: [groupe?.discipline || '', Validators.required],
      ville: [this.getVilleId(groupe?.ville), Validators.required],
      stade: [this.getStadeId(groupe?.stade)],
      jourMatch: [groupe?.jourMatch || 'Dimanche'],
      heureMatch: [groupe?.heureMatch || ''],
      typeEquipe: [groupe?.typeEquipe || ''],
      modeEquipe: [groupe?.modeEquipes || 'STATIQUE'],
      fraisAdhesion: [groupe?.fraisAdhesion || 0],
      isActive: [groupe?.isActive ?? true],
      isPublic: [groupe?.isPublic ?? true]
    });
  }

  private getVilleId(ville: any): number | null {
    if (!ville) return null;
    return typeof ville === 'object' ? ville.id : ville;
  }

  private getStadeId(stade: any): number | null {
    if (!stade) return null;
    return typeof stade === 'object' ? stade.id : stade;
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      
      // Transformer les IDs en objets si nécessaire
      const groupe = {
        ...formValue,
        ville: formValue.ville,
        stade: formValue.stade
      };
      
      this.dialogRef.close(groupe);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}