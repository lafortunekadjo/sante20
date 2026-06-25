import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlayerProfile, ProfileService } from '../../../../core/services/profile.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, TranslateModule, MatOptionModule,MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule],
  templateUrl: './player-list.component.html',
  styleUrl: './player-list.component.scss'
})
export class PlayerListComponent implements OnInit {
  players: PlayerProfile[] = [];
  filteredPlayers: PlayerProfile[] = [];
  isLoading = true;

  // Filtres enrichis
  searchQuery = '';
  selectedPoste = 'all';
  selectedPied = 'all';
  selectedSexe = 'all';
  selectedQuartier = 'all';
  minGoals: number | null = null;
  sortBy = 'butsDesc';

  // Liste unique des quartiers détectés dynamiquement depuis le backend
  quartiersDisponibles: string[] = [];
  selectedPostes: string[] = [];
selectedQuartiers: string[] = [];

  // Comparateur
  comparedPlayers: PlayerProfile[] = [];
  showComparisonModal = false;
  showMobileFilters: boolean = true;

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    if (window.innerWidth <= 768) {
    this.showMobileFilters = false;
  }
    this.profileService.getAllPlayers().subscribe({
      next: (data) => {
        this.players = data;
        console.log(data)
        // Extraire dynamiquement la liste des quartiers pour alimenter le filtre dropdown
        const setQuartiers = new Set(data.map(p => p.quartier).filter(q => q && q !== 'Non renseigné'));
        this.quartiersDisponibles = Array.from(setQuartiers).sort();
        
        this.applyAdvancedFilters();
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  // 2. Ajoute cette fonction pour intercepter le clic de réduction
toggleMobileFilters(): void {
  if (window.innerWidth <= 768) {
    this.showMobileFilters = !this.showMobileFilters;
  }
}

 applyAdvancedFilters(): void {
  this.filteredPlayers = this.players.filter(player => {
    const matchesSearch = player.username.toLowerCase().includes(this.searchQuery.toLowerCase());
    const matchesPoste = this.selectedPostes.length === 0 || this.selectedPostes.includes(player.poste);
    const matchesPied = this.selectedPied === 'all' || player.piedFort === this.selectedPied;
    
    // GESTION SOUPLE DU SEXE (M/Masculin, F/Féminin)
    // 1. Récupère la première lettre du sexe du joueur en majuscule (ex: 'M' ou 'F')
    const playerSexeLetter = player.sexe ? player.sexe.trim().toUpperCase().charAt(0) : '';
    // 2. Vérifie si le filtre correspond à cette lettre
    const matchesSexe = this.selectedSexe === 'all' || playerSexeLetter === this.selectedSexe.toUpperCase().charAt(0);

    const matchesQuartier = this.selectedQuartiers.length === 0 || this.selectedQuartiers.includes(player.quartier);
    const matchesGoals = this.minGoals === null || (player.totalButsGlobal || 0) >= this.minGoals;

    return matchesSearch && matchesPoste && matchesPied && matchesSexe && matchesQuartier && matchesGoals;
  });

    this.sortResults();
  }

  sortResults(): void {
    switch (this.sortBy) {
      case 'butsDesc':
        this.filteredPlayers.sort((a, b) => b.totalButsGlobal - a.totalButsGlobal);
        break;
      case 'passesDesc':
        this.filteredPlayers.sort((a, b) => b.totalPassesGlobal - a.totalPassesGlobal);
        break;
      case 'cleanSheetsDesc':
        this.filteredPlayers.sort((a, b) => b.cleanSheets - a.cleanSheets);
        break;
      case 'matchsDesc':
        this.filteredPlayers.sort((a, b) => b.totalMatchsJoues - a.totalMatchsJoues);
        break;
      case 'usernameAsc':
        this.filteredPlayers.sort((a, b) => a.username.localeCompare(b.username));
        break;
    }
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedPostes.length > 0 || this.selectedPied !== 'all' || this.selectedSexe !== 'all' || this.selectedQuartiers.length > 0);
  }

  getActiveFilterCount(): number {
    let n = 0;
    if (this.selectedPostes.length > 0) n++;
    if (this.selectedPied !== 'all') n++;
    if (this.selectedSexe !== 'all') n++;
    if (this.selectedQuartiers.length > 0) n++;
    return n;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedPoste = 'all';
    this.selectedPied = 'all';
    this.selectedSexe = 'all';
    this.selectedQuartier = 'all';
    this.minGoals = null;
    this.sortBy = 'butsDesc';
    this.selectedPostes = [];
    this.selectedQuartiers = [];
    this.applyAdvancedFilters();
  }

  toggleCompare(player: PlayerProfile, event: any): void {
    if (event.target.checked) {
      if (this.comparedPlayers.length >= 3) {
        event.target.checked = false;
        alert('Maximum 3 joueurs pour la comparaison.');
        return;
      }
      this.comparedPlayers.push(player);
    } else {
      this.comparedPlayers = this.comparedPlayers.filter(p => p.id !== player.id);
    }
  }

  isCompared(player: PlayerProfile): boolean {
    return this.comparedPlayers.some(p => p.id === player.id);
  }

  openComparison(): void { if (this.comparedPlayers.length >= 2) this.showComparisonModal = true; }
  closeComparison(): void { this.showComparisonModal = false; }
  clearComparison(): void { this.comparedPlayers = []; this.showComparisonModal = false; }
}