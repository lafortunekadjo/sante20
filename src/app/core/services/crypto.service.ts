import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  // Clé maîtresse de l'application My2-0 (À garder secrète)
  private readonly APP_MASTER_SECRET = 'My20_Secret_Salt_For_End_To_End_Encryption_2026';
  private readonly APP_SECRET = 'my2-0-chat-secret-2026';
 
  // Cache des clés dérivées par conversationId (évite PBKDF2 à chaque message)
  private keyCache = new Map<number, CryptoKey>();

  /** Génère une clé unique propre à chaque salon de discussion */
  private obtenirCleDiscussion(discussionId: number): string {
    return `${this.APP_MASTER_SECRET}_Room_${discussionId}`;
  }

  /** Chiffre le texte brut en AES */
  chiffrer(texte: string, discussionId: number): string {
    const cle = this.obtenirCleDiscussion(discussionId);
    return CryptoJS.AES.encrypt(texte.trim(), cle).toString();
  }

  /** Déchiffre la chaîne AES reçue */
  dechiffrer(texteChiffre: string, discussionId: number): string {
    try {
      const cle = this.obtenirCleDiscussion(discussionId);
      const bytes = CryptoJS.AES.decrypt(texteChiffre, cle);
      const texteDecrypte = bytes.toString(CryptoJS.enc.Utf8);
      
      // Si le déchiffrement échoue ou donne du vide
      if (!texteDecrypte) {
        return '🔒 [Message chiffré - Clé invalide]';
      }
      return texteDecrypte;
    } catch (e) {
      return '🔒 [Erreur de déchiffrement du message]';
    }
  }
  async encrypt(plaintext: string, conversationId: number): Promise<string> {
    try {
      const key = await this.getKey(conversationId);
      // Utiliser ArrayBuffer directement — évite le conflit SharedArrayBuffer
      const ivArray = new Uint8Array(12);
      crypto.getRandomValues(ivArray);
      const iv: ArrayBuffer = ivArray.buffer as ArrayBuffer;
 
      const encoded: ArrayBuffer = new TextEncoder().encode(plaintext).buffer as ArrayBuffer;
 
      const ciphertext: ArrayBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      );
 
      const ivB64 = this.toBase64(ivArray);
      const ctB64 = this.toBase64(new Uint8Array(ciphertext));
      return `${ivB64}:${ctB64}`;
    } catch (e) {
      console.error('[Crypto] Échec chiffrement:', e);
      return plaintext;
    }
  }
 
  async decrypt(ciphertext: string, conversationId: number): Promise<string> {
    if (!this.isEncrypted(ciphertext)) {
      return ciphertext;
    }
    try {
      const [ivB64, ctB64] = ciphertext.split(':');
      const iv: ArrayBuffer = this.fromBase64(ivB64).buffer as ArrayBuffer;
      const ct: ArrayBuffer = this.fromBase64(ctB64).buffer as ArrayBuffer;
      const key = await this.getKey(conversationId);
 
      const decrypted: ArrayBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ct
      );
 
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error('[Crypto] Échec déchiffrement:', e);
      return '🔒 Message chiffré (clé invalide)';
    }
  }
 
  async decryptMessages<T extends { content: string; conversationId: number }>(
    messages: T[]
  ): Promise<T[]> {
    return Promise.all(
      messages.map(async (m) => ({
        ...m,
        content: await this.decrypt(m.content, m.conversationId)
      }))
    );
  }
 
  isEncrypted(text: string): boolean {
    if (!text) return false;
    const parts = text.split(':');
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  }
 
  private async getKey(conversationId: number): Promise<CryptoKey> {
    if (this.keyCache.has(conversationId)) {
      return this.keyCache.get(conversationId)!;
    }
    const key = await this.deriveKey(conversationId);
    this.keyCache.set(conversationId, key);
    return key;
  }
 
  private async deriveKey(conversationId: number): Promise<CryptoKey> {
    const encoder = new TextEncoder();
 
    const rawKey: ArrayBuffer = encoder.encode(this.APP_SECRET).buffer as ArrayBuffer;
    const keyMaterial = await crypto.subtle.importKey(
      'raw', rawKey, 'PBKDF2', false, ['deriveKey']
    );
 
    const salt: ArrayBuffer = encoder.encode(`conversation-${conversationId}-salt`).buffer as ArrayBuffer;
 
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
 
  private toBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...Array.from(bytes)));
  }
 
  private fromBase64(b64: string): Uint8Array {
    return Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
  }
}