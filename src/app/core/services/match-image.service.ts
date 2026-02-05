import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class MatchImageService {

  private readonly API_URL = `${environment.apiUrl}/matches`;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Télécharger l'image de la feuille de match
   * @param matchId ID du match
   * @param format 'full' ou 'story'
   */
  downloadMatchImage(matchId: number, format: 'full' | 'story' = 'full'): void {
    this.snackBar.open('Génération de l\'image...', '', { duration: 2000 });

    this.http.get(`${this.API_URL}/${matchId}/image?format=${format}`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feuille-match-${matchId}-${format}.png`;
        link.click();
        
        // Nettoyer
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('Image téléchargée !', '✓', { 
          duration: 3000,
          panelClass: 'snackbar-success'
        });
      },
      error: (err) => {
        console.error('Erreur téléchargement image:', err);
        this.snackBar.open('Erreur lors du téléchargement', '✕', { 
          duration: 3000,
          panelClass: 'snackbar-error'
        });
      }
    });
  }

  /**
   * Partager l'image (mobile)
   */
  async shareMatchImage(matchId: number, format: 'full' | 'story' = 'full'): Promise<void> {
    // Vérifier si Web Share API est disponible
    if (!navigator.share) {
      this.snackBar.open('Partage non disponible, téléchargement...', '', { duration: 2000 });
      this.downloadMatchImage(matchId, format);
      return;
    }

    try {
      this.snackBar.open('Préparation du partage...', '', { duration: 2000 });

      // Récupérer l'image comme blob
      const blob = await this.http.get(`${this.API_URL}/${matchId}/image?format=${format}`, {
        responseType: 'blob'
      }).toPromise();

      if (!blob) throw new Error('Erreur récupération image');

      // Créer un fichier à partir du blob
      const file = new File([blob], `match-${matchId}.png`, { type: 'image/png' });

      // Vérifier si on peut partager des fichiers
      const shareData: ShareData = {
        title: 'Feuille de match',
        files: [file]
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        this.snackBar.open('Partagé !', '✓', { duration: 2000 });
      } else {
        // Fallback: téléchargement
        this.downloadMatchImage(matchId, format);
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Erreur partage:', error);
        this.snackBar.open('Erreur lors du partage', '✕', { duration: 3000 });
      }
    }
  }

  /**
   * Obtenir l'URL de l'image (pour affichage preview)
   */
  getImageUrl(matchId: number, format: 'full' | 'story' = 'full'): string {
    return `${this.API_URL}/${matchId}/image?format=${format}`;
  }
}