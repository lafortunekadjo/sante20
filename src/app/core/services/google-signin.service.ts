import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../environment';

/** Erreur « normale » (fenêtre fermée par l'utilisateur) : à ne pas afficher comme un échec. */
export class ConnexionAnnulee extends Error {}

/**
 * Obtient un jeton d'identité Google (Firebase) : plugin natif sur Android/iOS, fenêtre Firebase sur le web.
 * Le jeton est ensuite envoyé au serveur, qui le vérifie (POST /api/auth/google).
 * Les bibliothèques sont chargées à la demande pour ne pas alourdir le démarrage de l'application.
 */
@Injectable({ providedIn: 'root' })
export class GoogleSigninService {

  async obtenirIdToken(): Promise<string> {
    try {
      return Capacitor.isNativePlatform() ? await this.natif() : await this.web();
    } catch (e: any) {
      const code = String(e?.code ?? e?.message ?? '');
      if (/popup-closed|cancelled-popup|cancel|12501|canceled/i.test(code)) throw new ConnexionAnnulee();
      throw e;
    }
  }

  private async natif(): Promise<string> {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    await FirebaseAuthentication.signInWithGoogle();
    // Jeton FIREBASE (et non le jeton Google brut) : c'est lui que le serveur sait vérifier
    const { token } = await FirebaseAuthentication.getIdToken();
    if (!token) throw new Error('Jeton Firebase manquant');
    return token;
  }

  private async web(): Promise<string> {
    const cfg = environment.firebase;
    if (!cfg?.appId) throw new Error('Configuration Firebase web incomplète (appId manquant)');
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const app = getApps().length ? getApp() : initializeApp(cfg);
    const resultat = await signInWithPopup(getAuth(app), new GoogleAuthProvider());
    return resultat.user.getIdToken();
  }
}
