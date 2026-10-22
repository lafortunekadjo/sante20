/**
 * Traduit le lien (`actionUrl`) envoyé par le backend en une route Angular qui existe vraiment.
 *
 * Le backend envoie des liens génériques ("/mes-sanctions", "/matches/12"...) qui ne correspondent
 * pas toujours aux routes de l'application : selon le rôle, la page n'est pas la même
 * (/membre/... pour un joueur, /responsable/... pour un responsable).
 */
export function resolveNotificationUrl(url: string | null | undefined, isResponsable: boolean): string | null {
  if (!url) return null;

  const home = isResponsable ? '/responsable/dashboard' : '/membre/dashboard';
  const path = url.split('?')[0];

  // Pages personnelles : tableau de bord du rôle
  if (/^\/(mes-cotisations|mes-sanctions|cotisations|mon-profil|dashboard)$/.test(path)) return home;

  // Matchs
  if (/^\/(matches|matchs)(\/\d+)?$/.test(path)) return isResponsable ? '/responsable/matchs' : home;

  // Membres
  if (/^\/membres(\/\d+)?$/.test(path)) return isResponsable ? '/responsable/membres' : home;

  // Caisse (saisie de dépenses) : espace finances du responsable
  if (path === '/caisse') return isResponsable ? '/responsable/finances/dashboard' : home;

  // Invitation à rejoindre un groupe
  if (/^\/groupes\/\d+\/invitation$/.test(path)) return '/explorer';

  // Espace admin
  if (/^\/admin\/users\/\d+$/.test(path)) return '/admin/utilisateurs';
  if (/^\/admin\/groupes\/\d+$/.test(path)) return '/admin/groupes';

  // Espace partenaire
  if (path === '/partenaire/publicites') return '/partenaire/publicite';

  return url;
}
