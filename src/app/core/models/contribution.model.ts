import { Evenement } from "./evenement.model";
import { Membre } from "./membre.model";

export interface Contribution {
  id?: number;
  evenement: Evenement | null;
  commentaire: string;
  description: string;
  delaiContribution: Date;
  montantMin?: number;
  montantCible?: number;
  groupe: number;
  montantCollecteActuel: number;
  open:boolean;
  isAdhesion:boolean;
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