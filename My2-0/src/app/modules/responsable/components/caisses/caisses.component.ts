// caisses.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { GroupeService } from '../../../../core/services/groupe.service';
import { Caisse, Exercice, FinancesService } from '../../../../core/services/finances.service';
import { AuthService } from '../../../../core/services/auth.service';

// Interfaces


@Component({
  selector: 'app-caisses',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './caisses.component.html',
  styleUrls: ['./caisses.component.scss']
})
export class CaissesComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();

  // États
  isLoading = true;
  exerciceActif: Exercice | null = null;
  caisses: Caisse[] = [];
  
  // Statistiques globales
  soldeTotal = 0;
  totalEntrees = 0;
  totalSorties = 0;

  constructor(
    private financesService: FinancesService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
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
    const groupeId = this.authService.getGroupe();

    if (!groupeId) {
      this.isLoading = false;
      return;
    }

    // Charger l'exercice actif
    this.financesService.getExerciceActif(groupeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exercice) => {
          this.exerciceActif = exercice;
          if (exercice) {
            this.loadCaisses(exercice.id);
          } else {
            this.isLoading = false;
          }
        },
        error: () => {
          this.isLoading = false;
          this.showError('Erreur lors du chargement de l\'exercice');
        }
      });
  }

  loadCaisses(exerciceId: number): void {
    this.financesService.getCaissesByExercice(exerciceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (caisses) => {
          this.caisses = caisses.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
          this.calculateTotals();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.showError('Erreur lors du chargement des caisses');
        }
      });
  }

  calculateTotals(): void {
    this.soldeTotal = this.caisses.reduce((sum, c) => sum + c.soldeActuel, 0);
    this.totalEntrees = this.caisses.reduce((sum, c) => sum + c.totalEntrees, 0);
    this.totalSorties = this.caisses.reduce((sum, c) => sum + c.totalSorties, 0);
  }

  // Calculs pour l'affichage
  getProgressPercentage(caisse: Caisse): number {
    if (this.soldeTotal === 0) return 0;
    return (caisse.soldeActuel / this.soldeTotal) * 100;
  }

  getObjectifPercentage(caisse: any): number | null {
    if (!caisse.seuilAlerteMax || caisse.seuilAlerteMax === 0) return null;
    return Math.min(100, (caisse.soldeActuel / caisse.seuilAlerteMax) * 100);
  }

  isEnAlerte(caisse: any): boolean {
    return caisse.seuilAlerteMin !== undefined && 
           caisse.seuilAlerteMin !== null && 
           caisse.soldeActuel < caisse.seuilAlerteMin;
  }

  isObjectifAtteint(caisse: any): boolean {
    return caisse.seuilAlerteMax !== undefined && 
           caisse.seuilAlerteMax !== null && 
           caisse.soldeActuel >= caisse.seuilAlerteMax;
  }

  getTypeLibelle(type: string): string {
    const types: Record<string, string> = {
      'ADHESION': 'Adhésions',
      'COTISATION': 'Cotisations',
      'SANCTION': 'Sanctions',
      'EVENEMENT': 'Événements',
      'FONCTIONNEMENT': 'Fonctionnement',
      'INVESTISSEMENT': 'Investissement',
      'AUTRE': 'Autre'
    };
    return types[type] || type;
  }

  // Formatage
  formatMontant(montant: number | undefined): string {
    if (montant === undefined || montant === null) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  // Actions
  refreshData(): void {
    this.loadData();
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