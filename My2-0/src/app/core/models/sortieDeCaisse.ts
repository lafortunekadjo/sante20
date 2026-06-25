import { Membre } from "./membre.model";
import { TypeDepense } from "./typeDepense";
import { User } from "./user";

export interface SortieDeCaisse {
  id: number | null;
  description: string;
  montant: number;
  dateSortie: Date;
  utilisateur: Membre;
  typeDepense: TypeDepense;
}