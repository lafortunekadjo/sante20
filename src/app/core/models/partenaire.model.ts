// ============================================================
// MY2-0 - MODÈLES PARTENAIRE
// Interfaces TypeScript pour le module partenaire
// ============================================================

// ============================================================
// PARTENAIRE
// ============================================================

export interface PartenaireDTO {
  id: number;
  nom: string;
  description?: string;
  personneContact?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  
  // Contrat
  typeContrat: TypeContrat;
  dateDebutContrat?: string;
  dateFinContrat?: string;
  montantContrat?: number;
  frequenceFacturation?: FrequenceFacturation;
  emplacementsAutorises: string[];
  maxPublicitesActives?: number;
  maxEntreprises?: number;
  
  statut: StatutPartenaire;
  createdAt?: string;
  
  // Compteurs
  nombreEntreprises?: number;
  nombrePublicitesActives?: number;
  nombreUtilisateurs?: number;
  
  // Stats
  totalImpressions?: number;
  totalClics?: number;
}

export type TypeContrat = 'ESSAI' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'PERSONNALISE';
export type FrequenceFacturation = 'PONCTUEL' | 'HEBDOMADAIRE' | 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL';
export type StatutPartenaire = 'EN_ATTENTE' | 'ACTIF' | 'SUSPENDU' | 'EXPIRE' | 'RESILIE';

// ============================================================
// ENTREPRISE
// ============================================================

export interface EntrepriseDTO {
  id: number;
  partenaireId: number;
  partenaireNom?: string;
  
  nom: string;
  slogan?: string;
  description?: string;
  
  // Médias
  logoUrl?: string;
  bannerUrl?: string;
  imagesUrls?: string[];
  
  categorie: CategorieEntreprise;
  
  // Contact
  telephone?: string;
  email?: string;
  siteWeb?: string;
  whatsapp?: string;
  
  // Localisation
  adresse?: string;
  ville?: string;
  quartier?: string;
  latitude?: number;
  longitude?: number;
  
  // Réseaux
  facebookUrl?: string;
  instagramUrl?: string;
  
  actif: boolean;
  createdAt?: string;
  
  // Stats
  nombrePublicites?: number;
  totalImpressions?: number;
  totalClics?: number;
}

export interface CreateEntrepriseRequest {
  nom: string;
  slogan?: string;
  description?: string;
  categorie: CategorieEntreprise;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  whatsapp?: string;
  adresse?: string;
  ville?: string;
  quartier?: string;
  latitude?: number;
  longitude?: number;
  facebookUrl?: string;
  instagramUrl?: string;
}

export type CategorieEntreprise = 
  | 'EQUIPEMENT_SPORTIF'
  | 'NUTRITION_BOISSON'
  | 'RESTAURATION'
  | 'SANTE_BIEN_ETRE'
  | 'TRANSPORT'
  | 'LOISIRS_DIVERTISSEMENT'
  | 'MODE_VETEMENTS'
  | 'SERVICES_FINANCIERS'
  | 'TECHNOLOGIE'
  | 'FORMATION_EDUCATION'
  | 'IMMOBILIER'
  | 'AUTRE';

// ============================================================
// PUBLICITÉ
// ============================================================

export interface PubliciteDTO {
  id: number;
  entrepriseId: number;
  entrepriseNom?: string;
  entrepriseLogoUrl?: string;
  partenaireId?: number;
  partenaireNom?: string;
  
  titre: string;
  description?: string;
  imageUrl?: string;
  lienCible?: string;
  
  emplacement: EmplacementPublicite;
  format?: FormatPublicite;
  
  dateDebut?: string;
  dateFin?: string;
  
  villesCibles?: string[];
  
  statut: StatutPublicite;
  priorite: number;
  
  // Stats
  totalImpressions: number;
  totalClics: number;
  tauxClics?: number;
  derniereImpression?: string;
  
  createdAt?: string;
  dateApprobation?: string;
}

export interface CreatePubliciteRequest {
  entrepriseId: number;
  titre: string;
  description?: string;
  lienCible?: string;
  emplacement: EmplacementPublicite;
  format?: FormatPublicite;
  dateDebut?: string;
  dateFin?: string;
  villesCibles?: string[];
  priorite?: number;
}

export interface UpdatePubliciteRequest {
  titre?: string;
  description?: string;
  lienCible?: string;
  dateDebut?: string;
  dateFin?: string;
  villesCibles?: string[];
  priorite?: number;
  statut?: StatutPublicite;
}

export type EmplacementPublicite = 
  | 'HEADER'
  | 'SIDEBAR'
  | 'FEED'
  | 'BETWEEN_SECTIONS'
  | 'FOOTER'
  | 'SPLASH_SCREEN'
  | 'PDF_FOOTER'
  | 'IMAGE_MATCH'
  | 'MODAL'
  | 'EXPLORER_TOP';

export type FormatPublicite = 
  | 'BANNER_728x90'
  | 'BANNER_468x60'
  | 'BANNER_320x50'
  | 'BANNER_300x250'
  | 'BANNER_336x280'
  | 'SQUARE_250x250'
  | 'SKYSCRAPER_160x600'
  | 'LOGO_SMALL'
  | 'LOGO_MEDIUM'
  | 'FULLSCREEN'
  | 'NATIVE';

export type StatutPublicite = 
  | 'BROUILLON'
  | 'EN_ATTENTE'
  | 'ACTIVE'
  | 'PAUSEE'
  | 'REJETEE'
  | 'TERMINEE'
  | 'ARCHIVEE';

// ============================================================
// UTILISATEUR PARTENAIRE
// ============================================================

export interface UtilisateurPartenaireDTO {
  id: number;
  partenaireId: number;
  partenaireNom?: string;
  utilisateurId: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: RolePartenaire;
  permissions?: string[];
  actif: boolean;
  createdAt?: string;
  derniereConnexion?: string;
}

export interface CreateUtilisateurPartenaireRequest {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  role: RolePartenaire;
  permissions?: string[];
}

export type RolePartenaire = 'ADMIN_PARTENAIRE' | 'GESTIONNAIRE' | 'LECTEUR';

// ============================================================
// STATISTIQUES
// ============================================================

export interface StatsPartenaireDTO {
  partenaireId: number;
  partenaireNom?: string;
  
  nombreEntreprises: number;
  nombrePublicitesActives: number;
  nombrePublicitesTotal?: number;
  
  totalImpressions: number;
  totalClics: number;
  tauxClicsMoyen: number;
  
  statsParEmplacement?: StatsEmplacementDTO[];
  statsParEntreprise?: StatsEntrepriseDTO[];
  evolution30Jours?: StatsJournaliereDTO[];
}

export interface StatsPubliciteDTO {
  publiciteId: number;
  publiciteTitre?: string;
  emplacement?: string;
  
  totalImpressions: number;
  totalClics: number;
  tauxClics: number;
  
  impressionsPeriode?: number;
  clicsPeriode?: number;
  utilisateursUniques?: number;
  
  impressionsMobile?: number;
  impressionsDesktop?: number;
  
  statsJournalieres?: StatsJournaliereDTO[];
}

export interface StatsEmplacementDTO {
  emplacement: string;
  impressions: number;
  clics: number;
  tauxClics: number;
}

export interface StatsEntrepriseDTO {
  entrepriseId: number;
  entrepriseNom: string;
  nombrePublicites: number;
  impressions: number;
  clics: number;
  tauxClics: number;
}

export interface StatsJournaliereDTO {
  date: string;
  impressions: number;
  clics: number;
  tauxClics?: number;
}

// ============================================================
// AFFICHAGE PUBLICITÉ (Pour le composant ad-banner)
// ============================================================

export interface PubliciteAffichageDTO {
  id: number;
  imageUrl: string;
  titre?: string;
  lienCible?: string;
  format?: string;
  entrepriseNom?: string;
  entrepriseLogoUrl?: string;
  trackingId: string;
}

// ============================================================
// ENUMS HELPERS
// ============================================================

export const CATEGORIES_ENTREPRISE: { value: CategorieEntreprise; labelKey: string }[] = [
  { value: 'EQUIPEMENT_SPORTIF', labelKey: 'partenaire.entreprises.categories.EQUIPEMENT_SPORTIF' },
  { value: 'NUTRITION_BOISSON', labelKey: 'partenaire.entreprises.categories.NUTRITION_BOISSON' },
  { value: 'RESTAURATION', labelKey: 'partenaire.entreprises.categories.RESTAURATION' },
  { value: 'SANTE_BIEN_ETRE', labelKey: 'partenaire.entreprises.categories.SANTE_BIEN_ETRE' },
  { value: 'TRANSPORT', labelKey: 'partenaire.entreprises.categories.TRANSPORT' },
  { value: 'LOISIRS_DIVERTISSEMENT', labelKey: 'partenaire.entreprises.categories.LOISIRS_DIVERTISSEMENT' },
  { value: 'MODE_VETEMENTS', labelKey: 'partenaire.entreprises.categories.MODE_VETEMENTS' },
  { value: 'SERVICES_FINANCIERS', labelKey: 'partenaire.entreprises.categories.SERVICES_FINANCIERS' },
  { value: 'TECHNOLOGIE', labelKey: 'partenaire.entreprises.categories.TECHNOLOGIE' },
  { value: 'FORMATION_EDUCATION', labelKey: 'partenaire.entreprises.categories.FORMATION_EDUCATION' },
  { value: 'IMMOBILIER', labelKey: 'partenaire.entreprises.categories.IMMOBILIER' },
  { value: 'AUTRE', labelKey: 'partenaire.entreprises.categories.AUTRE' }
];

export const EMPLACEMENTS_PUBLICITE: { value: EmplacementPublicite; labelKey: string; dimensions: string }[] = [
  { value: 'HEADER', labelKey: 'partenaire.publicites.emplacements.HEADER', dimensions: '728x90' },
  { value: 'SIDEBAR', labelKey: 'partenaire.publicites.emplacements.SIDEBAR', dimensions: '160x600' },
  { value: 'FEED', labelKey: 'partenaire.publicites.emplacements.FEED', dimensions: '300x250' },
  { value: 'BETWEEN_SECTIONS', labelKey: 'partenaire.publicites.emplacements.BETWEEN_SECTIONS', dimensions: '336x280' },
  { value: 'FOOTER', labelKey: 'partenaire.publicites.emplacements.FOOTER', dimensions: '468x60' },
  { value: 'SPLASH_SCREEN', labelKey: 'partenaire.publicites.emplacements.SPLASH_SCREEN', dimensions: '1080x1920' },
  { value: 'PDF_FOOTER', labelKey: 'partenaire.publicites.emplacements.PDF_FOOTER', dimensions: '200x100' },
  { value: 'IMAGE_MATCH', labelKey: 'partenaire.publicites.emplacements.IMAGE_MATCH', dimensions: '200x100' },
  { value: 'MODAL', labelKey: 'partenaire.publicites.emplacements.MODAL', dimensions: '500x400' },
  { value: 'EXPLORER_TOP', labelKey: 'partenaire.publicites.emplacements.EXPLORER_TOP', dimensions: '728x90' }
];

export const STATUTS_PUBLICITE: { value: StatutPublicite; labelKey: string; color: string }[] = [
  { value: 'BROUILLON', labelKey: 'partenaire.publicites.status.BROUILLON', color: 'default' },
  { value: 'EN_ATTENTE', labelKey: 'partenaire.publicites.status.EN_ATTENTE', color: 'warn' },
  { value: 'ACTIVE', labelKey: 'partenaire.publicites.status.ACTIVE', color: 'primary' },
  { value: 'PAUSEE', labelKey: 'partenaire.publicites.status.PAUSEE', color: 'accent' },
  { value: 'REJETEE', labelKey: 'partenaire.publicites.status.REJETEE', color: 'warn' },
  { value: 'TERMINEE', labelKey: 'partenaire.publicites.status.TERMINEE', color: 'default' },
  { value: 'ARCHIVEE', labelKey: 'partenaire.publicites.status.ARCHIVEE', color: 'default' }
];

export const ROLES_PARTENAIRE: { value: RolePartenaire; labelKey: string; descriptionKey: string }[] = [
  { 
    value: 'ADMIN_PARTENAIRE', 
    labelKey: 'partenaire.users.roles.ADMIN_PARTENAIRE',
    descriptionKey: 'partenaire.users.rolesDescription.ADMIN_PARTENAIRE'
  },
  { 
    value: 'GESTIONNAIRE', 
    labelKey: 'partenaire.users.roles.GESTIONNAIRE',
    descriptionKey: 'partenaire.users.rolesDescription.GESTIONNAIRE'
  },
  { 
    value: 'LECTEUR', 
    labelKey: 'partenaire.users.roles.LECTEUR',
    descriptionKey: 'partenaire.users.rolesDescription.LECTEUR'
  }
];