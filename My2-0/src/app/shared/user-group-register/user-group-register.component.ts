// ============================================================
// USER-GROUP-REGISTER COMPONENT - VERSION FINALE
// Rafraîchit les rôles après création du groupe
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
import { Router } from '@angular/router';
import { finalize, catchError, of, switchMap, tap, delay } from 'rxjs';
import { Ville } from '../../core/models/ville';
import { OnboardingService } from '../../core/services/onboarding.service';

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
  ) {}

  ngOnInit(): void {
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

  /**
   * ✅ VERSION FINALE - Rafraîchit les rôles après création
   */
  onSubmit(isValid: boolean | null): void {
    if (!isValid || this.isLoading) return;

    this.isLoading = true;

    this.groupeService.addGroupe(this.groupData).pipe(
      switchMap(response => {
        if (response && response.id) {
          console.log('[UserGroupRegister] Groupe créé avec ID:', response.id);
          
          // 1. Mettre à jour le groupeId localement
          this.authService.updateGroupeId(response.id);
          
          // 2. ✅ CRUCIAL: Rafraîchir les infos utilisateur depuis le serveur
          // Le backend a changé le rôle de CANDIDAT à RESPONSABLE
          return this.authService.refreshUserInfo().pipe(
            tap(() => {
              console.log('[UserGroupRegister] Infos utilisateur rafraîchies');
            }),
            // Retourner la réponse originale pour la suite
            switchMap(() => of(response))
          );
        }
        return of(null);
      }),
      catchError(err => {
        console.error('[UserGroupRegister] Erreur:', err);
        this.showError(err.error?.message || 'Erreur lors de la création');
        return of(null);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe(response => {
      if (response) {
        this.showSuccess('Groupe créé avec succès !');
        
        // 3. Terminer l'onboarding
        this.onboardingService.complete();

        // 4. Naviguer après un court délai
        setTimeout(() => {
          // Vérifier si on est bien RESPONSABLE maintenant
          const roles = this.authService.getRoles();
          console.log('[UserGroupRegister] Rôles après refresh:', roles);
          
          if (roles.includes('RESPONSABLE') || roles.includes('ROLE_RESPONSABLE')) {
            this.router.navigate(['/responsable/configuration']);
          } else {
            // Fallback si le rôle n'est pas encore mis à jour
            // Dans ce cas, forcer un rechargement complet
            console.warn('[UserGroupRegister] Rôle RESPONSABLE non trouvé, rechargement...');
            window.location.href = '/responsable/configuration';
          }
        }, 1000);
      }
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
    this.router.navigate(['/home']);
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