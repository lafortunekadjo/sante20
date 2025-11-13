// demandes-badge.component.ts
// Composant à intégrer dans la navbar ou le menu latéral

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { QuestionCandidatureService } from '../../../core/services/question-candidature.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-demandes-badge',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <button 
      mat-icon-button 
      (click)="goToMesDemandes()"
      [matBadge]="demandesEnAttente"
      [matBadgeHidden]="demandesEnAttente === 0"
      matBadgeColor="warn"
      matBadgeSize="small"
      matTooltip="Mes demandes d'adhésion">
      <mat-icon>assignment</mat-icon>
    </button>
  `,
  styles: [`
    button {
      position: relative;
    }
  `]
})
export class DemandesBadgeComponent implements OnInit, OnDestroy {
  demandesEnAttente = 0;
  private subscription?: Subscription;

  constructor(
    private questionnaireService: QuestionCandidatureService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadDemandesEnAttente();
      
      // Actualiser toutes les 2 minutes
      this.subscription = interval(120000) // 2 minutes
        .pipe(
          switchMap(() => this.questionnaireService.getMesDemandesAdhesion())
        )
        .subscribe({
          next: (demandes) => {
            this.demandesEnAttente = demandes.filter(d => d.statut === 'EN_ATTENTE').length;
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadDemandesEnAttente(): void {
    this.questionnaireService.getMesDemandesAdhesion().subscribe({
      next: (demandes) => {
        this.demandesEnAttente = demandes.filter(d => d.statut === 'EN_ATTENTE').length;
      },
      error: (err) => {
        console.error('Erreur chargement badge demandes:', err);
      }
    });
  }

  goToMesDemandes(): void {
    this.router.navigate(['/mes-demandes']);
  }
}

// Usage dans la navbar:
// <app-demandes-badge></app-demandes-badge>