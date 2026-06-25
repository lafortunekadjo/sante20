// ============================================================
// MY2-0 - DÉTAIL ENTREPRISE
// Vue détaillée d'une entreprise partenaire
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { EntrepriseDTO, PubliciteDTO, CATEGORIES_ENTREPRISE } from '../../../core/models/partenaire.model';
import { PartenaireService } from '../../../core/services/partenaire.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';



@Component({
  selector: 'app-entreprise-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './entreprise-detail.component.html',
  styleUrls: ['./entreprise-detail.component.scss']
})
export class EntrepriseDetailComponent implements OnInit, OnDestroy {
  // Données
  entreprise: EntrepriseDTO | null = null;
  publicites: PubliciteDTO[] = [];

  // États
  isLoading = true;
  isLoadingPubs = true;
  entrepriseId!: number;
  activeTab = 0;

  // Helpers
  categories = CATEGORIES_ENTREPRISE;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private partenaireService: PartenaireService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.entrepriseId = +this.route.snapshot.params['id'];

    if (!this.entrepriseId) {
      this.router.navigate(['/partenaire/entreprises']);
      return;
    }

    this.loadEntreprise();
    this.loadPublicites();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  private loadEntreprise(): void {
    this.isLoading = true;

    const sub = this.partenaireService.getEntreprise(this.entrepriseId).subscribe({
      next: (entreprise) => {
        this.entreprise = entreprise;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement entreprise:', err);
        this.snackBar.open('Entreprise non trouvée', 'OK', { duration: 3000 });
        this.router.navigate(['/partenaire/entreprises']);
      }
    });
    this.subscriptions.push(sub);
  }

  private loadPublicites(): void {
    this.isLoadingPubs = true;

    const sub = this.partenaireService.getPublicitesEntreprise(this.entrepriseId).subscribe({
      next: (publicites) => {
        this.publicites = publicites;
        this.isLoadingPubs = false;
      },
      error: () => {
        this.isLoadingPubs = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  toggleActif(): void {
    if (!this.entreprise) return;

    const action = this.entreprise.actif ? 'désactiver' : 'activer';

    this.partenaireService.toggleEntrepriseActif(this.entrepriseId).subscribe({
      next: (updated) => {
        this.entreprise = updated;
        this.snackBar.open(`Entreprise ${action === 'activer' ? 'activée' : 'désactivée'}`, 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'action', 'OK', { duration: 3000 });
      }
    });
  }

  delete(): void {
    if (!this.entreprise) return;

    const hasPublicites = this.publicites.length > 0;
    const message = hasPublicites
      ? `Attention ! "${this.entreprise.nom}" a ${this.publicites.length} publicité(s) associée(s). Tout sera supprimé.`
      : `Voulez-vous vraiment supprimer "${this.entreprise.nom}" ?`;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l\'entreprise',
        message: message,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.partenaireService.deleteEntreprise(this.entrepriseId).subscribe({
          next: () => {
            this.snackBar.open('Entreprise supprimée', 'OK', { duration: 3000 });
            this.router.navigate(['/partenaire/entreprises']);
          },
          error: () => {
            this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  createPublicite(): void {
    this.router.navigate(['/partenaire/publicite/new'], {
      queryParams: { entreprise: this.entrepriseId }
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getCategorieLabel(value: string): string {
    const cat = this.categories.find(c => c.value === value);
    return cat ? this.translateService.instant(cat.labelKey) : value;
  }

  getCategorieIcon(value: string): string {
    const icons: Record<string, string> = {
      'RESTAURANT': 'restaurant',
      'COMMERCE': 'store',
      'SERVICES': 'miscellaneous_services',
      'SANTE': 'local_hospital',
      'EDUCATION': 'school',
      'SPORT': 'sports_soccer',
      'DIVERTISSEMENT': 'celebration',
      'IMMOBILIER': 'home',
      'TRANSPORT': 'directions_car',
      'TECHNOLOGIE': 'computer',
      'AUTRE': 'category'
    };
    return icons[value] || 'business';
  }

  getStatutPubliciteClass(statut: string): string {
    switch (statut) {
      case 'ACTIVE': return 'status-active';
      case 'EN_ATTENTE': return 'status-pending';
      case 'PAUSEE': return 'status-paused';
      case 'REJETEE': return 'status-rejected';
      default: return '';
    }
  }

  getStatutPubliciteLabel(statut: string): string {
    return this.translateService.instant(`partenaire.publicites.status.${statut}`);
  }

  formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  goBack(): void {
    this.router.navigate(['/partenaire/entreprises']);
  }

  trackByPublicite(index: number, pub: PubliciteDTO): number {
    return pub.id;
  }
}