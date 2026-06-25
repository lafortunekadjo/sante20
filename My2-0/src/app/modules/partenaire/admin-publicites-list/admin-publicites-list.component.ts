// ============================================================
// MY2-0 - LISTE PUBLICITÉS ADMIN
// Gestion et validation des publicités partenaires
// ============================================================

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PubliciteDTO, EMPLACEMENTS_PUBLICITE } from '../../../core/models/partenaire.model';
import { AdminPartenaireService } from '../../../core/services/admin-partenaire.service';
import { RejetPubliciteDialogComponent } from '../rejet-publicite-dialog/rejet-publicite-dialog.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDividerModule } from '@angular/material/divider';



@Component({
  selector: 'app-admin-publicites-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
    MatBadgeModule,
    TranslateModule,
    MatDividerModule
  ],
  templateUrl: './admin-publicites-list.component.html',
  styleUrls: ['./admin-publicites-list.component.scss']
})
export class AdminPublicitesListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Données
  publicites: PubliciteDTO[] = [];
  
  // Stats par statut
  stats = {
    total: 0,
    enAttente: 0,
    actives: 0,
    pausees: 0,
    rejetees: 0
  };

  // Colonnes du tableau
  displayedColumns = ['image', 'titre', 'partenaire', 'emplacement', 'statut', 'stats', 'dates', 'actions'];

  // Filtres
  searchQuery = '';
  selectedStatut: string | null = null;
  selectedEmplacement: string | null = null;
  selectedPartenaire: number | null = null;

  // Pagination
  totalElements = 0;
  pageSize = 20;
  pageIndex = 0;

  // États
  isLoading = true;
  selectedTab = 0;
  selectedPublicite: PubliciteDTO | null = null;

  // Helpers
  emplacements = EMPLACEMENTS_PUBLICITE;
  partenaires: { id: number; nom: string }[] = [];

  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(
    private adminService: AdminPartenaireService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadPartenaires();
    this.loadStats();
    this.loadPublicites();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  private setupSearch(): void {
    const sub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageIndex = 0;
      this.loadPublicites();
    });
    this.subscriptions.push(sub);
  }

  private loadPartenaires(): void {
    const sub = this.adminService.getPartenaires({ size: 100 }).subscribe({
      next: (response) => {
        this.partenaires = response.content.map(p => ({ id: p.id, nom: p.nom }));
      }
    });
    this.subscriptions.push(sub);
  }

  private loadStats(): void {
    const sub = this.adminService.getPublicitesStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      }
    });
    this.subscriptions.push(sub);
  }

  loadPublicites(): void {
    this.isLoading = true;

    const params: any = {
      page: this.pageIndex,
      size: this.pageSize
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedStatut) params.statut = this.selectedStatut;
    if (this.selectedEmplacement) params.emplacement = this.selectedEmplacement;
    if (this.selectedPartenaire) params.partenaireId = this.selectedPartenaire;

    const sub = this.adminService.getAllPublicites(params).subscribe({
      next: (response) => {
        this.publicites = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Erreur de chargement', 'OK', { duration: 3000 });
      }
    });
    this.subscriptions.push(sub);
  }

  // ============================================================
  // FILTRES
  // ============================================================

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    
    switch (index) {
      case 0: this.selectedStatut = null; break;
      case 1: this.selectedStatut = 'EN_ATTENTE'; break;
      case 2: this.selectedStatut = 'ACTIVE'; break;
      case 3: this.selectedStatut = 'PAUSEE'; break;
      case 4: this.selectedStatut = 'REJETEE'; break;
    }
    
    this.pageIndex = 0;
    this.loadPublicites();
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.loadPublicites();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatut = null;
    this.selectedEmplacement = null;
    this.selectedPartenaire = null;
    this.selectedTab = 0;
    this.pageIndex = 0;
    this.loadPublicites();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedEmplacement || this.selectedPartenaire);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPublicites();
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  approuverPublicite(pub: PubliciteDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Approuver la publicité',
        message: `Voulez-vous approuver "${pub.titre}" ? Elle sera immédiatement visible.`,
        confirmText: 'Approuver',
        cancelText: 'Annuler',
        confirmColor: 'primary',
        icon: 'check_circle'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.approuverPublicite(pub.id).subscribe({
          next: () => {
            this.snackBar.open('Publicité approuvée', 'OK', { duration: 3000 });
            this.loadPublicites();
            this.loadStats();
          },
          error: () => {
            this.snackBar.open('Erreur lors de l\'approbation', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  rejeterPublicite(pub: PubliciteDTO): void {
    const dialogRef = this.dialog.open(RejetPubliciteDialogComponent, {
      width: '450px',
      data: { publicite: pub }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.rejeterPublicite(pub.id, result.motif).subscribe({
          next: () => {
            this.snackBar.open('Publicité rejetée', 'OK', { duration: 3000 });
            this.loadPublicites();
            this.loadStats();
          },
          error: () => {
            this.snackBar.open('Erreur lors du rejet', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  pauserPublicite(pub: PubliciteDTO): void {
    this.adminService.pauserPublicite(pub.id).subscribe({
      next: () => {
        this.snackBar.open('Publicité mise en pause', 'OK', { duration: 3000 });
        this.loadPublicites();
        this.loadStats();
      },
      error: () => {
        this.snackBar.open('Erreur', 'OK', { duration: 3000 });
      }
    });
  }

  reprendrePublicite(pub: PubliciteDTO): void {
    this.adminService.reprendrePublicite(pub.id).subscribe({
      next: () => {
        this.snackBar.open('Publicité réactivée', 'OK', { duration: 3000 });
        this.loadPublicites();
        this.loadStats();
      },
      error: () => {
        this.snackBar.open('Erreur', 'OK', { duration: 3000 });
      }
    });
  }

  supprimerPublicite(pub: PubliciteDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la publicité',
        message: `Voulez-vous supprimer définitivement "${pub.titre}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        confirmColor: 'warn',
        icon: 'delete_forever'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.supprimerPublicite(pub.id).subscribe({
          next: () => {
            this.snackBar.open('Publicité supprimée', 'OK', { duration: 3000 });
            this.loadPublicites();
            this.loadStats();
          },
          error: () => {
            this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACTIVE': return 'status-active';
      case 'EN_ATTENTE': return 'status-pending';
      case 'PAUSEE': return 'status-paused';
      case 'REJETEE': return 'status-rejected';
      case 'TERMINEE': return 'status-ended';
      case 'BROUILLON': return 'status-draft';
      default: return '';
    }
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Active',
      'EN_ATTENTE': 'En attente',
      'PAUSEE': 'En pause',
      'REJETEE': 'Rejetée',
      'TERMINEE': 'Terminée',
      'BROUILLON': 'Brouillon'
    };
    return labels[statut] || statut;
  }

  getStatutIcon(statut: string): string {
    switch (statut) {
      case 'ACTIVE': return 'check_circle';
      case 'EN_ATTENTE': return 'hourglass_empty';
      case 'PAUSEE': return 'pause_circle';
      case 'REJETEE': return 'cancel';
      case 'TERMINEE': return 'event_busy';
      case 'BROUILLON': return 'edit_note';
      default: return 'help';
    }
  }

  getEmplacementLabel(value: string): string {
    const emp = this.emplacements.find(e => e.value === value);
    return emp ? this.translateService.instant(emp.labelKey) : value;
  }

  formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  calculateCTR(pub: PubliciteDTO): string {
    if (!pub.totalImpressions) return '0.00';
    return ((pub.totalClics || 0) / pub.totalImpressions * 100).toFixed(2);
  }

  trackByPublicite(index: number, pub: PubliciteDTO): number {
    return pub.id;
  }
}