import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sanction } from '../models/sanction.model';
import { environment } from '../../environment';

export interface PaiementSanction {
  id?: number;
  sanctionId: number;
  sanction?: Sanction;
  mouvementCaisseId?: number;
  montant: number;
  datePaiement: string;
  dateEnregistrement?: string;
  modePaiement: 'ESPECES' | 'MOBILE_MONEY' | 'VIREMENT' | 'CHEQUE' | 'AUTRE';
  reference?: string;
  commentaire?: string;
  enregistreParId?: number;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'ANNULE';
}

export interface PaiementRequest {
  sanctionId: number;
  montant: number;
  datePaiement: string;
  modePaiement: string;
  reference?: string;
  caisseId?: number;
  commentaire?: string;
}

export interface SanctionResume {
  nombreTotal: number;
  nombrePayees: number;
  nombrePartielles: number;
  nombreNonPayees: number;
  totalMontant: number;
  totalPaye: number;
  totalResteAPayer: number;
  tauxRecouvrement: number;
  parTypeSanction: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class SanctionFinanceService {
  private apiUrl = `${environment.apiUrl}/sanctions`;

  constructor(private http: HttpClient) {}

  // =====================================================
  // PAIEMENTS
  // =====================================================

  /**
   * Enregistre un paiement pour une sanction
   */
  enregistrerPaiement(request: PaiementRequest): Observable<PaiementSanction> {
    return this.http.post<PaiementSanction>(
      `${this.apiUrl}/${request.sanctionId}/paiements`,
      request
    );
  }

  /**
   * Obtient l'historique des paiements pour une sanction
   */
  getHistoriquePaiements(sanctionId: number): Observable<PaiementSanction[]> {
    return this.http.get<PaiementSanction[]>(
      `${this.apiUrl}/${sanctionId}/paiements`
    );
  }

  /**
   * Annule un paiement
   */
  annulerPaiement(paiementId: number, motif: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/paiements/${paiementId}`,
      { body: { motif } }
    );
  }

  // =====================================================
  // STATISTIQUES
  // =====================================================

  /**
   * Obtient le résumé des sanctions pour un exercice
   */
  getResumeSanctionsExercice(exerciceId: number): Observable<SanctionResume> {
    return this.http.get<SanctionResume>(
      `${this.apiUrl}/resume/exercice/${exerciceId}`
    );
  }

  /**
   * Obtient les sanctions non payées d'un membre
   */
  getSanctionsNonPayeesMembre(membreId: number): Observable<Sanction[]> {
    return this.http.get<Sanction[]>(
      `${this.apiUrl}/membre/${membreId}/non-payees`
    );
  }

  /**
   * Obtient le total des sanctions non payées d'un membre
   */
  getTotalSanctionsNonPayees(membreId: number): Observable<{ membreId: number; totalNonPayees: number }> {
    return this.http.get<{ membreId: number; totalNonPayees: number }>(
      `${this.apiUrl}/membre/${membreId}/total-non-payees`
    );
  }

  // =====================================================
  // REPORT D'EXERCICE
  // =====================================================

  /**
   * Reporte les sanctions non payées vers un nouvel exercice
   */
  reporterSanctionsNonPayees(ancienExerciceId: number, nouvelExerciceId: number): Observable<Sanction[]> {
    return this.http.post<Sanction[]>(
      `${this.apiUrl}/reporter`,
      { ancienExerciceId, nouvelExerciceId }
    );
  }

  // =====================================================
  // HELPERS
  // =====================================================

  /**
   * Calcule le reste à payer pour une sanction
   */
  calculerResteAPayer(sanction: Sanction): number {
    const montant = sanction.montant || 0;
    const paye = sanction.montantPaye || 0;
    return Math.max(0, montant - paye);
  }

  /**
   * Vérifie si une sanction est entièrement payée
   */
  isEntierementPayee(sanction: Sanction): boolean {
    return this.calculerResteAPayer(sanction) <= 0;
  }

  /**
   * Calcule le pourcentage payé
   */
  calculerPourcentagePaye(sanction: Sanction): number {
    if (!sanction.montant || sanction.montant <= 0) return 100;
    const paye = sanction.montantPaye || 0;
    return Math.min(100, (paye / sanction.montant) * 100);
  }

  /**
   * Obtient la classe CSS pour l'état de paiement
   */
  getEtatClass(sanction: Sanction): string {
    const pourcentage = this.calculerPourcentagePaye(sanction);
    if (pourcentage >= 100) return 'status-paid';
    if (pourcentage > 0) return 'status-partial';
    return 'status-unpaid';
  }

  /**
   * Obtient le libellé de l'état de paiement
   */
  getEtatLabel(sanction: Sanction): string {
    const pourcentage = this.calculerPourcentagePaye(sanction);
    if (pourcentage >= 100) return 'Payée';
    if (pourcentage > 0) return `Partiel (${Math.round(pourcentage)}%)`;
    return 'Non payée';
  }
}