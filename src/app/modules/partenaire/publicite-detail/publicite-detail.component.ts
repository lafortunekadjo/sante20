// ============================================================
// MY2-0 - DÉTAIL PUBLICITÉ
// Vue détaillée et statistiques d'une publicité
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
import { PubliciteDTO, StatsPubliciteDTO, StatsJournaliereDTO, EMPLACEMENTS_PUBLICITE } from '../../../core/models/partenaire.model';
import { PartenaireService } from '../../../core/services/partenaire.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-publicite-detail',
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
  templateUrl: './publicite-detail.component.html',
  styleUrls: ['./publicite-detail.component.scss']
})
export class PubliciteDetailComponent implements OnInit, OnDestroy {
  // Données
  publicite: PubliciteDTO | null = null;
  stats: StatsPubliciteDTO | null = null;
  evolution: StatsJournaliereDTO[] = [];

  // États
  isLoading = true;
  isLoadingStats = true;
  publiciteId!: number;

  // Helpers
  emplacements = EMPLACEMENTS_PUBLICITE;

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
    this.publiciteId = +this.route.snapshot.params['id'];

    if (!this.publiciteId) {
      this.router.navigate(['/partenaire/publicites']);
      return;
    }

    this.loadPublicite();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  private loadPublicite(): void {
    this.isLoading = true;

    const sub = this.partenaireService.getPublicite(this.publiciteId).subscribe({
      next: (publicite) => {
        this.publicite = publicite;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement publicité:', err);
        this.snackBar.open('Publicité non trouvée', 'OK', { duration: 3000 });
        this.router.navigate(['/partenaire/publicites']);
      }
    });
    this.subscriptions.push(sub);
  }

  private loadStats(): void {
    this.isLoadingStats = true;

    const sub = this.partenaireService.getStatsPublicite(this.publiciteId).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.evolution = stats.statsJournalieres || [];
        this.isLoadingStats = false;
      },
      error: () => {
        this.isLoadingStats = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  togglePause(): void {
    if (!this.publicite) return;

    this.partenaireService.togglePausePublicite(this.publiciteId).subscribe({
      next: (updated) => {
        this.publicite = updated;
        const message = updated.statut === 'PAUSEE' ? 'Publicité mise en pause' : 'Publicité reprise';
        this.snackBar.open(message, 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'action', 'OK', { duration: 3000 });
      }
    });
  }

  duplicate(): void {
    if (!this.publicite) return;

    this.partenaireService.duplicatePublicite(this.publiciteId).subscribe({
      next: (newPub) => {
        this.snackBar.open('Publicité dupliquée', 'OK', { duration: 3000 });
        this.router.navigate(['/partenaire/publicites', newPub.id, 'edit']);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la duplication', 'OK', { duration: 3000 });
      }
    });
  }

  delete(): void {
    if (!this.publicite) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la publicité',
        message: `Voulez-vous vraiment supprimer "${this.publicite.titre}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.partenaireService.deletePublicite(this.publiciteId).subscribe({
          next: () => {
            this.snackBar.open('Publicité supprimée', 'OK', { duration: 3000 });
            this.router.navigate(['/partenaire/publicites']);
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
    return this.translateService.instant(`partenaire.publicites.status.${statut}`);
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

  getEmplacementDimensions(value: string): string {
    const emp = this.emplacements.find(e => e.value === value);
    return emp ? emp.dimensions : '';
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
      month: 'long',
      year: 'numeric'
    });
  }

  calculateCTR(): string {
    if (!this.publicite?.totalImpressions) return '0.00';
    const ctr = (this.publicite.totalClics / this.publicite.totalImpressions) * 100;
    return ctr.toFixed(2);
  }

  canEdit(): boolean {
    return this.publicite?.statut === 'BROUILLON' || this.publicite?.statut === 'REJETEE';
  }

  canPause(): boolean {
    return this.publicite?.statut === 'ACTIVE' || this.publicite?.statut === 'PAUSEE';
  }

  goBack(): void {
    this.router.navigate(['/partenaire/publicite']);
  }
}