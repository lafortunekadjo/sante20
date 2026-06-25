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
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatCheckboxModule } from "@angular/material/checkbox";

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
    TranslateModule,
    MatProgressBarModule,
    MatCheckboxModule
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
  isCandidat : boolean = false
  // imageUrl = `${environment.imageUrl}`;

  constructor(
    private groupesService: GroupeService,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {

    this.isCandidat=this.authService.isCandidat()
    this.totalDisciplines = this.disciplines.length;
    this.loadGroupes();
    this.loadVilles();
  }

  loadGroupes(): void {
    this.isLoading = true;
    this.groupesService.getAllGroupes().subscribe({
      next: (groupes) => {
        console.log(groupes)
        this.groupes = groupes.filter(g => g.isActive && g.isPublic);
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

 onVilleChange(villeNom: string): void {
  // 1. On met à jour l'objet de filtres
  this.filters.ville = villeNom;
  
  // 2. On réinitialise le quartier car il n'est plus cohérent avec la nouvelle ville
  this.filters.quartier = '';
  this.quartiers = [];

  // 3. On lance la recherche immédiatement
  this.applyFilters();
}

  applyFilters(): void {
    let filtered = [...this.groupes];

    if (this.filters.searchText.trim()) {
      const search = this.filters.searchText.toLowerCase();
      filtered = filtered.filter(g => 
        g.nom.toLowerCase().includes(search) ||
        g.description?.toLowerCase().includes(search) ||
        g.stade.nom.toLowerCase().includes(search)
      );
    }

    if (this.filters.discipline) {
      filtered = filtered.filter(g => g.discipline === this.filters.discipline);
      }

   // CORRECTION FILTRE VILLE : On compare le nom de l'objet ville avec le string du filtre
  if (this.filters.ville) {
    filtered = filtered.filter(g => g.ville && g.ville.nom === this.filters.ville);
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
      stade: g.stade ,
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
            this.router.navigate(['/adhesion', groupe.id, '/candidature']);
          }
        },
        error: (err) => {
          console.error('Erreur vérification demande:', err);
          // En cas d'erreur, rediriger quand même
          this.router.navigate(['/adhesion', groupe.id, '/candidature']);
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
  // ===== AJOUTS POUR TON COMPOSANT EXISTANT =====
// Ajoute simplement ces propriétés et méthodes à ton GroupesExploreComponent

// 1. NOUVELLES PROPRIÉTÉS (ajouter après tes propriétés existantes)
selectedGroups: any[] = [];
favoriteGroups: Set<number> = new Set();
totalDisciplines: number = 0;
sortBy: string = 'nom';

// Filtres rapides (optionnel, tu peux les ignorer pour l'instant)
quickFilterTags: any[] = [];
priceRanges: any[] = [
  { label: 'Gratuit', min: 0, max: 0 },
  { label: '< 5,000 FCFA', min: 0, max: 5000 },
  { label: '5,000 - 10,000 FCFA', min: 5000, max: 10000 },
  { label: '10,000 - 25,000 FCFA', min: 10000, max: 25000 },
  { label: '> 25,000 FCFA', min: 25000, max: null }
];

// 2. NOUVELLES MÉTHODES (ajouter à la fin de ta classe)

// Gestion de la sélection multiple
isGroupSelected(groupe: any): boolean {
  return this.selectedGroups.some(g => g?.id === groupe?.id);
}

toggleGroupSelection(groupe: any): void {
  if (!groupe?.id) return;
  
  const index = this.selectedGroups.findIndex(g => g?.id === groupe.id);
  if (index >= 0) {
    this.selectedGroups.splice(index, 1);
  } else {
    this.selectedGroups.push(groupe);
  }
}

selectAll(): void {
  this.selectedGroups = [...this.filteredGroupes];
}

compareSelected(): void {
  if (this.selectedGroups.length < 2) return;
  console.log('Comparing groups:', this.selectedGroups);
  // Tu peux ajouter ta logique de comparaison plus tard
}

// Gestion des favoris
isGroupFavorite(groupe: any): boolean {
  return groupe?.id ? this.favoriteGroups.has(groupe.id) : false;
}

toggleFavorite(groupe: any): void {
  if (!groupe?.id) return;
  
  if (this.favoriteGroups.has(groupe.id)) {
    this.favoriteGroups.delete(groupe.id);
  } else {
    this.favoriteGroups.add(groupe.id);
  }
}

// Helpers pour le template
getActiveFiltersList(): any[] {
  const activeFilters = [];
  
  if (this.filters.searchText?.trim()) {
    activeFilters.push({
      label: `"${this.filters.searchText}"`,
      icon: 'search',
      key: 'searchText'
    });
  }
  
  if (this.filters.discipline) {
    activeFilters.push({
      label: this.filters.discipline,
      icon: 'sports',
      key: 'discipline'
    });
  }
  
  if (this.filters.ville) {
    activeFilters.push({
      label: this.filters.ville,
      icon: 'location_city',
      key: 'ville'
    });
  }
  
  if (this.filters.fraisMin !== 0 || this.filters.fraisMax !== 100000) {
    const min = this.filters.fraisMin || 0;
    const max = this.filters.fraisMax || '∞';
    activeFilters.push({
      label: `${min} - ${max} FCFA`,
      icon: 'payments',
      key: 'prix'
    });
  }
  
  return activeFilters;
}

removeFilter(filter: any): void {
  switch (filter.key) {
    case 'searchText':
      this.filters.searchText = '';
      break;
    case 'discipline':
      this.filters.discipline = '';
      break;
    case 'ville':
      this.filters.ville = '';
      this.quartiers = [];
      break;
    case 'prix':
      this.filters.fraisMin = 0;
      this.filters.fraisMax = 100000;
      break;
  }
  this.applyFilters();
}

// Tri
applySorting(): void {
  this.filteredGroupes.sort((a, b) => {
    switch (this.sortBy) {
      case 'nom':
        return (a.nom || '').localeCompare(b.nom || '');
      case 'ville':
        return (a.ville || '').localeCompare(b.ville || '');
      case 'fraisAdhesion':
        return (a.fraisAdhesion || 0) - (b.fraisAdhesion || 0);
      case 'discipline':
        return (a.discipline || '').localeCompare(b.discipline || '');
      default:
        return 0;
    }
  });
}

// Actions
exportResults(): void {
  console.log('Export:', this.filteredGroupes);
  // Tu peux implémenter l'export plus tard
}

shareGroupe(groupe: any): void {
  if (!groupe?.id) return;
  
  if (navigator.share) {
    navigator.share({
      title: groupe.nom || 'Groupe sportif',
      text: `Découvre ce groupe: ${groupe.nom} - ${groupe.discipline}`,
      url: `${window.location.origin}/groupe/${groupe.id}`
    });
  } else {
    const url = `${window.location.origin}/groupe/${groupe.id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Lien copié dans le presse-papiers', 'Fermer', { duration: 2000 });
    });
  }
}

// Filtres rapides (optionnel)
applyQuickFilter(tag: any): void {
  tag.active = !tag.active;
  this.applyFilters();
}

setPriceRange(range: any): void {
  this.filters.fraisMin = range.min;
  this.filters.fraisMax = range.max;
  this.applyFilters();
}

isPriceRangeActive(range: any): boolean {
  return this.filters.fraisMin === range.min && this.filters.fraisMax === range.max;
}

getCapacityColor(groupe: any): 'primary' | 'accent' | 'warn' {
  const percentage = this.getCapacityPercentage(groupe);
  if (percentage < 70) return 'primary';
  if (percentage < 90) return 'accent';
  return 'warn';
}

getCapacityPercentage(groupe: any): number {
  if (!groupe.capaciteMax || !groupe.nombreMembres) return 0;
  return Math.round((groupe.nombreMembres / groupe.capaciteMax) * 100);
}
getAvailabilityIcon(groupe: any): string {
  const availability = this.getAvailabilityClass(groupe);
  switch (availability) {
    case 'available': return 'check_circle';
    case 'limited': return 'schedule';
    case 'full': return 'block';
    default: return 'help';
  }
}
getAvailabilityClass(groupe: any): string {
  if (!groupe.accepteNouveauxMembres) return 'full';
  if (!groupe.capaciteMax) return 'available';
  
  const percentage = this.getCapacityPercentage(groupe);
  if (percentage < 70) return 'available';
  if (percentage < 90) return 'limited';
  return 'full';
}

// Effacer la recherche
clearSearch(): void {
  this.filters.searchText = '';
  this.applyFilters();
}
 // Helper pour l'URL d'image
getGroupeImageUrl(groupe: any): string {
  return groupe.imageUrl ? `url(${groupe.imageUrl})` : `url('assets/default-groupe.jpg')`;
}
trackByGroupeId(index: number, groupe: any): any {
  return groupe?.id || index;
}

getBackgroundImageStyle(groupe: any): string {
  // Assurez-vous que l'interface Groupe est définie dans votre fichier (Groupe est simulée ici)
  interface Groupe {
    imageUrl: string | null;
  }
  
  // Vérifie si l'URL de l'image est non nulle et non vide
  if (groupe.imageUrl) {
    // Retourne la valeur CSS 'url(...)'
    return `url(${groupe.imageUrl})`;
  }
  
  // Aucune image, retourne 'none' pour laisser le fond gris et l'icône s'afficher
  return 'none'; 
}

getPlaceholderColor(nom: string): string {
  // Petite fonction de hachage simple
  let hash = 0;
  for (let i = 0; i < nom.length; i++) {
    hash = nom.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convertir le hachage en couleur HSL (plus agréable que RGB aléatoire)
  const h = hash % 360;
  // Saturation et Luminosité fixes pour de belles couleurs
  return `hsl(${h}, 60%, 45%)`; 
}
}