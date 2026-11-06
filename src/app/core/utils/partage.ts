import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { environment } from '../../environment';

/**
 * Partage d'un lien : feuille de partage du téléphone si disponible (WhatsApp, SMS...),
 * sinon ouverture de WhatsApp Web, et copie dans le presse-papiers en dernier recours.
 * Retourne le moyen utilisé, pour informer l'utilisateur.
 *
 * Dans l'application Android le WebView n'expose pas navigator.share (origine http://localhost non sécurisée) :
 * on passe par le plugin natif @capacitor/share, sinon le lien était seulement copié.
 */
export async function partagerLien(titre: string, texte: string, url: string): Promise<'partage' | 'whatsapp' | 'copie'> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({ title: titre, text: texte, url, dialogTitle: titre });
      return 'partage';
    } catch {
      return 'partage';   // feuille fermée par l'utilisateur : on ne copie pas à sa place
    }
  }
  const nav = navigator as Navigator & { share?: (d: any) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title: titre, text: texte, url });
      return 'partage';
    } catch {
      // annulé par l'utilisateur : on ne bascule pas sur un autre moyen
      return 'partage';
    }
  }
  const message = `${texte} ${url}`;
  const wa = window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  if (wa) return 'whatsapp';
  await copierTexte(url);
  return 'copie';
}

export async function copierTexte(texte: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(texte);
  } catch {
    const zone = document.createElement('textarea');
    zone.value = texte;
    document.body.appendChild(zone);
    zone.select();
    document.execCommand('copy');
    document.body.removeChild(zone);
  }
}

/**
 * Lien à partager pour un groupe. Il pointe vers une page légère du serveur qui expose la photo du groupe
 * (ou le logo My2-0) et le nom en aperçu dans WhatsApp, Facebook, etc., puis renvoie vers la fiche du groupe.
 * L'application web étant une SPA, un lien direct vers /explorer/:id n'a pas d'aperçu.
 */
export function urlPartageGroupe(id: number | string): string {
  // On part de l'adresse de l'API (et non de celle de la page) : en développement la page est sur :4200 dont le proxy
  // pointe ailleurs, alors que l'API est directement joignable sur apiUrl.
  const api = environment.apiUrl;
  const base = /^https?:\/\//.test(api) ? api.replace(/\/$/, '') : urlApplication(api);
  return `${base}/public/partage/groupe/${id}`;
}

/**
 * Adresse publique de l'application (pour fabriquer les liens à partager).
 * Dans l'application Android (Capacitor) l'origine est locale (http://localhost) : on prend alors le site public.
 */
export function urlApplication(chemin: string): string {
  let origine = window.location.origin;
  if (/^(https?:\/\/localhost|capacitor:|ionic:)/.test(origine) && environment.apiUrl.startsWith('https://')) {
    origine = environment.apiUrl.replace(/\/api\/?$/, '');
  }
  return `${origine}${chemin.startsWith('/') ? '' : '/'}${chemin}`;
}
