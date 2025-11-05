// question-candidature.model.ts
export enum TypeChamp {
  TEXTE_COURT = 'TEXTE_COURT',
  TEXTE_LONG = 'TEXTE_LONG',
  NOMBRE = 'NOMBRE',
  DATE = 'DATE',
  EMAIL = 'EMAIL',
  TELEPHONE = 'TELEPHONE',
  CHOIX_UNIQUE = 'CHOIX_UNIQUE',
  CHOIX_MULTIPLE = 'CHOIX_MULTIPLE',
  OUI_NON = 'OUI_NON'
}

export interface QuestionCandidature {
  id: number;
  groupe?: number; // ID du groupe
  texteQuestion: string;
  typeChamp: TypeChamp;
  optionsChoix?: string; // Format: "option1;option2;option3"
  ordreAffichage: number;
  obligatoire?: boolean; // Ajout pour validation
}

// groupe-config.model.ts
export interface Groupe {
  id: number;
  nom: string;
  isActive: boolean;
  discipline: string;
  ville: number;
  stade: number;
  ville1: Ville;
  stade2: Stade;
  jourMatch: string;
  typeEquipe: string;
  modeEquipe: 'STATIQUE' | 'DYNAMIQUE';
  fraisAdhesion: number;
}

export interface Ville {
  id: number;
  nom: string;
}

export interface Stade {
  id: number;
  nom: string;
}

// type-champ-info.ts - Pour l'interface
export interface TypeChampInfo {
  value: TypeChamp;
  label: string;
  icon: string;
  needsOptions: boolean;
  placeholder?: string;
}

export const TYPE_CHAMP_CONFIG: TypeChampInfo[] = [
  {
    value: TypeChamp.TEXTE_COURT,
    label: 'Texte court',
    icon: 'short_text',
    needsOptions: false,
    placeholder: 'Réponse courte (ex: nom, prénom)'
  },
  {
    value: TypeChamp.TEXTE_LONG,
    label: 'Texte long',
    icon: 'subject',
    needsOptions: false,
    placeholder: 'Réponse détaillée (ex: motivation)'
  },
  {
    value: TypeChamp.NOMBRE,
    label: 'Nombre',
    icon: 'pin',
    needsOptions: false,
    placeholder: 'Réponse numérique (ex: âge, numéro)'
  },
  {
    value: TypeChamp.DATE,
    label: 'Date',
    icon: 'event',
    needsOptions: false,
    placeholder: 'Sélection de date'
  },
  {
    value: TypeChamp.EMAIL,
    label: 'Email',
    icon: 'email',
    needsOptions: false,
    placeholder: 'Adresse email'
  },
  {
    value: TypeChamp.TELEPHONE,
    label: 'Téléphone',
    icon: 'phone',
    needsOptions: false,
    placeholder: 'Numéro de téléphone'
  },
  {
    value: TypeChamp.CHOIX_UNIQUE,
    label: 'Choix unique',
    icon: 'radio_button_checked',
    needsOptions: true,
    placeholder: 'Séparez les options par des points-virgules (;)'
  },
  {
    value: TypeChamp.CHOIX_MULTIPLE,
    label: 'Choix multiple',
    icon: 'check_box',
    needsOptions: true,
    placeholder: 'Séparez les options par des points-virgules (;)'
  },
  {
    value: TypeChamp.OUI_NON,
    label: 'Oui/Non',
    icon: 'toggle_on',
    needsOptions: false,
    placeholder: 'Question fermée'
  }
];