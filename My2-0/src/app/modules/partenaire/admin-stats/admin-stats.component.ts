// ============================================================
// MY2-0 - STATISTIQUES ADMIN PARTENAIRES
// Vue globale des performances publicitaires
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PartenaireDTO, PubliciteDTO, EMPLACEMENTS_PUBLICITE } from '../../../core/models/partenaire.model';
import { AdminPartenaireService } from '../../../core/services/admin-partenaire.service';



interface GlobalStats {
  totalImpressions: number;
  totalClics: number;
  tauxClicMoyen: number;
  revenusTotal: number;
  revenusMois: number;
  evolutionRevenus: number;
  topPartenaires: PartenaireDTO[];
  topPublicites: PubliciteDTO[];
  statsParEmplacement: {
    emplacement: string;
    impressions: number;
    clics: number;
    tauxClics: number;
  }[];
  evolutionMensuelle: {
    mois: string;
    impressions: number;
    clics: number;
    revenus: number;
  }[];
}

type PeriodeType = '30j' | '90j' | '6m' | '12m' | 'custom';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatDividerModule,
    MatTabsModule,
    TranslateModule
  ],
  templateUrl: './admin-stats.component.html',
  styleUrls: ['./admin-stats.component.scss']
})
export class AdminStatsComponent implements OnInit, OnDestroy {
  // Données
  stats: GlobalStats | null = null;

  // États
  isLoading = true;
  isExporting = false;

  // Filtres
  selectedPeriode: PeriodeType = '30j';
  dateDebut: Date | null = null;
  dateFin: Date | null = null;

  // Helpers
  emplacements = EMPLACEMENTS_PUBLICITE;

  private subscriptions: Subscription[] = [];

  constructor(
    private adminService: AdminPartenaireService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  loadStats(): void {
    this.isLoading = true;

    // Simuler le chargement des stats globales
    // En production, cela viendrait du service
    setTimeout(() => {
      this.stats = {
        totalImpressions: 1250000,
        totalClics: 45000,
        tauxClicMoyen: 3.6,
        revenusTotal: 12500000,
        revenusMois: 1850000,
        evolutionRevenus: 12.5,
        topPartenaires: [],
        topPublicites: [],
        statsParEmplacement: [
          { emplacement: 'HEADER', impressions: 450000, clics: 18000, tauxClics: 4.0 },
          { emplacement: 'FEED', impressions: 380000, clics: 15200, tauxClics: 4.0 },
          { emplacement: 'SIDEBAR', impressions: 220000, clics: 6600, tauxClics: 3.0 },
          { emplacement: 'SPLASH_SCREEN', impressions: 120000, clics: 3600, tauxClics: 3.0 },
          { emplacement: 'PDF_FOOTER', impressions: 80000, clics: 1600, tauxClics: 2.0 }
        ],
        evolutionMensuelle: [
          { mois: 'Jan', impressions: 80000, clics: 2800, revenus: 1200000 },
          { mois: 'Fév', impressions: 95000, clics: 3400, revenus: 1350000 },
          { mois: 'Mar', impressions: 110000, clics: 4000, revenus: 1500000 },
          { mois: 'Avr', impressions: 125000, clics: 4500, revenus: 1650000 },
          { mois: 'Mai', impressions: 140000, clics: 5100, revenus: 1850000 }
        ]
      };
      this.isLoading = false;
    }, 800);
  }

  // ============================================================
  // FILTRES
  // ============================================================

  onPeriodeChange(): void {
    if (this.selectedPeriode !== 'custom') {
      this.dateDebut = null;
      this.dateFin = null;
      this.loadStats();
    }
  }

  applyCustomDates(): void {
    if (this.dateDebut && this.dateFin) {
      this.loadStats();
    }
  }

  // ============================================================
  // EXPORT
  // ============================================================

  exportStats(): void {
    this.isExporting = true;

    // Simuler l'export
    setTimeout(() => {
      this.isExporting = false;
      // En production, télécharger le fichier
    }, 1500);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString('fr-FR');
  }

  formatCurrency(num: number | undefined): string {
    if (num === undefined || num === null) return '0 FCFA';
    return num.toLocaleString('fr-FR') + ' FCFA';
  }

  getEmplacementLabel(value: string): string {
    const emp = this.emplacements.find(e => e.value === value);
    return emp ? this.translateService.instant(emp.labelKey) : value;
  }

  getEvolutionClass(): string {
    if (!this.stats) return '';
    return this.stats.evolutionRevenus >= 0 ? 'positive' : 'negative';
  }

  getEvolutionIcon(): string {
    if (!this.stats) return 'remove';
    return this.stats.evolutionRevenus >= 0 ? 'trending_up' : 'trending_down';
  }

  getMaxImpressions(): number {
    if (!this.stats?.statsParEmplacement.length) return 1;
    return Math.max(...this.stats.statsParEmplacement.map(s => s.impressions));
  }

  getBarWidth(value: number): number {
    const max = this.getMaxImpressions();
    return max > 0 ? (value / max) * 100 : 0;
  }

  getMaxMensuel(): number {
    if (!this.stats?.evolutionMensuelle.length) return 1;
    return Math.max(...this.stats.evolutionMensuelle.map(s => s.impressions));
  }

  getBarHeight(value: number): number {
    const max = this.getMaxMensuel();
    return max > 0 ? (value / max) * 100 : 0;
  }
}