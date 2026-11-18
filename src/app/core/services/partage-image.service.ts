import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type ResultatPartage = 'partage' | 'telecharge' | 'annule';

/**
 * Partage une image : feuille de partage du système sur mobile (application et navigateur compatible),
 * sinon téléchargement du fichier.
 */
@Injectable({ providedIn: 'root' })
export class PartageImageService {

  async partager(blob: Blob, nomFichier: string, titre: string): Promise<ResultatPartage> {
    if (Capacitor.isNativePlatform()) return this.partagerNatif(blob, nomFichier, titre);

    // Navigateur mobile : feuille de partage (WhatsApp, etc.) quand elle accepte les fichiers
    const fichier = new File([blob], nomFichier, { type: blob.type || 'image/jpeg' });
    const nav: any = navigator;
    if (nav.canShare?.({ files: [fichier] })) {
      try {
        await nav.share({ files: [fichier], title: titre });
        return 'partage';
      } catch (e: any) {
        if (e?.name === 'AbortError') return 'annule';
        /* partage impossible : on retombe sur le téléchargement */
      }
    }
    this.telecharger(blob, nomFichier);
    return 'telecharge';
  }

  private async partagerNatif(blob: Blob, nomFichier: string, titre: string): Promise<ResultatPartage> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const lecteur = new FileReader();
      lecteur.onload = () => resolve(String(lecteur.result).split(',')[1] ?? '');
      lecteur.onerror = reject;
      lecteur.readAsDataURL(blob);
    });
    const fichier = await Filesystem.writeFile({ path: nomFichier, data: base64, directory: Directory.Documents, recursive: true });
    try {
      await Share.share({ title: titre, files: [fichier.uri], dialogTitle: titre });
      return 'partage';
    } catch (e: any) {
      return /cancel/i.test(String(e?.message ?? e)) ? 'annule' : 'telecharge';   // le fichier reste dans Documents
    }
  }

  private telecharger(blob: Blob, nomFichier: string): void {
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichier;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
