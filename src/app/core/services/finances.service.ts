// finances.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environment';


// ==================== INTERFACES ====================

export interface Exercice {
  id: number;
  libelle: string;
  annee: number;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
  cloture: boolean;
  dateCloture?: string;
  soldeReporte: number;
  soldeFinal?: number;
  groupe?: any;
}

export interface Caisse {
  id?: number;
  nom: string;
  description?: string;
  type: TypeCaisse;
  soldeActuel: number;
  soldeReporte: number;
  totalEntrees: number;
  totalSorties: number;
  couleur: string;
  icone: string;
  ordre?: number;
  actif: boolean;
  seuilAlerteMin?: number;
  seuilAlerteMax?: number;
  exercice?: Exercice;
}

export type TypeCaisse = 'ADHESION' | 'COTISATION' | 'SANCTION' | 'EVENEMENT' | 'MATCH' | 'INVESTISSEMENT' | 'RESERVE' | 'AUTRE';

export interface TypeContribution {
  id?: number;
  nom: string;
  description?: string;
  frequence: FrequenceContribution;
  montantStandard?: number;
  montantMinimum?: number;
  obligatoire: boolean;
  genererEcheancesAuto: boolean;
  jourEcheance?: number;
  lieEvenement: boolean;
  majStatutMembre: boolean;
  champStatutMembre?: string;
  reportable: boolean;
  actif: boolean;
  caisse?: Caisse;
  exercice?: Exercice;
  delaiContribution: Date
}

export type FrequenceContribution = 'UNIQUE' | 'PAR_MATCH' | 'HEBDOMADAIRE' | 'MENSUELLE' | 'TRIMESTRIELLE' | 'SEMESTRIELLE' | 'ANNUELLE' | 'PONCTUELLE';

export interface TypeDepense {
  id?: number;
  nom: string;
  description?: string;
  icone?: string;
  couleur?: string;
  budgetAlloue?: number;
  seuilAlerte?: number;
  necessiteValidation: boolean;
  seuilValidation?: number;
  actif: boolean;
  caisse?: Caisse;
  exercice?: Exercice;
}

export interface MouvementCaisse {
  id?: number;
  typeMouvement: 'ENTREE' | 'SORTIE';
  montant: number;
  dateMouvement: string;
  dateEnregistrement?: string;
  libelle: string;
  reference?: string;
  membre?: any;
  caisse?: Caisse;
  typeContribution?: TypeContribution;
  typeDepense?: TypeDepense;
  beneficiaire?: any;
  beneficiaireTexte?: string;
  evenement?: any;
  enregistrePar?: any;
  validePar?: any;
  statut: StatutMouvement;
  pieceJustificative?: string;
  commentaire?: string;
  soldeApresMouvement?: number;
}

export type StatutMouvement = 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'ANNULE';

export interface EcheancierContribution {
  id?: number;
  membre?: any;
  typeContribution?: TypeContribution;
  dateEcheance: string;
  periodeConcernee?: string;
  montantAttendu: number;
  montantPaye: number;
  resteAPayer: number;
  statut: StatutEcheance;
  dateDernierPaiement?: string;
  reporte: boolean;
  exonere?: boolean;
  joursRetard?: number;
  penaliteRetard?: number;
  exercice?: Exercice;
}

export type StatutEcheance = 'EN_ATTENTE' | 'PARTIEL' | 'PAYE' | 'EN_RETARD' | 'EXONERE' | 'REPORTE';

export interface SoldeGlobal {
  soldeTotal: number;
  totalEntrees: number;
  totalSorties: number;
  nombreCaisses: number;
  detailCaisses: CaisseDetail[];
}

export interface CaisseDetail {
  caisseId: number;
  nom: string;
  type: TypeCaisse;
  soldeActuel: number;
  soldeReporte: number;
  totalEntrees: number;
  totalSorties: number;
  couleur: string;
  icone: string;
}

export interface BilanExercice {
  id?: number;
  exercice?: Exercice;
  dateGeneration?: string;
  soldeInitial: number;
  totalEntrees: number;
  totalSorties: number;
  soldeFinal: number;
  detailParCaisseJson?: string;
  detailCaisses?: CaisseDetail[];
  detailContributions?: ContributionBilan[];
  detailDepenses?: DepenseBilan[];
  impayes?: ImpayesBilan;
  statistiques?: StatistiquesBilan;
  totalImpayesAdhesion: number;
  totalImpayesCotisations: number;
  totalImpayesSanctions: number;
  nombreMembresEnRetard: number;
  nombreMembresActifs: number;
  valide: boolean;
}

export interface ContributionBilan {
  typeId: number;
  nom: string;
  montantAttendu: number;
  montantRecu: number;
  tauxRecouvrement: number;
  nbContributions: number;
}

export interface DepenseBilan {
  typeId: number;
  nom: string;
  budgetAlloue: number;
  montantDepense: number;
  tauxConsommation: number;
  nbDepenses: number;
}

export interface ImpayesBilan {
  totalImpayes: number;
  nombreMembresEnRetard: number;
  detailParType: { type: string; montant: number }[];
}

export interface StatistiquesBilan {
  nombreMembresActifs: number;
  nombreContributions: number;
  contributionMoyenne: number;
  nombreSorties: number;
  sortieMoyenne: number;
}

export interface EntreeCaisseRequest {
  caisseId: number;
  membreId: number;
  montant: number;
  dateMouvement?: string;
  libelle: string;
  typeContributionId?: number;
  contributionCampagneId?: number;
  echeanceId?: number;
  evenementId?: number;
  commentaire?: string;
}

export interface SortieCaisseRequest {
  caisseId: number;
  montant: number;
  dateMouvement?: string;
  libelle: string;
  typeDepenseId?: number;
  beneficiaireId?: number;
  beneficiaireTexte?: string;
  evenementId?: number;
  pieceJustificative?: string;
  commentaire?: string;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class FinancesService {
 

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==================== EXERCICES ====================
  // Backend: ExerciceController.java

  /**
   * POST /api/exercices/groupe/{groupeId}
   * Créer un nouvel exercice
   */
  creerExercice(groupeId: number, data: any): Observable<Exercice> {
    return this.http.post<Exercice>(`${this.baseUrl}/exercices/groupe/${groupeId}`, data);
  }

  /**
   * GET /api/exercices/actif/groupe/{groupeId}
   * Récupérer l'exercice actif d'un groupe
   */
  getExerciceActif(groupeId: number): Observable<Exercice | null> {
    return this.http.get<Exercice>(`${this.baseUrl}/exercices/actif/groupe/${groupeId}`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * GET /api/exercices/groupe/{groupeId}
   * Récupérer tous les exercices d'un groupe
   */
  getExercicesGroupe(groupeId: number): Observable<Exercice[]> {
    return this.http.get<Exercice[]>(`${this.baseUrl}/exercices/groupe/${groupeId}`);
  }

  /**
   * Alias pour getExercicesGroupe (utilisé dans certains composants)
   */
  getExercicesByGroupe(groupeId: number): Observable<Exercice[]> {
    return this.getExercicesGroupe(groupeId);
  }

  /**
   * Alias pour getTypesContributionByExercice (utilisé dans certains composants)
   */
  getTypesContributionsByExercice(exerciceId: number): Observable<TypeContribution[]> {
    return this.getTypesContributionByExercice(exerciceId);
  }

    getMouvementsByContribution(contributionId: number): Observable<MouvementCaisse[]> {
    return this.http.get<MouvementCaisse[]>(`${this.baseUrl}/caisses/${contributionId}/historique/contrib`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * GET /api/exercices/{exerciceId}
   * Récupérer un exercice par son ID
   */
  getExerciceById(exerciceId: number): Observable<Exercice> {
    return this.http.get<Exercice>(`${this.baseUrl}/exercices/${exerciceId}`);
  }

  /**
   * GET /api/exercices/{exerciceId}/preview-bilan
   * Prévisualiser le bilan avant clôture
   */
  previewBilan(exerciceId: number): Observable<BilanExercice> {
    return this.http.get<BilanExercice>(`${this.baseUrl}/exercices/${exerciceId}/preview-bilan`);
  }

  /**
   * POST /api/exercices/{exerciceId}/cloturer
   * Clôturer un exercice
   */
  cloturerExercice(exerciceId: number, options: any): Observable<BilanExercice> {
    return this.http.post<BilanExercice>(`${this.baseUrl}/exercices/${exerciceId}/cloturer`, options);
  }

  /**
   * GET /api/exercices/{exerciceId}/bilan
   * Récupérer le bilan d'un exercice
   */
  getBilanExercice(exerciceId: number): Observable<BilanExercice | null> {
    return this.http.get<BilanExercice>(`${this.baseUrl}/exercices/${exerciceId}/bilan`).pipe(
      map(bilan => this.enrichBilanData(bilan)),
      catchError(() => of(null))
    );
  }

  // ==================== CAISSES ====================
  // Backend: CaisseController.java

  /**
   * POST /api/caisses
   * Créer une nouvelle caisse
   */
  creerCaisse(data: any): Observable<Caisse> {
    return this.http.post<Caisse>(`${this.baseUrl}/caisses`, data);
  }

  /**
   * GET /api/caisses/exercice/{exerciceId}
   * Récupérer les caisses d'un exercice
   */
  getCaissesByExercice(exerciceId: number): Observable<Caisse[]> {
    return this.http.get<Caisse[]>(`${this.baseUrl}/caisses/exercice/${exerciceId}`);
  }

  getCaissesByGroupe(groupeId: number): Observable<Caisse[]> {
  return this.http.get<Caisse[]>(`${this.baseUrl}/caisses/groupe/${groupeId}`);
}

  /**
   * GET /api/caisses/solde-global
   * Récupérer le solde global
   */
  getSoldeGlobal(groupeId: number, exerciceId: number): Observable<SoldeGlobal> {
    const params = new HttpParams()
      .set('groupeId', groupeId.toString())
      .set('exerciceId', exerciceId.toString());
    return this.http.get<SoldeGlobal>(`${this.baseUrl}/caisses/solde-global`, { params });
  }

  // ==================== ENTRÉES ====================
  // Backend: CaisseController.java

  /**
   * POST /api/caisses/entrees
   * Enregistrer une entrée de caisse
   */
  enregistrerEntree(data: EntreeCaisseRequest): Observable<MouvementCaisse> {
    return this.http.post<MouvementCaisse>(`${this.baseUrl}/caisses/entrees`, data);
  }

  // ==================== SORTIES ====================
  // Backend: CaisseController.java

  /**
   * POST /api/caisses/sorties
   * Enregistrer une sortie de caisse
   */
  enregistrerSortie(data: SortieCaisseRequest): Observable<MouvementCaisse> {
    return this.http.post<MouvementCaisse>(`${this.baseUrl}/caisses/sorties`, data);
  }

  /**
   * PUT /api/caisses/sorties/{mouvementId}/valider
   * Valider une sortie
   */
  validerSortie(mouvementId: number): Observable<MouvementCaisse> {
    return this.http.put<MouvementCaisse>(`${this.baseUrl}/caisses/sorties/${mouvementId}/valider`, {});
  }

  /**
   * PUT /api/caisses/sorties/{mouvementId}/rejeter
   * Rejeter une sortie
   */
  rejeterSortie(mouvementId: number, motif: string): Observable<MouvementCaisse> {
    return this.http.put<MouvementCaisse>(`${this.baseUrl}/caisses/sorties/${mouvementId}/rejeter`, { motif });
  }

  // ==================== MOUVEMENTS ====================
  // Backend: CaisseController.java

  /**
   * GET /api/caisses/{caisseId}/historique
   * Récupérer l'historique d'une caisse
   */
  getHistoriqueCaisse(caisseId: number, debut: string, fin: string): Observable<MouvementCaisse[]> {
    const params = new HttpParams()
    return this.http.get<MouvementCaisse[]>(`${this.baseUrl}/caisses/${caisseId}/historique`, { params });
  }

    getHistoriqueContrib(contribId: number): Observable<MouvementCaisse[]> {
    
    return this.http.get<MouvementCaisse[]>(`${this.baseUrl}/caisses/${contribId}/historique/contrib`);
  }

  /**
   * GET /api/caisses/mouvements/exercice/{exerciceId}
   * Récupérer tous les mouvements d'un exercice
   */
  getMouvementsExercice(exerciceId: number | undefined): Observable<MouvementCaisse[]> {
    return this.http.get<MouvementCaisse[]>(`${this.baseUrl}/caisses/mouvements/exercice/${exerciceId}`);
  }

  /**
   * GET /api/caisses/mouvements/membre/{membreId}
   * Récupérer les mouvements d'un membre
   */
  getMouvementsMembre(membreId: number): Observable<MouvementCaisse[]> {
    return this.http.get<MouvementCaisse[]>(`${this.baseUrl}/caisses/mouvements/membre/${membreId}`);
  }

   getMouvementsMembre2(): Observable<MouvementCaisse[]> {
    return this.http.get<MouvementCaisse[]>(`${this.baseUrl}/caisses/mouvements/membre`);
  }


  // ==================== TYPES DE CONTRIBUTION ====================
  // Backend: TypeContributionController.java

  /**
   * POST /api/types-contributions
   * Créer un type de contribution
   */
  creerTypeContribution(data: any): Observable<TypeContribution> {
        console.log(data)
    return this.http.post<TypeContribution>(`${this.baseUrl}/types-contributions`, data);
  }

  /**
   * GET /api/types-contributions/exercice/{exerciceId}
   * Récupérer les types de contribution d'un exercice
   */
  getTypesContributionByExercice(exerciceId: number | undefined): Observable<TypeContribution[]> {
    return this.http.get<TypeContribution[]>(`${this.baseUrl}/types-contributions/exercice/${exerciceId}`);
  }

  /**
   * PUT /api/types-contributions/{id}
   * Mettre à jour un type de contribution
   */
  updateTypeContribution(id: number, data: any): Observable<TypeContribution> {
    console.log(data)
    return this.http.put<TypeContribution>(`${this.baseUrl}/types-contributions/${id}`, data);
  }

  /**
   * DELETE /api/types-contributions/{id}
   * Désactiver un type de contribution
   */
  deleteTypeContribution(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/types-contributions/${id}`);
  }


    // Types Depenses
getTypesDepenses(groupeId: number | null): Observable<TypeDepense[]> {
  const params = groupeId ? `?groupeId=${groupeId}` : '';
  return this.http.get<TypeDepense[]>(`${this.baseUrl}/types-depenses${params}`);
}

createTypeDepense(data: Partial<TypeDepense>): Observable<TypeDepense> {
  return this.http.post<TypeDepense>(`${this.baseUrl}/types-depenses`, data);
}

// updateTypeDepense(id: number, data: Partial<TypeDepense>): Observable<TypeDepense> {
//   return this.http.put<TypeDepense>(`${this.apiUrl}/types-depenses/${id}`, data);
// }

deleteTypeDepense(id: number): Observable<void> {
  return this.http.delete<void>(`${this.baseUrl}/types-depenses/${id}`);
}

  // ==================== STATISTIQUES ====================
  // Backend: CaisseController.java

  /**
   * GET /api/caisses/stats/contributions/{exerciceId}
   * Statistiques des contributions par type
   */
  getStatistiquesContributions(exerciceId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/caisses/stats/contributions/${exerciceId}`);
  }

  /**
   * GET /api/caisses/stats/depenses/{exerciceId}
   * Statistiques des dépenses par type
   */
  getStatistiquesDepenses(exerciceId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/caisses/stats/depenses/${exerciceId}`);
  }

  /**
   * GET /api/caisses/{caisseId}
   * Récupérer une caisse par son ID
   */
  getCaisseById(caisseId: number): Observable<Caisse> {
    return this.http.get<Caisse>(`${this.baseUrl}/caisses/${caisseId}`);
  }

  /**
   * PUT /api/caisses/{caisseId}
   * Mettre à jour une caisse
   */
  updateCaisse(caisseId: number, data: Partial<Caisse>): Observable<Caisse> {
    return this.http.put<Caisse>(`${this.baseUrl}/caisses/${caisseId}`, data);
  }

  /**
   * GET /api/caisses/{caisseId}/mouvements
   * Récupérer les mouvements d'une caisse spécifique
   */
  getMouvementsByCaisse(caisseId: number): Observable<MouvementCaisse[]> {
    return this.http.get<MouvementCaisse[]>(`${this.baseUrl}/caisses/${caisseId}/mouvements`).pipe(
      catchError(() => of([]))
    );
  }

  // ==================== TYPES DE DÉPENSE ====================
  // Backend: TypeDepenseController.java

  /**
   * GET /api/types-depenses/exercice/{exerciceId}
   * Récupérer les types de dépense d'un exercice
   */
  getTypesDepenseByExercice(exerciceId: number): Observable<TypeDepense[]> {
    return this.http.get<TypeDepense[]>(`${this.baseUrl}/types-depenses/exercice/${exerciceId}`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * POST /api/types-depenses
   * Créer un type de dépense
   */
  creerTypeDepense(data: any): Observable<TypeDepense> {
    return this.http.post<TypeDepense>(`${this.baseUrl}/types-depenses`, data);
  }

  /**
   * PUT /api/types-depenses/{id}
   * Mettre à jour un type de dépense
   */
  updateTypeDepense(id: number, data: any): Observable<TypeDepense> {
    return this.http.put<TypeDepense>(`${this.baseUrl}/types-depenses/${id}`, data);
  }

  // ==================== ÉCHÉANCIER ====================
  // Backend: EcheancierController.java

  /**
   * GET /api/echeancier/exercice/{exerciceId}
   * Récupérer les échéances d'un exercice
   */
  getEcheancesByExercice(exerciceId: number): Observable<EcheancierContribution[]> {
    return this.http.get<EcheancierContribution[]>(`${this.baseUrl}/echeancier/exercice/${exerciceId}`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * GET /api/echeancier/exercice/{exerciceId}/en-retard
   * Récupérer les échéances en retard
   */
  getEcheancesEnRetard(exerciceId: number): Observable<EcheancierContribution[]> {
    return this.http.get<EcheancierContribution[]>(`${this.baseUrl}/echeancier/exercice/${exerciceId}/en-retard`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * GET /api/echeancier/membre/{membreId}
   * Récupérer les échéances d'un membre
   */
  getEcheancesByMembre(membreId: number, exerciceId: number): Observable<EcheancierContribution[]> {
    const params = new HttpParams().set('exerciceId', exerciceId.toString());
    return this.http.get<EcheancierContribution[]>(`${this.baseUrl}/echeancier/membre/${membreId}`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  // ==================== MÉTHODES UTILITAIRES FRONTEND ====================

  /**
   * Enrichir les données du bilan avec les statistiques calculées
   */
  private enrichBilanData(bilan: BilanExercice): BilanExercice {
    // Parser le JSON des détails par caisse si présent
    if (bilan.detailParCaisseJson) {
      try {
        bilan.detailCaisses = JSON.parse(bilan.detailParCaisseJson);
      } catch (e) {
        bilan.detailCaisses = [];
      }
    }

    // Construire les impayés depuis les données existantes
    bilan.impayes = {
      totalImpayes: (bilan.totalImpayesAdhesion || 0) + 
                    (bilan.totalImpayesCotisations || 0) + 
                    (bilan.totalImpayesSanctions || 0),
      nombreMembresEnRetard: bilan.nombreMembresEnRetard || 0,
      detailParType: [
        { type: 'Adhésions', montant: bilan.totalImpayesAdhesion || 0 },
        { type: 'Cotisations', montant: bilan.totalImpayesCotisations || 0 },
        { type: 'Sanctions', montant: bilan.totalImpayesSanctions || 0 }
      ].filter(d => d.montant > 0)
    };

    return bilan;
  }

  /**
   * Calculer les statistiques à partir des mouvements (côté client)
   */
  calculateStats(mouvements: MouvementCaisse[]): { 
    totalEntrees: number; 
    totalSorties: number; 
    nbEntrees: number; 
    nbSorties: number;
    balance: number;
  } {
    const entreesValides = mouvements.filter(m => m.typeMouvement === 'ENTREE' && m.statut === 'VALIDE');
    const sortiesValides = mouvements.filter(m => m.typeMouvement === 'SORTIE' && m.statut === 'VALIDE');

    const totalEntrees = entreesValides.reduce((sum, m) => sum + m.montant, 0);
    const totalSorties = sortiesValides.reduce((sum, m) => sum + m.montant, 0);

    return {
      totalEntrees,
      totalSorties,
      nbEntrees: entreesValides.length,
      nbSorties: sortiesValides.length,
      balance: totalEntrees - totalSorties
    };
  }

  /**
   * Filtrer les mouvements par type
   */
  filterMouvementsByType(mouvements: MouvementCaisse[], type: 'ENTREE' | 'SORTIE' | 'ALL'): MouvementCaisse[] {
    if (type === 'ALL') return mouvements;
    return mouvements.filter(m => m.typeMouvement === type);
  }

  /**
   * Filtrer les mouvements par caisse
   */
  filterMouvementsByCaisse(mouvements: MouvementCaisse[], caisseId: number | null): MouvementCaisse[] {
    if (!caisseId) return mouvements;
    return mouvements.filter(m => m.caisse?.id === caisseId);
  }

  /**
   * Calculer les statistiques des échéances (côté client)
   */
  calculateEcheanceStats(echeances: EcheancierContribution[]): {
    totalAttendu: number;
    totalPaye: number;
    totalRestant: number;
    nbEnRetard: number;
    nbPayes: number;
    tauxRecouvrement: number;
  } {
    const totalAttendu = echeances.reduce((sum, e) => sum + e.montantAttendu, 0);
    const totalPaye = echeances.reduce((sum, e) => sum + e.montantPaye, 0);
    const totalRestant = echeances.reduce((sum, e) => sum + e.resteAPayer, 0);
    const nbEnRetard = echeances.filter(e => e.statut === 'EN_RETARD').length;
    const nbPayes = echeances.filter(e => e.statut === 'PAYE').length;
    const tauxRecouvrement = totalAttendu > 0 ? (totalPaye / totalAttendu) * 100 : 0;

    return { totalAttendu, totalPaye, totalRestant, nbEnRetard, nbPayes, tauxRecouvrement };
  }

  // ==================== FORMATEURS ====================

  formatMontant(montant: number | undefined | null): string {
    if (montant === undefined || montant === null) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  getIconByCaisseType(type: TypeCaisse): string {
    const icons: Record<TypeCaisse, string> = {
      'ADHESION': 'card_membership',
      'COTISATION': 'payments',
      'SANCTION': 'gavel',
      'EVENEMENT': 'celebration',
      'MATCH': 'sports_soccer',
      'INVESTISSEMENT': 'trending_up',
      'RESERVE': 'savings',
      'AUTRE': 'account_balance_wallet'
    };
    return icons[type] || 'account_balance_wallet';
  }

  getCouleurByCaisseType(type: TypeCaisse): string {
    const couleurs: Record<TypeCaisse, string> = {
      'ADHESION': '#10b981',
      'COTISATION': '#2563eb',
      'SANCTION': '#ef4444',
      'EVENEMENT': '#f59e0b',
      'MATCH': '#8b5cf6',
      'INVESTISSEMENT': '#06b6d4',
      'RESERVE': '#6366f1',
      'AUTRE': '#6b7280'
    };
    return couleurs[type] || '#6b7280';
  }

  getFrequenceLabel(frequence: FrequenceContribution): string {
    const labels: Record<FrequenceContribution, string> = {
      'UNIQUE': 'Unique (une fois)',
      'PAR_MATCH': 'Par match',
      'HEBDOMADAIRE': 'Hebdomadaire',
      'MENSUELLE': 'Mensuelle',
      'TRIMESTRIELLE': 'Trimestrielle',
      'SEMESTRIELLE': 'Semestrielle',
      'ANNUELLE': 'Annuelle',
      'PONCTUELLE': 'Ponctuelle (à la demande)'
    };
    return labels[frequence] || frequence;
  }

  getStatutMouvementLabel(statut: StatutMouvement): string {
    const labels: Record<StatutMouvement, string> = {
      'EN_ATTENTE': 'En attente',
      'VALIDE': 'Validé',
      'REJETE': 'Rejeté',
      'ANNULE': 'Annulé'
    };
    return labels[statut] || statut;
  }

  getStatutEcheanceLabel(statut: StatutEcheance): string {
    const labels: Record<StatutEcheance, string> = {
      'EN_ATTENTE': 'En attente',
      'PARTIEL': 'Partiel',
      'PAYE': 'Payé',
      'EN_RETARD': 'En retard',
      'EXONERE': 'Exonéré',
      'REPORTE': 'Reporté'
    };
    return labels[statut] || statut;
  }



}