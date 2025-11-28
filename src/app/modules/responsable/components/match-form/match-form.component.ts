import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Groupe } from '../../../../core/models/groupe.model';
import { Match } from '../../../../core/models/match.model';
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
import { Equipe } from '../../../../core/models/groupe.model copy';
import { GeneralService } from '../../../../core/services/general.service';
import { MediaUploadDialogComponent } from '../media-upload-dialog/media-upload-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import * as XLSX from 'xlsx';

interface MatchFilters {
  typeMatch: string;
  dateDebut: Date | null;
  dateFin: Date | null;
  searchText: string;
  statut: string; // 'tous', 'joues', 'manques', 'futurs'
}

@Component({
  selector: 'app-match-form',
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
  
  newMatch: Match = {
    id: 0,
    groupe: {
      id: 0, nom: '',
      isActive: false,
      discipline: '',
      ville1: 0,
      stade2: 0,
      jourMatch: '',
      typeEquipe: '',
      modeEquipe: 'STATIQUE',
      fraisAdhesion: 0,
      ville: { id: 0, nom: '' },
      stade: {
        id: 0, nom: '',
        stadiumLat: 0,
        stadiumLon: 0,
        radius: 0
      },
      profilePhotoUrl: '',
      heureMatch: '',
      isPublic: false,
      abreviation: ''
    },
    typeMatch: 'AMICAL',
    dateMatch: new Date().toISOString().split('T')[0],
    adversaire: '',
    lieu: '',
    commentaire: '',
    membreAnniversaire: '',
    mediaUrls: [],
    forfait: false,
    equipeForfait: '',
    arbitrePrincipal: null,
    arbitrePrincipalNomOccasionnel: null,
    arbitreAssistant: null,
    arbitreAssistantNomOccasionnel: null,
    rapporteur: null,
    rapporteurNomOccasionnel: null

  };
  
  groupes: Groupe | null = null;
  membres: Membre[] = [];
  equipe: Equipe[] = [];
  editingMatch: Match | null = null;
  matchToPrint: Match | null = null;
  presencesToPrint: Presence[] = [];
  sanctionsToPrint: Sanction[] = [];
  typeSanctions: TypeSanction[] = [];
  equipes: string[] = [];

  constructor(
    private matchService: MatchService,
    private membreService: MembreService,
    private adminService: GroupeService,
    private sanctionService: SanctionService,
    private presenceService: PresenceService,
    private generalService: GeneralService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    this.filteredDataSource.paginator = this.paginator;
    this.filteredDataSource.sort = this.sort;
    this.filteredDataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'groupe': return item.groupe.nom;
        case 'dateMatch': return new Date(item.dateMatch).getTime();
        case 'statut': return this.getMatchStatus(item);
        default: return (item as any)[property];
      }
    };
  }

  loadData() {
    this.isLoading = true;
    forkJoin([
      this.matchService.getAllMatch(),
      this.adminService.getAllGroupesMembre(),
      this.membreService.getGroupMembers(),
      this.sanctionService.getTypeSanctions(),
      this.generalService.getEquipesByGroupe()
    ]).subscribe({
      next: ([matches, groupes, membres, typeSanctions, equipes]) => {
        this.dataSource.data = matches;
        this.groupes = groupes;
        this.membres = membres;
        this.equipe = equipes;
        this.typeSanctions = typeSanctions;
        this.sortMatches();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.isLoading = false;
      }
    });
  }

  sortMatches() {
    const today = new Date();
    const thisSunday = new Date(today);
    thisSunday.setDate(today.getDate() - today.getDay() + 7 - 7);

    const sortedMatches = [...this.dataSource.data].sort((a, b) => {
      const dateA = new Date(a.dateMatch);
      const dateB = new Date(b.dateMatch);
      const isPastA = dateA < thisSunday;
      const isPastB = dateB < thisSunday;

      if (isPastA && isPastB) {
        return dateA.getTime() - dateB.getTime();
      }
      if (!isPastA && !isPastB) {
        return dateA.getTime() - dateB.getTime();
      }
      return isPastA ? 1 : -1;
    });

    this.dataSource.data = sortedMatches;
  }

  // Gestion des filtres
  applyFilters() {
    let filtered = [...this.dataSource.data];

    // Filtre par type
    if (this.filters.typeMatch !== 'tous') {
      filtered = filtered.filter(m => m.typeMatch === this.filters.typeMatch);
    }

    // Filtre par statut
    if (this.filters.statut !== 'tous') {
      filtered = filtered.filter(m => {
        const status = this.getMatchStatus(m);
        return status === this.filters.statut;
      });
    }

    // Filtre par date de début
    if (this.filters.dateDebut) {
      filtered = filtered.filter(m => 
        new Date(m.dateMatch) >= this.filters.dateDebut!
      );
    }

    // Filtre par date de fin
    if (this.filters.dateFin) {
      filtered = filtered.filter(m => 
        new Date(m.dateMatch) <= this.filters.dateFin!
      );
    }

    // Filtre par recherche textuelle
    if (this.filters.searchText.trim()) {
      const search = this.filters.searchText.toLowerCase();
      filtered = filtered.filter(m => 
        m.adversaire?.toLowerCase().includes(search) ||
        m.commentaire?.toLowerCase().includes(search) ||
        m.lieu?.toLowerCase().includes(search)
      );
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

  // Export Excel
  exportToExcel() {
    const dataToExport = this.filteredDataSource.data.map(match => ({
      'Date': new Date(match.dateMatch).toLocaleDateString('fr-FR'),
      'Type': match.typeMatch,
      'Adversaire': match.adversaire || '-',
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

  // Export CSV
  exportToCSV() {
    const dataToExport = this.filteredDataSource.data.map(match => ({
      'Date': new Date(match.dateMatch).toLocaleDateString('fr-FR'),
      'Type': match.typeMatch,
      'Adversaire': match.adversaire || '-',
      'Lieu': match.lieu || '-',
      'Statut': this.getMatchStatusLabel(match),
      'Arbitre Principal': match.arbitrePrincipalNomOccasionnel || this.getMembreName(match.arbitrePrincipal ?? null),
      'Rapporteur': match.rapporteurNomOccasionnel || this.getMembreName(match.rapporteur ?? null),
      'Forfait': match.forfait ? 'Oui' : 'Non',
      'Équipe Forfait': match.forfait ? match.equipeForfait : '-',
      'Commentaire': match.commentaire || '-'
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

  // Vérification si le match peut être modifié (présences/médias)
  canAccessMatchData(match: Match): boolean {
    const matchDate = new Date(match.dateMatch);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    matchDate.setHours(0, 0, 0, 0);
    return matchDate <= today;
    
  }

  navigateToPresences(match: Match) {
    if (!this.canAccessMatchData(match)) {
      alert('Les présences ne sont accessibles que pour les matchs passés ou du jour.');
      return;
    }
    this.router.navigate(['/responsable/presences', match.id]);
  }

openMediaDialog(match: Match) {
  if (!this.canAccessMatchData(match)) {
    alert('Les médias ne peuvent être ajoutés que pour les matchs passés ou du jour.');
    return;
  }

  const dialogRef = this.dialog.open(MediaUploadDialogComponent, {
    width: '90vw',
    maxWidth: '900px',
    data: { 
      matchId: match.id,
      existingMediaUrls: match.mediaUrls || []  // Passer directement les URLs
    },
    panelClass: 'media-dialog-container'
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.loadData();
    }
  });
}

  getMatchStatus(match: Match): string {
    if (this.isMatchPlayed(match)) return 'joues';
    if (this.isMatchMissed(match)) return 'manques';
    return 'futurs';
  }

  getMatchStatusLabel(match: Match): string {
    if (this.isMatchPlayed(match)) return 'Joué';
    if (this.isMatchMissed(match)) return 'Manqué';
    return 'À venir';
  }

  onTypeChange() {
    if (this.newMatch.typeMatch === 'INTERNE') {
      const equipe1 = this.equipe[Math.floor(Math.random() * this.equipe.length)];
      let equipe2 = this.equipe[Math.floor(Math.random() * this.equipe.length)];
      while (equipe1.id === equipe2.id) {
        equipe2 = this.equipe[Math.floor(Math.random() * this.equipe.length)];
      }
      this.newMatch.adversaire = `${equipe1.nom} vs ${equipe2.nom}`;
    } else if (this.newMatch.typeMatch === 'DUEL') {
      this.newMatch.adversaire = this.newMatch.commentaire;
    } else if (this.newMatch.typeMatch === 'ANNIVERSAIRE') {
      const equipe1 = this.equipe[Math.floor(Math.random() * this.equipe.length)];
      let equipe2 = this.equipe[Math.floor(Math.random() * this.equipe.length)];
      while (equipe1.id === equipe2.id) {
        equipe2 = this.equipe[Math.floor(Math.random() * this.equipe.length)];
      }
      this.newMatch.adversaire = `${equipe1.nom} vs ${equipe2.nom}`;
    }
  }

  getMembreName(membre: number | Membre | null): string {
    if (membre === null) {
      return '-';
    }
    if (typeof membre === 'number') {
      const foundMembre = this.membres.find(m => m.id === membre);
      return foundMembre ? `${foundMembre.nom} ${foundMembre.prenom}` : '-';
    } else {
      return `${membre?.nom} ${membre?.prenom}`;
    }
  }

  getTypeSanctionName(typeSanctionId: number): string {
    const typeSanction = this.typeSanctions.find(t => t.id === typeSanctionId);
    return typeSanction ? typeSanction.nom : 'Inconnu';
  }

  isDateValid(date: string): boolean {
    if (!date) return false;
    try {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    } catch {
      return false;
    }
  }

  isCreateFormValid(): boolean {
    let isValid = !!this.newMatch.typeMatch && this.isDateValid(this.newMatch.dateMatch);

    if (this.newMatch.typeMatch === 'AMICAL') {
      isValid = isValid && !!this.newMatch.adversaire;
    } else if (this.newMatch.typeMatch === 'DUEL') {
      isValid = isValid && !!this.newMatch.commentaire;
    } else if (this.newMatch.typeMatch === 'ANNIVERSAIRE') {
      isValid = isValid && !!this.newMatch.membreAnniversaire;
    }
    return isValid;
  }

  saveMatch() {
    if (this.isCreateFormValid()) {
      this.isLoading = true;
      const payload: any = {
        ...this.newMatch,
        arbitrePrincipalId: this.newMatch.arbitrePrincipal?.id || null,
        arbitrePrincipalNom: this.newMatch.arbitrePrincipalNomOccasionnel || null,
        arbitreAssistantId: this.newMatch.arbitreAssistant?.id || null,
        arbitreAssistantNom: this.newMatch.arbitreAssistantNomOccasionnel || null,
        rapporteurId: this.newMatch.rapporteur?.id || null,
        rapporteurNom: this.newMatch.rapporteurNomOccasionnel || null,
        scoreAdversaire: this.newMatch.scoreAdversaire || null
      };
      
      const saveObservable = this.editingMatch
        ? this.matchService.updateMatch(this.editingMatch.id, payload)
        : this.matchService.createMatch(payload);
        
      saveObservable.subscribe({
        next: () => {
          this.loadData();
          this.toggleCreateRow();
          this.editingMatch = null;
        },
        error: (err) => {
          console.error('Erreur lors de l\'enregistrement du match:', err);
          this.isLoading = false;
        }
      });
    }
  }

  cancelCreate() {
    this.toggleCreateRow();
    this.editingMatch = null;
  }

  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.newMatch = {
        id: 0,
        groupe: {
          id: 0, nom: '',
          isActive: false,
          discipline: '',
          ville1: 0,
          stade2: 0,
          jourMatch: '',
          typeEquipe: '',
          modeEquipe: 'STATIQUE',
          fraisAdhesion: 0,
          ville: { id: 0, nom: '' },
          stade: {
            id: 0, nom: '',
            stadiumLat: 0,
            stadiumLon: 0,
            radius: 0
          },
          profilePhotoUrl: '',
          heureMatch: '',
          isPublic: false,
          abreviation: ''
        },
        typeMatch: 'AMICAL',
        dateMatch: new Date().toISOString().split('T')[0],
        adversaire: '',
        lieu: '',
        commentaire: '',
        membreAnniversaire: '',
        mediaUrls: [],
        forfait: false,
        equipeForfait:'',
        arbitrePrincipal: null,
        arbitrePrincipalNomOccasionnel: null,
        arbitreAssistant: null,
        arbitreAssistantNomOccasionnel: null,
        rapporteur: null,
        rapporteurNomOccasionnel: null
      };
    }
  }

  editMatch(match: Match) {
    this.editingMatch = { ...match };
    this.newMatch = { ...match };
    this.showCreateRow = true;
  }

  printFeuilleMatch(match: Match) {
    this.isLoading = true;
    forkJoin([
      this.presenceService.getPresences(match.id),
      this.sanctionService.getSanctionsByMatch(match.id)
    ]).subscribe({
      next: ([presences, sanctions]) => {
        this.matchToPrint = match;
        this.presencesToPrint = presences;
        this.sanctionsToPrint = sanctions;
        setTimeout(() => window.print(), 0);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données d\'impression:', err);
        this.isLoading = false;
      }
    });
  }

  openDeleteDialog(match: Match) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer le match du ${match.dateMatch} contre ${match.adversaire} ?` }
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
      next: () => this.loadData(),
      error: (err) => {
        console.error('Erreur lors de la suppression du match:', err);
        this.isLoading = false;
      }
    });
  }

  viewCalendar() {
    if (!this.groupes || !this.dataSource.data) {
      console.error('Groupe ou données de match non disponibles.');
      return;
    }

    const sortedMatches = [...this.dataSource.data].sort((a, b) => {
      return new Date(a.dateMatch).getTime() - new Date(b.dateMatch).getTime();
    });

    const jourDeMatch = this.groupes.jourMatch || 'Sunday';
    const dialogRef = this.dialog.open(CalendarComponent, {
      width: '500px',
      data: { matches: sortedMatches, jourDeMatch }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Calendrier fermé avec résultat:', result);
      }
    });
  }

  generateAndSaveMatches() {
    if (!this.groupes || !this.equipe || this.equipe.length < 2) {
      console.error('Groupe ou équipes non disponibles pour générer les matchs.');
      return;
    }

    const jourDeMatch = this.groupes.jourMatch || 'Sunday';
    const matchDates = this.generateMatchDates(jourDeMatch);
    const matchesToSave: Match[] = [];

    matchDates.forEach(date => {
      const equipe1 = this.equipe[Math.floor(Math.random() * this.equipe.length)];
      let equipe2 = this.equipe[Math.floor(Math.random() * this.equipe.length)];
      while (equipe1.id === equipe2.id) {
        equipe2 = this.equipe[Math.floor(Math.random() * this.equipe.length)];
      }

      const newMatch: any = {
        id: 0,
        typeMatch: 'INTERNE',
        dateMatch: date.toISOString().split('T')[0],
        adversaire: `${equipe1.nom} vs ${equipe2.nom}`,
        lieu: '',
        commentaire: '',
        membreAnniversaire: '',
        mediaUrls: []
      };
      matchesToSave.push(newMatch);
    });

    this.isLoading = true;
    forkJoin(matchesToSave.map(match => this.matchService.createMatch(match))).subscribe({
      next: () => {
        console.log('Matchs générés et enregistrés avec succès.');
        this.loadData();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de l\'enregistrement des matchs:', err);
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

  isMatchPlayed(match: Match): boolean {
    const matchDate = new Date(match.dateMatch);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasRapporteur =
      !!match.rapporteur ||
      !!(match.rapporteurNomOccasionnel && match.rapporteurNomOccasionnel.trim() !== '');

    return matchDate < today && hasRapporteur;
  }

  isMatchMissed(match: Match): boolean {
    const matchDate = new Date(match.dateMatch);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasRapporteur =
      !!match.rapporteur ||
      (match.rapporteurNomOccasionnel && match.rapporteurNomOccasionnel.trim() !== '');

    return matchDate < today && !hasRapporteur;
  }

  isMatchFuture(match: Match): boolean {
    const matchDate = new Date(match.dateMatch);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return matchDate >= today;
  }

  getEquipeNames(adversaire: string | undefined | null): [string, string] {
    if (adversaire && adversaire.includes(' vs ')) {
      return adversaire.split(' vs ') as [string, string];
    }
    return ['', ''];
  }

  onForfaitChange() {
    if (this.newMatch.forfait && this.newMatch.adversaire) {
      this.equipes = this.getEquipeNames(this.newMatch.adversaire);
    } else {
      this.newMatch.equipeForfait = "";
      this.equipes = [];
    }
  }

  onAdversaireInput() {
    if (this.newMatch.forfait && this.newMatch.adversaire) {
      this.equipes = this.getEquipeNames(this.newMatch.adversaire);
    } else {
      this.equipes = [];
    }
  }

  getMatchStatusClass(match: Match): string {
    if (this.isMatchPlayed(match)) {
      return 'status-played';
    } else if (this.isMatchMissed(match)) {
      return 'status-missed';
    } else {
      return 'status-future';
    }
  }

  getMatchStatusIcon(match: Match): string {
    if (this.isMatchPlayed(match)) {
      return 'check_circle';
    } else if (this.isMatchMissed(match)) {
      return 'cancel';
    } else {
      return 'schedule';
    }
  }

  getMatchInfo(match: Match): string {
    switch (match.typeMatch) {
      case 'ANNIVERSAIRE':
        return `Anniversaire de ${match.membreAnniversaire}`;
      case 'DUEL':
        return match.commentaire || 'Duel';
      case 'AMICAL':
      case 'INTERNE':
        return match.adversaire || 'Match interne';
      default:
        return match.adversaire || '';
    }
  }
}
