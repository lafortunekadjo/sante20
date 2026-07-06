// ============================================================
// USER-GROUP-REGISTER COMPONENT — VERSION MULTI-GROUPE v2
// Après création : ferme le formulaire + page actualisée sur
// le nouveau groupe + redirection vers la config du groupe
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GroupeService } from '../../core/services/groupe.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, catchError, of, switchMap, tap } from 'rxjs';
import { Ville } from '../../core/models/ville';
import { OnboardingService } from '../../core/services/onboarding.service';
import { GroupeContextService } from '../../core/services/groupe-context.service';
 

interface GroupeRequest {
  nom: string;
  ville1: string | number;
  abreviation: string;
  discipline?: string;
  description?: string;
}

@Component({
  selector: 'app-user-group-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './user-group-register.component.html',
  styleUrls: ['./user-group-register.component.scss']
})
export class UserGroupRegisterComponent implements OnInit {

  groupData: GroupeRequest = {
    nom: '',
    ville1: '',
    abreviation: '',
    discipline: '',
    description: ''
  };

  isLoading = false;
  isVillesLoading = false;
  villesList: Ville[] = [];
  isModeAjout = false;

  // FIX : contrôle l'affichage du formulaire
  // Permet au template de masquer le form une fois soumis avec succès
  showForm = true;
  groupeCreeNom: string | null = null;

  disciplines = [
    { value: 'FOOTBALL', label: 'Football', icon: 'sports_soccer' },
    { value: 'BASKETBALL', label: 'Basketball', icon: 'sports_basketball' },
  ];

  constructor(
    private snackBar: MatSnackBar,
    private groupeService: GroupeService,
    private authService: AuthService,
    private router: Router,
    private onboardingService: OnboardingService,
    private route: ActivatedRoute,
    private groupeContext: GroupeContextService
  ) {}

  ngOnInit(): void {
    this.isModeAjout = this.route.snapshot.queryParams['mode'] === 'add';
    this.loadVilles();
  }

  loadVilles(): void {
    this.isVillesLoading = true;
    this.groupeService.getVilles().pipe(
      finalize(() => this.isVillesLoading = false),
      catchError(err => {
        console.error('Erreur lors du chargement des villes:', err);
        this.showError('Impossible de charger la liste des villes.');
        return of([]);
      })
    ).subscribe((villes: Ville[]) => {
      this.villesList = villes;
    });
  }

  onSubmit(isValid: boolean | null): void {
    if (!isValid || this.isLoading) return;

    this.isLoading = true;

    this.groupeService.addGroupe(this.groupData).pipe(
      switchMap(response => {
        if (!response || !response.id) {
          return of(null);
        }

        console.log('[UserGroupRegister] Groupe créé avec ID:', response.id);

        if (this.isModeAjout) {
          // MODE AJOUT : switcher vers le nouveau groupe
          return this.authService.switchGroupe(response.id).pipe(
            tap(() => {
              this.groupeContext.notifyGroupeChanged(response.id);
            }),
            switchMap(() => of(response))
          );
        } else {
          // MODE PREMIER GROUPE : rafraîchir les rôles globaux
          return this.authService.refreshUserInfo().pipe(
            switchMap(() => of(response))
          );
        }
      }),
      catchError(err => {
        console.error('[UserGroupRegister] Erreur:', err);
        this.showError(err.error?.message || 'Erreur lors de la création');
        return of(null);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe(response => {
      if (!response) return;

      // FIX : masquer le formulaire immédiatement après succès
      this.showForm = false;
      this.groupeCreeNom = response.nom;

      this.showSuccess(`Groupe "${response.nom}" créé avec succès !`);

      if (!this.isModeAjout) {
        this.onboardingService.complete();
      }

      // FIX : laisser le temps au message de succès + à l'UI
      // de refléter "formulaire fermé" avant de naviguer,
      // puis rediriger vers la CONFIG du groupe fraîchement créé
      // (paramètres / groupe-config) — pas vers /membre ou /home
      setTimeout(() => {
        this.router.navigate(['/responsable/configuration']);
      }, 1200);
    });
  }

  generateAbbreviation(): void {
    if (this.groupData.nom && !this.groupData.abreviation) {
      const words = this.groupData.nom.split(' ');
      if (words.length >= 2) {
        this.groupData.abreviation = words
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 4);
      } else {
        this.groupData.abreviation = this.groupData.nom.substring(0, 3).toUpperCase();
      }
    }
  }

  onCancel(): void {
    this.router.navigate([this.isModeAjout ? '/membre' : '/home']);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 7000,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}