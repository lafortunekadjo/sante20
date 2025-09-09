import { Groupe } from "./groupe.model";
import { Membre } from "./membre.model";

export interface Match {
  id: number;
  groupe: Groupe;
  typeMatch: 'AMICAL' | 'INTERNE' | 'DUEL' | 'ANNIVERSAIRE';
  dateMatch: string;
  adversaire: string;
  lieu: string;
  commentaire:string;
  membreAnniversaire:String;
  mediaUrls: string[];
    forfait: boolean;
  equipeForfait: string

  // Nouveaux champs pour arbitres et rapporteur
  arbitrePrincipal?: Membre | null;              // si membre existant
  arbitrePrincipalNomOccasionnel?: string | null; // si occasionnel

  arbitreAssistant?: Membre | null;
  arbitreAssistantNomOccasionnel?: string | null;

  rapporteur?: Membre | null;
  rapporteurNomOccasionnel?: string | null;
}