import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { FinancesService } from '../../../../core/services/finances.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

// ── Interfaces alignées sur BilanCompletDTO backend ───────────

export interface ExerciceBilan {
  id: number;
  libelle: string;
  annee: number;
  actif: boolean;
  cloture: boolean;
  dateDebut: string;
  dateFin: string;
  soldeReporte: number;
}

export interface CaisseBilan {
  id: number;
  nom: string;
  type: string;
  couleur: string;
  icone: string;
  soldeReporte: number;
  totalEntrees: number;
  totalSorties: number;
  soldeActuel: number;
}

// Backend renvoie { typeLabel, montant } — pas de tauxRecouvrement/montantAttendu
export interface DetailContribution {
  typeLabel: string;    // nom du type de contribution
  montant: number;      // montant total encaissé
}

export interface DetailDepense {
  typeLabel: string;    // libellé de la dépense/sortie
  montant: number;      // montant total dépensé
}

export interface DetailImpayeType {
  type: string;
  montant: number;
}

export interface ImpayesBilan {
  totalImpayes: number;
  nombreMembresEnRetard: number;
  detailParType: DetailImpayeType[];
}

export interface StatistiquesBilan {
  nombreMembresActifs: number;
  nombreContributions: number;
  contributionMoyenne: number;
  nombreSorties: number;
  sortieMoyenne: number;
}

export interface BilanComplet {
  exercice: ExerciceBilan;
  soldeInitial: number;
  totalEntrees: number;
  totalSorties: number;
  soldeFinal: number;
  detailCaisses: CaisseBilan[];
  detailContributions: DetailContribution[];
  detailDepenses: DetailDepense[];
  impayes: ImpayesBilan;
  statistiques: StatistiquesBilan;
}

export interface Exercice {
  id: number;
  libelle: string;
  annee: number;
  actif: boolean;
  cloture: boolean;
}

@Component({
  selector: 'app-bilan',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSelectModule, MatFormFieldModule, MatTooltipModule,
    MatSnackBarModule, TranslateModule, MatProgressBarModule
  ],
  templateUrl: './bilan.component.html',
  styleUrls: ['./bilan.component.scss']
})
export class BilanComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  Math = Math;

  isLoading    = true;
  isExporting  = false;
  exercices: Exercice[] = [];
  selectedExerciceId: number | null = null;
  bilanData: BilanComplet | null = null;
  bilanTab: 'caisses' | 'contributions' | 'depenses' | 'impayes' | 'statistiques' = 'caisses';

  constructor(
    private financesService: FinancesService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.loadData(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Chargement ────────────────────────────────────────────────

  loadData(): void {
    this.isLoading = true;
    const groupeId = this.authService.getGroupe();
    if (!groupeId) { this.isLoading = false; return; }

    this.financesService.getExercicesByGroupe(groupeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exercices) => {
          this.exercices = exercices;
          const actif = exercices.find(e => e.actif);
          const cible = actif || exercices[0];
          if (cible) { this.selectedExerciceId = cible.id; this.loadBilan(cible.id); }
          else        { this.isLoading = false; }
        },
        error: () => { this.isLoading = false; this.showError('Erreur chargement exercices'); }
      });
  }

  loadBilan(exerciceId: number): void {
    this.isLoading = true;
    this.bilanData = null;

    this.financesService.getBilanExercice(exerciceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (bilan) => { this.bilanData = bilan; this.isLoading = false; },
        error: () => { this.isLoading = false; this.showError('Erreur chargement bilan'); }
      });
  }

  onExerciceChange(id: number): void {
    this.selectedExerciceId = id;
    this.loadBilan(id);
  }

  // ── Calculs ───────────────────────────────────────────────────

  getVariation(): number {
    if (!this.bilanData) return 0;
    return this.bilanData.soldeFinal - this.bilanData.soldeInitial;
  }

  getVariationPct(): number {
    if (!this.bilanData || !this.bilanData.soldeInitial) return 0;
    return (this.getVariation() / this.bilanData.soldeInitial) * 100;
  }

  isPositiveVariation(): boolean { return this.getVariation() >= 0; }

  getTauxRecouvrement(): number {
    if (!this.bilanData) return 0;
    const attendu = this.bilanData.totalEntrees + (this.bilanData.impayes?.totalImpayes || 0);
    return attendu === 0 ? 100 : Math.min(100, (this.bilanData.totalEntrees / attendu) * 100);
  }

  getCaissePct(caisse: CaisseBilan): number {
    if (!this.bilanData?.soldeFinal) return 0;
    return Math.min(100, (caisse.soldeActuel / this.bilanData.soldeFinal) * 100);
  }

  // Contribution : % du total des contributions encaissées
  getContribPct(contrib: DetailContribution): number {
    if (!this.bilanData) return 0;
    const total = this.bilanData.detailContributions.reduce((s, c) => s + c.montant, 0);
    return total === 0 ? 0 : (contrib.montant / total) * 100;
  }

  // Dépense : % du total des sorties
  getDepensePct(depense: DetailDepense): number {
    if (!this.bilanData) return 0;
    const total = this.bilanData.detailDepenses.reduce((s, d) => s + d.montant, 0);
    return total === 0 ? 0 : (depense.montant / total) * 100;
  }

  // ── Export PDF ───────────────────────────────────────────────
  // Génération client-side via impression stylisée
  // Pour un vrai PDF serveur, implémenter POST /api/exercices/{id}/bilan/pdf

  exportPDF(): void {
    this.isExporting = true;
    // Ajouter une classe print-mode qui masque les tabs et affiche tout
    document.body.classList.add('bilan-print-mode');
    // Forcer tous les tabs visibles
    this.bilanTab = 'caisses'; // reset
    setTimeout(() => {
      window.print();
      document.body.classList.remove('bilan-print-mode');
      this.isExporting = false;
    }, 400);
  }

  exportExcel(): void {
    // TODO: appel API POST /api/exercices/{id}/bilan/excel → blob download
    this.showSuccess('Export Excel en cours de développement');
  }

  print(): void { window.print(); }

  // ── Formatage ─────────────────────────────────────────────────

  formatMontant(v: number | undefined | null): string {
    if (v == null) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';
  }

  formatPct(v: number | undefined | null): string {
    if (v == null || isNaN(v)) return '0%';
    return v.toFixed(1) + '%';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR');
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Fermer', { duration: 5000, panelClass: ['error-snackbar'] });
  }
  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
  }
}