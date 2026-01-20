// caisse-detail.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FinancesService } from '../../../../core/services/finances.service';



// Interfaces
interface Caisse {
  id: number;
  nom: string;
  description?: string;
  type: string;
  soldeActuel: number;
  soldeReporte: number;
  totalEntrees: number;
  totalSorties: number;
  couleur: string;
  icone: string;
  actif: boolean;
  seuilAlerteMin?: number;
  seuilAlerteMax?: number;
  exercice?: any;
}

interface MouvementCaisse {
  id: number;
  typeMouvement: 'ENTREE' | 'SORTIE';
  montant: number;
  dateMouvement: string;
  libelle: string;
  reference: string;
  statut: string;
  membre?: { id: number; nom: string; prenom: string };
  typeContribution?: { id: number; nom: string };
  typeDepense?: { id: number; nom: string };
  beneficiaire?: string;
  commentaire?: string;
}

@Component({
  selector: 'app-caisse-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule
  ],
  templateUrl: './caisse-detail.component.html',
  styleUrls: ['./caisse-detail.component.scss']
})
export class CaisseDetailComponent implements OnInit, OnDestroy {
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();

  // États
  isLoading = true;
  caisseId: number | null = null;
  caisse: any | null = null;
  mouvements: any[] = [];

  // Table
  displayedColumns = ['date', 'type', 'libelle', 'membre', 'montant', 'statut'];
  dataSource = new MatTableDataSource<MouvementCaisse>([]);

  // Filtres
  filterType: 'ALL' | 'ENTREE' | 'SORTIE' = 'ALL';

  // Statistiques
  stats = {
    nbEntrees: 0,
    nbSorties: 0,
    moyenneEntree: 0,
    moyenneSortie: 0
  };

  constructor(
    private route: ActivatedRoute,
    private financesService: FinancesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.caisseId = +params['id'];
      if (this.caisseId) {
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    if (!this.caisseId) return;

    this.isLoading = true;

    // Charger les informations de la caisse
    this.financesService.getCaisseById(this.caisseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (caisse) => {
          this.caisse = caisse;
          this.loadMouvements();
        },
        error: () => {
          // Si getCaisseById n'est pas disponible, charger quand même les mouvements
          this.loadMouvements();
        }
      });
  }

  loadMouvements(): void {
    if (!this.caisseId) return;

    // Utiliser getMouvementsByCaisse qui charge tous les mouvements
    this.financesService.getMouvementsByCaisse(this.caisseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (mouvements) => {
          this.mouvements = mouvements;
          
          // Extraire les infos de la caisse depuis le premier mouvement si pas encore chargées
          if (!this.caisse && mouvements.length > 0 && mouvements[0].caisse) {
            this.caisse = mouvements[0].caisse as Caisse;
          }
          
          this.applyFilter();
          this.calculateStats();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.showError('Erreur lors du chargement des mouvements');
        }
      });
  }

  applyFilter(): void {
    let filtered = this.mouvements;

    if (this.filterType !== 'ALL') {
      filtered = this.mouvements.filter(m => m.typeMouvement === this.filterType);
    }

    this.dataSource.data = filtered;
    
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    });
  }

  setFilter(type: 'ALL' | 'ENTREE' | 'SORTIE'): void {
    this.filterType = type;
    this.applyFilter();
  }

  calculateStats(): void {
    const entrees = this.mouvements.filter(m => m.typeMouvement === 'ENTREE');
    const sorties = this.mouvements.filter(m => m.typeMouvement === 'SORTIE');

    this.stats.nbEntrees = entrees.length;
    this.stats.nbSorties = sorties.length;
    this.stats.moyenneEntree = entrees.length > 0 
      ? entrees.reduce((sum, m) => sum + m.montant, 0) / entrees.length 
      : 0;
    this.stats.moyenneSortie = sorties.length > 0 
      ? sorties.reduce((sum, m) => sum + m.montant, 0) / sorties.length 
      : 0;
  }

  // Helpers
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

  getMouvementIcon(mouvement: MouvementCaisse): string {
    return mouvement.typeMouvement === 'ENTREE' ? 'arrow_upward' : 'arrow_downward';
  }

  getMouvementClass(mouvement: MouvementCaisse): string {
    return mouvement.typeMouvement === 'ENTREE' ? 'entree' : 'sortie';
  }

  getMembreNom(mouvement: MouvementCaisse): string {
    if (mouvement.membre) {
      return `${mouvement.membre.prenom} ${mouvement.membre.nom}`;
    }
    if (mouvement.beneficiaire) {
      return mouvement.beneficiaire;
    }
    return '-';
  }

  formatMontant(montant: number | undefined): string {
    if (montant === undefined || montant === null) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // Actions
  exportData(): void {
    this.showSuccess('Export en cours...');
    // TODO: Implémenter l'export
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