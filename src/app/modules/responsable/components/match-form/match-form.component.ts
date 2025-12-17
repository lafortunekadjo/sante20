import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Groupe } from '../../../../core/models/groupe.model';
import { Match, TypeMatch, SourceAdversaire } from '../../../../core/models/match.model';
import { Presence } from '../../../../core/models/presence.model';
import { Sanction } from '../../../../core/models/sanction.model';
import { MatchService } from '../../../../core/services/match.service';
import { SanctionService } from '../../../../core/services/sanction.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { GroupeService } from '../../../../core/services/groupe.service';
import { PresenceService } from '../../../../core/services/presence.service';
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
import { Equipe } from '../../../../core/models/groupe.model copy';
import { MatchEditDialogComponent } from '../match-edit-dialog/match-edit-dialog.component';
import { CreateInvitationDialogComponent } from '../../../users/create-invitation-dialog/create-invitation-dialog.component';


interface MatchFilters {
  typeMatch: string;
  dateDebut: Date | null;
  dateFin: Date | null;
  searchText: string;
  statut: string;
}

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
    EquipeFilterPipe
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
    ])
  ],
  templateUrl: './match-form.component.html',
  styleUrl: './match-form.component.scss'
})
export class MatchFormComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource = new MatTableDataSource<Match>([]);
  filteredDataSource = new MatTableDataSource<Match>([]);
  displayedColumns: string[] = ['dateMatch', 'typeMatch', 'adversaire', 'statut', 'actions'];
  
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
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
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

  // ===== UTILITAIRES =====
  
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

  // ===== CORRECTION BUG #2: getEquipeNames =====
  
  getEquipeNames(match: any): [string, string] {
    if (!match || !match.typeMatch) return ['Équipe 1', 'Équipe 2'];

    switch (match.typeMatch) {
      case 'INTERNE':
      case 'DUEL':
        // CORRECTION: Utiliser equipe1 et equipe2 correctement
        const eq1Name = match.equipe1?.nom || match.equipe1Nom || 'Équipe 1';
        const eq2Name = match.equipe2?.nom || match.equipe2Nom || 'Équipe 2';
        return [eq1Name, eq2Name];

      case 'AMICAL':
        const localeName = this.groupes?.abreviation || this.groupes?.nom || 'Locale';
        let adversaireName = 'Adverse';
        
        if (match.groupeAdverse) {
          adversaireName = match.groupeAdverse.abreviation || match.groupeAdverse.nom;
        } else if (match.nomAdversaireManuel) {
          adversaireName = match.nomAdversaireManuel;
        } else if (match.adversaire) {
          // Fallback sur l'ancien champ
          adversaireName = match.equipe2Nom;
        }
        
        return [localeName, adversaireName];

      case 'ANNIVERSAIRE':
        // Pour anniversaire, utiliser les équipes si disponibles
        const feteTeam = match.equipe1?.nom || 'Équipe Fêtés';
        const advTeam = match.equipe2?.nom || 'Équipe Adverses';
        return [feteTeam, advTeam];

      default:
        return ['Équipe 1', 'Équipe 2'];
    }
  }

  getMatchDisplayName(match: Match): string {
    if (!match || !match.typeMatch) return 'Match';

    const [team1, team2] = this.getEquipeNames(match);

    switch (match.typeMatch) {
      case 'INTERNE':
      case 'DUEL':
        return `${team1} vs ${team2}`;

      case 'AMICAL':
        return `${team1} vs ${team2}`;

      case 'ANNIVERSAIRE':
        const fetes = match.membresAnniversaire?.map(m => m.prenom).join(', ') 
                   ||'';
        return fetes ? `🎂 ${fetes}` : 'Match Anniversaire';

      default:
        return `${team1} vs ${team2}`;
    }
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

  // ===== CHARGEMENT DES DONNÉES =====

  loadData() {
    this.isLoading = true;
    forkJoin([
      this.matchService.getAllMatch(),
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
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.showSnackbar('Erreur lors du chargement des matchs', 'error');
        this.isLoading = false;
      }
    });
  }

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

  // ===== CORRECTION BUG #1: STATUTS DES MATCHS =====

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
    // Un match est considéré "joué" si:
    // 1. Il a un rapporteur assigné, OU
    // 2. Il a des scores enregistrés, OU
    // 3. Il a des présences enregistrées (vérification future possible)
    // 4. Il est marqué manuellement comme joué
    
    const hasRapporteur = this.hasRapporteur(match);
    const hasScore = this.hasScore(match);
    //const isMarkedPlayed = (match as any).forceMarkAsPlayed === true;

    if (match.hasRapporteur && hasScore) {
      return 'joues';
    }

    return 'manques';
  }

  /**
   * Vérifie si le match a un rapporteur assigné
   */
  private hasRapporteur(match: Match): boolean {
    return !!match.rapporteur || 
           !!(match.rapporteurNomOccasionnel && match.rapporteurNomOccasionnel.trim() !== '');
  }

  /**
   * Vérifie si le match a un score enregistré
   */
  private hasScore(match: Match): boolean {
    // Pour les matchs internes/duel
    if (match.scoreEquipe1 !== undefined && match.scoreEquipe1 !== null) return true;
    if (match.scoreEquipe2 !== undefined && match.scoreEquipe2 !== null) return true;
    
    // Pour les matchs amicaux
    if (match.scoreAdversaire !== undefined && match.scoreAdversaire !== null) return true;
    
    return false;
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

  // Méthodes legacy pour compatibilité
  isMatchPlayed(match: Match): boolean {
    return this.getMatchStatus(match) === 'joues';
  }

  isMatchMissed(match: Match): boolean {
    return this.getMatchStatus(match) === 'manques';
  }

  isMatchFuture(match: Match): boolean {
    return this.getMatchStatus(match) === 'futurs';
  }

  // ===== FILTRES =====

  applyFilters() {
    let filtered = [...this.dataSource.data];

    if (this.filters.typeMatch !== 'tous') {
      filtered = filtered.filter(m => m.typeMatch === this.filters.typeMatch);
    }

    if (this.filters.statut !== 'tous') {
      filtered = filtered.filter(m => this.getMatchStatus(m) === this.filters.statut);
    }

    if (this.filters.dateDebut) {
      filtered = filtered.filter(m => new Date(m.dateMatch) >= this.filters.dateDebut!);
    }

    if (this.filters.dateFin) {
      filtered = filtered.filter(m => new Date(m.dateMatch) <= this.filters.dateFin!);
    }

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

  resetFilters() {
    this.filters = {
      typeMatch: 'tous',
      dateDebut: null,
      dateFin: null,
      searchText: '',
      statut: 'tous'
    };
    this.applyFilters();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  // ===== CORRECTION BUG #3: ÉDITION EN POPUP =====

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
        this.updateMatch(result);
      }
    });
  }

  private updateMatch(payload: any) {
    this.isLoading = true;
    
    this.matchService.updateMatch(payload.id, payload).subscribe({
      next: () => {
        this.showSnackbar('Match mis à jour avec succès', 'success');
        this.loadData();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        this.showSnackbar('Erreur lors de la mise à jour du match', 'error');
        this.isLoading = false;
      }
    });
  }

  // ===== ACTIONS =====

  canAccessMatchData(match: Match): boolean {
    const matchDate = new Date(match.dateMatch);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    matchDate.setHours(0, 0, 0, 0);
    return matchDate <= today;
  }

  navigateToPresences(match: Match) {
    if (!this.canAccessMatchData(match)) {
      this.showSnackbar('Les présences ne sont accessibles que pour les matchs passés ou du jour.', 'info');
      return;
    }
    this.router.navigate(['/responsable/presences', match.id]);
  }

  openMediaDialog(match: Match) {
    if (!this.canAccessMatchData(match)) {
      this.showSnackbar('Les médias ne peuvent être ajoutés que pour les matchs passés ou du jour.', 'info');
      return;
    }

    const dialogRef = this.dialog.open(MediaUploadDialogComponent, {
      width: '90vw',
      maxWidth: '900px',
      data: { 
        matchId: match.id,
        existingMediaUrls: match.mediaUrls || []
      },
      panelClass: 'media-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }
private getAdversaireName(match: any): string | undefined {

    // Cas 1: L'adversaire a été saisi manuellement (généralement pour AMICAL)
  
        return match.equipe2Nom;
   
}
openInvitationDialog(match: Match): void {
    
    const adversaireNom = this.getAdversaireName(match); // Utilisation de la nouvelle fonction utilitaire

    const dialogRef = this.dialog.open(CreateInvitationDialogComponent, {
        width: '500px',
        maxWidth: '95vw',
        data: {
            match: {
                id: match.id,
                dateMatch: match.dateMatch,
                // Utiliser la valeur déterminée
                adversaire: adversaireNom 
            }
        }
    });
    // ... suite de la fonction (gestion de la fermeture, etc.)
}

  openDeleteDialog(match: Match) {
    const matchName = this.getMatchDisplayName(match);
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { 
        message: `Voulez-vous supprimer le match du ${new Date(match.dateMatch).toLocaleDateString('fr-FR')} (${matchName}) ?` 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteMatch(match.id);
      }
    });
  }

  deleteMatch(id: number) {
    this.isLoading = true;
    this.matchService.deleteMatch(id).subscribe({
      next: () => {
        this.showSnackbar('Match supprimé avec succès', 'success');
        this.loadData();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.showSnackbar('Erreur lors de la suppression du match', 'error');
        this.isLoading = false;
      }
    });
  }

  // ===== CRÉATION DE MATCH =====

  onTypeChange() {
    const type = this.newMatch.typeMatch;
    
    this.newMatch.equipe1 = undefined;
    this.newMatch.equipe2 = undefined;
    this.newMatch.sourceAdversaire = undefined;
    this.newMatch.groupeAdverse = undefined;
    this.newMatch.nomAdversaireManuel = '';
    this.membresAnniversaireSelected = [];
    this.selectedSourceAdversaire = 'MANUEL';

    if (type === 'INTERNE') {
      this.setRandomTeams();
    } else if (type === 'AMICAL') {
      this.newMatch.sourceAdversaire = 'MANUEL';
    } else if (type === 'ANNIVERSAIRE') {
      this.setRandomTeams();
    }
    
    this.updateEquipesForForfait();
  }

  setRandomTeams() {
    if (this.equipes.length >= 2) {
      const shuffled = [...this.equipes].sort(() => Math.random() - 0.5);
      this.newMatch.equipe1 = shuffled[0];
      this.newMatch.equipe2 = shuffled[1];
      this.updateEquipesForForfait();
    }
  }

  onSourceAdversaireChange() {
    this.newMatch.sourceAdversaire = this.selectedSourceAdversaire;
    this.newMatch.groupeAdverse = undefined;
    this.newMatch.nomAdversaireManuel = '';
  }

  filterGroupes() {
    if (!this.groupeSearch.trim()) {
      this.groupesFiltres = this.allGroupes.slice(0, 10);
    } else {
      const search = this.groupeSearch.toLowerCase();
      this.groupesFiltres = this.allGroupes
        .filter(g => g.nom.toLowerCase().includes(search))
        .slice(0, 10);
    }
  }

  selectGroupeAdverse(groupe: Groupe) {
    this.newMatch.groupeAdverse = groupe;
    this.groupeSearch = '';
    this.updateEquipesForForfait();
  }

  get filteredMembres(): Membre[] {
    if (!this.membreSearch.trim()) {
      return this.membres.filter(m => 
        !this.membresAnniversaireSelected.some(s => s.id === m.id)
      ).slice(0, 10);
    }
    const search = this.membreSearch.toLowerCase();
    return this.membres
      .filter(m => 
        !this.membresAnniversaireSelected.some(s => s.id === m.id) &&
        (`${m.nom} ${m.prenom}`.toLowerCase().includes(search))
      )
      .slice(0, 10);
  }

  addMembreAnniversaire(membre: Membre) {
    if (!this.membresAnniversaireSelected.some(m => m.id === membre.id)) {
      this.membresAnniversaireSelected.push(membre);
      this.newMatch.membresAnniversaire = this.membresAnniversaireSelected;
      this.membreSearch = '';
    }
  }

  removeMembreAnniversaire(membre: Membre) {
    this.membresAnniversaireSelected = this.membresAnniversaireSelected.filter(m => m.id !== membre.id);
    this.newMatch.membresAnniversaire = this.membresAnniversaireSelected;
  }

  updateEquipesForForfait() {
    const [team1, team2] = this.getEquipeNamesFromNewMatch();
    this.equipesForForfait = [team1, team2].filter(t => t && t.trim() !== '');
  }

  getEquipeNamesFromNewMatch(): [string, string] {
    const type = this.newMatch.typeMatch;
    
    switch (type) {
      case 'INTERNE':
      case 'DUEL':
        return [
          this.newMatch.equipe1?.nom || '',
          this.newMatch.equipe2?.nom || ''
        ];
      case 'AMICAL':
        const local = this.groupes?.abreviation || this.groupes?.nom || 'Locale';
        let adverse = '';
        if (this.newMatch.groupeAdverse) {
          adverse = this.newMatch.groupeAdverse.abreviation || this.newMatch.groupeAdverse.nom;
        } else if (this.newMatch.nomAdversaireManuel) {
          adverse = this.newMatch.nomAdversaireManuel;
        }
        return [local, adverse];
      case 'ANNIVERSAIRE':
        return ['Équipe Fêtés', 'Équipe Adverses'];
      default:
        return ['', ''];
    }
  }

  onForfaitChange() {
    if (this.newMatch.forfait) {
      this.updateEquipesForForfait();
    } else {
      this.newMatch.equipeForfait = '';
    }
  }

  onAdversaireManuelInput() {
    this.updateEquipesForForfait();
  }

  getMembreName(membre: number | Membre | null): string {
    if (membre === null) return '-';
    if (typeof membre === 'number') {
      const foundMembre = this.membres.find(m => m.id === membre);
      return foundMembre ? `${foundMembre.nom} ${foundMembre.prenom}` : '-';
    }
    return `${membre?.nom} ${membre?.prenom}`;
  }

  isDateValid(date: string | undefined): boolean {
    if (!date) return false;
    try {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    } catch {
      return false;
    }
  }

  isCreateFormValid(): boolean {
    if (!this.newMatch.typeMatch || !this.isDateValid(this.newMatch.dateMatch)) {
      return false;
    }

    const type = this.newMatch.typeMatch;

    switch (type) {
      case 'INTERNE':
      case 'DUEL':
        return !!this.newMatch.equipe1 && !!this.newMatch.equipe2 &&
               this.newMatch.equipe1.id !== this.newMatch.equipe2?.id;
      
      case 'AMICAL':
        if (this.selectedSourceAdversaire === 'GROUPE_EXISTANT') {
          return !!this.newMatch.groupeAdverse;
        }
        if (this.selectedSourceAdversaire === 'MANUEL') {
          return !!this.newMatch.nomAdversaireManuel?.trim();
        }
        return false;
      
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
      } else if (this.selectedSourceAdversaire === 'MANUEL') {
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
        this.loadData();
        this.toggleCreateRow();
      },
      error: (err) => {
        console.error('Erreur lors de la création:', err);
        this.showSnackbar('Erreur lors de la création du match', 'error');
        this.isLoading = false;
      }
    });
  }

  cancelCreate() {
    this.toggleCreateRow();
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

  // ===== EXPORT =====

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
      'Équipe Forfait': match.forfait ? match.equipeForfait : '-',
      'Commentaire': match.commentaire || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matchs');
    
    const fileName = `matchs_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    link.setAttribute('download', `matchs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ===== AUTRES =====

// Méthode corrigée pour ouvrir le calendrier
viewCalendar(): void {
  if (!this.dataSource?.data || this.dataSource.data.length === 0) {
    this.showSnackbar('Aucun match disponible', 'error');
    return;
  }

  // Trier les matchs par date (les plus récents d'abord ou par ordre chronologique)
  const sortedMatches = [...this.dataSource.data].sort((a, b) => {
    return new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime();
  });

  // Récupérer le jour de match depuis le groupe (avec fallback)
  const jourDeMatch = this.groupes?.jourMatch || 'Dimanche';

  // Ouvrir le dialog avec TOUTES les données nécessaires
  this.dialog.open(CalendarComponent, {
    width: '95vw',
    maxWidth: '900px',
    height: '85vh',
    maxHeight: '700px',
    panelClass: 'calendar-dialog',
    data: { 
      matches: sortedMatches,           // ✅ Tous les matchs (pas seulement ceux du jour de match)
      jourDeMatch: jourDeMatch,         // ✅ Le jour de match habituel (pour affichage)
      groupeActif: this.groupes         // ✅ Le groupe actif (pour les noms en match AMICAL)
    }
  });
}

  generateAndSaveMatches() {
    if (!this.groupes || !this.equipes || this.equipes.length < 2) {
      this.showSnackbar('Groupe ou équipes non disponibles pour générer les matchs', 'error');
      return;
    }

    const jourDeMatch = this.groupes.jourMatch || 'Sunday';
    const matchDates = this.generateMatchDates(jourDeMatch);
    const matchesToSave: any[] = [];

    matchDates.forEach(date => {
      const shuffled = [...this.equipes].sort(() => Math.random() - 0.5);
      const equipe1 = shuffled[0];
      const equipe2 = shuffled[1];

      matchesToSave.push({
        typeMatch: 'INTERNE',
        dateMatch: date.toISOString().split('T')[0],
        equipe1Id: equipe1.id,
        equipe2Id: equipe2.id,
        lieu: '',
        commentaire: ''
      });
    });

    this.isLoading = true;
    forkJoin(matchesToSave.map(match => this.matchService.createMatch(match))).subscribe({
      next: () => {
        this.showSnackbar(`${matchesToSave.length} matchs générés avec succès`, 'success');
        this.loadData();
      },
      error: (err) => {
        console.error('Erreur lors de la génération:', err);
        this.showSnackbar('Erreur lors de la génération des matchs', 'error');
        this.isLoading = false;
      }
    });
  }

  generateMatchDates(dayOfWeek: string): Date[] {
    const dates: Date[] = [];
    const now = new Date();
    const year = now.getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    let currentDate = new Date(startDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = days.indexOf(dayOfWeek);

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