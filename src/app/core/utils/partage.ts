import { environment } from '../../environment';

/**
 * Partage d'un lien : feuille de partage du téléphone si disponible (WhatsApp, SMS...),
 * sinon ouverture de WhatsApp Web, et copie dans le presse-papiers en dernier recours.
 * Retourne le moyen utilisé, pour informer l'utilisateur.
 */
export async function partagerLien(titre: string, texte: string, url: string): Promise<'partage' | 'whatsapp' | 'copie'> {
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
