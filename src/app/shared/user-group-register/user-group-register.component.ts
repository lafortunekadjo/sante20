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
import { finalize, catchError, of } from 'rxjs';
import { Ville } from '../../core/models/ville';

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
export class UserGroupRegisterComponent  implements OnInit {

  // Données du formulaire
  groupData: GroupeRequest = {
    nom: '',
    ville1: '',
    abreviation: '',
    discipline: '',
    description: ''
  };

  // États
  isLoading = false;
  isVillesLoading = false;
  villesList: Ville[] = [];

  // Liste des disciplines
  disciplines = [
    { value: 'FOOTBALL', label: 'Football', icon: 'sports_soccer' },
    { value: 'BASKETBALL', label: 'Basketball', icon: 'sports_basketball' },
    { value: 'VOLLEYBALL', label: 'Volleyball', icon: 'sports_volleyball' },
    { value: 'HANDBALL', label: 'Handball', icon: 'sports_handball' },
    { value: 'TENNIS', label: 'Tennis', icon: 'sports_tennis' },
    { value: 'AUTRE', label: 'Autre', icon: 'sports' }
  ];

  constructor(
    private snackBar: MatSnackBar,
    private groupeService: GroupeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadVilles();
  }

  /**
   * Charger la liste des villes
   */
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
   * Soumettre le formulaire
   */
  onSubmit(isValid: boolean | null): void {
    if (!isValid || this.isLoading) {
      if (!isValid) {
        this.showError('Veuillez remplir tous les champs obligatoires.');
      }
      return;
    }

    this.isLoading = true;

    this.groupeService.addGroupe(this.groupData).pipe(
      finalize(() => {
        this.isLoading = false;
      }),
      catchError(err => {
        console.error('Erreur lors de la création du groupe:', err);
        const errorMessage = err.error?.message || 'Erreur lors de la création. Veuillez réessayer.';
        this.showError(errorMessage);
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        console.log('Groupe créé avec succès:', response);
        this.showSuccess('Groupe créé avec succès !');
        
        // Rafraîchir les données utilisateur et recharger la page
        this.refreshAndRedirect(response);
      }
    });
  }

  /**
   * Rafraîchir les données et rediriger
   */
  private refreshAndRedirect(groupeResponse: any): void {
    // Option 1: Mettre à jour le localStorage et recharger complètement
    // C'est la méthode la plus sûre pour s'assurer que tout est synchronisé
    
    // Si l'API retourne les nouvelles infos utilisateur avec le groupe
    // if (groupeResponse.groupe) {
    //   // Mettre à jour le groupe dans le localStorage
    //   this.authService.se (groupeResponse.groupe);
    // }

    // Afficher un message et recharger après un court délai
    setTimeout(() => {
      // Recharger complètement la page pour rafraîchir le menu et l'état
      window.location.href = '/dashboard';
    }, 1500);
  }

  /**
   * Générer automatiquement l'abréviation
   */
  generateAbbreviation(): void {
    if (this.groupData.nom && !this.groupData.abreviation) {
      // Prendre les premières lettres de chaque mot
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

  /**
   * Annuler et retourner
   */
  onCancel(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Afficher un message de succès
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Afficher un message d'erreur
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 7000,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}