export interface ZoneGeographique {
  id: number;
  nom: string;
  type: 'PAYS' | 'REGION' | 'DEPARTEMENT' | 'VILLE';
  parent?: ZoneGeographique;
}

export interface Ethnie {
  id: number;
  nom: string;
}