import { Membre } from "./membre.model";
import { ZoneGeographique, Ethnie } from "./zonegeographique.model";

export interface User {
  id: number;
  username: string;
  email: string;
  roles: string;
  active: boolean;
  membre: number;
  motDePasse: string;
  groupe:number;
  profilePhotoUrl: string;

  // --- NOUVEAUX CHAMPS STRUCTURÉS ---
  villeHabitation?: ZoneGeographique;
  quartierHabitation?: string;
  zoneOrigine?: ZoneGeographique; // Le niveau le plus précis (Département / Ville d'origine)
  ethnie?: Ethnie;
}