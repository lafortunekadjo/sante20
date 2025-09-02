import { Sanction } from "./sanction.model";

export interface PaiementSanction {
  id: number;
  sanction: Sanction;
  montant: number;
  datePaiement: string;
  commentaire: string;
}