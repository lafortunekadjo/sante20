// media-upload-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../environment';

export interface MediaDialogData {
  matchId: number;
  existingMediaUrls: string[];
}

@Component({
  selector: 'app-media-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './media-upload-dialog.component.html',
  styleUrls: ['./media-upload-dialog.component.scss']
})
export class MediaUploadDialogComponent implements OnInit {
  selectedFiles: File[] = [];
  previews: (string | null)[] = [];
  existingMediaUrls: string[] = [];
  uploadProgress = '';
  uploadProgressValue = 0;
  isError = false;
  isUploading = false;
  isDragOver = false;
  matchId: number;

  constructor(
    public dialogRef: MatDialogRef<MediaUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MediaDialogData,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.matchId = data.matchId;
    // Charger directement les URLs passées en paramètre
    this.existingMediaUrls = data.existingMediaUrls || [];
  }

  ngOnInit(): void {
    // Plus besoin de charger les médias via HTTP, ils sont déjà passés
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    this.addFiles(files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(files);
    }
  }

  private addFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Vérifier le type de fichier
      if (!this.isValidFileType(file)) {
        this.showError(`${file.name} n'est pas un type de fichier valide`);
        continue;
      }

      // Vérifier la taille (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        this.showError(`${file.name} est trop volumineux (max 50MB)`);
        continue;
      }

      this.selectedFiles.push(file);

      // Générer un aperçu pour les images
      if (this.isImage(file)) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previews.push(e.target.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        this.previews.push(null);
      }
    }
  }

  isValidFileType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
    return validTypes.includes(file.type);
  }

  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }

  /**
   * Vérifie si l'URL correspond à une image
   */
  isMediaUrlImage(url: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/) !== null ||
           lowerUrl.includes('/image/');
  }

  /**
   * Vérifie si l'URL correspond à une vidéo
   */
  isMediaUrlVideo(url: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.match(/\.(mp4|avi|mov|webm)(\?.*)?$/) !== null ||
           lowerUrl.includes('/video/');
  }

  /**
   * Retourne l'URL complète du média
   */
  getMediaUrl(url: string): string {
    if (!url) return '';
    
    // Si c'est déjà une URL complète (Cloudinary)
    if (url.startsWith('http')) {
      return url;
    }
    
    // Sinon, c'est un chemin relatif
    return environment.imageUrl + url;
  }

  /**
   * Extrait le nom du fichier depuis l'URL
   */
  getFilenameFromUrl(url: string): string {
    if (!url) return 'media';
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'media';
      // Retirer l'extension de version Cloudinary si présente
      return filename.split('?')[0];
    } catch {
      return url.split('/').pop() || 'media';
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previews.splice(index, 1);
  }

  clearAllFiles(): void {
    this.selectedFiles = [];
    this.previews = [];
    this.uploadProgress = '';
    this.uploadProgressValue = 0;
    this.isError = false;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  uploadFiles(): void {
    if (this.selectedFiles.length === 0) {
      this.showError('Veuillez sélectionner au moins un fichier');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 'Préparation de l\'upload...';
    this.uploadProgressValue = 0;
    this.isError = false;

    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('matchMedia', file);
    });

    this.http.post(`${environment.apiUrl}/matches/${this.matchId}/media`, formData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'text'
    }).pipe(
      catchError(error => {
        this.showError(`Erreur : ${error.message || 'Erreur inconnue'}`);
        return of(null);
      }),
      finalize(() => {
        this.isUploading = false;
      })
    ).subscribe(event => {
      if (event) {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgressValue = Math.round((event.loaded / event.total) * 100);
          this.uploadProgress = `Upload en cours... ${this.uploadProgressValue}%`;
        } else if (event.type === HttpEventType.Response) {
          this.uploadProgress = 'Médias uploadés avec succès !';
          this.uploadProgressValue = 100;
          
          this.snackBar.open('Médias uploadés avec succès !', 'Fermer', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          
          this.clearAllFiles();
          
          setTimeout(() => {
            this.dialogRef.close(true);
          }, 1500);
        }
      }
    });
  }

  /**
   * Ouvre le média dans un nouvel onglet
   */
  openMediaPreview(url: string): void {
    const fullUrl = this.getMediaUrl(url);
    window.open(fullUrl, '_blank');
  }

  /**
   * Télécharge le média
   */
  downloadMedia(url: string): void {
    const fullUrl = this.getMediaUrl(url);
    const filename = this.getFilenameFromUrl(url);
    
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Supprime un média par son index
   */
  deleteMedia(index: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) {
      return;
    }

    this.http.delete(`${environment.apiUrl}/matches/${this.matchId}/media/${index}`)
      .pipe(
        catchError(error => {
          this.snackBar.open(`Erreur lors de la suppression : ${error.message}`, 'Fermer', {
            duration: 4000,
            panelClass: ['snackbar-error']
          });
          return of(null);
        })
      )
      .subscribe(response => {
        if (response !== null || response === undefined) {
          // Supprimer localement
          this.existingMediaUrls.splice(index, 1);
          
          this.snackBar.open('Média supprimé avec succès', 'Fermer', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
        }
      });
  }

  private showError(message: string): void {
    this.uploadProgress = message;
    this.isError = true;
    this.uploadProgressValue = 0;
    
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: ['snackbar-error']
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}