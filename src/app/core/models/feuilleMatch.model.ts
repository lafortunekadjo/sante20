import { Membre } from "./membre.model";
import { Sanction } from "./sanction.model";

export interface FeuilleMatch {
  joueurs: Membre[];
  sanctions: Sanction[];
  arbitre: string;
  scoreLocal: number;
  scoreAdverse: number;
  duree: number;
  commentaire: string;
}