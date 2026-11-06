/**
 * Sépare un nom complet saisi en un seul champ en { prenom, nom }, pour les API qui attendent les deux.
 *
 *  - « Jean Mbarga »          → prénom « Jean »,  nom « Mbarga »
 *  - « Jean Pierre Mbarga »   → prénom « Jean Pierre », nom « Mbarga »
 *  - « MBARGA Jean »          → prénom « Jean »,  nom « MBARGA »   (usage courant : NOM en majuscules d'abord)
 *  - « MBARGA NKODO Jean »    → prénom « Jean »,  nom « MBARGA NKODO »
 *  - « Mbarga »               → prénom « »,       nom « Mbarga »    (un seul mot : pas de prénom)
 *  - « JEAN MBARGA »          → prénom « JEAN »,  nom « MBARGA »    (tout en majuscules : le dernier mot est le nom)
 *
 * Chaque partie est limitée à 50 caractères, comme côté serveur.
 */
export function separerNomComplet(saisie: string | null | undefined): { prenom: string; nom: string } {
  const mots = (saisie ?? '').trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return { prenom: '', nom: '' };
  if (mots.length === 1) return { prenom: '', nom: borner(mots[0]) };

  const majuscules = (m: string) => m.length >= 2 && m === m.toUpperCase() && m !== m.toLowerCase();

  // Des mots en MAJUSCULES au début, suivis d'au moins un mot normal : « NOM Prénom »
  let nbMaj = 0;
  while (nbMaj < mots.length && majuscules(mots[nbMaj])) nbMaj++;
  if (nbMaj > 0 && nbMaj < mots.length) {
    return { prenom: borner(mots.slice(nbMaj).join(' ')), nom: borner(mots.slice(0, nbMaj).join(' ')) };
  }

  // Sinon « Prénom(s) Nom » : le dernier mot est le nom
  return { prenom: borner(mots.slice(0, -1).join(' ')), nom: borner(mots[mots.length - 1]) };
}

function borner(texte: string): string {
  return texte.length > 50 ? texte.slice(0, 50) : texte;
}
