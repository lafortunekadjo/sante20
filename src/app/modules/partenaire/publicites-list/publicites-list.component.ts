// ============================================================
// MY2-0 - LISTE DES PUBLICITÉS PARTENAIRE
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PubliciteDTO, EntrepriseDTO, StatutPublicite, STATUTS_PUBLICITE, EMPLACEMENTS_PUBLICITE } from '../../../core/models/partenaire.model';
import { PartenaireAuthService } from '../../../core/services/partenaire-auth.service';
import { PartenaireService } from '../../../core/services/partenaire.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';



@Component({
  selector: 'app-publicites-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './publicites-list.component.html',
  styleUrls: ['./publicites-list.component.scss']
})
export class PublicitesListComponent implements OnInit, OnDestroy {
  // Données
  publicites: PubliciteDTO[] = [];
  filteredPublicites: PubliciteDTO[] = [];
  entreprises: EntrepriseDTO[] = [];
  
  // États
  isLoading = true;
  
  // Filtres
  searchQuery = '';
  selectedStatut: StatutPublicite | 'ALL' = 'ALL';
  selectedEntreprise: number | null = null;
  
  // Helpers
  statuts = STATUTS_PUBLICITE;
  emplacements = EMPLACEMENTS_PUBLICITE;

  private subscriptions: Subscription[] = [];

  constructor(
    private partenaireService: PartenaireService,
    private authService: PartenaireAuthService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Vérifier les query params pour filtrer par entreprise
    this.route.queryParams.subscribe(params => {
      if (params['entreprise']) {
        this.selectedEntreprise = +params['entreprise'];
      }
    });
    
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  private loadData(): void {
    this.isLoading = true;

    // Charger les entreprises pour le filtre
    const entSub = this.partenaireService.getMesEntreprises().subscribe({
      next: (entreprises) => {
        this.entreprises = entreprises;
      }
    });
    this.subscriptions.push(entSub);

    // Charger les publicités
    const pubSub = this.partenaireService.getMesPublicites().subscribe({
      next: (publicites) => {
        this.publicites = publicites;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement publicités:', err);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(pubSub);
  }

  // ============================================================
  // FILTRES
  // ============================================================

  applyFilters(): void {
    let result = [...this.publicites];

    // Filtre par recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(p => 
        p.titre.toLowerCase().includes(query) ||
        p.entrepriseNom?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (this.selectedStatut !== 'ALL') {
      result = result.filter(p => p.statut === this.selectedStatut);
    }

    // Filtre par entreprise
    if (this.selectedEntreprise) {
      result = result.filter(p => p.entrepriseId === this.selectedEntreprise);
    }

    this.filteredPublicites = result;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatutFilter(statut: StatutPublicite | 'ALL'): void {
    this.selectedStatut = statut;
    this.applyFilters();
  }

  onEntrepriseFilter(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatut = 'ALL';
    this.selectedEntreprise = null;
    this.applyFilters();
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  togglePause(publicite: PubliciteDTO): void {
    const action = publicite.statut === 'PAUSEE' ? 'reprendre' : 'mettre en pause';
    
    this.partenaireService.togglePausePublicite(publicite.id).subscribe({
      next: (updated) => {
        // Mettre à jour la liste
        const index = this.publicites.findIndex(p => p.id === publicite.id);
        if (index !== -1) {
          this.publicites[index] = updated;
          this.applyFilters();
        }
        this.snackBar.open(`Publicité ${action === 'reprendre' ? 'reprise' : 'mise en pause'}`, 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open(`Erreur lors de l'action`, 'OK', { duration: 3000 });
      }
    });
  }

  duplicatePublicite(publicite: PubliciteDTO): void {
    this.partenaireService.duplicatePublicite(publicite.id).subscribe({
      next: () => {
        this.snackBar.open('Publicité dupliquée', 'OK', { duration: 3000 });
        this.loadData();
      },
      error: () => {
        this.snackBar.open('Erreur lors de la duplication', 'OK', { duration: 3000 });
      }
    });
  }

  deletePublicite(publicite: PubliciteDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: this.translateService.instant('partenaire.publicites.confirmDelete.title'),
        message: this.translateService.instant('partenaire.publicites.confirmDelete.message'),
        confirmText: this.translateService.instant('partenaire.publicites.confirmDelete.confirm'),
        cancelText: this.translateService.instant('partenaire.publicites.confirmDelete.cancel'),
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.partenaireService.deletePublicite(publicite.id).subscribe({
          next: () => {
            this.snackBar.open('Publicité supprimée', 'OK', { duration: 3000 });
            this.loadData();
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

  canCreate(): boolean {
    return this.authService.canCreateAds() && this.entreprises.length > 0;
  }

  hasEntreprises(): boolean {
    return this.entreprises.length > 0;
  }

  getStatutLabel(statut: string): string {
    return this.translateService.instant(`partenaire.publicites.status.${statut}`);
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACTIVE': return 'status-active';
      case 'EN_ATTENTE': return 'status-pending';
      case 'PAUSEE': return 'status-paused';
      case 'REJETEE': return 'status-rejected';
      case 'TERMINEE': return 'status-ended';
      case 'BROUILLON': return 'status-draft';
      default: return 'status-default';
    }
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

  getEmplacementLabel(emplacement: string): string {
    return this.translateService.instant(`partenaire.publicites.emplacements.${emplacement}`);
  }

  formatNumber(num: number): string {
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

  calculateCTR(impressions: number, clics: number): string {
    if (!impressions || impressions === 0) return '0.00';
    return ((clics / impressions) * 100).toFixed(2);
  }

  getCountByStatut(statut: StatutPublicite | 'ALL'): number {
    if (statut === 'ALL') return this.publicites.length;
    return this.publicites.filter(p => p.statut === statut).length;
  }

  trackByPublicite(index: number, publicite: PubliciteDTO): number {
    return publicite.id;
  }
}