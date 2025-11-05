// src/app/core/models/menu.model.ts

export interface Menu {
  id: number;
  code: string;
  label: string;
  icone: string;
  route: string;
  description: string;
  ordre: number;
  actif: boolean;
  categorie: string;
}

export interface MenuCategorie {
  code: string;
  label: string;
  icone: string;
  menus: Menu[];
}