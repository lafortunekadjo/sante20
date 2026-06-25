// ============================================================
// MY2-0 - DASHBOARD ADMIN PARTENAIRES
// Vue d'ensemble de la monétisation et partenariats
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PubliciteDTO, PartenaireDTO } from '../../../core/models/partenaire.model';
import { AdminPartenaireService } from '../../../core/services/admin-partenaire.service';



interface DashboardStats {
  totalPartenaires: number;
  partenairesActifs: number;
  partenairesSuspendus: number;
  contratsExpirantBientot: number;
  totalEntreprises: number;
  totalPublicites: number;
  publicitesActives: number;
  publicitesEnAttente: number;
  totalImpressionsMois: number;
  totalClicsMois: number;
  tauxClicMoyen: number;
  revenusMois: number;
  revenusTotal: number;
  evolutionRevenus: number; // % vs mois précédent
}

@Component({
  selector: 'app-admin-partenaires-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './admin-partenaire-dashboard.component.html',
  styleUrls: ['./admin-partenaire-dashboard.component.scss']
})
export class AdminPartenaireDashboardComponent implements OnInit, OnDestroy {
  // Données
  stats: DashboardStats | null = null;
  publicitesEnAttente: PubliciteDTO[] = [];
  derniersPartenaires: PartenaireDTO[] = [];
  topPublicites: PubliciteDTO[] = [];

  // États
  isLoading = true;
  isLoadingPubs = true;

  private subscriptions: Subscription[] = [];

  constructor(private adminService: AdminPartenaireService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  private loadDashboardData(): void {
    this.isLoading = true;
console.log(this.isLoading)
    // Charger les stats globales
    const statsSub = this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
    this.subscriptions.push(statsSub);

    // Charger les publicités en attente
    this.loadPublicitesEnAttente();

    // Charger les derniers partenaires
    this.loadDerniersPartenaires();

    // Charger les top publicités
    this.loadTopPublicites();
  }

  private loadPublicitesEnAttente(): void {
    this.isLoadingPubs = true;

    const sub = this.adminService.getPublicitesEnAttente().subscribe({
      next: (pubs) => {
        this.publicitesEnAttente = pubs.slice(0, 5);
        this.isLoadingPubs = false;
      },
      error: () => {
        this.isLoadingPubs = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private loadDerniersPartenaires(): void {
    const sub = this.adminService.getPartenaires({ size: 5, sort: 'createdAt,desc' }).subscribe({
      next: (response) => {
        this.derniersPartenaires = response.content;
      }
    });
    this.subscriptions.push(sub);
  }

  private loadTopPublicites(): void {
    const sub = this.adminService.getTopPublicites(5).subscribe({
      next: (pubs) => {
        this.topPublicites = pubs;
      }
    });
    this.subscriptions.push(sub);
  }

  // ============================================================
  // ACTIONS RAPIDES
  // ============================================================

  approuverPublicite(pub: PubliciteDTO): void {
    this.adminService.approuverPublicite(pub.id).subscribe({
      next: () => {
        this.loadPublicitesEnAttente();
        this.loadDashboardData();
      }
    });
  }

  rejeterPublicite(pub: PubliciteDTO): void {
    // TODO: Ouvrir dialog pour motif
    this.adminService.rejeterPublicite(pub.id, 'Non conforme').subscribe({
      next: () => {
        this.loadPublicitesEnAttente();
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
    return num.toLocaleString('fr-FR');
  }

  formatCurrency(num: number | undefined): string {
    if (num === undefined || num === null) return '0 FCFA';
    return num.toLocaleString('fr-FR') + ' FCFA';
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'status-active';
      case 'SUSPENDU': return 'status-suspended';
      case 'EN_ATTENTE': return 'status-pending';
      default: return '';
    }
  }

  getTypeContratClass(type: string): string {
    switch (type) {
      case 'ESSAI': return 'type-trial';
      case 'BASIC': return 'type-basic';
      case 'STANDARD': return 'type-standard';
      case 'PREMIUM': return 'type-premium';
      default: return '';
    }
  }

  getEvolutionClass(): string {
    if (!this.stats) return '';
    return this.stats.evolutionRevenus >= 0 ? 'positive' : 'negative';
  }

  getEvolutionIcon(): string {
    if (!this.stats) return 'remove';
    return this.stats.evolutionRevenus >= 0 ? 'trending_up' : 'trending_down';
  }

  trackByPartenaire(index: number, item: PartenaireDTO): number {
    return item.id;
  }

  trackByPublicite(index: number, item: PubliciteDTO): number {
    return item.id;
  }
}