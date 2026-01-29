import { AfterViewInit, Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { Groupe } from '../../../../core/models/groupe.model';
import { Match, TypeMatch, SourceAdversaire } from '../../../../core/models/match.model';
import { Presence } from '../../../../core/models/presence.model';
import { Sanction } from '../../../../core/models/sanction.model';
import { MatchService } from '../../../../core/services/match.service';
import { SanctionService } from '../../../../core/services/sanction.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { GroupeService } from '../../../../core/services/groupe.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { Exercice, FinancesService } from '../../../../core/services/finances.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TypeSanction } from '../../../../core/models/typeSanction.model';
import { Membre } from '../../../../core/models/membre.model';
import { MembreService } from '../../../../core/services/membre.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { EquipeFilterPipe } from '../../../../core/pipes/equipe-filter.pipe';
import { CalendarComponent } from '../calendar/calendar.component';
import { GeneralService } from '../../../../core/services/general.service';
import { MediaUploadDialogComponent } from '../media-upload-dialog/media-upload-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { MatchEditDialogComponent } from '../match-edit-dialog/match-edit-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { Equipe } from '../../../../core/models/groupe.model copy';

// Interface Exercice
// interface Exercice {
//   id: number;
//   nom: string;
//   dateDebut: string;
//   dateFin: string;
//   actif: boolean;
//   cloture: boolean;
// }

interface MatchFilters {
  typeMatch: string;
  dateDebut: Date | null;
  dateFin: Date | null;
  searchText: string;
  statut: string;
}

type FilterMode = 'season' | 'dateRange';

@Component({
  selector: 'app-match-form',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatRadioModule,
    MatSnackBarModule,
    FormsModule,
    RouterModule,
    EquipeFilterPipe,
    TranslateModule
  ],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, height: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, height: 0, overflow: 'hidden' }))
      ])
    ]),
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ],
  templateUrl: './match-form.component.html',
  styleUrl: './match-form.component.scss'
})
export class MatchFormComponent implements OnInit, AfterViewInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource = new MatTableDataSource<Match>([]);
  filteredDataSource = new MatTableDataSource<Match>([]);
  displayedColumns: string[] = ['dateMatch', 'typeMatch', 'adversaire', 'statut', 'actions'];
  
  // ===== EXERCICES (SAISONS) =====
  exercices: Exercice[] = [];
  selectedExerciceId: number | null = null;
  currentExercice: Exercice | null = null;
  isLoadingExercices: boolean = false;
  filterMode: FilterMode = 'season';
  
  // Vue et filtres
  viewMode: 'card' | 'list' = 'card';
  showFilters: boolean = false;
  filters: MatchFilters = {
    typeMatch: 'tous',
    dateDebut: null,
    dateFin: null,
    searchText: '',
    statut: 'tous'
  };
  
  showCreateRow: boolean = false;
  isLoading: boolean = true;
  
  // Modèle de match pour création
  newMatch: Partial<Match> = this.getEmptyMatch();
  
  // Pour le formulaire de création
  selectedSourceAdversaire: SourceAdversaire = 'MANUEL';
  membresAnniversaireSelected: Membre[] = [];
  groupesFiltres: Groupe[] = [];
  membreSearch: string = '';
  groupeSearch: string = '';
  
  groupes: Groupe | null = null;
  allGroupes: Groupe[] = [];
  membres: Membre[] = [];
  equipes: Equipe[] = [];
  editingMatch: Match | null = null;
  matchToPrint: Match | null = null;
  presencesToPrint: Presence[] = [];
  sanctionsToPrint: Sanction[] = [];
  typeSanctions: TypeSanction[] = [];
  
  // Pour le forfait
  equipesForForfait: string[] = [];

  constructor(
    private matchService: MatchService,
    private membreService: MembreService,
    private adminService: GroupeService,
    private sanctionService: SanctionService,
    private presenceService: PresenceService,
    private generalService: GeneralService,
    private financesService: FinancesService,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  // ============ LIFECYCLE ============

  ngOnInit() {
    this.loadExercices();
  }

  ngAfterViewInit() {
    this.filteredDataSource.paginator = this.paginator;
    this.filteredDataSource.sort = this.sort;
    this.filteredDataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'groupe': return item.groupe?.nom || '';
        case 'dateMatch': return new Date(item.dateMatch).getTime();
        case 'statut': return this.getMatchStatus(item);
        case 'adversaire': return this.getMatchDisplayName(item);
        default: return (item as any)[property];
      }
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ GESTION DES EXERCICES ============

  /**
   * Charge la liste des exercices (saisons) du groupe
   */
  private loadExercices(): void {
    this.isLoadingExercices = true;
    const groupeId = this.authService.getGroupe();

    if (!groupeId) {
      console.error('Groupe ID not found');
      this.isLoadingExercices = false;
      this.loadData();
      return;
    }

    this.financesService.getExercicesByGroupe(groupeId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.error('Erreur lors du chargement des exercices:', err);
          return of([]);
        })
      )
      .subscribe({
        next: (exercices) => {
          // Trier par date de début décroissante (plus récent en premier)
          this.exercices = exercices.sort((a, b) => 
            new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime()
          );

          // Trouver l'exercice actif (non clôturé)
          this.currentExercice = this.exercices.find(e => e.actif && !e.cloture) || null;
          
          // Sélectionner l'exercice actif par défaut
          if (this.currentExercice) {
            this.selectedExerciceId = this.currentExercice.id;
          } else if (this.exercices.length > 0) {
            // Sinon, prendre le plus récent
            this.selectedExerciceId = this.exercices[0].id;
          }

          this.isLoadingExercices = false;

          // Charger les matchs avec l'exercice sélectionné
          if (this.selectedExerciceId) {
            this.loadDataForSelectedExercice();
          } else {
            this.loadData();
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des exercices:', err);
          this.isLoadingExercices = false;
          this.loadData();
        }
      });
  }

  /**
   * Change le mode de filtrage (saison ou plage de dates)
   */
  onFilterModeChange(mode: FilterMode): void {
    this.filterMode = mode;
    
    if (mode === 'season' && this.selectedExerciceId) {
      this.loadDataForSelectedExercice();
    }
  }

  /**
   * Gère le changement d'exercice/saison
   */
  onExerciceChange(exerciceId: number): void {
    this.selectedExerciceId = exerciceId;
    
    if (this.filterMode === 'season') {
      this.loadDataForSelectedExercice();
    }
  }

  /**
   * Charge les matchs pour l'exercice sélectionné
   */
  private loadDataForSelectedExercice(): void {
    if (!this.selectedExerciceId) {
      this.loadData();
      return;
    }

    const exercice = this.exercices.find(e => e.id === this.selectedExerciceId);
    if (!exercice) {
      this.loadData();
      return;
    }

    this.loadData(exercice.dateDebut, exercice.dateFin);
  }

  /**
   * Retourne l'exercice actuellement sélectionné
   */
  getSelectedExercice(): Exercice | undefined {
    return this.exercices.find(e => e.id === this.selectedExerciceId);
  }

  /**
   * Formate les dates d'un exercice pour l'affichage
   */
  formatExercicePeriod(exercice: Exercice): string {
    const start = new Date(exercice.dateDebut).toLocaleDateString('fr-FR', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
    const end = new Date(exercice.dateFin).toLocaleDateString('fr-FR', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
    return `${start} - ${end}`;
  }

  /**
   * Vérifie si un exercice est l'exercice actif actuel
   */
  isCurrentExercice(exercice: Exercice): boolean {
    return exercice.actif && !exercice.cloture;
  }

  /**
   * Retourne le libellé de la période actuelle
   */
  getCurrentPeriodLabel(): string {
    if (this.filterMode === 'dateRange' && this.hasDateFilter()) {
      const start = this.filters.dateDebut?.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      const end = this.filters.dateFin?.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
      return `${start} - ${end}`;
    }
    
    const exercice = this.getSelectedExercice();
    return exercice?.libelle || 'Toutes les données';
  }

  /**
   * Vérifie si un filtre de dates est actif
   */
  hasDateFilter(): boolean {
    return !!(this.filters.dateDebut && this.filters.dateFin);
  }

  // ============ UTILITAIRES ============
  
  private getEmptyMatch(): Partial<Match> {
    return {
      id: 0,
      typeMatch: 'INTERNE',
      dateMatch: new Date().toISOString().split('T')[0],
      lieu: '',
      commentaire: '',
      mediaUrls: [],
      forfait: false,
      equipeForfait: '',
      equipe1: undefined,
      equipe2: undefined,
      sourceAdversaire: undefined,
      groupeAdverse: undefined,
      nomAdversaireManuel: '',
      membresAnniversaire: [],
      arbitrePrincipal: null,
      arbitrePrincipalNomOccasionnel: null,
      arbitreAssistant: null,
      arbitreAssistantNomOccasionnel: null,
      rapporteur: null,
      rapporteurNomOccasionnel: null
    };
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: type === 'error' ? 'snackbar-error' : type === 'success' ? 'snackbar-success' : ''
    });
  }

  // ============ NOMS DES ÉQUIPES ============

  getEquipeNames(match: any): [string, string] {
    if (!match || !match.typeMatch) return ['Équipe 1', 'Équipe 2'];

    switch (match.typeMatch) {
      case 'INTERNE':
      case 'DUEL':
        return [
          match.equipe1?.nom || match.equipe1Nom || 'Équipe 1',
          match.equipe2?.nom || match.equipe2Nom || 'Équipe 2'
        ];

      case 'AMICAL':
        const localeName = this.groupes?.abreviation || this.groupes?.nom || 'Locale';
        let adversaireName = 'Adverse';
        
        if (match.groupeAdverse) {
          adversaireName = match.groupeAdverse.abreviation || match.groupeAdverse.nom;
        } else if (match.nomAdversaireManuel) {
          adversaireName = match.nomAdversaireManuel;
        }
        
        return [localeName, adversaireName];

      case 'ANNIVERSAIRE':
        return [
          match.equipe1?.nom || 'Équipe Fêtés',
          match.equipe2?.nom || 'Équipe Adverses'
        ];

      default:
        return ['Équipe 1', 'Équipe 2'];
    }
  }

  getMatchDisplayName(match: Match): string {
    if (!match || !match.typeMatch) return 'Match';

    const [team1, team2] = this.getEquipeNames(match);

    if (match.typeMatch === 'ANNIVERSAIRE') {
      const fetes = match.membresAnniversaire?.map(m => m.prenom).join(', ') || '';
      return fetes ? `🎂 ${fetes}` : 'Match Anniversaire';
    }

    return `${team1} vs ${team2}`;
  }

  getTypeMatchLabel(type: TypeMatch | undefined): string {
    if (!type) return 'Match';
    const labels: Record<TypeMatch, string> = {
      'INTERNE': 'Match Interne',
      'DUEL': 'Duel',
      'AMICAL': 'Match Amical',
      'ANNIVERSAIRE': 'Match Anniversaire'
    };
    return labels[type] || 'Match';
  }

  getMembreName(membre: Membre | null): string {
    return membre ? `${membre.prenom} ${membre.nom}` : '-';
  }

  // ============ CHARGEMENT DES DONNÉES ============

  /**
   * Charge les données avec filtrage optionnel par dates
   * @param startDate Date de début (format ISO string ou null)
   * @param endDate Date de fin (format ISO string ou null)
   */
  loadData(startDate?: string, endDate?: string) {
    this.isLoading = true;
    
    // Utiliser le service avec les paramètres de date si fournis
    const matchesObservable = startDate && endDate 
      ? this.matchService.getMatchesByDateRange(startDate, endDate)
      : this.matchService.getAllMatch();
    
    forkJoin([
      matchesObservable,
      this.adminService.getAllGroupesMembre(),
      this.membreService.getGroupMembers(),
      this.sanctionService.getTypeSanctions(),
      this.generalService.getEquipesByGroupe(),
      this.adminService.getAllGroupes()
    ]).subscribe({
      next: ([matches, groupes, membres, typeSanctions, equipes, allGroupes]) => {
        this.dataSource.data = matches;
        this.groupes = groupes;
        this.membres = membres;
        this.equipes = equipes;
        this.allGroupes = allGroupes.filter(g => g.id !== groupes?.id);
        this.typeSanctions = typeSanctions;
        this.sortMatches();
        this.applyFilters();
        this.isLoading = false;
        
        // Log pour debug
        const exercice = this.getSelectedExercice();
        if (exercice) {
          console.log(`✅ Matchs chargés pour ${exercice.libelle}: ${matches.length}`);
        } else {
          console.log(`✅ Tous les matchs chargés: ${matches.length}`);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.showSnackbar('Erreur lors du chargement des matchs', 'error');
        this.isLoading = false;
      }
    });
  }

  /**
   * Trie les matchs : futurs en premier (croissant), puis passés (décroissant)
   */
  sortMatches() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedMatches = [...this.dataSource.data].sort((a, b) => {
      const dateA = new Date(a.dateMatch);
      const dateB = new Date(b.dateMatch);
      dateA.setHours(0, 0, 0, 0);
      dateB.setHours(0, 0, 0, 0);
      
      const isPastA = dateA < today;
      const isPastB = dateB < today;

      // Matchs futurs en premier, triés par date croissante
      // Puis matchs passés, triés par date décroissante
      if (!isPastA && !isPastB) {
        return dateA.getTime() - dateB.getTime();
      }
      if (isPastA && isPastB) {
        return dateB.getTime() - dateA.getTime();
      }
      return isPastA ? 1 : -1;
    });

    this.dataSource.data = sortedMatches;
  }

  // ============ STATUTS DES MATCHS ============

  getMatchStatus(match: any): string {
    const matchDate = new Date(match.dateMatch);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    matchDate.setHours(0, 0, 0, 0);

    // Match futur
    if (matchDate > today) {
      return 'futurs';
    }

    // Match passé - vérifier s'il a été joué
    const hasRapporteur = !!match.rapporteur || !!(match.rapporteurNomOccasionnel?.trim());
    const hasScore = (match.scoreEquipe1 != null) || (match.scoreEquipe2 != null) || (match.scoreAdversaire != null);

    if (hasRapporteur && hasScore) {
      return 'joues';
    }

    return 'manques';
  }

  getMatchStatusLabel(match: Match): string {
    const status = this.getMatchStatus(match);
    switch (status) {
      case 'joues': return 'Joué';
      case 'manques': return 'Non validé';
      case 'futurs': return 'À venir';
      default: return 'Inconnu';
    }
  }

  getMatchStatusClass(match: Match): string {
    const status = this.getMatchStatus(match);
    switch (status) {
      case 'joues': return 'status-played';
      case 'manques': return 'status-missed';
      case 'futurs': return 'status-future';
      default: return '';
    }
  }

  getMatchStatusIcon(match: Match): string {
    const status = this.getMatchStatus(match);
    switch (status) {
      case 'joues': return 'check_circle';
      case 'manques': return 'warning';
      case 'futurs': return 'schedule';
      default: return 'help';
    }
  }

  isMatchPlayed(match: Match): boolean { 
    return this.getMatchStatus(match) === 'joues'; 
  }
  
  isMatchMissed(match: Match): boolean { 
    return this.getMatchStatus(match) === 'manques'; 
  }
  
  isMatchFuture(match: Match): boolean { 
    return this.getMatchStatus(match) === 'futurs'; 
  }

  // ============ FILTRES ============

  applyFilters() {
    let filtered = [...this.dataSource.data];

    // Filtre par type de match
    if (this.filters.typeMatch !== 'tous') {
      filtered = filtered.filter(m => m.typeMatch === this.filters.typeMatch);
    }

    // Filtre par statut
    if (this.filters.statut !== 'tous') {
      filtered = filtered.filter(m => this.getMatchStatus(m) === this.filters.statut);
    }

    // Filtres de dates supplémentaires (en plus du filtre exercice)
    if (this.filters.dateDebut) {
      filtered = filtered.filter(m => new Date(m.dateMatch) >= this.filters.dateDebut!);
    }

    if (this.filters.dateFin) {
      filtered = filtered.filter(m => new Date(m.dateMatch) <= this.filters.dateFin!);
    }

    // Filtre par texte de recherche
    if (this.filters.searchText.trim()) {
      const search = this.filters.searchText.toLowerCase();
      filtered = filtered.filter(m => {
        const displayName = this.getMatchDisplayName(m).toLowerCase();
        return displayName.includes(search) ||
          m.commentaire?.toLowerCase().includes(search) ||
          m.lieu?.toLowerCase().includes(search);
      });
    }

    this.filteredDataSource.data = filtered;
  }

  /**
   * Applique le filtre par dates personnalisé (mode dateRange)
   */
  applyDateRangeFilter(): void {
    if (this.filters.dateDebut && this.filters.dateFin) {
      this.filterMode = 'dateRange';
      const startDate = this.filters.dateDebut.toISOString().split('T')[0];
      const endDate = this.filters.dateFin.toISOString().split('T')[0];
      this.loadData(startDate, endDate);
    }
  }

  /**
   * Réinitialise tous les filtres et revient à la saison en cours
   */
  resetFilters() {
    this.filters = {
      typeMatch: 'tous',
      dateDebut: null,
      dateFin: null,
      searchText: '',
      statut: 'tous'
    };
    
    // Revenir au mode saison
    this.filterMode = 'season';
    
    // Revenir à l'exercice actif
    if (this.currentExercice) {
      this.selectedExerciceId = this.currentExercice.id;
    }
    
    this.loadDataForSelectedExercice();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  // ============ STATISTIQUES ============

  /**
   * Retourne le nombre de matchs par statut
   */
  getMatchCountByStatus(status: string): number {
    return this.dataSource.data.filter(m => this.getMatchStatus(m) === status).length;
  }

  /**
   * Retourne le nombre total de matchs chargés
   */
  getTotalMatchCount(): number {
    return this.dataSource.data.length;
  }

  /**
   * Retourne le nombre de matchs filtrés
   */
  getFilteredMatchCount(): number {
    return this.filteredDataSource.data.length;
  }

  // ============ ACTIONS CRUD ============

  editMatch(match: Match) {
    const dialogRef = this.dialog.open(MatchEditDialogComponent, {
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '90vh',
      data: {
        match: match,
        membres: this.membres,
        equipes: this.equipes,
        groupes: this.allGroupes,
        currentGroupe: this.groupes
      },
      panelClass: 'match-edit-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDataForSelectedExercice();
      }
    });
  }

  deleteMatch(match: Match) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Supprimer le match',
        message: `Êtes-vous sûr de vouloir supprimer le match "${this.getMatchDisplayName(match)}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.matchService.deleteMatch(match.id).subscribe({
          next: () => {
            this.showSnackbar('Match supprimé avec succès', 'success');
            this.loadDataForSelectedExercice();
          },
          error: (err) => {
            console.error('Erreur lors de la suppression:', err);
            this.showSnackbar('Erreur lors de la suppression du match', 'error');
          }
        });
      }
    });
  }

  viewMatchDetails(match: Match) {
    this.router.navigate(['/responsable/presences/', match.id]);
  }

  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.newMatch = this.getEmptyMatch();
      this.membresAnniversaireSelected = [];
      this.selectedSourceAdversaire = 'MANUEL';
      this.groupeSearch = '';
      this.membreSearch = '';
    }
  }

  cancelCreate() {
    this.toggleCreateRow();
  }

  isCreateFormValid(): boolean {
    if (!this.newMatch.typeMatch || !this.newMatch.dateMatch) return false;

    switch (this.newMatch.typeMatch) {
      case 'INTERNE':
      case 'DUEL':
        return !!(this.newMatch.equipe1 && this.newMatch.equipe2);
      case 'AMICAL':
        if (this.selectedSourceAdversaire === 'GROUPE_EXISTANT') {
          return !!this.newMatch.groupeAdverse;
        }
        return !!(this.newMatch.nomAdversaireManuel?.trim());
      case 'ANNIVERSAIRE':
        return this.membresAnniversaireSelected.length > 0;
      default:
        return false;
    }
  }

  saveMatch() {
    if (!this.isCreateFormValid()) return;

    this.isLoading = true;
    
    const payload: any = {
      typeMatch: this.newMatch.typeMatch,
      dateMatch: this.newMatch.dateMatch,
      lieu: this.newMatch.lieu || null,
      commentaire: this.newMatch.commentaire || null,
      forfait: this.newMatch.forfait || false,
      equipeForfait: this.newMatch.forfait ? this.newMatch.equipeForfait : null,
      arbitrePrincipalId: this.newMatch.arbitrePrincipal?.id || null,
      arbitrePrincipalNom: this.newMatch.arbitrePrincipalNomOccasionnel || null,
      arbitreAssistantId: this.newMatch.arbitreAssistant?.id || null,
      arbitreAssistantNom: this.newMatch.arbitreAssistantNomOccasionnel || null,
      rapporteurId: this.newMatch.rapporteur?.id || null,
      rapporteurNom: this.newMatch.rapporteurNomOccasionnel || null
    };

    const type = this.newMatch.typeMatch;

    if (type === 'INTERNE' || type === 'DUEL') {
      payload.equipe1Id = this.newMatch.equipe1?.id;
      payload.equipe2Id = this.newMatch.equipe2?.id;
    }

    if (type === 'AMICAL') {
      payload.sourceAdversaire = this.selectedSourceAdversaire;
      if (this.selectedSourceAdversaire === 'GROUPE_EXISTANT') {
        payload.groupeAdverseId = this.newMatch.groupeAdverse?.id;
      } else {
        payload.nomAdversaireManuel = this.newMatch.nomAdversaireManuel;
      }
      payload.scoreAdversaire = this.newMatch.scoreAdversaire || null;
    }

    if (type === 'ANNIVERSAIRE') {
      payload.membresAnniversaireIds = this.membresAnniversaireSelected.map(m => m.id);
      payload.equipe1Id = this.newMatch.equipe1?.id;
      payload.equipe2Id = this.newMatch.equipe2?.id;
    }
    
    this.matchService.createMatch(payload).subscribe({
      next: () => {
        this.showSnackbar('Match créé avec succès', 'success');
        this.loadDataForSelectedExercice();
        this.toggleCreateRow();
      },
      error: (err) => {
        console.error('Erreur lors de la création:', err);
        this.showSnackbar('Erreur lors de la création du match', 'error');
        this.isLoading = false;
      }
    });
  }

  // ============ EXPORT ============

  exportToExcel() {
    const dataToExport = this.filteredDataSource.data.map(match => ({
      'Date': new Date(match.dateMatch).toLocaleDateString('fr-FR'),
      'Type': match.typeMatch,
      'Match': this.getMatchDisplayName(match),
      'Lieu': match.lieu || '-',
      'Statut': this.getMatchStatusLabel(match),
      'Arbitre Principal': match.arbitrePrincipalNomOccasionnel || this.getMembreName(match.arbitrePrincipal ?? null),
      'Rapporteur': match.rapporteurNomOccasionnel || this.getMembreName(match.rapporteur ?? null),
      'Forfait': match.forfait ? 'Oui' : 'Non',
      'Commentaire': match.commentaire || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matchs');
    
    const exercice = this.getSelectedExercice();
    const fileName = `matchs_${exercice?.libelle || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  exportToCSV() {
    const dataToExport = this.filteredDataSource.data.map(match => ({
      'Date': new Date(match.dateMatch).toLocaleDateString('fr-FR'),
      'Type': match.typeMatch,
      'Match': this.getMatchDisplayName(match),
      'Lieu': match.lieu || '-',
      'Statut': this.getMatchStatusLabel(match)
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const exercice = this.getSelectedExercice();
    link.setAttribute('download', `matchs_${exercice?.libelle || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ============ CALENDRIER ============

  viewCalendar(): void {
    if (!this.dataSource?.data || this.dataSource.data.length === 0) {
      this.showSnackbar('Aucun match disponible', 'error');
      return;
    }

    const sortedMatches = [...this.dataSource.data].sort((a, b) => 
      new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime()
    );

    this.dialog.open(CalendarComponent, {
      width: '95vw',
      maxWidth: '900px',
      height: '85vh',
      maxHeight: '700px',
      panelClass: 'calendar-dialog',
      data: { 
        matches: sortedMatches,
        jourDeMatch: this.groupes?.jourMatch || 'Dimanche',
        groupeActif: this.groupes,
        exerciceEnCours: this.getSelectedExercice()
      }
    });
  }

  // ============ GÉNÉRATION DE MATCHS ============

  /**
   * Génère automatiquement les matchs internes pour la saison sélectionnée
   * basé sur le jour de match du groupe
   */
 generateAndSaveMatches() {
  if (!this.groupes || !this.equipes || this.equipes.length < 2) {
    this.showSnackbar('Configuration incomplète', 'error');
    return;
  }

  const exercice = this.getSelectedExercice();
  const startDate = exercice?.dateDebut ? new Date(exercice.dateDebut) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = exercice?.dateFin ? new Date(exercice.dateFin) : new Date(new Date().getFullYear(), 11, 31);
  
  const jourDeMatch = this.groupes.jourMatch || 'Dimanche';
  const matchDates = this.generateMatchDatesInRange(jourDeMatch, startDate, endDate);

  // 1. Extraire les dates des matchs DEJA présents dans le tableau
  // On utilise le format ISO (YYYY-MM-DD) pour une comparaison fiable
  const existingDates = new Set(
    this.dataSource.data.map(match => 
      new Date(match.dateMatch).toISOString().split('T')[0]
    )
  );

  // 2. Filtrer pour ne garder que le futur ET ce qui n'existe pas
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newUniqueDates = matchDates.filter(date => {
    const dateStr = date.toISOString().split('T')[0];
    return date >= today && !existingDates.has(dateStr);
  });

  // 3. Vérification si on a quelque chose à générer
  if (newUniqueDates.length === 0) {
    this.showSnackbar('Tous les matchs pour cette période existent déjà', 'info');
    return;
  }

  // 4. Confirmation et exécution
  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    data: {
      title: 'Générer les matchs',
      message: `Il y a ${newUniqueDates.length} nouveaux matchs à planifier.\n(Les matchs déjà présents dans la liste ont été ignorés).`,
      confirmText: 'Générer',
      cancelText: 'Annuler'
    }
  });

  dialogRef.afterClosed().subscribe(confirmed => {
    if (confirmed) {
      this.executeMatchGeneration(newUniqueDates);
    }
  });
}

  /**
   * Exécute la génération des matchs après confirmation
   */
  private executeMatchGeneration(matchDates: Date[]) {
    const matchesToSave: any[] = matchDates.map(date => {
      const shuffled = [...this.equipes].sort(() => Math.random() - 0.5);
      return {
        typeMatch: 'INTERNE',
        dateMatch: date.toISOString().split('T')[0],
        equipe1Id: shuffled[0].id,
        equipe2Id: shuffled[1].id,
        lieu: '',
        commentaire: ''
      };
    });

    this.isLoading = true;
    forkJoin(matchesToSave.map(match => this.matchService.createMatch(match))).subscribe({
      next: () => {
        this.showSnackbar(`${matchesToSave.length} matchs générés avec succès`, 'success');
        this.loadDataForSelectedExercice();
      },
      error: (err) => {
        console.error('Erreur lors de la génération:', err);
        this.showSnackbar('Erreur lors de la génération des matchs', 'error');
        this.isLoading = false;
      }
    });
  }

  /**
   * Génère les dates de match dans une plage donnée
   * Supporte les jours en français et en anglais
   */
  generateMatchDatesInRange(dayOfWeek: string, startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    
    // Mapping des jours (français et anglais)
    const daysMapping: { [key: string]: number } = {
      // Français
      'Dimanche': 0, 'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 
      'Jeudi': 4, 'Vendredi': 5, 'Samedi': 6,
      // Anglais
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    const targetDayIndex = daysMapping[dayOfWeek] ?? 0; // Dimanche par défaut

    while (currentDate <= endDate) {
      if (currentDate.getDay() === targetDayIndex) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  getMatchInfo(match: Match): string {
    return this.getMatchDisplayName(match);
  }
}