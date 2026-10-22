// ============================================================
// MY2-0 - DÉTAIL PUBLICITÉ ADMIN
// Vue détaillée et gestion d'une publicité
// ============================================================

import { t } from '../../../core/i18n/traduire';
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
import { AdminPartenaireService } from '../../../core/services/admin-partenaire.service';
import { RejetPubliciteDialogComponent } from '../rejet-publicite-dialog/rejet-publicite-dialog.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';



@Component({
  selector: 'app-admin-publicite-detail',
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
  templateUrl: './admin-publicite-detail.component.html',
  styleUrls: ['./admin-publicite-detail.component.scss']
})
export class AdminPubliciteDetailComponent implements OnInit, OnDestroy {
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
    private adminService: AdminPartenaireService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.publiciteId = +this.route.snapshot.params['id'];

    if (!this.publiciteId) {
      this.router.navigate(['/admin/partenaires/publicites']);
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

    const sub = this.adminService.getPublicite(this.publiciteId).subscribe({
      next: (publicite) => {
        this.publicite = publicite;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.snackBar.open(t('ui.ts_publicite_non_trouvee_e0c6'), 'OK', { duration: 3000 });
        this.router.navigate(['/admin/partenaires/publicites']);
      }
    });
    this.subscriptions.push(sub);
  }

  private loadStats(): void {
    this.isLoadingStats = true;

    const sub = this.adminService.getPubliciteStats(this.publiciteId).subscribe({
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

  /** Fréquence de diffusion choisie à l'approbation (le partenaire ne la décide pas). */
  priorite = 0;

  approuver(): void {
    if (!this.publicite) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: t('ui.ts_approuver_la_publicite_985f'),
        message: `Voulez-vous approuver "${this.publicite.titre}" ? Elle sera immédiatement visible.`,
        confirmText: 'Approuver',
        cancelText: t('common.CANCEL'),
        confirmColor: 'primary',
        icon: 'check_circle'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.approuverPublicite(this.publiciteId, this.priorite).subscribe({
          next: (updated) => {
            this.publicite = updated;
            this.snackBar.open(t('partenaire.settings.notifications.adApproved'), 'OK', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open(t('ui.ts_erreur_lors_de_l_approbation_1b28'), 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  rejeter(): void {
    if (!this.publicite) return;

    const dialogRef = this.dialog.open(RejetPubliciteDialogComponent, {
      width: '450px',
      data: { publicite: this.publicite }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.rejeterPublicite(this.publiciteId, result.motif).subscribe({
          next: (updated) => {
            this.publicite = updated;
            this.snackBar.open(t('partenaire.settings.notifications.adRejected'), 'OK', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open(t('ui.ts_erreur_lors_du_rejet_76f8'), 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  pauser(): void {
    if (!this.publicite) return;

    this.adminService.pauserPublicite(this.publiciteId).subscribe({
      next: (updated) => {
        this.publicite = updated;
        this.snackBar.open(t('ui.ts_publicite_mise_en_pause_73d8'), 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open(t('common.error'), 'OK', { duration: 3000 });
      }
    });
  }

  reprendre(): void {
    if (!this.publicite) return;

    this.adminService.reprendrePublicite(this.publiciteId).subscribe({
      next: (updated) => {
        this.publicite = updated;
        this.snackBar.open(t('ui.ts_publicite_reactivee_14ab'), 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open(t('common.error'), 'OK', { duration: 3000 });
      }
    });
  }

  supprimer(): void {
    if (!this.publicite) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: t('partenaire.publicites.confirmDelete.title'),
        message: `Voulez-vous supprimer définitivement "${this.publicite.titre}" ? Cette action est irréversible.`,
        confirmText: t('type_depense.actions.supprimer'),
        cancelText: t('common.CANCEL'),
        confirmColor: 'warn',
        icon: 'delete_forever'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.supprimerPublicite(this.publiciteId).subscribe({
          next: () => {
            this.snackBar.open(t('ui.ts_publicite_supprimee_e721'), 'OK', { duration: 3000 });
            this.router.navigate(['/admin/partenaires/publicites']);
          },
          error: () => {
            this.snackBar.open(t('equipe.deleteError'), 'OK', { duration: 3000 });
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
      'REJETEE': t('partenaire.publicites.status.REJETEE'),
      'TERMINEE': t('partenaire.publicites.status.TERMINEE'),
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

  getEmplacementDimensions(value: string): string {
    const emp = this.emplacements.find(e => e.value === value);
    return emp ? emp.dimensions : '';
  }

  formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString('fr-FR');
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
    return ((this.publicite.totalClics || 0) / this.publicite.totalImpressions * 100).toFixed(2);
  }

  getMaxImpressions(): number {
    if (!this.evolution.length) return 1;
    return Math.max(...this.evolution.map(d => d.impressions || 0));
  }

  getBarHeight(value: number): number {
    const max = this.getMaxImpressions();
    return max > 0 ? (value / max) * 100 : 0;
  }

  goBack(): void {
    this.router.navigate(['/admin/partenaires/publicites']);
  }
}