export type ScopeObjectif =
  | 'PERSONNEL_GLOBAL'
  | 'PERSONNEL_GROUPE'
  | 'GROUPE_GLOBAL'
  | 'GROUPE_SPECIFIQUE';

export type TypeObjectif =
  | 'BUTS' | 'PASSES' | 'PRESENCE' | 'CARTON' | 'MOTM' | 'MVP_EQUIPE';

export interface ObjectifDTO {
  id: number;
  type: TypeObjectif;
  scope: ScopeObjectif;
  valeurCible: number;
  valeurActuelle: number;
  pourcentage: number;
  dateDebut: string;
  dateFin: string;
  titre?: string;
  description?: string;
  groupeId?: number;
  groupeNom: string;          // "Tous mes groupes" si scope global
  creeParResponsable: boolean;
  createurNom?: string;
  expire: boolean;
  atteint: boolean;
}

export interface CreateObjectifPersonnelDTO {
  type: TypeObjectif;
  valeurCible: number;
  dateDebut: string;
  dateFin: string;
  titre?: string;
  description?: string;
  groupeId?: number | null;   // null = global
}

export interface CreateObjectifGroupeDTO {
  groupeId: number;
  membreIds?: number[];        // vide = tous les membres
  type: TypeObjectif;
  valeurCible: number;
  dateDebut: string;
  dateFin: string;
  titre?: string;
  description?: string;
}