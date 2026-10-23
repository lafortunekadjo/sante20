import { Stade } from "./stade";

// groupe-public.model.ts
export interface GroupePublic {
  id: number;
  nom: string;
  discipline: string;
  ville: string;
  quartier?: string;
  localisation?: string;
  stade: Stade;
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
  dateCreation: Date ;
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
/** Profil public d'un groupe (page de détail d'Explorer) : infos d'accueil et activité des 12 derniers mois. */
export interface GroupeProfil {
  id: number;
  nom: string;
  discipline: string;
  ville?: string;
  quartier?: string;
  stade?: string;
  jourMatch?: string;
  heureMatch?: string;
  fraisAdhesion?: number;
  nombreMembres: number;
  capaciteMax?: number;
  imageUrl?: string;
  description?: string;
  niveauRequis?: string;
  accepteNouveauxMembres: boolean;
  activite: {
    matchsJoues: number; matchsExternes: number; matchsInternes: number;
    victoires: number; nuls: number; defaites: number;
    butsPour: number; butsContre: number; serieInvaincue: number; seancesDeJeu: number;
  };
  derniersResultats: { date: string; adversaire?: string; score: string; issue: 'V' | 'N' | 'D' }[];
}
