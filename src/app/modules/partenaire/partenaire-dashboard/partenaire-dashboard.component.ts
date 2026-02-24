// ============================================================
// MY2-0 - DASHBOARD PARTENAIRE
// Page d'accueil de l'espace partenaire
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PartenaireDTO, StatsPartenaireDTO, PubliciteDTO, EntrepriseDTO } from '../../../core/models/partenaire.model';
import { PartenaireAuthService } from '../../../core/services/partenaire-auth.service';
import { PartenaireService } from '../../../core/services/partenaire.service';




@Component({
  selector: 'app-partenaire-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './partenaire-dashboard.component.html',
  styleUrls: ['./partenaire-dashboard.component.scss']
})
export class PartenaireDashboardComponent implements OnInit, OnDestroy {
  // Données
  partenaire: PartenaireDTO | null = null;
  stats: StatsPartenaireDTO | null = null;
  recentAds: PubliciteDTO[] = [];
  entreprises: EntrepriseDTO[] = [];
  
  // États
  isLoading = true;
  isLoadingStats = true;
  
  // Alertes
  alerts: { type: string; message: string; icon: string }[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private partenaireService: PartenaireService,
    private authService: PartenaireAuthService
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
    
    // Charger le partenaire
    const partSub = this.partenaireService.getMonPartenaire().subscribe({
      next: (partenaire) => {
        this.partenaire = partenaire;
        this.checkAlerts();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement partenaire:', err);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(partSub);

    // Charger les stats
    this.loadStats();

    // Charger les entreprises
    const entSub = this.partenaireService.getMesEntreprises().subscribe({
      next: (entreprises) => {
        this.entreprises = entreprises;
      }
    });
    this.subscriptions.push(entSub);

    // Charger les publicités récentes
    const pubSub = this.partenaireService.getMesPublicites().subscribe({
      next: (publicites) => {
        this.recentAds = publicites.slice(0, 5);
        this.checkPendingAds(publicites);
      }
    });
    this.subscriptions.push(pubSub);
  }

  private loadStats(): void {
    this.isLoadingStats = true;
    
    const sub = this.partenaireService.getMesStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoadingStats = false;
      },
      error: () => {
        this.isLoadingStats = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // ============================================================
  // ALERTES
  // ============================================================

  private checkAlerts(): void {
    this.alerts = [];

    if (!this.partenaire) return;

    // Contrat expire bientôt
    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining > 0 && daysRemaining <= 30) {
      this.alerts.push({
        type: 'warning',
        message: `Votre contrat expire dans ${daysRemaining} jours`,
        icon: 'warning'
      });
    } else if (daysRemaining <= 0) {
      this.alerts.push({
        type: 'error',
        message: 'Votre contrat a expiré',
        icon: 'error'
      });
    }

    // Limite de publicités atteinte
    if (this.partenaire.maxPublicitesActives && 
        this.partenaire.nombrePublicitesActives && 
        this.partenaire.nombrePublicitesActives >= this.partenaire.maxPublicitesActives) {
      this.alerts.push({
        type: 'info',
        message: 'Vous avez atteint la limite de publicités actives',
        icon: 'info'
      });
    }
  }

  private checkPendingAds(publicites: PubliciteDTO[]): void {
    const pendingCount = publicites.filter(p => p.statut === 'EN_ATTENTE').length;
    if (pendingCount > 0) {
      this.alerts.push({
        type: 'info',
        message: `${pendingCount} publicité(s) en attente d'approbation`,
        icon: 'hourglass_empty'
      });
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getDaysRemaining(): number {
    if (!this.partenaire?.dateFinContrat) return 999;
    const end = new Date(this.partenaire.dateFinContrat);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getContractStatusClass(): string {
    const days = this.getDaysRemaining();
    if (days < 0) return 'status-expired';
    if (days <= 30) return 'status-warning';
    return 'status-active';
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACTIVE': return 'status-active';
      case 'EN_ATTENTE': return 'status-pending';
      case 'PAUSEE': return 'status-paused';
      case 'REJETEE': return 'status-rejected';
      default: return 'status-default';
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getUserName(): string {
    const user = this.authService.getUser();
    return user ? `${user.prenom}` : '';
  }

  canCreateAds(): boolean {
    return this.authService.canCreateAds();
  }

  trackByAlert(index: number, alert: any): string {
    return alert.message;
  }

  trackByAd(index: number, ad: PubliciteDTO): number {
    return ad.id;
  }
}