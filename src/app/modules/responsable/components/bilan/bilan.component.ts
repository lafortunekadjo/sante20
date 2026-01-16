// bilan.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services

import { GroupeService } from '../../../../core/services/groupe.service';
import { FinancesService } from '../../../../core/services/finances.service';

// Interfaces
interface Exercice {
  id: number;
  libelle: string;
  annee: number;
  actif: boolean;
  cloture: boolean;
  dateDebut: string;
  dateFin: string;
  soldeReporte: number;
}

interface BilanData {
  exercice: Exercice;
  soldeInitial: number;
  totalEntrees: number;
  totalSorties: number;
  soldeFinal: number;
  detailCaisses: CaisseBilan[];
  detailContributions: ContributionBilan[];
  detailDepenses: DepenseBilan[];
  impayes: ImpayesBilan;
  statistiques: StatistiquesBilan;
}

interface CaisseBilan {
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

interface ContributionBilan {
  typeId: number;
  nom: string;
  montantAttendu: number;
  montantRecu: number;
  tauxRecouvrement: number;
  nbContributions: number;
}

interface DepenseBilan {
  typeId: number;
  nom: string;
  budgetAlloue: number;
  montantDepense: number;
  tauxConsommation: number;
  nbDepenses: number;
}

interface ImpayesBilan {
  totalImpayes: number;
  nombreMembresEnRetard: number;
  detailParType: { type: string; montant: number }[];
}

interface StatistiquesBilan {
  nombreMembresActifs: number;
  nombreContributions: number;
  contributionMoyenne: number;
  nombreSorties: number;
  sortieMoyenne: number;
}

@Component({
  selector: 'app-bilan',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './bilan.component.html',
  styleUrls: ['./bilan.component.scss']
})
export class BilanComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();

  // États
  isLoading = true;
  exercices: Exercice[] = [];
  selectedExerciceId: number | null = null;
  bilanData: BilanData | null = null;

  constructor(
    private financesService: FinancesService,
    private groupeService: GroupeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    const groupeId = this.groupeService.getGroupeConn();

    if (!groupeId) {
      this.isLoading = false;
      return;
    }

    this.financesService.getExercicesByGroupe(groupeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exercices) => {
          this.exercices = exercices;
          const actif = exercices.find(e => e.actif);
          
          if (actif) {
            this.selectedExerciceId = actif.id;
            this.loadBilan(actif.id);
          } else if (exercices.length > 0) {
            this.selectedExerciceId = exercices[0].id;
            this.loadBilan(exercices[0].id);
          } else {
            this.isLoading = false;
          }
        },
        error: () => {
          this.isLoading = false;
          this.showError('Erreur lors du chargement des exercices');
        }
      });
  }

  loadBilan(exerciceId: number): void {
    this.isLoading = true;

    this.financesService.getBilanExercice(exerciceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (bilan) => {
          this.bilanData = bilan;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.showError('Erreur lors du chargement du bilan');
        }
      });
  }

  onExerciceChange(exerciceId: number): void {
    this.selectedExerciceId = exerciceId;
    this.loadBilan(exerciceId);
  }

  // Calculs
  getVariation(): number {
    if (!this.bilanData) return 0;
    return this.bilanData.soldeFinal - this.bilanData.soldeInitial;
  }

  getVariationPercentage(): number {
    if (!this.bilanData || this.bilanData.soldeInitial === 0) return 0;
    return ((this.bilanData.soldeFinal - this.bilanData.soldeInitial) / this.bilanData.soldeInitial) * 100;
  }

  isPositiveVariation(): boolean {
    return this.getVariation() >= 0;
  }

  getTauxRecouvrement(): number {
    if (!this.bilanData) return 0;
    const total = this.bilanData.totalEntrees + (this.bilanData.impayes?.totalImpayes || 0);
    if (total === 0) return 100;
    return (this.bilanData.totalEntrees / total) * 100;
  }

  getCaissePercentage(caisse: CaisseBilan): number {
    if (!this.bilanData || this.bilanData.soldeFinal === 0) return 0;
    return (caisse.soldeActuel / this.bilanData.soldeFinal) * 100;
  }

  // Formatage
  formatMontant(montant: number | undefined): string {
    if (montant === undefined || montant === null) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // Actions
  exportPDF(): void {
    this.showSuccess('Génération du PDF en cours...');
    // TODO: Implémenter l'export PDF
  }

  exportExcel(): void {
    this.showSuccess('Génération Excel en cours...');
    // TODO: Implémenter l'export Excel
  }

  print(): void {
    window.print();
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}