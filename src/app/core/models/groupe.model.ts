import { Stade } from "./stade";
import { Ville } from "./ville";

export interface Groupe {
  id: number;
  nom: string;
  isActive: boolean;
  discipline: string;
  ville: number;
  stade: number;
  ville1: Ville;
  stade2: Stade;
  jourMatch: string;
  typeEquipe: string;
  modeEquipe: 'STATIQUE' | 'DYNAMIQUE';
  fraisAdhesion: number;
}