import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AssetLoaderService {

  private cache = new Map<string, string>();

  async loadImageAsBase64(path: string): Promise<string | null> {
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }
    try {
      const response = await fetch(path);

      // 1. fetch() ne rejette PAS sur 404/500 — il faut vérifier explicitement
      if (!response.ok) {
        console.warn(`Asset ${path} introuvable (HTTP ${response.status})`);
        return null;
      }

      const blob = await response.blob();

      // 2. Vérifie que c'est bien une image, pas une page d'erreur HTML
      if (!blob.type.startsWith('image/')) {
        console.warn(`Asset ${path} n'est pas une image (type reçu: ${blob.type})`);
        return null;
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      this.cache.set(path, base64);
      return base64;
    } catch (err) {
      console.warn(`Impossible de charger l'asset ${path}:`, err);
      return null;
    }
  }
}