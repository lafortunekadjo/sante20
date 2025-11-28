// media-preview-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface MediaPreviewData {
  mediaUrl: string;
  isImage: boolean;
  isVideo: boolean;
  matchId?: number;
  allMediaUrls?: string[];
}

@Component({
  selector: 'app-media-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './media-preview-dialog.component.html',
  styleUrls: ['./media-preview-dialog.component.scss']
})
export class MediaPreviewDialogComponent {
  currentIndex: number = 0;
  currentUrl: string;
  
  constructor(
    public dialogRef: MatDialogRef<MediaPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MediaPreviewData
  ) {
    this.currentUrl = data.mediaUrl;
    
    // Trouver l'index actuel si on a toutes les URLs
    if (data.allMediaUrls && data.allMediaUrls.length > 0) {
      this.currentIndex = data.allMediaUrls.indexOf(data.mediaUrl);
      if (this.currentIndex === -1) this.currentIndex = 0;
    }
  }

  /**
   * Vérifie si l'URL actuelle est une image
   */
  get isCurrentImage(): boolean {
    return this.isImageUrl(this.currentUrl);
  }

  /**
   * Vérifie si l'URL actuelle est une vidéo
   */
  get isCurrentVideo(): boolean {
    return this.isVideoUrl(this.currentUrl);
  }

  /**
   * Vérifie si on peut naviguer
   */
  get canNavigate(): boolean {
    return this.data.allMediaUrls !== undefined && this.data.allMediaUrls.length > 1;
  }

  /**
   * Vérifie si l'URL est une image
   */
  isImageUrl(url: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/)) {
      return true;
    }
    
    if (lowerUrl.includes('/image/upload/') || lowerUrl.includes('/image/')) {
      return true;
    }
    
    return !this.isVideoUrl(url);
  }

  /**
   * Vérifie si l'URL est une vidéo
   */
  isVideoUrl(url: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.match(/\.(mp4|mov|avi|webm)(\?.*)?$/)) {
      return true;
    }
    
    if (lowerUrl.includes('/video/upload/') || lowerUrl.includes('/video/')) {
      return true;
    }
    
    return false;
  }

  /**
   * Média précédent
   */
  previousMedia(): void {
    if (!this.data.allMediaUrls) return;
    
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.data.allMediaUrls.length - 1;
    }
    this.currentUrl = this.data.allMediaUrls[this.currentIndex];
  }

  /**
   * Média suivant
   */
  nextMedia(): void {
    if (!this.data.allMediaUrls) return;
    
    this.currentIndex++;
    if (this.currentIndex >= this.data.allMediaUrls.length) {
      this.currentIndex = 0;
    }
    this.currentUrl = this.data.allMediaUrls[this.currentIndex];
  }

  /**
   * Télécharger le média
   */
  downloadMedia(): void {
    const link = document.createElement('a');
    link.href = this.currentUrl;
    link.download = this.getFilename();
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Extrait le nom du fichier depuis l'URL
   */
  getFilename(): string {
    try {
      const urlObj = new URL(this.currentUrl);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || 'media';
    } catch {
      return this.currentUrl.split('/').pop() || 'media';
    }
  }

  /**
   * Ferme le dialog
   */
  closeDialog(): void {
    this.dialogRef.close();
  }
}