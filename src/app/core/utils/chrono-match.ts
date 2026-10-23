/**
 * Règle du chrono d'un match : de la durée écoulée dans la mi-temps en cours, on déduit la minute affichée et celle
 * proposée pour un événement.
 *
 *   1re mi-temps : 1′ … 45′, puis 45+1, 45+2…      mi-temps : 45′ (figé)
 *   2e mi-temps  : 46′ … 90′, puis 90+1, 90+2…      fin      : 90′
 *
 * Fonction pure (aucune dépendance à Angular) : testable seule.
 */
export type PhaseMatch = 'avant' | 'p1' | 'mt' | 'p2' | 'fin';

export interface MinuteMatch {
  /** Minute du jeu (1 à 90, ou 45 / 90 pendant le temps additionnel). */
  minute: number;
  /** Minute de temps additionnel (le « 2 » de 45+2), ou null. */
  add: number | null;
}

/** @param ecouleMs temps écoulé depuis le début de la mi-temps en cours (déjà corrigé de l'ajustement manuel). */
export function minuteDuChrono(phase: PhaseMatch, ecouleMs: number, dureeMiTemps = 45): MinuteMatch | null {
  if (phase === 'avant') return null;
  if (phase === 'mt') return { minute: dureeMiTemps, add: null };
  if (phase === 'fin') return { minute: 2 * dureeMiTemps, add: null };
  const ecoule = Math.max(0, Math.floor(ecouleMs / 60000));          // minutes entières déjà jouées dans la mi-temps
  const base = phase === 'p1' ? 0 : dureeMiTemps;
  if (ecoule < dureeMiTemps) return { minute: base + ecoule + 1, add: null };
  return { minute: base + dureeMiTemps, add: ecoule - dureeMiTemps + 1 };
}

/** « 34′ », « 45+2′ ». */
export function libelleMinute(m: MinuteMatch | null): string {
  if (!m) return '';
  return m.add ? `${m.minute}+${m.add}'` : `${m.minute}'`;
}
