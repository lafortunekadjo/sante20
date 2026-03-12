// mouvements-historique.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Caisse, Exercice, FinancesService, MouvementCaisse } from '../../../../core/services/finances.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

// Services


// Interfaces




@Component({
  selector: 'app-mouvements-historique',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './mouvements-historique.component.html',
  styleUrls: ['./mouvements-historique.component.scss']
})
export class MouvementsHistoriqueComponent implements OnInit, OnDestroy {
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();

  // États
  isLoading = true;
  exerciceActif: Exercice | null = null;
  exercices: Exercice[] = [];
  caisses: Caisse[] = [];
  mouvements: MouvementCaisse[] = [];

  // Table
  displayedColumns = ['date', 'type', 'libelle', 'caisse', 'membre', 'montant', 'statut', 'actions'];
  dataSource = new MatTableDataSource<MouvementCaisse>([]);

  // Formulaire de filtres
  filterForm: FormGroup;
  selectedExerciceId: number | null = null;

  // Statistiques
  stats = {
    totalEntrees: 0,
    totalSorties: 0,
    nbEntrees: 0,
    nbSorties: 0,
    balance: 0
  };

  constructor(
    private fb: FormBuilder,
    private financesService: FinancesService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      type: ['ALL'],
      caisseId: [null],
      dateDebut: [null],
      dateFin: [null],
      statut: ['ALL']
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilterListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  loadData(): void {
    this.isLoading = true;
     const groupeId = this.authService.getGroupe();

    if (!groupeId) {
      this.isLoading = false;
      return;
    }

    // Charger les exercices
    this.financesService.getExercicesByGroupe(groupeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exercices) => {
          this.exercices = exercices;
          this.exerciceActif = exercices.find(e => e.actif) || null;
          
          if (this.exerciceActif) {
            this.selectedExerciceId = this.exerciceActif.id;
            this.loadCaisses(this.exerciceActif.id);
            this.loadMouvements(this.exerciceActif.id);
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

  loadCaisses(exerciceId: number): void {
    this.financesService.getCaissesByExercice(exerciceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (caisses) => {
          this.caisses = caisses;
        }
      });
  }

  loadMouvements(exerciceId: number | undefined): void {
    this.financesService.getMouvementsExercice(exerciceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (mouvements) => {
          this.mouvements = mouvements;
          this.calculateStats();
          this.applyFilters();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.showError('Erreur lors du chargement des mouvements');
        }
      });
  }

  onExerciceChange(exerciceId: number): void {
    this.selectedExerciceId = exerciceId;
    this.isLoading = true;
    this.loadCaisses(exerciceId);
    this.loadMouvements(exerciceId);
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.mouvements];

    // Filtre par recherche
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(m => 
        m.libelle.toLowerCase().includes(search) ||
        m.reference?.toLowerCase().includes(search) ||
        (m.membre && `${m.membre.prenom} ${m.membre.nom}`.toLowerCase().includes(search))
      );
    }

    // Filtre par type
    if (filters.type !== 'ALL') {
      filtered = filtered.filter(m => m.typeMouvement === filters.type);
    }

    // Filtre par caisse
    if (filters.caisseId) {
      filtered = filtered.filter(m => m.caisse?.id === filters.caisseId);
    }

    // Filtre par date début
    if (filters.dateDebut) {
      const dateDebut = new Date(filters.dateDebut);
      filtered = filtered.filter(m => new Date(m.dateMouvement) >= dateDebut);
    }

    // Filtre par date fin
    if (filters.dateFin) {
      const dateFin = new Date(filters.dateFin);
      filtered = filtered.filter(m => new Date(m.dateMouvement) <= dateFin);
    }

    // Filtre par statut
    if (filters.statut !== 'ALL') {
      filtered = filtered.filter(m => m.statut === filters.statut);
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

  calculateStats(): void {
    const entrees = this.mouvements.filter(m => m.typeMouvement === 'ENTREE' && m.statut === 'VALIDE');
    const sorties = this.mouvements.filter(m => m.typeMouvement === 'SORTIE' && m.statut === 'VALIDE');

    this.stats.totalEntrees = entrees.reduce((sum, m) => sum + m.montant, 0);
    this.stats.totalSorties = sorties.reduce((sum, m) => sum + m.montant, 0);
    this.stats.nbEntrees = entrees.length;
    this.stats.nbSorties = sorties.length;
    this.stats.balance = this.stats.totalEntrees - this.stats.totalSorties;
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      type: 'ALL',
      caisseId: null,
      dateDebut: null,
      dateFin: null,
      statut: 'ALL'
    });
  }

  // Helpers
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

  viewDetail(mouvement: MouvementCaisse): void {
    // TODO: Ouvrir dialog de détail
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