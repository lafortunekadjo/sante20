import { Membre } from "./membre.model";

export interface Contribution {
  idContribution?: number;
  idEvenement: number;
  titre: string;
  description: string;
  delaiContribution: Date;
  montantMin?: number;
  montantCible?: number;
  montantCollecteActuel: number;
}

export interface ContributionIndividuelle {
  id?: number;
  idContribution: number;
  idMembre: number;
  montant: number;
  dateContribution: Date;
}