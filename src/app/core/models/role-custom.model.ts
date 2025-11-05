// src/app/core/models/role-custom.model.ts

import { Menu } from './menu.model';

export interface RoleCustom {
  id: number;
  groupeId: number;
  nom: string;
  description: string;
  couleur: string;
  icone: string;
  actif: boolean;
  systeme: boolean;
  niveau: number;
  dateCreation: string;
  dateModification: string;
  menus: Menu[];
  nombreMembres: number;
}

export interface CreateRoleCustomDTO {
  nom: string;
  description: string;
  couleur: string;
  icone: string;
  niveau: number;
  menuIds: number[];
}

export interface UserMenusDTO {
  userId: number;
  groupeId: number;
  groupeNom: string;
  roleCustom: RoleCustom | null;
  menus: Menu[];
}