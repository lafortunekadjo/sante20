import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-video-upload-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './video-upload-dialog.component.html',
  styleUrls: ['./video-upload-dialog.component.scss'] // Ajoute ton fichier de style si existant
})
export class VideoUploadDialogComponent {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<VideoUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { username: string }
  ) {
    this.uploadForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      adversaire: [''],
      description: ['']
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validation optionnelle de taille de sécurité (Ex: 60Mo max)
      if (file.size > 60 * 1024 * 1024) {
        this.snackBar.open('La vidéo est trop lourde (Max 60 Mo)', 'Fermer', { duration: 4000 });
        return;
      }
      this.selectedFile = file;
    }
  }

  onSubmit(): void {
    if (this.uploadForm.invalid || !this.selectedFile) return;

    this.isUploading = true;

    // Construction du FormData requis par le backend Spring Boot pour intercepter le fichier + strings
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('titre', this.uploadForm.get('titre')?.value);
    formData.append('adversaire', this.uploadForm.get('adversaire')?.value || '');
    formData.append('description', this.uploadForm.get('description')?.value || '');

    this.profileService.uploadPlayerVideo(this.data.username, formData).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.dialogRef.close(response); // Renvoie l'objet VideoHighlight créé au composant appelant
      },
      error: (err) => {
        console.error('Erreur lors du téléversement du highlight', err);
        this.snackBar.open('Erreur lors de l\'envoi de la vidéo au serveur', 'Fermer', { duration: 4000 });
        this.isUploading = false;
      }
    });
  }
}