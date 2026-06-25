// ============================================================
// MY2-0 - LISTE DES ENTREPRISES PARTENAIRE
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { EntrepriseDTO, PartenaireDTO, CATEGORIES_ENTREPRISE } from '../../../core/models/partenaire.model';
import { PartenaireAuthService } from '../../../core/services/partenaire-auth.service';
import { PartenaireService } from '../../../core/services/partenaire.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDividerModule } from '@angular/material/divider';



@Component({
  selector: 'app-entreprises-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './entreprises-list.component.html',
  styleUrls: ['./entreprises-list.component.scss']
})
export class EntreprisesListComponent implements OnInit, OnDestroy {
  // Données
  entreprises: EntrepriseDTO[] = [];
  filteredEntreprises: EntrepriseDTO[] = [];
  partenaire: PartenaireDTO | null = null;
  
  // États
  isLoading = true;
  
  // Filtres
  searchQuery = '';
  selectedCategory: string | null = null;
  
  // Helpers
  categories = CATEGORIES_ENTREPRISE;

  private subscriptions: Subscription[] = [];

  constructor(
    private partenaireService: PartenaireService,
    private authService: PartenaireAuthService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
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

    // Charger le partenaire pour les limites
    const partSub = this.partenaireService.getMonPartenaire().subscribe({
      next: (partenaire) => {
        this.partenaire = partenaire;
      }
    });
    this.subscriptions.push(partSub);

    // Charger les entreprises
    const entSub = this.partenaireService.getMesEntreprises().subscribe({
      next: (entreprises) => {
        this.entreprises = entreprises;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement entreprises:', err);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(entSub);
  }

  // ============================================================
  // FILTRES
  // ============================================================

  applyFilters(): void {
    let result = [...this.entreprises];

    // Filtre par recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(e => 
        e.nom.toLowerCase().includes(query) ||
        e.slogan?.toLowerCase().includes(query) ||
        e.ville?.toLowerCase().includes(query)
      );
    }

    // Filtre par catégorie
    if (this.selectedCategory) {
      result = result.filter(e => e.categorie === this.selectedCategory);
    }

    this.filteredEntreprises = result;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onCategoryFilter(category: string | null): void {
    this.selectedCategory = this.selectedCategory === category ? null : category;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = null;
    this.applyFilters();
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  deleteEntreprise(entreprise: EntrepriseDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: this.translateService.instant('partenaire.entreprises.confirmDelete.title'),
        message: this.translateService.instant('partenaire.entreprises.confirmDelete.message', { name: entreprise.nom }),
        confirmText: this.translateService.instant('partenaire.entreprises.confirmDelete.confirm'),
        cancelText: this.translateService.instant('partenaire.entreprises.confirmDelete.cancel'),
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.partenaireService.deleteEntreprise(entreprise.id).subscribe({
          next: () => {
            this.snackBar.open('Entreprise supprimée', 'OK', { duration: 3000 });
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
    if (!this.partenaire?.maxEntreprises) return true;
    return this.entreprises.length < this.partenaire.maxEntreprises;
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? this.translateService.instant(cat.labelKey) : category;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'EQUIPEMENT_SPORTIF': 'sports_soccer',
      'NUTRITION_BOISSON': 'restaurant',
      'RESTAURATION': 'local_dining',
      'SANTE_BIEN_ETRE': 'spa',
      'TRANSPORT': 'directions_car',
      'LOISIRS_DIVERTISSEMENT': 'celebration',
      'MODE_VETEMENTS': 'checkroom',
      'SERVICES_FINANCIERS': 'account_balance',
      'TECHNOLOGIE': 'computer',
      'FORMATION_EDUCATION': 'school',
      'IMMOBILIER': 'home',
      'AUTRE': 'category'
    };
    return icons[category] || 'business';
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  trackByEntreprise(index: number, entreprise: EntrepriseDTO): number {
    return entreprise.id;
  }
}