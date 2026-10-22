/** Modèles des collectes d'événements (cotisations pour un mariage, un décès, une fête...). */

export type ModeCollecte = 'FIXE' | 'LIBRE' | 'OBJECTIF';

/** label et aide sont des clés de traduction (collecte.modes.<MODE>.label | aide). */
export const MODES_COLLECTE: { valeur: ModeCollecte; label: string; aide: string }[] = (['FIXE', 'LIBRE', 'OBJECTIF'] as ModeCollecte[])
  .map(valeur => ({ valeur, label: `collecte.modes.${valeur}.label`, aide: `collecte.modes.${valeur}.aide` }));

/** Un événement tel que renvoyé par /api/evenements/groupe (entité complète, champs de collecte inclus). */
export interface EvenementCollecte {
  id: number;
  nomEvenement: string;
  description?: string;
  typeEvenement: string;              // Heureux | Malheureux | AUTRE
  dateEvenement?: string;
  estContributionOuverte: boolean;
  estMontantLibre?: boolean;
  modeCollecte?: ModeCollecte | null;
  montantRequisParMembre?: number | null;
  objectifGlobal?: number | null;
  delaiCollecte?: string | null;
  membreLie?: { id: number; nom?: string; prenom?: string } | null;
}

export interface BilanLigne {
  id?: number;
  membreId?: number;
  nom?: string;
  montant: number;
  date?: string;
  sens: 'ENTREE' | 'SORTIE';
  libelle?: string;
}

export interface EvenementBilan {
  evenementId: number;
  nom: string;
  categorie?: string;
  dateEvenement?: string;
  collecteOuverte: boolean;
  mode: ModeCollecte;
  montantParMembre?: number | null;
  objectifGlobal?: number | null;
  delaiCollecte?: string | null;
  totalCollecte: number;
  totalDepense: number;
  totalRemis: number;
  solde: number;
  resteAObjectif?: number | null;
  nbContributeurs: number;
  nbMembresAttendus: number;
  contributeurs: BilanLigne[];
  mouvements: BilanLigne[];
}

/** Une collecte ouverte vue par le membre (jamais celle dont il est le membre concerné). */
export interface CollecteEnCours {
  evenementId: number;
  nom: string;
  categorie?: string;
  description?: string;
  dateEvenement?: string;
  mode: ModeCollecte;
  montantParMembre?: number | null;
  objectifGlobal?: number | null;
  delaiCollecte?: string | null;
  totalCollecte: number;
  maContribution: number;
}

/** Mode effectif d'un événement (anciens événements sans mode : libre si « montant libre », sinon fixe). */
export function modeDe(e: EvenementCollecte): ModeCollecte {
  return (e.modeCollecte as ModeCollecte) ?? (e.estMontantLibre ? 'LIBRE' : 'FIXE');
}
