/**
 * Heures de match. Le serveur renvoie « 18:30:00 » ; les groupes saisissent parfois « 18h30 » ; un champ
 * <input type="time"> attend « 18:30 ». Cette fonction ramène toute heure lisible à « HH:mm ».
 * Retourne '' si l'heure est absente ou illisible.
 */
export function normaliserHeure(valeur: string | null | undefined): string {
  if (!valeur) return '';
  const t = String(valeur).trim().toLowerCase().replace(/\s+/g, '');
  const m = /^(\d{1,2})(?:[h:](\d{1,2})?)?(?::\d{1,2})?$/.exec(t);
  if (!m) return '';
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return '';
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
