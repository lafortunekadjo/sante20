// src/app/modules/responsable/components/groupes-explore/groupes-explore.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSliderModule } from '@angular/material/slider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { GroupePublic, GroupeFilters, DISCIPLINES, TYPES_EQUIPE, JOURS_SEMAINE, NIVEAUX } from '../../../../core/models/groupe-explorer.model';
import { AuthService } from '../../../../core/services/auth.service';
import { GroupeService } from '../../../../core/services/groupe.service';
import { Ville } from '../../../../core/models/ville';
import { GroupeDetailsDialogComponent } from '../../../membre/components/groupe-details-dialog/groupe-details-dialog.component';
import { LoginPromptDialogComponent } from '../../../membre/components/login-prompt-dialog/login-prompt-dialog.component';
import { environment } from '../../../../environment';
import { NavbarComponent } from "../../../../shared/components/navbar/navbar.component";

@Component({
  selector: 'app-groupes-explore',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatSliderModule,
    MatExpansionModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatButtonToggleModule,
    NavbarComponent
  ],
  templateUrl: './groupes-explore.component.html',
  styleUrl: './groupes-explore.component.scss'
})
export class GroupesExploreComponent implements OnInit {
  groupes: any[] = [];
  filteredGroupes: GroupePublic[] = [];
  villes: Ville[] = [];
  quartiers: any[] = [];
  
  isLoading = true;
  viewMode: 'grid' | 'list' = 'grid';
  showFilters = false;
  
  filters: GroupeFilters = {
    searchText: '',
    discipline: '',
    ville: '',
    quartier: '',
    typeEquipe: '',
    jourMatch: '',
    fraisMin: 0,
    fraisMax: 100000,
    niveauRequis: '',
    accepteNouveauxMembres: null
  };

  // Constants
  disciplines = DISCIPLINES;
  typesEquipe = TYPES_EQUIPE;
  joursSemaine = JOURS_SEMAINE;
  niveaux = NIVEAUX;
  imageUrl = `${environment.imageUrl}`;

  constructor(
    private groupesService: GroupeService,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('==========================================');
    console.log('📍 GroupesExploreComponent initialized');
    console.log('Current URL:', this.router.url);
    console.log('Is authenticated:', this.authService.isLoggedIn());
    console.log('==========================================');
    
    // ❌ NE PAS FAIRE DE REDIRECTION ICI
    // Juste charger les données
    this.loadGroupes();
    this.loadVilles();
  }

  loadGroupes(): void {
    this.isLoading = true;
    this.groupesService.getAllGroupes().subscribe({
      next: (groupes) => {
        this.groupes = groupes.filter(g => g.isActive);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement groupes:', err);
        this.snackBar.open('Erreur lors du chargement des groupes', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadVilles(): void {
    this.groupesService.getVilles().subscribe({
      next: (villes) => {
        this.villes = villes;
      },
      error: (err) => {
        console.error('Erreur chargement villes:', err);
      }
    });
  }

  onVilleChange(ville: string): void {
    this.filters.quartier = '';
    this.quartiers = [];
    
    if (ville) {
      this.groupesService.getVilles().subscribe({
        next: (quartiers) => {
          this.quartiers = quartiers;
        },
        error: (err) => {
          console.error('Erreur chargement quartiers:', err);
        }
      });
    }
    
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.groupes];

    if (this.filters.searchText.trim()) {
      const search = this.filters.searchText.toLowerCase();
      filtered = filtered.filter(g => 
        g.nom.toLowerCase().includes(search) ||
        g.description?.toLowerCase().includes(search) ||
        g.stade.toLowerCase().includes(search)
      );
    }

    if (this.filters.discipline) {
      filtered = filtered.filter(g => g.discipline === this.filters.discipline);
      }

    if (this.filters.ville) {
      filtered = filtered.filter(g => g.ville === this.filters.ville);
    }

    if (this.filters.quartier) {
      filtered = filtered.filter(g => g.quartier === this.filters.quartier);
    }

    if (this.filters.typeEquipe) {
      filtered = filtered.filter(g => g.typeEquipe === this.filters.typeEquipe);
    }

    if (this.filters.jourMatch) {
      filtered = filtered.filter(g => g.jourMatch === this.filters.jourMatch);
    }

    filtered = filtered.filter(g => 
      g.fraisAdhesion >= this.filters.fraisMin && 
      g.fraisAdhesion <= this.filters.fraisMax
    );

    if (this.filters.niveauRequis) {
      filtered = filtered.filter(g => 
        g.niveauRequis === this.filters.niveauRequis ||
        g.niveauRequis === 'Tous niveaux'
      );
    }

    if (this.filters.accepteNouveauxMembres !== null) {
      filtered = filtered.filter(g => g.accepteNouveauxMembres === this.filters.accepteNouveauxMembres);
    }

    this.filteredGroupes = filtered.map(g => ({
      ...g, 
      ville: g.ville ? g.ville.nom : 'Pas mentionné', 
      stade: g.stade ? g.stade.nom : 'Pas mentionné',
      imageUrl: g.profilePhotoUrl,
      modeEquipe: g.modeEquipes
    }));
  }

  resetFilters(): void {
    this.filters = {
      searchText: '',
      discipline: '',
      ville: '',
      quartier: '',
      typeEquipe: '',
      jourMatch: '',
      fraisMin: 0,
      fraisMax: 100000,
      niveauRequis: '',
      accepteNouveauxMembres: null
    };
    this.quartiers = [];
    this.applyFilters();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  viewGroupeDetails(groupe: GroupePublic): void {
    const dialogRef = this.dialog.open(GroupeDetailsDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { groupe },
      panelClass: 'groupe-details-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'adhesion') {  
        this.demanderAdhesion(groupe);
      }
    });
  }

  demanderAdhesion(groupe: GroupePublic): void {
    if (!this.authService.isLoggedIn()) {
      this.openLoginPrompt(groupe);
      return;
    }

    const userId = this.authService.getUserId();
      
    if (userId) {
      this.groupesService.verifierDemandeExistante(groupe.id, userId).subscribe({
        next: (demandeExiste) => {
          if (demandeExiste) {
            this.snackBar.open('Vous avez déjà une demande en attente pour ce groupe', 'Fermer', {
              duration: 4000
            });
          } else {
            // Rediriger vers le formulaire de candidature
            this.router.navigate(['/adhesion', groupe.id, 'candidature']);
          }
        },
        error: (err) => {
          console.error('Erreur vérification demande:', err);
          // En cas d'erreur, rediriger quand même
          this.router.navigate(['/adhesion', groupe.id, 'candidature']);
        }
      });
    }
  }

  openLoginPrompt(groupe: GroupePublic): void {
    const dialogRef = this.dialog.open(LoginPromptDialogComponent, {
      width: '450px',
      data: { groupe }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'login') {
        // ✅ CORRECTION : Utiliser query params au lieu de localStorage
        const returnUrl = `/adhesion/${groupe.id}/candidature`;
        console.log('Redirecting to login with returnUrl:', returnUrl);
        
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: returnUrl }
        });
      } else if (result === 'signup') {
        // ✅ CORRECTION : Utiliser query params au lieu de localStorage
        const returnUrl = `/adhesion/${groupe.id}/candidature`;
        console.log('Redirecting to signup with returnUrl:', returnUrl);
        
        this.router.navigate(['/signup'], {
          queryParams: { returnUrl: returnUrl }
        });
      }
    });
  }

  getCapaciteInfo(groupe: GroupePublic): string {
    if (!groupe.nombreMembres || !groupe.capaciteMax) {
      return 'Non spécifié';
    }
    const pourcent = (groupe.nombreMembres / groupe.capaciteMax) * 100;
    return `${groupe.nombreMembres}/${groupe.capaciteMax} (${pourcent.toFixed(0)}%)`;
  }

  getCapaciteClass(groupe: GroupePublic): string {
    if (!groupe.nombreMembres || !groupe.capaciteMax) {
      return '';
    }
    const pourcent = (groupe.nombreMembres / groupe.capaciteMax) * 100;
    if (pourcent >= 90) return 'full';
    if (pourcent >= 70) return 'high';
    return 'available';
  }

  getDisciplineIcon(discipline: string): string {
    const icons: { [key: string]: string } = {
      'Football': 'sports_soccer',
      'Basketball': 'sports_basketball',
      'Volleyball': 'sports_volleyball',
      'Handball': 'sports_handball',
      'Rugby': 'sports_rugby',
      'Tennis': 'sports_tennis',
      'Badminton': 'sports_tennis'
    };
    return icons[discipline] || 'sports';
  }

  hasActiveFilters(): boolean {
    return this.filters.searchText !== '' ||
           this.filters.discipline !== '' ||
           this.filters.ville !== '' ||
           this.filters.quartier !== '' ||
           this.filters.typeEquipe !== '' ||
           this.filters.jourMatch !== '' ||
           this.filters.niveauRequis !== '' ||
           this.filters.fraisMin !== 0 ||
           this.filters.fraisMax !== 100000 ||
           this.filters.accepteNouveauxMembres !== null;
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filters.searchText) count++;
    if (this.filters.discipline) count++;
    if (this.filters.ville) count++;
    if (this.filters.quartier) count++;
    if (this.filters.typeEquipe) count++;
    if (this.filters.jourMatch) count++;
    if (this.filters.niveauRequis) count++;
    if (this.filters.fraisMin !== 0 || this.filters.fraisMax !== 100000) count++;
    if (this.filters.accepteNouveauxMembres !== null) count++;
    return count;
  }
}