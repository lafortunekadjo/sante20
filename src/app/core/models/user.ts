import { Membre } from "./membre.model";

export interface User {
  id: number;
  username: string;
  email: string;
  roles: string;
  active: boolean;
  membre: number;
  motDePasse: string;
  groupe:number;
}