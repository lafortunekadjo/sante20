export interface Objectif {
  id: number;
  membre: {
    id: number;
  };
  type: 'BUTS' | 'PASSES' | 'PRESENCE' | 'CARTON';
  valeurCible: number;
  dateDebut: Date;
  dateFin: Date;
  valeurActuelle?: number;
}