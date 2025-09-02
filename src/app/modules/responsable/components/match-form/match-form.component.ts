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
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FormsModule,
    RouterModule,
  EquipeFilterPipe],
  templateUrl: './match-form.component.html',
  styleUrl: './match-form.component.scss'
})
export class MatchFormComponent implements OnInit, AfterViewInit {
@ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<Match>([]);
  displayedColumns: string[] = ['dateMatch', 'typeMatch', 'adversaire', 'actions'];
  showCreateRow: boolean = false;
  isLoading: boolean = true;
  newMatch: Match = {
    id: 0,
    groupe: {
      id: 0, nom: '',
      isActive: false,
      discipline: '',
      ville: 0,
      stade: 0,
      jourMatch: '',
      typeEquipe: '',
      modeEquipe: 'STATIQUE',
      fraisAdhesion: 0,
      ville1: {id: 0, nom: ''},
      stade2: {id: 0, nom: ''},
    },
    typeMatch: 'AMICAL',
    dateMatch: new Date().toISOString().split('T')[0],
    adversaire: '',
    lieu: '',
    commentaire: '',
    membreAnniversaire: '',
    mediaUrls: [] // Initialisation du champ mediaUrls
  };
  groupes: Groupe | null = null;
  membres: Membre[] = [];
  equipe: Equipe[] = [];
  editingMatch: Match | null = null;
  matchToPrint: Match | null = null;
  presencesToPrint: Presence[] = [];
  sanctionsToPrint: Sanction[] = [];
  typeSanctions: TypeSanction[] = [];

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
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'groupe': return item.groupe.nom;
        case 'dateMatch': return new Date(item.dateMatch).getTime();
        default: return (item as any)[property];
      }
    };
  }

  loadData() {
    this.isLoading = true;
    forkJoin([
      this.matchService.getAllMatch(),
      this.adminService.getAllGroupesMembre(),
      this.membreService.getMembres(),
      this.sanctionService.getTypeSanctions(),
      this.generalService.getEquipesByGroupe()
    ]).subscribe({
      next: ([matches, groupes, membres, typeSanctions, equipes]) => {
        this.dataSource.data = matches;
        this.groupes = groupes;
        this.membres = membres;
        this.equipe = equipes;
        this.typeSanctions = typeSanctions;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.isLoading = false;
      }
    });
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
      return 'Inconnu';
    }
    if (typeof membre === 'number') {
      const foundMembre = this.membres.find(m => m.id === membre);
      return foundMembre ? `${foundMembre.nom} ${foundMembre.prenom}` : 'Inconnu';
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
      const saveObservable = this.editingMatch
        ? this.matchService.updateMatch(this.editingMatch.id, this.newMatch)
        : this.matchService.createMatch(this.newMatch);
      saveObservable.subscribe({
        next: () => {
          this.loadData();
          this.toggleCreateRow();
          this.editingMatch = null;
        },
        error: (err) => {
          console.error('Erreur lors de l’enregistrement du match:', err);
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
          ville: 0,
          stade: 0,
          jourMatch: '',
          typeEquipe: '',
          modeEquipe: 'STATIQUE',
          fraisAdhesion: 0,
          ville1: {id: 0, nom: ''},
          stade2: {id: 0, nom: ''},
        },
        typeMatch: 'AMICAL',
        dateMatch: new Date().toISOString().split('T')[0],
        adversaire: '',
        lieu: '',
        commentaire: '',
        membreAnniversaire: '',
        mediaUrls: []
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
        console.error('Erreur lors du chargement des données d’impression:', err);
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

    // Crée une copie du tableau et la trie par date de match croissante
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

  generateCalendar() {
    const jourDeMatch = this.groupes?.jourMatch || 'Sunday';
    const calendar = this.generateMatchDates(jourDeMatch);
    console.log('Calendrier généré:', calendar);
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
        id: 0, // ID sera généré par le backend
        typeMatch: 'INTERNE', // Par défaut
        dateMatch: date.toISOString().split('T')[0], // Format YYYY-MM-DD
        adversaire: `${equipe1.nom} vs ${equipe2.nom}`,
        lieu: '', // À définir si nécessaire
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
        this.loadData(); // Recharge la liste des matchs
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
    return matchDate < today;
  }

  isMatchMissed(match: Match): boolean {
    const matchDate = new Date(match.dateMatch);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return matchDate < today && !this.isMatchPlayed(match);
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

  openMediaUploadDialog(match: Match) {
    const dialogRef = this.dialog.open(MediaUploadDialogComponent, {
      width: '400px',
      data: { matchId: match.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData(); // Recharge les données après un upload réussi
      }
    });
  }

}