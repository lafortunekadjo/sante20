import { Evenement } from "./evenement.model";
import { Membre } from "./membre.model";

export interface Contribution {
  id?: number;
  idEvenement: Evenement | null;
  commentaire: string;
  description: string;
  delaiContribution: Date;
  montantMin?: number;
  montantCible?: number;
  groupe: number;
  montantCollecteActuel: number;
  open:boolean
}

export interface ContributionIndividuelle {
  id?: number;
  idContribution: number;
  // contribution: Contribution;
  idMembre: number;
  // membre: Membre;
  montant: number;
  dateContribution: Date;
}