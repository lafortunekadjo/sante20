import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environment';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

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
    next: async (blob) => {
      const fileName = `feuille-match-${matchId}-${format}.png`;

      if (Capacitor.isNativePlatform()) {
        // --- LOGIQUE MOBILE (Android/APK) ---
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;

          try {
            // 1. Enregistrer le fichier
            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64data,
              directory: Directory.Documents,
              recursive: true
            });

            // 2. Ouvrir le fichier pour que l'utilisateur puisse le voir/partager
            await FileOpener.open({
              filePath: savedFile.uri,
              contentType: 'image/png'
            });

            this.snackBar.open('Image enregistrée dans Documents', '✓', { duration: 3000 });
          } catch (error) {
            console.error('Erreur stockage mobile:', error);
            this.snackBar.open('Erreur d\'enregistrement sur le téléphone', '✕', { duration: 3000 });
          }
        };
      } else {
        // --- LOGIQUE WEB (Navigateur) ---
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Image téléchargée !', '✓', { 
          duration: 3000,
          panelClass: 'snackbar-success'
        });
      }
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
  try {
    this.snackBar.open('Préparation du partage...', '', { duration: 2000 });

    // 1. Récupérer l'image depuis ton API
    const blob = await this.http.get(`${this.API_URL}/${matchId}/image?format=${format}`, {
      responseType: 'blob'
    }).toPromise();

    if (!blob) throw new Error('Erreur récupération image');

    const fileName = `match-${matchId}-${format}.png`;

    // 2. Logique MOBILE (Capacitor)
    if (Capacitor.isNativePlatform()) {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;

        // On doit d'abord enregistrer le fichier temporairement pour pouvoir le partager
        const savedFile = await Filesystem.writeFile({
          path: `tmp_${fileName}`, // préfixe tmp pour indiquer un fichier temporaire
          data: base64data,
          directory: Directory.Cache // On utilise le dossier Cache pour ne pas encombrer le téléphone
        });

        // Appel de la feuille de partage native
        await Share.share({
          title: 'Feuille de match',
          text: 'Voici le résumé du match !',
          url: savedFile.uri, // Capacitor utilise l'URI interne du fichier enregistré
          dialogTitle: 'Partager via',
        });
      };
    } 
    // 3. Logique WEB (Navigator Share API)
    else if (navigator.share) {
      const file = new File([blob], fileName, { type: 'image/png' });
      const shareData: ShareData = {
        title: 'Feuille de match',
        files: [file]
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        this.downloadMatchImage(matchId, format);
      }
    } 
    // 4. Fallback (Téléchargement si rien n'est dispo)
    else {
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