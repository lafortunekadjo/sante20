// groupe-public.model.ts
export interface GroupePublic {
  id: number;
  nom: string;
  discipline: string;
  ville: string;
  quartier?: string;
  localisation?: string;
  stade: string;
  jourMatch: string;
  heureMatch?: string;
  typeEquipe: string;
  modeEquipe: 'STATIQUE' | 'DYNAMIQUE';
  fraisAdhesion: number;
  description?: string;
  nombreMembres?: number;
  capaciteMax?: number;
  imageUrl?: string;
  isActive: boolean;
  accepteNouveauxMembres?: boolean;
  niveauRequis?: string; // Débutant, Intermédiaire, Avancé
  stadiumLat: number;
  stadiumLon: number;
  radius: number;
}

// filters.model.ts
export interface GroupeFilters {
  searchText: string;
  discipline: string;
  ville: string;
  quartier: string;
  typeEquipe: string;
  jourMatch: string;
  fraisMin: number ;
  fraisMax: number ;
  niveauRequis: string;
  accepteNouveauxMembres: boolean | null;
}

// demande-adhesion.model.ts
export interface DemandeAdhesion {
  id?: number | null;
  groupeId: number;
  userId?: number;
  statut: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';
  dateCreation: Date;
  reponses?: ReponseQuestion[];
}

export interface ReponseQuestion {
  questionId: number;
  valeur: string;
}

// Constants
export const DISCIPLINES = [
  'Football',
  'Basketball',
  'Volleyball',
  'Handball',
  'Rugby',
  'Tennis',
  'Badminton'
];

export const TYPES_EQUIPE = [
  'Senior',
  'Junior',
  'Vétéran',
  'Féminin',
  'Masculin',
  'Mixte'
];

export const JOURS_SEMAINE = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche'
];

export const NIVEAUX = [
  'Débutant',
  'Intermédiaire',
  'Avancé',
  'Tous niveaux'
];