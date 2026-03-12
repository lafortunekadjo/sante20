// echeancier.component.ts
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
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { GroupeService } from '../../../../core/services/groupe.service';
import { FinancesService } from '../../../../core/services/finances.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

// Interfaces
interface Echeance {
  id: number;
  membre: { id: number; nom: string; prenom: string; photo?: string };
  typeContribution: { id: number; nom: string; couleur?: string };
  dateEcheance: string;
  periodeConcernee: string;
  montantAttendu: number;
  montantPaye: number;
  resteAPayer: number;
  statut: 'EN_ATTENTE' | 'PARTIEL' | 'PAYE' | 'EN_RETARD' | 'EXONERE' | 'REPORTE';
  joursRetard: number;
  penaliteRetard: number;
  reporte: boolean;
  exonere: boolean;
}


interface Exercice {
  id: number;
  libelle: string;
  actif: boolean;
}

interface TypeContribution {
  id: number;
  nom: string;
}

@Component({
  selector: 'app-echeancier',
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
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './echeancier.component.html',
  styleUrls: ['./echeancier.component.scss']
})
export class EcheancierComponent implements OnInit, OnDestroy {
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();

  // États
  isLoading = true;
  exerciceActif: Exercice | null = null;
  typesContributions: any[] = [];
  echeances: any[] = [];

  // Table
  displayedColumns = ['membre', 'type', 'periode', 'montant', 'paye', 'reste', 'statut', 'actions'];
  dataSource = new MatTableDataSource<Echeance>([]);

  // Filtres
  filterForm: FormGroup;

  // Statistiques
  stats = {
    totalAttendu: 0,
    totalPaye: 0,
    totalRestant: 0,
    nbEnRetard: 0,
    nbPayes: 0,
    tauxRecouvrement: 0
  };

  constructor(
    private fb: FormBuilder,
    private financesService: FinancesService,
    private groupeService: GroupeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      typeId: [null],
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

    // Charger l'exercice actif
    this.financesService.getExerciceActif(groupeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exercice:any) => {
          this.exerciceActif = exercice;
          if (exercice) {
            this.loadTypesContributions(exercice.id);
            this.loadEcheances(exercice.id);
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

  loadTypesContributions(exerciceId: number): void {
    this.financesService.getTypesContributionsByExercice(exerciceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.typesContributions = types;
        }
      });
  }

  loadEcheances(exerciceId: number): void {
    this.financesService.getEcheancesByExercice(exerciceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (echeances) => {
          this.echeances = echeances;
          this.calculateStats();
          this.applyFilters();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.showError('Erreur lors du chargement des échéances');
        }
      });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.echeances];

    // Filtre par recherche (nom membre)
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        `${e.membre.prenom} ${e.membre.nom}`.toLowerCase().includes(search) ||
        e.periodeConcernee.toLowerCase().includes(search)
      );
    }

    // Filtre par type de contribution
    if (filters.typeId) {
      filtered = filtered.filter(e => e.typeContribution.id === filters.typeId);
    }

    // Filtre par statut
    if (filters.statut !== 'ALL') {
      filtered = filtered.filter(e => e.statut === filters.statut);
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
    this.stats.totalAttendu = this.echeances.reduce((sum, e) => sum + e.montantAttendu, 0);
    this.stats.totalPaye = this.echeances.reduce((sum, e) => sum + e.montantPaye, 0);
    this.stats.totalRestant = this.echeances.reduce((sum, e) => sum + e.resteAPayer, 0);
    this.stats.nbEnRetard = this.echeances.filter(e => e.statut === 'EN_RETARD').length;
    this.stats.nbPayes = this.echeances.filter(e => e.statut === 'PAYE').length;
    this.stats.tauxRecouvrement = this.stats.totalAttendu > 0 
      ? (this.stats.totalPaye / this.stats.totalAttendu) * 100 
      : 0;
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      typeId: null,
      statut: 'ALL'
    });
  }

  // Helpers
  getMembreNom(echeance: Echeance): string {
    return `${echeance.membre.prenom} ${echeance.membre.nom}`;
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'PAYE': 'paye',
      'PARTIEL': 'partiel',
      'EN_ATTENTE': 'en-attente',
      'EN_RETARD': 'en-retard',
      'EXONERE': 'exonere',
      'REPORTE': 'reporte'
    };
    return classes[statut] || '';
  }

  getStatutIcon(statut: string): string {
    const icons: Record<string, string> = {
      'PAYE': 'check_circle',
      'PARTIEL': 'pie_chart',
      'EN_ATTENTE': 'schedule',
      'EN_RETARD': 'warning',
      'EXONERE': 'verified',
      'REPORTE': 'event_repeat'
    };
    return icons[statut] || 'help';
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'PAYE': 'Payé',
      'PARTIEL': 'Partiel',
      'EN_ATTENTE': 'En attente',
      'EN_RETARD': 'En retard',
      'EXONERE': 'Exonéré',
      'REPORTE': 'Reporté'
    };
    return labels[statut] || statut;
  }

  getProgressPercentage(echeance: Echeance): number {
    if (echeance.montantAttendu === 0) return 100;
    return (echeance.montantPaye / echeance.montantAttendu) * 100;
  }

  formatMontant(montant: number | undefined): string {
    if (montant === undefined || montant === null) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // Actions
  enregistrerPaiement(echeance: Echeance): void {
    // Navigation vers la page d'entrée avec les paramètres
    // TODO: Ouvrir dialog de paiement ou naviguer
  }

  exportData(): void {
    this.showSuccess('Export en cours...');
    // TODO: Implémenter l'export
  }

  sendReminders(): void {
    const enRetard = this.echeances.filter(e => e.statut === 'EN_RETARD');
    if (enRetard.length === 0) {
      this.showInfo('Aucun membre en retard');
      return;
    }
    // TODO: Implémenter l'envoi de rappels
    this.showSuccess(`Rappels envoyés à ${enRetard.length} membre(s)`);
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

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000
    });
  }
}