import { Match } from "./match.model";
import { Membre } from "./membre.model";

export interface Presence {
  id?: number; // Optionnel car absent lors de la création
  membre: Membre;
  match: Match;
  aJoue: boolean;
  estCapitaine: boolean;
  equipePosition: number;
  equipeMatch: string;
  present: boolean;
  /** Venu mais n'a pas joué : SURNOMBRE | BLESSE | ARBITRE | REMPLACANT | AUTRE. */
  motifNonJoue?: string | null;
  estHommeDuMatch: boolean;
  estHommeDuMatchEq: boolean;
  nomOccasionnel?: string;
  passes: number; // Commun au Foot, Basket et Hand

  // --- SECTION FOOTBALL ---
  buts: number;
  butsContreSonCamp: number;
  penalti: number;
  cartonsJaunes: number;
  cartonsRouges: number;
  estGardien: boolean;

  // --- SECTION BASKETBALL (DÉTAILLÉ) ---
  points: number;       // Calculé : (3*p3) + (2*p2) + lf
  paniers2pts: number;
  paniers3pts: number;
  lancersFrancs: number;
  rebonds: number;
  interceptions: number;
  contres: number;
  fautes: number;

  // --- SECTION HANDBALL ---
  jets7m: number;
  deuxMinutes: number; // Nombre d'exclusions
}