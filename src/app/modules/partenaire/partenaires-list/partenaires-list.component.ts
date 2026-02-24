// ============================================================
// MY2-0 - LISTE DES PARTENAIRES (Admin)
// Gestion administrative des partenaires
// ============================================================

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { PartenaireDTO, StatutPartenaire, TypeContrat } from '../../../core/models/partenaire.model';
import { AdminPartenaireService, PartenaireListParams } from '../../../core/services/admin-partenaire.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';



@Component({
  selector: 'app-partenaires-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './partenaires-list.component.html',
  styleUrls: ['./partenaires-list.component.scss']
})
export class PartenairesListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Données
  partenaires: PartenaireDTO[] = [];
  dataSource = new MatTableDataSource<PartenaireDTO>([]);
  
  // Colonnes affichées
  displayedColumns: string[] = [
    'nom',
    'contact',
    'typeContrat',
    'statut',
    'limites',
    'dateFinContrat',
    'actions'
  ];

  // États
  isLoading = true;
  totalElements = 0;
  selectedPartenaire: PartenaireDTO | null = null;
  
  // Filtres
  searchQuery = '';
  selectedStatut: StatutPartenaire | '' = '';
  selectedType: TypeContrat | '' = '';
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // Stats rapides
  stats = {
    total: 0,
    actifs: 0,
    suspendus: 0,
    expirantBientot: 0
  };

  // Options de filtres
  statuts: { value: StatutPartenaire | ''; label: string }[] = [
    { value: '', label: 'Tous les statuts' },
    { value: 'ACTIF', label: 'Actif' },
    { value: 'SUSPENDU', label: 'Suspendu' },
    { value: 'RESILIE', label: 'Résilié' },
    { value: 'EN_ATTENTE', label: 'En attente' }
  ];

  typesContrat: { value: TypeContrat | ''; label: string }[] = [
    { value: '', label: 'Tous les types' },
    { value: 'ESSAI', label: 'Essai' },
    { value: 'BASIC', label: 'Basic' },
    { value: 'STANDARD', label: 'Standard' },
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'PERSONNALISE', label: 'Personnalisé' }
  ];

  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(
    private adminService: AdminPartenaireService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPartenaires();
    this.loadStats();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.searchSubject.complete();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  public loadPartenaires(): void {
    this.isLoading = true;

    const params: PartenaireListParams = {
      page: this.pageIndex,
      size: this.pageSize,
      search: this.searchQuery || undefined,
      statut: this.selectedStatut || undefined,
      typeContrat: this.selectedType || undefined
    };

    const sub = this.adminService.getPartenaires(params).subscribe({
      next: (response) => {
        this.partenaires = response.content;
        this.dataSource.data = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement partenaires:', err);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement', 'OK', { duration: 3000 });
      }
    });
    this.subscriptions.push(sub);
  }

  private loadStats(): void {
    const sub = this.adminService.getGlobalStats().subscribe({
      next: (stats) => {
        this.stats = {
          total: stats.totalPartenaires,
          actifs: stats.partenairesActifs,
          suspendus: stats.partenairesSuspendus,
          expirantBientot: stats.contratsExpirantBientot
        };
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
      }
    });
    this.subscriptions.push(sub);
  }

  private setupSearch(): void {
    const sub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      this.pageIndex = 0;
      this.loadPartenaires();
    });
    this.subscriptions.push(sub);
  }

  // ============================================================
  // FILTRES ET RECHERCHE
  // ============================================================

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onStatutChange(): void {
    this.pageIndex = 0;
    this.loadPartenaires();
  }

  onTypeChange(): void {
    this.pageIndex = 0;
    this.loadPartenaires();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatut = '';
    this.selectedType = '';
    this.pageIndex = 0;
    this.loadPartenaires();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedStatut || this.selectedType);
  }

  // ============================================================
  // PAGINATION ET TRI
  // ============================================================

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPartenaires();
  }

  onSortChange(sort: Sort): void {
    // Implémenter le tri côté serveur si nécessaire
    this.loadPartenaires();
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  activerPartenaire(partenaire: PartenaireDTO): void {
    this.adminService.activerPartenaire(partenaire.id).subscribe({
      next: () => {
        this.snackBar.open('Partenaire activé', 'OK', { duration: 3000 });
        this.loadPartenaires();
        this.loadStats();
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'activation', 'OK', { duration: 3000 });
      }
    });
  }

  suspendrePartenaire(partenaire: PartenaireDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Suspendre le partenaire',
        message: `Voulez-vous vraiment suspendre le partenaire "${partenaire.nom}" ? Ses publicités seront désactivées.`,
        confirmText: 'Suspendre',
        cancelText: 'Annuler',
        confirmColor: 'warn',
        icon: 'pause_circle'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.suspendrePartenaire(partenaire.id).subscribe({
          next: () => {
            this.snackBar.open('Partenaire suspendu', 'OK', { duration: 3000 });
            this.loadPartenaires();
            this.loadStats();
          },
          error: () => {
            this.snackBar.open('Erreur lors de la suspension', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  deletePartenaire(partenaire: PartenaireDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le partenaire',
        message: `Attention ! Cette action est irréversible. Toutes les données du partenaire "${partenaire.nom}" seront supprimées (entreprises, publicités, statistiques).`,
        confirmText: 'Supprimer définitivement',
        cancelText: 'Annuler',
        confirmColor: 'warn',
        icon: 'delete_forever'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.deletePartenaire(partenaire.id).subscribe({
          next: () => {
            this.snackBar.open('Partenaire supprimé', 'OK', { duration: 3000 });
            this.loadPartenaires();
            this.loadStats();
          },
          error: () => {
            this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  exportList(): void {
    this.adminService.exportPartenaires('excel').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `partenaires_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Export téléchargé', 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'export', 'OK', { duration: 3000 });
      }
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'status-active';
      case 'SUSPENDU': return 'status-suspended';
      case 'RESILIE': return 'status-terminated';
      case 'EN_ATTENTE': return 'status-pending';
      default: return 'status-default';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'Actif';
      case 'SUSPENDU': return 'Suspendu';
      case 'RESILIE': return 'Résilié';
      case 'EN_ATTENTE': return 'En attente';
      default: return statut;
    }
  }

  getTypeContratClass(type: string): string {
    switch (type) {
      case 'ESSAI': return 'type-trial';
      case 'BASIC': return 'type-basic';
      case 'STANDARD': return 'type-standard';
      case 'PREMIUM': return 'type-premium';
      case 'PERSONNALISE': return 'type-custom';
      default: return 'type-default';
    }
  }

  getDaysUntilExpiration(dateFinContrat: string | null): number | null {
    if (!dateFinContrat) return null;
    const end = new Date(dateFinContrat);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isExpiringSoon(dateFinContrat: string | null): boolean {
    const days = this.getDaysUntilExpiration(dateFinContrat);
    return days !== null && days > 0 && days <= 30;
  }

  isExpired(dateFinContrat: string | null): boolean {
    const days = this.getDaysUntilExpiration(dateFinContrat);
    return days !== null && days <= 0;
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'Illimité';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  trackByPartenaire(index: number, partenaire: PartenaireDTO): number {
    return partenaire.id;
  }
}