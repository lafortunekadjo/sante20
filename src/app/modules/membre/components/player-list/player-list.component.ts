import { EcussonNiveauComponent } from '../../../../shared/components/ecusson-niveau/ecusson-niveau.component';
import { normaliserSexe, estMasculin } from '../../../../core/utils/referentiel';
import { t } from '../../../../core/i18n/traduire';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResumeJoueur, ProfileService } from '../../../../core/services/profile.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, TranslateModule, MatOptionModule,MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule, EcussonNiveauComponent],
  templateUrl: './player-list.component.html',
  styleUrl: './player-list.component.scss'
})
export class PlayerListComponent implements OnInit {
  players: ResumeJoueur[] = [];
  filteredPlayers: ResumeJoueur[] = [];
  isLoading = true;

  // Filtres enrichis
  searchQuery = '';
  selectedPoste = 'all';
  selectedPied = 'all';
  selectedSexe = 'all';
  selectedQuartier = 'all';
  minGoals: number | null = null;
  minMatchs: number | null = null;

  // Affichage progressif : 24 cartes d'abord, les suivantes à la demande (moins de DOM et d'images à charger)
  readonly taillePage = 24;
  visibles = this.taillePage;
  sortBy = 'butsDesc';

  // Liste unique des quartiers détectés dynamiquement depuis le backend
  quartiersDisponibles: string[] = [];
  selectedPostes: string[] = [];
selectedQuartiers: string[] = [];

  // Comparateur
  comparedPlayers: ResumeJoueur[] = [];
  showComparisonModal = false;
  showMobileFilters: boolean = true;

  constructor(private profileService: ProfileService, private snackBar: MatSnackBar) {}

  get visiblePlayers(): ResumeJoueur[] {
    return this.filteredPlayers.slice(0, this.visibles);
  }

  get restants(): number {
    return Math.max(0, this.filteredPlayers.length - this.visibles);
  }

  afficherPlus(): void {
    this.visibles += this.taillePage;
  }

  trackById(_: number, p: ResumeJoueur): number {
    return p.id;
  }

  /** Médaille des 3 premiers quand le tri porte sur une statistique (et que la valeur est > 0). */
  medaille(index: number, p: ResumeJoueur): string {
    if (index > 2) return '';
    const valeur = this.sortBy === 'butsDesc' ? p.totalButsGlobal
      : this.sortBy === 'passesDesc' ? p.totalPassesGlobal
      : this.sortBy === 'cleanSheetsDesc' ? p.cleanSheets
      : this.sortBy === 'matchsDesc' ? p.totalMatchsJoues : 0;
    return valeur > 0 ? ['🥇', '🥈', '🥉'][index] : '';
  }

  ngOnInit(): void {
    if (window.innerWidth <= 768) {
    this.showMobileFilters = false;
  }
    this.profileService.getAnnuaire().subscribe({
      next: (data) => {
        this.players = data;
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
        // 2. Vérifie si le filtre correspond à cette lettre
    const matchesSexe = this.selectedSexe === 'all' || normaliserSexe(player.sexe) === this.selectedSexe;

    const matchesQuartier = this.selectedQuartiers.length === 0 || this.selectedQuartiers.includes(player.quartier);
    const matchesGoals = !this.minGoals || (player.totalButsGlobal || 0) >= this.minGoals;
    const matchesMatchs = !this.minMatchs || (player.totalMatchsJoues || 0) >= this.minMatchs;

    return matchesSearch && matchesPoste && matchesPied && matchesSexe && matchesQuartier && matchesGoals && matchesMatchs;
  });
  this.visibles = this.taillePage;

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

  /** Utilisé par la carte du joueur. */
  readonly estMasculin = estMasculin;

  hasActiveFilters(): boolean {
    return !!(this.selectedPostes.length > 0 || this.selectedPied !== 'all' || this.selectedSexe !== 'all' || this.selectedQuartiers.length > 0
      || this.minGoals || this.minMatchs);
  }

  getActiveFilterCount(): number {
    let n = 0;
    if (this.selectedPostes.length > 0) n++;
    if (this.selectedPied !== 'all') n++;
    if (this.selectedSexe !== 'all') n++;
    if (this.selectedQuartiers.length > 0) n++;
    if (this.minGoals) n++;
    if (this.minMatchs) n++;
    return n;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedPoste = 'all';
    this.selectedPied = 'all';
    this.selectedSexe = 'all';
    this.selectedQuartier = 'all';
    this.minGoals = null;
    this.minMatchs = null;
    this.sortBy = 'butsDesc';
    this.selectedPostes = [];
    this.selectedQuartiers = [];
    this.applyAdvancedFilters();
  }

  toggleCompare(player: ResumeJoueur, event: any): void {
    if (event.target.checked) {
      if (this.comparedPlayers.length >= 3) {
        event.target.checked = false;
        this.snackBar.open(t('ui.ts_maximum_3_joueurs_pour_la_compar_d07a'), 'OK', { duration: 3000 });
        return;
      }
      this.comparedPlayers.push(player);
    } else {
      this.comparedPlayers = this.comparedPlayers.filter(p => p.id !== player.id);
    }
  }

  isCompared(player: ResumeJoueur): boolean {
    return this.comparedPlayers.some(p => p.id === player.id);
  }

  // ── Comparaison : valeur de chaque joueur, meilleur mis en évidence ──────────
  private ratioDe(total: number, matchs: number): number {
    return matchs ? Math.round(100 * (total || 0) / matchs) / 100 : 0;
  }

  /** Lignes du comparateur. « max » : plus c'est haut, mieux c'est ; « min » : plus c'est bas, mieux c'est (cartons, buts encaissés). */
  get lignesComparaison(): { cle: string; icone: string; valeurs: number[]; max: number; meilleurs: boolean[] }[] {
    const p = this.comparedPlayers;
    if (p.length < 2) return [];
    const defs: { cle: string; icone: string; f: (x: ResumeJoueur) => number; sens: 'max' | 'min'; masquerSiNul?: boolean }[] = [
      { cle: 'matches', icone: '👕', f: x => x.totalMatchsJoues || 0, sens: 'max' },
      { cle: 'goals', icone: '⚽', f: x => x.totalButsGlobal || 0, sens: 'max' },
      { cle: 'goalsPerMatch', icone: '📈', f: x => this.ratioDe(x.totalButsGlobal, x.totalMatchsJoues), sens: 'max' },
      { cle: 'assists', icone: '🎯', f: x => x.totalPassesGlobal || 0, sens: 'max' },
      { cle: 'assistsPerMatch', icone: '📈', f: x => this.ratioDe(x.totalPassesGlobal, x.totalMatchsJoues), sens: 'max' },
      { cle: 'contributions', icone: '🔥', f: x => (x.totalButsGlobal || 0) + (x.totalPassesGlobal || 0), sens: 'max' },
      { cle: 'cleanSheets', icone: '🧤', f: x => x.cleanSheets || 0, sens: 'max', masquerSiNul: true },
      { cle: 'conceded', icone: '🥅', f: x => x.butsEncaisses || 0, sens: 'min', masquerSiNul: true },
      { cle: 'cards', icone: '🟨', f: x => x.totalCartonsGlobal || 0, sens: 'min' }
    ];
    return defs.map(d => {
      const valeurs = p.map(d.f);
      const max = Math.max(...valeurs);
      const min = Math.min(...valeurs);
      const tousEgaux = max === min;
      const meilleurs = valeurs.map(v => !tousEgaux && (d.sens === 'max' ? v === max : v === min) && (d.sens === 'min' || v > 0));
      return { cle: d.cle, icone: d.icone, valeurs, max, meilleurs, masque: d.masquerSiNul && max === 0 };
    }).filter((l: any) => !l.masque).map(({ cle, icone, valeurs, max, meilleurs }: any) => ({ cle, icone, valeurs, max, meilleurs }));
  }

  /** Nombre de lignes (hors matchs joués) où le joueur est le meilleur. */
  avantages(index: number): number {
    return this.lignesComparaison.filter(l => l.cle !== 'matches' && l.meilleurs[index]).length;
  }

  largeur(ligne: { max: number }, valeur: number): number {
    return ligne.max ? Math.max(valeur ? 6 : 0, Math.round(100 * valeur / ligne.max)) : 0;
  }

  openComparison(): void { if (this.comparedPlayers.length >= 2) this.showComparisonModal = true; }
  closeComparison(): void { this.showComparisonModal = false; }
  clearComparison(): void { this.comparedPlayers = []; this.showComparisonModal = false; }
}