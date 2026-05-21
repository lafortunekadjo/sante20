// models/competition.models.ts

export enum TypeCompetition {
  CHAMPIONNAT = 'CHAMPIONNAT',
  COUPE = 'COUPE',
  MIXTE = 'MIXTE'
}

export enum FormatCompetition {
  ALLER_SIMPLE = 'ALLER_SIMPLE',
  ALLER_RETOUR = 'ALLER_RETOUR',
  ELIMINATION_SIMPLE = 'ELIMINATION_SIMPLE',
  MIXTE = 'MIXTE'
}

export enum StatutCompetition {
  BROUILLON = 'BROUILLON',
  INSCRIPTION_OUVERTE = 'INSCRIPTION_OUVERTE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE'
}

export enum TypePhase {
  GROUPE = 'GROUPE',
  ELIMINATOIRE = 'ELIMINATOIRE'
}

export enum StatutPhase {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE'
}

export enum StatutMatch {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  REPORTE = 'REPORTE',
  FORFAIT_DOMICILE = 'FORFAIT_DOMICILE',
  FORFAIT_EXTERIEUR = 'FORFAIT_EXTERIEUR',
  FORFAIT_DOUBLE = 'FORFAIT_DOUBLE',
  ANNULE = 'ANNULE'
}

export enum StatutJournee {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE'
}

export enum NomTour {
  TOUR_PRELIMINAIRE = 'TOUR_PRELIMINAIRE',
  SEIZIEME = 'SEIZIEME',
  HUITIEME = 'HUITIEME',
  QUART_DE_FINALE = 'QUART_DE_FINALE',
  DEMI_FINALE = 'DEMI_FINALE',
  FINALE = 'FINALE'
}

export enum TypeEvent {
  BUT = 'BUT',
  PENALTY_MARQUE = 'PENALTY_MARQUE',
  PENALTY_RATE = 'PENALTY_RATE',
  CONTRE_SON_CAMP = 'CONTRE_SON_CAMP',
  CARTON_JAUNE = 'CARTON_JAUNE',
  CARTON_ROUGE = 'CARTON_ROUGE',
  CARTON_ROUGE_DOUBLE_JAUNE = 'CARTON_ROUGE_DOUBLE_JAUNE',
  REMPLACEMENT = 'REMPLACEMENT',
  BUT_ANNULE = 'BUT_ANNULE'
}

export enum TypeParticipant {
  GROUPE_MY20 = 'GROUPE_MY20',
  EXTERNE = 'EXTERNE'
}

export enum StatutInscription {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE',
  RETIRE = 'RETIRE'
}

export enum StatutClassement {
  QUALIFIE = 'QUALIFIE',
  CHAMPION = 'CHAMPION',
  RELEGATE = 'RELEGATE',
  BARRAGE = 'BARRAGE',
  PENALISE = 'PENALISE'
}

export enum CritereClassement {
  CONFRONTATION_DIRECTE = 'CONFRONTATION_DIRECTE',
  GOAL_AVERAGE_GENERAL = 'GOAL_AVERAGE_GENERAL',
  BUTS_MARQUES = 'BUTS_MARQUES',
  BUTS_EXTERIEUR = 'BUTS_EXTERIEUR',
  FAIR_PLAY = 'FAIR_PLAY',
  TIRAGE = 'TIRAGE'
}

export enum PosteJoueur {
  GARDIEN = 'GARDIEN',
  DEFENSEUR = 'DEFENSEUR',
  MILIEU = 'MILIEU',
  ATTAQUANT = 'ATTAQUANT'
}

export enum StatutComposition {
  TITULAIRE = 'TITULAIRE',
  REMPLACANT = 'REMPLACANT',
  NON_CONVOQUE = 'NON_CONVOQUE'
}

export enum Cote {
  DOMICILE = 'DOMICILE',
  EXTERIEUR = 'EXTERIEUR',
  LES_DEUX = 'LES_DEUX'
}

// ── Config
export interface CompetitionConfigDTO {
  format: FormatCompetition;
  pointsVictoire: number;
  pointsNul: number;
  pointsDefaite: number;
  scoreForfaitVainqueur: number;
  scoreForfaitPerdant: number;
  criteresClassement: CritereClassement[];
  seuilCartonsJaunesSuspension: number;
  matchsSuspensionCartonRouge: number;
  cumulCartonsEntrePhases: boolean;
  prolongationsActives: boolean;
  dureeProlong1: number;
  dureeProlong2: number;
  tabActif: boolean;
  nombreEquipesMin: number;
  nombreEquipesMax: number;
  allerRetour: boolean;
  nombreGroupes: number;
  equipesParGroupe: number;
  qualifiesParGroupe: number;
  meilleursTimesActif: boolean;
  nombreMeilleursTimesQualifies: number;
  droitsEngagementActifs: boolean;
  montantEngagement?: number;
}

// ── Participant
export interface CompetitionParticipantDTO {
  id: number;
  type: TypeParticipant;
  clubId?: number;
  nomEquipe: string;
  logoUrl?: string;
  contactResponsable?: string;
  statutInscription: StatutInscription;
  dateInscription: string;
  seed?: number;
}

// ── Competition
export interface CompetitionDTO {
  id: number;
  nom: string;
  description?: string;
  logoUrl?: string;
  type: TypeCompetition;
  statut: StatutCompetition;
  dateDebut: string;
  dateFin?: string;
  dateLimiteInscription?: string;
  organisateurNom?: string;
  nombreParticipants: number;
  format: FormatCompetition;
}

export interface CompetitionDetailDTO extends CompetitionDTO {
  config: CompetitionConfigDTO;
  participants: CompetitionParticipantDTO[];
  phases: PhaseDTO[];
}

export interface CompetitionCreateDTO {
  nom: string;
  description?: string;
  logoUrl?: string;
  type: TypeCompetition;
  dateDebut: string;
  dateFin?: string;
  dateLimiteInscription?: string;
  organisateurClubId?: number;
  organisateurNom?: string;
  config: CompetitionConfigDTO;
}

export interface CompetitionUpdateDTO {
  nom?: string;
  description?: string;
  logoUrl?: string;
  dateDebut?: string;
  dateFin?: string;
  dateLimiteInscription?: string;
  organisateurNom?: string;
  config?: CompetitionConfigDTO;
}

// ── Phase
export interface PhaseDTO {
  id: number;
  nom: string;
  ordre: number;
  type: TypePhase;
  statut: StatutPhase;
  dateDebut?: string;
  dateFin?: string;
  nomTour?: NomTour;
  matchAllerRetour?: boolean;
}

// ── Poule (ex-Groupe)
export interface PouleDTO {
  id: number;
  nom: string;
  participants: CompetitionParticipantDTO[];
  classement: ClassementDTO[];
  nombreJournees: number;
  journeesTerminees: number;
}

// ── Classement
export interface ClassementDTO {
  participantId: number;
  nomEquipe: string;
  logoUrl?: string;
  position: number;
  matchsJoues: number;
  victoires: number;
  nuls: number;
  defaites: number;
  butsPour: number;
  butsContre: number;
  goalAverage: number;
  points: number;
  penalitePoints: number;
  statutSpecial?: StatutClassement;
}

// ── Journée
export interface JourneeDTO {
  id: number;
  numero: number;
  nom: string;
  statut: StatutJournee;
  dateDebut?: string;
  dateFin?: string;
  nombreMatchs: number;
  matchsTermines: number;
}

export interface JourneeDetailDTO extends JourneeDTO {
  matchs: MatchDTO[];
}

// ── Match
export interface MatchDTO {
  id: number;
  domicile: CompetitionParticipantDTO;
  exterieur: CompetitionParticipantDTO;
  butsDomicile?: number;
  butsExterieur?: number;
  butsDomicileProlong?: number;
  butsExterieurProlong?: number;
  tabDomicile?: number;
  tabExterieur?: number;
  statut: StatutMatch;
  dateHeure?: string;
  lieu?: string;
  journeeNumero: number;
  tourNom?: string;
}

export interface MatchDetailDTO extends MatchDTO {
  vainqueur?: CompetitionParticipantDTO;
  evenements: MatchEventDTO[];
  compositionDomicile: MatchCompositionDTO[];
  compositionExterieur: MatchCompositionDTO[];
    heureEffectiveDebut?: string;
  heureEffectiveMiTemps?: string;
  heureEffectiveReprise?: string;
  heureEffectiveFin?: string;
  tempsAdditionnel1?: number;
  tempsAdditionnel2?: number;
  tempsAdditionnelP1?: number;
  tempsAdditionnelP2?: number;
  conditions?: string;
}

export interface ResultatDTO {
  butsDomicile: number;
  butsExterieur: number;
  butsDomicileProlong?: number;
  butsExterieurProlong?: number;
  tabDomicile?: number;
  tabExterieur?: number;
}

export interface ForfaitDTO {
  equipeForfait: Cote;
  motif?: string;
}

export interface ReportDTO {
  nouvelleDate: string;
  motif?: string;
}

export interface PlanificationMatchDTO {
 matchId?: number;
  dateHeure?: string;
  stadeId?: number;
  lieu?: string;
  officiels?: MatchOfficielDTO[];
}

// ── Événement match
export interface MatchEventDTO {
  id?: number;
  type: TypeEvent;
  minute?: number;
  minuteAdditionnel?: number;
  joueurId?: number;
  joueurNom?: string;
  joueurPrenom?: string;
  joueurSortantId?: number;
  joueurSortantNom?: string;
  passeurId?: number;
  passeurNom?: string;
  equipeId?: number;
  equipeNom?: string;
}

export interface CompositionDTO {
  membreId?: number;    // ← nouveau
  joueurId?: number;
  joueurNom: string;
  joueurPrenom?: string;
  numeroDos?: number;
  poste?: PosteJoueur;
  statut: StatutComposition;
  minuteEntree?: number;
  minuteSortie?: number;
  capitaine: boolean;
  gardienTitulaire: boolean;
}

// ── Composition
export interface MatchCompositionDTO {
  id?: number;
  membreId?: number;
  joueurId?: number;
  joueurNom: string;
  joueurPrenom?: string;
  numeroDos?: number;
  poste?: PosteJoueur;
  statut: StatutComposition;
  minuteEntree?: number;
  minuteSortie?: number;
  capitaine: boolean;
  gardienTitulaire: boolean;
  eligible: boolean;
  raisonIneligibilite?: string;
}

// ── Bracket
export interface BracketDTO {
  phaseId: number;
  phaseNom: string;
  nomTour: NomTour;
  noeuds: BracketNoeudDTO[];
}

export interface BracketNoeudDTO {
  id: number;
  position: number;
  participant1?: CompetitionParticipantDTO;
  participant2?: CompetitionParticipantDTO;
  vainqueur?: CompetitionParticipantDTO;
  matchAller?: MatchDTO;
  matchRetour?: MatchDTO;
  noeudSuivantId?: number;
  bye: boolean;
}

// ── Statistiques
export interface ButeurDTO {
  joueurId?: number;
  joueurNom: string;
  joueurPrenom?: string;
  nomEquipe?: string;
  logoEquipe?: string;
  nbButs: number;
  nbPenalties: number;
  nbContresSonCamp: number;
}

export interface PasseurDTO {
  joueurId?: number;
  joueurNom: string;
  joueurPrenom?: string;
  nomEquipe?: string;
  nbPasses: number;
}

export interface CartonJoueurDTO {
  joueurId?: number;
  joueurNom: string;
  nomEquipe?: string;
  nbCartonsJaunes: number;
  nbCartonsRouges: number;
}

export interface CartonsDTO {
  classementCartonsJaunes: CartonJoueurDTO[];
  classementCartonsRouges: CartonJoueurDTO[];
  totalCartonsJaunes: number;
  totalCartonsRouges: number;
}

export interface StatsEquipeDTO {
  participantId: number;
  nomEquipe: string;
  logoUrl?: string;
  matchsJoues: number;
  victoires: number;
  nuls: number;
  defaites: number;
  butsPour: number;
  butsContre: number;
  goalAverage: number;
  points: number;
  serieEnCours: number;
  typeSerieEnCours?: string;
  plusGrandeVictoire?: MatchDTO;
  plusLourdeDefaite?: MatchDTO;
}

export interface StatsJoueurDTO {
  joueurId?: number;
  joueurNom?: string;
  joueurPrenom?: string;
  nomEquipe?: string;
  matchsJoues: number;
  buts: number;
  passes: number;
  cartonsJaunes: number;
  cartonsRouges: number;
  minutesJouees: number;
  suspenduProchainMatch: boolean;
  cartonsJaunesRestantsAvantSuspension: number;
}

export interface SuspensionDTO {
  id: number;
  joueurId?: number;
  joueurNom: string;
  joueurPrenom?: string;
  nomEquipe?: string;
  raison: TypeEvent;
  motifManuel?: string;
  nbMatchsInitial: number;
  nbMatchsRestants: number;
  active: boolean;
  manuelle: boolean;
  dateDebut?: string;
  dateFin?: string;
  matchDeclencheurId?: number;
  matchDeclencheurLibelle?: string;
}

export interface CompetitionResumeDTO {
  id: number;
  nom: string;
  statut: StatutCompetition;
  type: TypeCompetition;
  phaseEnCoursNom?: string;
  journeeEnCours?: number;
  nombreMatchsRestants?: number;
  derniersResultats: MatchDTO[];
  prochainsMatchs: MatchDTO[];
  leader?: ClassementDTO;
}

// ── Inscription
export interface InscriptionDTO {
  type: TypeParticipant;
  clubId?: number;
  nomEquipe: string;
  logoUrl?: string;
  contactResponsable?: string;
  seed?: number;
}

// ── Pagination
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Ajouter à competition.models.ts

export enum RoleOfficiel {
  ARBITRE_PRINCIPAL    = 'ARBITRE_PRINCIPAL',
  ARBITRE_ASSISTANT_1  = 'ARBITRE_ASSISTANT_1',
  ARBITRE_ASSISTANT_2  = 'ARBITRE_ASSISTANT_2',
  QUATRIEME_ARBITRE    = 'QUATRIEME_ARBITRE',
  DELEGUE              = 'DELEGUE',
  OBSERVATEUR          = 'OBSERVATEUR'
}

export interface StadeDTO {
  id: number;
  nom: string;
  ville?: string;
  adresse?: string;
  capacite?: number;
  photoUrl?: string;
  clubId?: number;
  clubNom?: string;
  actif: boolean;
}

export interface StadeCreateDTO {
  nom: string;
  ville?: string;
  adresse?: string;
  capacite?: number;
  photoUrl?: string;
  clubId?: number;
  clubNom?: string;
}

export interface OfficielDTO {
  id: number;
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  role: RoleOfficiel;
  photoUrl?: string;
  actif: boolean;
}

export interface OfficielCreateDTO {
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  role: RoleOfficiel;
  photoUrl?: string;
}

export interface MatchOfficielDTO {
  officielId: number;
  nom?: string;
  prenom?: string;
  role: RoleOfficiel;
}


// Mise à jour MatchDTO pour inclure stade et officiels
export interface MatchDTO {
  id: number;
  domicile: CompetitionParticipantDTO;
  exterieur: CompetitionParticipantDTO;
  butsDomicile?: number;
  butsExterieur?: number;
  butsDomicileProlong?: number;
  butsExterieurProlong?: number;
  tabDomicile?: number;
  tabExterieur?: number;
  statut: StatutMatch;
  dateHeure?: string;
  lieu?: string;
  stade?: StadeDTO;          // ← nouveau
  officiels?: MatchOfficielDTO[]; // ← nouveau
  journeeNumero: number;
  tourNom?: string;
}

export enum RoleMembre {
  JOUEUR              = 'JOUEUR',
  GARDIEN             = 'GARDIEN',
  CAPITAINE           = 'CAPITAINE',
  ENTRAINEUR          = 'ENTRAINEUR',
  ASSISTANT_COACH     = 'ASSISTANT_COACH',
  PREPARATEUR_PHYSIQUE = 'PREPARATEUR_PHYSIQUE',
  MEDECIN             = 'MEDECIN',
  DIRIGEANT           = 'DIRIGEANT',
  AUTRE               = 'AUTRE'
}

export enum StatutMembre {
  ACTIF         = 'ACTIF',
  SUSPENDU      = 'SUSPENDU',
  BLESSE        = 'BLESSE',
  NON_CONVOQUE  = 'NON_CONVOQUE'
}

export interface MembreEquipeDTO {
  id: number;
  joueurId?: number;
  nom: string;
  prenom?: string;
  photoUrl?: string;
  telephone?: string;
  role: RoleMembre;
  numeroDos?: number;
  poste?: string;
  dateNaissance?: string;
  nationalite?: string;
  statut: StatutMembre;
  actif: boolean;
}

export interface MembreEquipeCreateDTO {
  joueurId?: number;
  nom: string;
  prenom?: string;
  photoUrl?: string;
  telephone?: string;
  role: RoleMembre;
  numeroDos?: number;
  poste?: string;
  dateNaissance?: string;
  nationalite?: string;
}

export interface TempsMatchDTO {
  heureEffectiveDebut?: string;
  heureEffectiveMiTemps?: string;
  heureEffectiveReprise?: string;
  heureEffectiveFin?: string;
  tempsAdditionnel1?: number;
  tempsAdditionnel2?: number;
  tempsAdditionnelP1?: number;
  tempsAdditionnelP2?: number;
  conditions?: string;
}