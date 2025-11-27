// excel-import-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { 
  ExcelImportService, 
  ExcelRowData, 
  ImportResult, 
  ImportError 
} from '../../../../core/services/excel-import.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

interface DialogData {
  equipes?: any[];
}

@Component({
  selector: 'app-excel-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatStepperModule,
    MatTableModule,
    MatChipsModule,
    MatCardModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ],
  template: `
    <div class="import-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>upload_file</mat-icon>
          Importer des membres depuis Excel
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Stepper -->
      <mat-stepper #stepper linear="false" class="import-stepper">
        
        <!-- Étape 1: Sélection du fichier -->
        <mat-step label="Sélection du fichier" [completed]="selectedFile !== null">
          <div class="step-content">
            <div class="file-upload-zone" 
                 [class.dragover]="isDragOver"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)"
                 (click)="fileInput.click()">
              
              <input #fileInput
                     type="file"
                     accept=".xlsx,.xls"
                     (change)="onFileSelected($event)"
                     style="display: none;">
              
              <div class="upload-content">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <h3>Glissez votre fichier Excel ici</h3>
                <p>ou cliquez pour sélectionner un fichier</p>
                <small>Formats acceptés: .xlsx, .xls</small>
              </div>
            </div>

            <div *ngIf="selectedFile" class="file-info">
              <mat-icon>description</mat-icon>
              <span>{{ selectedFile.name }}</span>
              <span class="file-size">({{ getFileSize(selectedFile.size) }})</span>
              <button mat-icon-button (click)="removeFile()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="template-section">
              <h4>Besoin d'un template ?</h4>
              <p>Téléchargez notre modèle Excel avec les colonnes requises</p>
              <button mat-stroked-button (click)="downloadTemplate()">
                <mat-icon>download</mat-icon>
                Télécharger le template
              </button>
            </div>

            <div class="step-actions">
              <button mat-raised-button 
                      color="primary"
                      [disabled]="!selectedFile || isProcessing"
                      (click)="parseFile(); stepper.next()">
                <mat-icon>visibility</mat-icon>
                Prévisualiser
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Étape 2: Prévisualisation -->
        <mat-step label="Prévisualisation" [completed]="previewData.length > 0">
          <div class="step-content">
            <div *ngIf="isProcessing" class="loading-state">
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
              <p>Analyse du fichier...</p>
            </div>

            <div *ngIf="!isProcessing && previewData.length > 0">
              <div class="preview-summary">
                <h4>Aperçu des données</h4>
                <div class="summary-chips">
                  <mat-chip-set>
                    <mat-chip>
                      <mat-icon>people</mat-icon>
                      {{ previewData.length }} ligne(s)
                    </mat-chip>
                    <mat-chip color="accent" *ngIf="validRows > 0">
                      <mat-icon>check_circle</mat-icon>
                      {{ validRows }} valide(s)
                    </mat-chip>
                    <mat-chip color="warn" *ngIf="errorRows > 0">
                      <mat-icon>error</mat-icon>
                      {{ errorRows }} erreur(s)
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>

              <!-- Table de prévisualisation -->
              <div class="preview-table-container">
                <table mat-table [dataSource]="previewData" class="preview-table">
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let row; let i = index">
                      <mat-icon [color]="getRowValidationStatus(row).color" 
                               [matTooltip]="getRowValidationStatus(row).message">
                        {{ getRowValidationStatus(row).icon }}
                      </mat-icon>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="nom">
                    <th mat-header-cell *matHeaderCellDef>Nom *</th>
                    <td mat-cell *matCellDef="let row">
                      <span [class.error-field]="!row.nom">{{ row.nom || '-' }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="prenom">
                    <th mat-header-cell *matHeaderCellDef>Prénom *</th>
                    <td mat-cell *matCellDef="let row">
                      <span [class.error-field]="!row.prenom">{{ row.prenom || '-' }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="sexe">
                    <th mat-header-cell *matHeaderCellDef>Sexe *</th>
                    <td mat-cell *matCellDef="let row">
                      <span [class.error-field]="!row.sexe || !['masculin', 'feminin'].includes(row.sexe)">
                        {{ row.sexe || '-' }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="email">
                    <th mat-header-cell *matHeaderCellDef>Email</th>
                    <td mat-cell *matCellDef="let row">{{ row.email || '-' }}</td>
                  </ng-container>

                  <ng-container matColumnDef="telephone">
                    <th mat-header-cell *matHeaderCellDef>Téléphone</th>
                    <td mat-cell *matCellDef="let row">{{ row.telephone || '-' }}</td>
                  </ng-container>

                  <ng-container matColumnDef="poste">
                    <th mat-header-cell *matHeaderCellDef>Poste</th>
                    <td mat-cell *matCellDef="let row">{{ row.poste || '-' }}</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                      [class.error-row]="!isRowValid(row)"></tr>
                </table>
              </div>

              <!-- Erreurs de validation -->
              <div *ngIf="validationErrors.length > 0" class="validation-errors">
                <h4>
                  <mat-icon color="warn">warning</mat-icon>
                  Erreurs de validation
                </h4>
                <div class="error-list">
                  <mat-card *ngFor="let error of validationErrors" class="error-card">
                    <div class="error-content">
                      <span class="error-row">Ligne {{ error.row }}</span>
                      <span class="error-field" *ngIf="error.field">{{ error.field }}</span>
                      <span class="error-message">{{ error.message }}</span>
                    </div>
                  </mat-card>
                </div>
              </div>
            </div>

            <div class="step-actions">
              <button mat-button (click)="stepper.previous()">Retour</button>
              <button mat-raised-button 
                      color="primary"
                      [disabled]="validRows === 0 || isImporting"
                      (click)="startImport(); stepper.next()">
                <mat-icon>upload</mat-icon>
                Importer {{ validRows }} membre(s)
              </button>
            </div>
          </div>
        </mat-step>

        <!-- Étape 3: Importation -->
        <mat-step label="Importation">
          <div class="step-content">
            <div *ngIf="isImporting" class="import-progress">
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
              <p>Importation en cours...</p>
              <small>Création des comptes utilisateurs et des membres</small>
            </div>

            <div *ngIf="!isImporting && importResult" class="import-results">
              <div class="result-header">
                <mat-icon [color]="importResult.errorCount === 0 ? 'primary' : 'warn'"
                         class="result-icon">
                  {{ importResult.errorCount === 0 ? 'check_circle' : 'warning' }}
                </mat-icon>
                <h3>Importation terminée</h3>
              </div>

              <div class="result-summary">
                <div class="result-stats">
                  <div class="stat-card success">
                    <mat-icon>check_circle</mat-icon>
                    <span class="stat-number">{{ importResult.successCount }}</span>
                    <span class="stat-label">Succès</span>
                  </div>
                  <div class="stat-card error" *ngIf="importResult.errorCount > 0">
                    <mat-icon>error</mat-icon>
                    <span class="stat-number">{{ importResult.errorCount }}</span>
                    <span class="stat-label">Erreurs</span>
                  </div>
                  <div class="stat-card total">
                    <mat-icon>people</mat-icon>
                    <span class="stat-number">{{ importResult.totalRows }}</span>
                    <span class="stat-label">Total</span>
                  </div>
                </div>
              </div>

              <!-- Erreurs d'importation -->
              <div *ngIf="importResult.errors.length > 0" class="import-errors">
                <h4>
                  <mat-icon color="warn">error</mat-icon>
                  Erreurs d'importation
                </h4>
                <div class="error-list">
                  <mat-card *ngFor="let error of importResult.errors" class="error-card">
                    <div class="error-content">
                      <span class="error-row">Ligne {{ error.row }}</span>
                      <span class="error-message">{{ error.message }}</span>
                      <div class="error-data" *ngIf="error.data">
                        <small>{{ error.data.nom }} {{ error.data.prenom }}</small>
                      </div>
                    </div>
                  </mat-card>
                </div>
              </div>
            </div>

            <div class="step-actions">
              <button mat-button (click)="stepper.previous()" [disabled]="isImporting">
                Retour
              </button>
              <button mat-raised-button 
                      color="primary"
                      [mat-dialog-close]="importResult"
                      [disabled]="isImporting">
                <mat-icon>done</mat-icon>
                Terminer
              </button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styleUrls: ['./excel-import-dialog.component.scss']
})
export class ExcelImportDialogComponent implements OnInit {
  selectedFile: File | null = null;
  isDragOver = false;
  isProcessing = false;
  isImporting = false;
  
  previewData: ExcelRowData[] = [];
  validationErrors: ImportError[] = [];
  validRows = 0;
  errorRows = 0;
  
  importResult: ImportResult | null = null;
  
  displayedColumns = ['status', 'nom', 'prenom', 'sexe', 'email', 'telephone', 'poste'];

  constructor(
    private dialogRef: MatDialogRef<ExcelImportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private excelImportService: ExcelImportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  // ===== GESTION DU FICHIER =====
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File): void {
    // Vérifier le type de fichier
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      this.snackBar.open('Format de fichier non supporté. Utilisez .xlsx ou .xls', 'Fermer', {
        duration: 4000
      });
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Le fichier est trop volumineux (max 5MB)', 'Fermer', {
        duration: 4000
      });
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewData = [];
    this.validationErrors = [];
    this.resetCounts();
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // ===== PARSING ET VALIDATION =====
  parseFile(): void {
    if (!this.selectedFile) return;
    
    this.isProcessing = true;
    this.resetCounts();
    
    this.excelImportService.parseExcelFile(this.selectedFile).subscribe({
      next: (data) => {
        this.previewData = data;
        this.validatePreviewData();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Erreur lors du parsing:', error);
        this.snackBar.open(
          'Erreur lors de la lecture du fichier: ' + error.message,
          'Fermer',
          { duration: 5000 }
        );
        this.isProcessing = false;
      }
    });
  }

  validatePreviewData(): void {
    const equipes = this.data.equipes || [];
    this.validationErrors = [];
    let validCount = 0;

    this.previewData.forEach((row, index) => {
      const errors = this.validateRow(row, index + 2, equipes);
      if (errors.length === 0) {
        validCount++;
      } else {
        this.validationErrors.push(...errors);
      }
    });

    this.validRows = validCount;
    this.errorRows = this.previewData.length - validCount;
  }

  validateRow(row: ExcelRowData, rowIndex: number, equipes: any[]): ImportError[] {
    const errors: ImportError[] = [];

    // Validation des champs obligatoires
    if (!row.nom?.trim()) {
      errors.push({
        row: rowIndex,
        field: 'nom',
        message: 'Le nom est obligatoire',
        data: row
      });
    }

    if (!row.prenom?.trim()) {
      errors.push({
        row: rowIndex,
        field: 'prenom',
        message: 'Le prénom est obligatoire',
        data: row
      });
    }

    if (!row.sexe || !['masculin', 'feminin'].includes(row.sexe)) {
      errors.push({
        row: rowIndex,
        field: 'sexe',
        message: 'Le sexe doit être "masculin" ou "feminin"',
        data: row
      });
    }

    return errors;
  }

  isRowValid(row: ExcelRowData): boolean {
    return !!(row.nom?.trim() && row.prenom?.trim() && 
             row.sexe && ['masculin', 'feminin'].includes(row.sexe));
  }

  getRowValidationStatus(row: ExcelRowData): { icon: string; color: string; message: string } {
    if (this.isRowValid(row)) {
      return {
        icon: 'check_circle',
        color: 'primary',
        message: 'Données valides'
      };
    } else {
      return {
        icon: 'error',
        color: 'warn',
        message: 'Erreurs de validation'
      };
    }
  }

  // ===== IMPORTATION =====
  startImport(): void {
    if (this.validRows === 0) return;
    
    this.isImporting = true;
    
    // Filtrer uniquement les lignes valides
    const validData = this.previewData.filter(row => this.isRowValid(row));
    
    this.excelImportService.importMembers(validData, this.data.equipes || []).subscribe({
      next: (result) => {
        this.importResult = result;
        this.isImporting = false;
        
        if (result.successCount > 0) {
          this.snackBar.open(
            `${result.successCount} membre(s) importé(s) avec succès`,
            'Fermer',
            { duration: 4000 }
          );
        }
      },
      error: (error) => {
        console.error('Erreur lors de l\'importation:', error);
        this.snackBar.open(
          'Erreur lors de l\'importation: ' + error.message,
          'Fermer',
          { duration: 5000 }
        );
        this.isImporting = false;
      }
    });
  }

  // ===== UTILITAIRES =====
  downloadTemplate(): void {
    this.excelImportService.generateTemplate();
    this.snackBar.open('Template téléchargé', 'Fermer', { duration: 3000 });
  }

  resetCounts(): void {
    this.validRows = 0;
    this.errorRows = 0;
  }
}