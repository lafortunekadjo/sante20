

export interface Sanction {
  id: number;
  membre: number;
  typeSanction: number;
  match: number;
  dateSanction: Date;
  montant: number;
  commentaire: string;
  etat: 'PAYEE' | 'NON_PAYEE';
  totalPaiements: number;
}