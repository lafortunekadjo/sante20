// ===== HELPERS POUR LE COMPOSANT EXPLORER =====

// Interface pour les filtres rapides
export interface QuickFilterTag {
  code: string;
  label: string;
  icon: string;
  active: boolean;
  filterFunction: (groupe: any) => boolean;
}

// Interface pour les plages de prix
export interface PriceRange {
  label: string;
  min: number;
  max: number | null;
}


// ===== INTERFACES ADDITIONNELLES =====

export interface GroupeFilters {
  searchText: string;
  discipline: string;
  ville: string;
  quartier: string;
  typeEquipe: string;
  jourMatch: string;
  niveauRequis: string;
  fraisMin: number;
  fraisMax: number;
}

export interface GroupeCard {
  id: number;
  nom: string;
  discipline: string;
  ville: string;
  quartier?: string;
  stade: string;
  jourMatch: string;
  heureMatch?: string;
  typeEquipe: string;
  fraisAdhesion: number;
  description?: string;
  imageUrl?: string;
  capaciteMax?: number;
  nombreMembres?: number;
  accepteNouveauxMembres: boolean;
  dateCreation?: string;
}