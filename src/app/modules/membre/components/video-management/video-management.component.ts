import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProfileService, VideoHighlight } from '../../../../core/services/profile.service';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-video-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule
  ],
  templateUrl: './video-management.component.html',
  styleUrls: ['./video-management.component.scss']
})
export class VideoManagementComponent implements OnInit {
  videos: VideoHighlight[] = [];
  isLoading = true;
  isUploading = false;

  // Modèle de formulaire pour l'ajout
  newVideoTitle = '';
  newVideoAdversaire = '';
  newVideoDescription = '';
  selectedFile: File | null = null;
  videoPreviewUrl: string | null = null;
  showUploadPanel = false;
  // Visionneuse active
  activeVideoUrl: string | null = null;
  readonly MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
  errorMessage: string | null = null;

  constructor(private profileService: ProfileService, private authservice: AuthService) {}

  ngOnInit(): void {
    this.loadUserVideos();
  }

  

  loadUserVideos(): void {
    this.isLoading = true;
    // Appelle l'endpoint de récupération des vidéos de l'utilisateur connecté
    this.profileService.getVideosByUsername(this.authservice.getUsername()!).subscribe({
      next: (data) => {
        this.videos = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des vidéos', err);
        this.isLoading = false;
      }
    });
  }

onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.errorMessage = null; // Réinitialiser l'erreur

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validation de la taille du fichier au Frontend
      if (file.size > this.MAX_FILE_SIZE_BYTES) {
        this.errorMessage = 'Le fichier est trop volumineux. La taille maximale autorisée est de 50 Mo.';
        this.selectedFile = null;
        this.videoPreviewUrl = null;
        input.value = ''; // Réinitialise l'input HTML
        return;
      }

      this.selectedFile = file;
      this.videoPreviewUrl = URL.createObjectURL(this.selectedFile);
    }
  }

  uploadVideo(): void {
    if (!this.selectedFile || !this.newVideoTitle.trim()) return;

    this.isUploading = true;
    this.errorMessage = null;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('titre', this.newVideoTitle);
    formData.append('adversaire', this.newVideoAdversaire);
    formData.append('description', this.newVideoDescription);

    this.profileService.uploadPlayerVideo(this.authservice.getUsername()!,formData).subscribe({
      next: (newVideo) => {
        this.videos.unshift(newVideo);
        this.resetForm();
        this.isUploading = false;
      },
      error: (err) => {
        console.error('Erreur lors du téléversement', err);
        this.isUploading = false;
        // Si le backend renvoie l'erreur personnalisée ou une erreur générique
        this.errorMessage = err.error?.error || 'Une erreur est survenue lors de l\'envoi de la vidéo.';
      }
    });
  }



  toggleUploadPanel(): void {
  this.showUploadPanel = !this.showUploadPanel;
  if (!this.showUploadPanel) {
    this.resetForm(); // Réinitialise proprement le formulaire s'il ferme le panneau
  }
}

  // uploadVideo(): void {
  //   if (!this.selectedFile || !this.newVideoTitle.trim()) return;

  //   this.isUploading = true;
  //   const formData = new FormData();
  //   formData.append('file', this.selectedFile);
  //   formData.append('titre', this.newVideoTitle);
  //   formData.append('adversaire', this.newVideoAdversaire);
  //   formData.append('description', this.newVideoDescription);

  //   this.profileService.uploadVideo(formData).subscribe({
  //     next: (newVideo) => {
  //       this.videos.unshift(newVideo); // Ajouter au début de la liste
  //       this.resetForm();
  //       this.isUploading = false;
  //     },
  //     error: (err) => {
  //       console.error('Erreur lors du téléversement', err);
  //       this.isUploading = false;
  //     }
  //   });
  // }

  deleteVideo(videoId: number, event: Event): void {
    event.stopPropagation(); // Évite d'ouvrir la vidéo en cliquant sur supprimer
    
    if (confirm('Voulez-vous vraiment supprimer cette vidéo de vos moments forts ?')) {
      this.profileService.deleteVideo(videoId, this.authservice.getUsername()!).subscribe({
        next: () => {
          this.videos = this.videos.filter(v => v.id !== videoId);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression', err);
        }
      });
    }
  }

  resetForm(): void {
    this.newVideoTitle = '';
    this.newVideoAdversaire = '';
    this.newVideoDescription = '';
    this.selectedFile = null;
    this.videoPreviewUrl = null;
    this.errorMessage = null;
  }

  openVideo(url: string): void {
    this.activeVideoUrl = url;
  }

  closeVideo(): void {
    this.activeVideoUrl = null;
  }
}