import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export type TypeScrutin = 'MVP_MATCH' | 'MVP_MOIS' | 'FAIR_PLAY_MOIS' | 'BALLON_OR_ANNEE' | 'PERSONNALISE';
export type StatutScrutin = 'PROGRAMME' | 'OUVERT' | 'CLOS' | 'ANNULE';
export type ModeEligibilite = 'PRESENTS_AU_MATCH' | 'JOUEURS_DU_MATCH' | 'PRESENCE_MIN' | 'TOUS';
export type ModeNomines = 'AUTO_TOP_N' | 'MANUEL' | 'TOUS_ELIGIBLES';
export type ModeDeclenchement = 'MANUEL' | 'AUTO_FIN_MATCH';
/** HIERARCHIE : finances à jour, cartons, buts + passes, votes, ordre alphabétique (un seul gagnant). AUCUN : ex æquo. */
export type Departage = 'HIERARCHIE' | 'AUCUN';

/** Critères de départage, dans l'ordre choisi par le responsable (l'ordre alphabétique tranche en dernier). */
export type CritereDepartage = 'FINANCES' | 'COTISATION' | 'ADHESION' | 'SANCTIONS' | 'DISCIPLINE' | 'EFFICACITE' | 'PRESENCES' | 'VOTES';
export const CRITERES_DEPARTAGE: CritereDepartage[] =
  ['FINANCES', 'COTISATION', 'ADHESION', 'SANCTIONS', 'DISCIPLINE', 'EFFICACITE', 'PRESENCES', 'VOTES'];
/** Ordre historique du groupe. */
export const CRITERES_HISTORIQUE: CritereDepartage[] =
  ['FINANCES', 'COTISATION', 'ADHESION', 'SANCTIONS', 'DISCIPLINE', 'EFFICACITE', 'VOTES'];

export const TYPES_SCRUTIN: TypeScrutin[] = ['MVP_MATCH', 'MVP_MOIS', 'FAIR_PLAY_MOIS', 'BALLON_OR_ANNEE', 'PERSONNALISE'];

/** Règles d'un scrutin (mêmes champs que RegleScrutin côté serveur). */
export interface RegleScrutin {
  votants: ModeEligibilite;
  votantsPresenceMinPercent: number;
  candidats: ModeEligibilite;
  candidatsPresenceMinPercent: number;
  nomines: ModeNomines;
  nbNomines: number;
  voixParVotant: number;
  voteSoiMeme: boolean;
  commentaire: boolean;
  poidsStats: number;
  poidsVotes: number;
  /** Points de statistiques par action (7 / 4 / 4 / 3 / 2 par défaut). */
  pointsHommeDuMatch: number;
  pointsMvpEquipe: number;
  pointsBut: number;
  pointsPasse: number;
  pointsPresence: number;
  minVotes: number;
  departage: Departage;
  /** Utilisés quand departage = HIERARCHIE, dans cet ordre. */
  criteresDepartage: CritereDepartage[];
}

export interface ScrutinResume {
  id: number;
  type: TypeScrutin;
  statut: StatutScrutin;
  titre: string;
  matchId: number | null;
  periodeDebut: string | null;
  periodeFin: string | null;
  ouvertureAt: string | null;
  fermetureAt: string | null;
  nbVotants: number;
  /** Le membre connecté a déjà voté. */
  aVote: boolean;
  /** Le membre connecté peut voter maintenant. */
  peutVoter: boolean;
}

export interface NomineScrutin {
  membreId: number;
  prenom: string;
  nom: string;
  photoUrl: string | null;
  poste: string | null;
}

export interface ResultatScrutin {
  rang: number;
  membreId: number;
  prenom: string;
  nom: string;
  photoUrl: string | null;
  nbVotes: number;
  scoreFinal: number;
  gagnant: boolean;
}

export interface ScrutinDetail {
  scrutin: ScrutinResume;
  regles: RegleScrutin;
  nomines: NomineScrutin[];
  /** Candidats déjà choisis par le membre connecté (jamais ceux d'un autre). */
  mesChoix: number[];
  /** Renseigné seulement quand le scrutin est clos. */
  resultats: ResultatScrutin[];
}

export interface CreerScrutin {
  type: TypeScrutin;
  titre?: string | null;
  matchId?: number | null;
  /** Format yyyy-MM (types mensuels). */
  mois?: string | null;
  annee?: number | null;
  periodeDebut?: string | null;
  periodeFin?: string | null;
  /** Vide = ouverture immédiate. Format ISO local (yyyy-MM-ddTHH:mm). */
  ouvertureAt?: string | null;
  fermetureAt?: string | null;
  regles?: RegleScrutin | null;
  nominesManuels?: number[] | null;
}

export interface ConfigScrutin {
  type: TypeScrutin;
  actif: boolean;
  declenchement: ModeDeclenchement;
  dureeHeures: number | null;
  reglesParDefaut: RegleScrutin;
}

export interface ModifierConfigScrutin {
  actif?: boolean;
  declenchement?: ModeDeclenchement;
  dureeHeures?: number;
  reglesParDefaut?: RegleScrutin;
  /** Vrai : efface les règles enregistrées du groupe pour ce type (retour aux règles standard). */
  reinitialiserRegles?: boolean;
}

/** Scrutins du groupe actif : consultation et vote pour tous, gestion pour le responsable (menu « Votes »). */
@Injectable({ providedIn: 'root' })
export class ScrutinService {
  private baseUrl = `${environment.apiUrl}/scrutins`;

  constructor(private http: HttpClient) {}

  lister(): Observable<ScrutinResume[]> {
    return this.http.get<ScrutinResume[]>(this.baseUrl);
  }

  detail(id: number): Observable<ScrutinDetail> {
    return this.http.get<ScrutinDetail>(`${this.baseUrl}/${id}`);
  }

  /** Une voix par appel : un scrutin à plusieurs voix se vote en plusieurs fois. */
  voter(id: number, candidatId: number, commentaire?: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/voter`, { candidatIds: [candidatId], commentaire: commentaire || null });
  }

  creer(demande: CreerScrutin): Observable<ScrutinResume> {
    return this.http.post<ScrutinResume>(this.baseUrl, demande);
  }

  ouvrir(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/ouvrir`, {});
  }

  cloturer(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/cloturer`, {});
  }

  annuler(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/annuler`, {});
  }

  modifierFermeture(id: number, fermetureAt: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/fermeture`, { fermetureAt });
  }

  configs(): Observable<ConfigScrutin[]> {
    return this.http.get<ConfigScrutin[]>(`${this.baseUrl}/config`);
  }

  modifierConfig(type: TypeScrutin, demande: ModifierConfigScrutin): Observable<ConfigScrutin> {
    return this.http.put<ConfigScrutin>(`${this.baseUrl}/config/${type}`, demande);
  }

  reglesParDefaut(type: TypeScrutin): Observable<RegleScrutin> {
    return this.http.get<RegleScrutin>(`${this.baseUrl}/regles-par-defaut`, { params: new HttpParams().set('type', type) });
  }
}
