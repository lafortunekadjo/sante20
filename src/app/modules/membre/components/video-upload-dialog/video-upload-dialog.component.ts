import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileService } from '../../../../core/services/profile.service';


@Component({
  selector: 'app-video-upload-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule, 
    MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="upload-dialog">
      <h2 mat-dialog-title>Ajouter un moment fort du stade</h2>
      <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          
          <div class="file-picker-zone" (click)="fileInput.click()">
            <mat-icon *ngIf="!selectedFile">cloud_upload</mat-icon>
            <mat-icon *ngIf="selectedFile" class="success-icon">check_circle</mat-icon>
            <p *ngIf="!selectedFile">Cliquez pour sélectionner votre vidéo (MP4, MOV)</p>
            <p *ngIf="selectedFile" class="file-name">{{ selectedFile.name }}</p>
            <input #fileInput type="file" accept="video/*" (change)="onFileSelected($event)" style="display:none">
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Titre de l'action</mat-label>
            <input matInput formControlName="titre" placeholder="Ex: Enchaînement roulette + lucarne">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Adversaire (Match du jour)</mat-label>
            <input matInput formControlName="adversaire" placeholder="Ex: vs FC Bonamoussadi">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description / Commentaire</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>

        </mat-dialog-content>
        
        <mat-dialog-actions align="end">
          <button mat-button type="button" mat-dialog-close [disabled]="isUploading">Annuler</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="uploadForm.invalid || !selectedFile || isUploading">
            <mat-spinner diameter="20" *ngIf="isUploading"></mat-spinner>
            <span *ngIf="!isUploading">Publier l'action</span>
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .upload-dialog { padding: 10px; max-width: 450px; }
    .full-width { width: 100%; margin-top: 12px; }
    .file-picker-zone {
      border: 2px dashed #ccc; border-radius: 12px; padding: 30px;
      text-align: center; cursor: pointer; margin-bottom: 15px;
      transition: all 0.2s;
      &:hover { border-color: #1976d2; background: rgba(25, 118, 210, 0.02); }
      mat-icon { font-size: 40px; width:40px; height:40px; color: #666; }
      .success-icon { color: #4caf50; }
      .file-name { font-weight: 600; color: #2e7d32; margin-top: 5px; }
    }
  `]
})
export class VideoUploadDialogComponent {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private dialogRef: MatDialogRef<VideoUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { username: string }
  ) {
    this.uploadForm = this.fb.group({
      titre: ['', Validators.required],
      adversaire: [''],
      description: ['']
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) { this.selectedFile = file; }
  }

  onSubmit(): void {
    if (this.uploadForm.invalid || !this.selectedFile) return;

    this.isUploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('titre', this.uploadForm.get('titre')?.value);
    formData.append('adversaire', this.uploadForm.get('adversaire')?.value || '');
    formData.append('description', this.uploadForm.get('description')?.value || '');
    formData.append('username', this.data.username);

    this.profileService.uploadVideo(formData).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.dialogRef.close(true); // Ferme et signale le succès
      },
      error: (err) => {
        console.error(err);
        this.isUploading = false;
      }
    });
  }
}