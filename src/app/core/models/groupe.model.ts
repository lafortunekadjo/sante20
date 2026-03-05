import { Stade } from "./stade";
import { Ville } from "./ville";

export interface Groupe {
  id: number;
  nom: string;
  isActive: boolean;
  discipline: string;
  ville1: number;
  stade2: number;
  ville: Ville;
  stade: Stade;
  jourMatch: string;
  typeEquipe: string;
  modeEquipes: 'STATIQUE' | 'DYNAMIQUE';
  fraisAdhesion: number;
  profilePhotoUrl: string;
  heureMatch:string;
  isPublic:boolean;
    abreviation: string;
}

