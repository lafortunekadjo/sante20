import { Groupe } from './groupe.model';

export interface TypeDepense {
  id: number | null;
  nom: string;
  isGenerique: boolean;
  groupe: Groupe | null;
}