// ============================================================
// MY2-0 - STATISTIQUES PARTENAIRE
// Dashboard des performances publicitaires
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { StatsPartenaireDTO, StatsPubliciteDTO, StatsEntrepriseDTO, StatsJournaliereDTO, EMPLACEMENTS_PUBLICITE } from '../../../core/models/partenaire.model';
import { PartenaireAuthService } from '../../../core/services/partenaire-auth.service';
import { PartenaireService } from '../../../core/services/partenaire.service';


type PeriodeType = '7j' | '30j' | '90j' | '12m' | 'custom';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    MatSortModule,
    MatTooltipModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './statistiques.component.html',
  styleUrls: ['./statistiques.component.scss']
})
export class StatistiquesComponent implements OnInit, OnDestroy {
  // Données
  stats: StatsPartenaireDTO | null = null;
  statsPublicites: StatsPubliciteDTO[] = [];
  statsEntreprises: StatsEntrepriseDTO[] = [];
  evolutionJournaliere: StatsJournaliereDTO[] = [];

  // États
  isLoading = true;
  isExporting = false;

  // Filtres
  selectedPeriode: PeriodeType = '30j';
  selectedEntreprise: number | null = null;
  dateDebut: Date | null = null;
  dateFin: Date | null = null;

  // Données pour les filtres
  entreprises: { id: number; nom: string }[] = [];
  emplacements = EMPLACEMENTS_PUBLICITE;

  // Colonnes tableau publicités
  displayedColumns = ['titre', 'emplacement', 'impressions', 'clics', 'ctr'];

  private subscriptions: Subscription[] = [];

  constructor(
    private partenaireService: PartenaireService,
    private authService: PartenaireAuthService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadEntreprises();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  private loadEntreprises(): void {
    const sub = this.partenaireService.getMesEntreprises().subscribe({
      next: (entreprises) => {
        this.entreprises = entreprises.map(e => ({ id: e.id, nom: e.nom }));
      }
    });
    this.subscriptions.push(sub);
  }

  loadStats(): void {
    this.isLoading = true;

    const params = this.buildParams();

    const sub = this.partenaireService.getStatistiques(params).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.evolutionJournaliere = stats.evolution30Jours || [];
        this.loadStatsPublicites(params);
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private loadStatsPublicites(params: any): void {
    const sub = this.partenaireService.getStatsPublicites(params).subscribe({
      next: (stats) => {
        this.statsPublicites = stats;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private buildParams(): any {
    const params: any = {};

    // Période
    const now = new Date();
    switch (this.selectedPeriode) {
      case '7j':
        params.dateDebut = this.subtractDays(now, 7).toISOString();
        break;
      case '30j':
        params.dateDebut = this.subtractDays(now, 30).toISOString();
        break;
      case '90j':
        params.dateDebut = this.subtractDays(now, 90).toISOString();
        break;
      case '12m':
        params.dateDebut = this.subtractDays(now, 365).toISOString();
        break;
      case 'custom':
        if (this.dateDebut) params.dateDebut = this.dateDebut.toISOString();
        if (this.dateFin) params.dateFin = this.dateFin.toISOString();
        break;
    }

    if (this.selectedEntreprise) {
      params.entrepriseId = this.selectedEntreprise;
    }

    return params;
  }

  private subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
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

  onEntrepriseChange(): void {
    this.loadStats();
  }

  applyCustomDates(): void {
    if (this.dateDebut && this.dateFin) {
      this.loadStats();
    }
  }

  clearFilters(): void {
    this.selectedPeriode = '30j';
    this.selectedEntreprise = null;
    this.dateDebut = null;
    this.dateFin = null;
    this.loadStats();
  }

  // ============================================================
  // EXPORT
  // ============================================================

  exportStats(): void {
    this.isExporting = true;

    const params = this.buildParams();

    this.partenaireService.exportStatistiques(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statistiques_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isExporting = false;
      },
      error: () => {
        this.isExporting = false;
      }
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatPercent(num: number | undefined): string {
    if (num === undefined || num === null) return '0.00';
    return num.toFixed(2);
  }

  getEmplacementLabel(value: string): string {
    const emp = this.emplacements.find(e => e.value === value);
    return emp ? this.translateService.instant(emp.labelKey) : value;
  }

  getVariationClass(variation: number | undefined): string {
    if (!variation) return '';
    return variation > 0 ? 'positive' : variation < 0 ? 'negative' : '';
  }

  getVariationIcon(variation: number | undefined): string {
    if (!variation) return 'remove';
    return variation > 0 ? 'trending_up' : 'trending_down';
  }

  // Calcul du max pour les barres de progression
  getMaxImpressions(): number {
    if (!this.evolutionJournaliere.length) return 1;
    return Math.max(...this.evolutionJournaliere.map(d => d.impressions || 0));
  }

  getBarWidth(value: number): number {
    const max = this.getMaxImpressions();
    return max > 0 ? (value / max) * 100 : 0;
  }

  trackByPublicite(index: number, item: StatsPubliciteDTO): number {
    return item.publiciteId;
  }

  trackByJour(index: number, item: StatsJournaliereDTO): string {
    return item.date;
  }
}