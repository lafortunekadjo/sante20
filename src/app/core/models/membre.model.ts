import { Groupe } from "./groupe.model";
import { Equipe } from "./groupe.model copy";
import { RoleCustom } from "./role-custom.model";
import { User } from "./user";

export interface Membre {

  id: number;
  nom: string;
  prenom: string;
  dateNaissance: string;
  poste: string;
  email: string;
  cotisationPayee: boolean;
  roleCO: string;
  equipe?: Equipe | null;
  groupe: Groupe;
  buts: number;
  passes: number;
  cartons: number;
  totalContributions: number;
  soldeRestant: number;
  soldeSanctionsRestant: number;
  user: User;
  active: boolean;
  sexe: string;
  cni: string;
  adresse:string;
  tel:string;
  assurance:boolean;

  roleCustom?: RoleCustom | null; //
}