export interface Evenement {
  id: number;
  idGroupe: number;
  nomEvenement: string;
  description: string;
  typeEvenement: string;
  dateCreation: Date;
  estContributionOuverte: boolean;
  idMembreLie?: number;
  dateEvenement: Date;
}


