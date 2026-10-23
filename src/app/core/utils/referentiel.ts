/**
 * Forme unique des valeurs saisies à la main (mêmes règles que Referentiel.java côté serveur) :
 *  - sexe : « masculin » ou « feminin » ;
 *  - discipline : « Football », « Basketball », « Volleyball »… (première lettre en majuscule).
 * Une valeur inconnue est conservée ; une valeur vide donne une chaîne vide.
 */
export const SEXE_MASCULIN = 'masculin';
export const SEXE_FEMININ = 'feminin';

const DISCIPLINES: Record<string, string> = {
  'football': 'Football', 'foot': 'Football',
  'basketball': 'Basketball', 'basket': 'Basketball', 'basket-ball': 'Basketball',
  'volleyball': 'Volleyball', 'volley': 'Volleyball', 'volley-ball': 'Volleyball',
  'handball': 'Handball', 'hand': 'Handball', 'hand-ball': 'Handball',
  'futsal': 'Futsal', 'rugby': 'Rugby', 'tennis': 'Tennis', 'badminton': 'Badminton'
};

function cle(v: string): string {
  return v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

/** « M », « Masculin », « homme »… → « masculin » ; « F », « Féminin », « femme »… → « feminin ». */
export function normaliserSexe(v?: string | null): string {
  const propre = (v ?? '').trim();
  if (!propre) return '';
  const n = cle(propre);
  if (n === 'm' || n === 'h' || n.startsWith('masc') || n === 'homme' || n === 'male') return SEXE_MASCULIN;
  if (n === 'f' || n.startsWith('fem') || n === 'femme' || n === 'female') return SEXE_FEMININ;
  return propre;
}

export function estMasculin(v?: string | null): boolean { return normaliserSexe(v) === SEXE_MASCULIN; }
export function estFeminin(v?: string | null): boolean { return normaliserSexe(v) === SEXE_FEMININ; }

/** « FOOTBALL », « football », « Football  », « foot » → « Football ». */
export function normaliserDiscipline(v?: string | null): string {
  const propre = (v ?? '').trim();
  if (!propre) return '';
  const connue = DISCIPLINES[cle(propre)];
  if (connue) return connue;
  const minuscules = propre.toLowerCase();
  return minuscules.charAt(0).toUpperCase() + minuscules.slice(1);
}

export function memeDiscipline(a?: string | null, b?: string | null): boolean {
  const x = normaliserDiscipline(a);
  return !!x && x === normaliserDiscipline(b);
}
