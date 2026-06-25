// financial-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

import { 
  FinancesService, 
  Exercice, 
  SoldeGlobal, 
  CaisseDetail,
  MouvementCaisse 
} from '../../../../core/services/finances.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    BaseChartDirective,
    TranslateModule
  ],
  templateUrl: './financial-dashboard.component.html',
  styleUrl: './financial-dashboard.component.scss'
})
export class FinancialDashboardComponent implements OnInit {

  isLoading = true;
  exerciceActif: Exercice | null = null;
  exercices: Exercice[] = [];
  selectedExerciceId: number | null = null;
  soldeGlobal: SoldeGlobal | null = null;
  derniersMouvements: MouvementCaisse[] = [];
  groupeId: number | null = null;

  // Graphique Doughnut - Répartition par caisse
  doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            return ` ${context.label}: ${this.formatMontant(value)}`;
          }
        }
      }
    },
    cutout: '60%'
  };

  // Graphique Bar - Entrées vs Sorties par caisse
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Entrées',
        data: [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 1
      },
      {
        label: 'Sorties',
        data: [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#ef4444',
        borderWidth: 1
      }
    ]
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => this.formatMontantShort(value as number)
        }
      }
    }
  };

  constructor(
    private financesService: FinancesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.groupeId = this.authService.getGroupe();
    if (this.groupeId) {
      this.loadData();
    } else {
      this.isLoading = false;
    }
  }

  loadData(): void {
    if (!this.groupeId) return;

    this.isLoading = true;

    this.financesService.getExercicesGroupe(this.groupeId).pipe(
      switchMap(exercices => {
        this.exercices = exercices;
        this.exerciceActif = exercices.find(e => e.actif) || null;
        this.selectedExerciceId = this.exerciceActif?.id || null;

        if (this.selectedExerciceId && this.groupeId) {
          return forkJoin({
            solde: this.financesService.getSoldeGlobal(this.groupeId, this.selectedExerciceId),
            mouvements: this.financesService.getMouvementsExercice(this.selectedExerciceId).pipe(
              catchError(() => of([]))
            )
          });
        }
        return of({ solde: null, mouvements: [] });
      })
    ).subscribe({
      next: ({ solde, mouvements }) => {
        if (solde) {
          this.soldeGlobal = solde;
          this.updateCharts();
        }
        this.derniersMouvements = (mouvements as MouvementCaisse[]).slice(0, 5);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement données financières:', err);
        this.isLoading = false;
      }
    });
  }

  onExerciceChange(exerciceId: number): void {
    this.selectedExerciceId = exerciceId;
    if (this.groupeId && exerciceId) {
      this.isLoading = true;
      forkJoin({
        solde: this.financesService.getSoldeGlobal(this.groupeId, exerciceId),
        mouvements: this.financesService.getMouvementsExercice(exerciceId).pipe(
          catchError(() => of([]))
        )
      }).subscribe({
        next: ({ solde, mouvements }) => {
          this.soldeGlobal = solde;
          this.derniersMouvements = (mouvements as MouvementCaisse[]).slice(0, 5);
          this.updateCharts();
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
    }
  }

  updateCharts(): void {
    if (!this.soldeGlobal) return;

    const caisses = this.soldeGlobal.detailCaisses.filter(c => c.soldeActuel > 0);

    // Graphique Doughnut
    this.doughnutChartData = {
      labels: caisses.map(c => c.nom),
      datasets: [{
        data: caisses.map(c => c.soldeActuel),
        backgroundColor: caisses.map(c => c.couleur),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Graphique Bar
    const toutesLesCaisses = this.soldeGlobal.detailCaisses;
    this.barChartData = {
      labels: toutesLesCaisses.map(c => c.nom.replace('Caisse ', '')),
      datasets: [
        {
          label: 'Entrées',
          data: toutesLesCaisses.map(c => c.totalEntrees),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981',
          borderWidth: 1
        },
        {
          label: 'Sorties',
          data: toutesLesCaisses.map(c => c.totalSorties),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: '#ef4444',
          borderWidth: 1
        }
      ]
    };
  }

  formatMontant(montant: number): string {
    return this.financesService.formatMontant(montant);
  }

  formatMontantShort(montant: number): string {
    if (montant >= 1000000) {
      return (montant / 1000000).toFixed(1) + 'M';
    } else if (montant >= 1000) {
      return (montant / 1000).toFixed(0) + 'K';
    }
    return montant.toString();
  }

  getProgressPercentage(caisse: CaisseDetail): number {
    if (!this.soldeGlobal || this.soldeGlobal.soldeTotal === 0) return 0;
    return (caisse.soldeActuel / this.soldeGlobal.soldeTotal) * 100;
  }

  getMouvementIcon(mouvement: MouvementCaisse): string {
    return mouvement.typeMouvement === 'ENTREE' ? 'arrow_upward' : 'arrow_downward';
  }

  getMouvementClass(mouvement: MouvementCaisse): string {
    return mouvement.typeMouvement === 'ENTREE' ? 'entree' : 'sortie';
  }
}