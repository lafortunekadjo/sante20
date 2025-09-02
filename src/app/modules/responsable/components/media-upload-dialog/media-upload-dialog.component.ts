import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-media-upload-dialog',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FormsModule,
    MatDatepickerModule,
    MatExpansionModule, // Ajouté,
    MatListModule
  ],
  templateUrl: './media-upload-dialog.component.html',
  styleUrls: ['./media-upload-dialog.component.scss']
})
export class MediaUploadDialogComponent {
  selectedFiles: File[] = [];
  uploadProgress: string = '';
  previews: (string | null)[] = []; // Tableau pour stocker les URLs d'aperçu
  matchId: number;

  constructor(
    public dialogRef: MatDialogRef<MediaUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { matchId: number },
    private http: HttpClient
  ) {
    this.matchId = data.matchId;
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.selectedFiles.push(file);
        // Générer un aperçu pour les images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.previews.push(e.target.result as string);
          };
          reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
          this.previews.push(null); // Placeholder pour les vidéos
        }
      }
    }
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.uploadProgress = 'Veuillez sélectionner au moins un fichier.';
      return;
    }

    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('matchMedia', file);
    });

    this.http.post(`http://localhost:8082/api/matches/${this.matchId}/media`, formData, { responseType: 'text' })
      .pipe(catchError(error => {
        this.uploadProgress = `Erreur : ${error.message}`;
        return of(null);
      }))
      .subscribe(response => {
        if (response) {
          this.uploadProgress = 'Médias uploadés avec succès!';
          this.dialogRef.close(true);
        }
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}