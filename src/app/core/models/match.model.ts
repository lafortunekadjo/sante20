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
}