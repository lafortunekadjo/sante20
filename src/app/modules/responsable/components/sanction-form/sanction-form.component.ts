import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Match } from '../../../../core/models/match.model';
import { Membre } from '../../../../core/models/membre.model';
import { Sanction } from '../../../../core/models/sanction.model';
import { Presence } from '../../../../core/models/presence.model';
import { MatchService } from '../../../../core/services/match.service';
import { SanctionService } from '../../../../core/services/sanction.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { MembreService } from '../../../../core/services/membre.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { TypeSanction } from '../../../../core/models/typeSanction.model';

@Component({
  selector: 'app-sanction-form',
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
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FormsModule,
    RouterModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  templateUrl: './sanction-form.component.html',
  styleUrls: ['./sanction-form.component.scss']
})
export class SanctionFormComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<Sanction>([]);
  displayedColumns: string[] = [
    'membre',
    'typeSanction',
    'match',
    'dateSanction',
    'montant',
    'commentaire',
    'etat',
    'actions'
  ];
  showCreateRow: boolean = false;
  isLoading: boolean = true;
  newSanction: Sanction & { equipeMatch?: string; selectedDate?: string } = {
    id: 0,
    membre: 0,
    typeSanction: 0,
    match: 0,
    dateSanction: new Date(),
    montant: 0,
    commentaire: '',
    etat: 'NON_PAYEE',
    totalPaiements: 0,
    equipeMatch: '',
    selectedDate: ''
  };
  membres: Membre[] = [];
  typeSanctions: TypeSanction[] = [];
  matches: Match[] = [];
  editingRows: boolean[] = [];
  editSanction: Sanction & { equipeMatch?: string; selectedDate?: string } = {} as Sanction & { equipeMatch?: string; selectedDate?: string };
  matchDates: { date: string; matches: Match[] }[] = [];
  filteredMatchDates: { date: string; matches: Match[] }[] = [];
  dateFilter: Date | null = null;

  get newSanctionMatches(): Match[] {
    if (!this.newSanction.selectedDate) return [];
    const matchGroup = this.filteredMatchDates.find(md => md.date === this.newSanction.selectedDate);
    return matchGroup ? matchGroup.matches : [];
  }

  get editSanctionMatches(): Match[] {
    if (!this.editSanction.selectedDate) return [];
    const matchGroup = this.filteredMatchDates.find(md => md.date === this.editSanction.selectedDate);
    return matchGroup ? matchGroup.matches : [];
  }

  constructor(
    private sanctionService: SanctionService,
    private matchService: MatchService,
    private presenceService: PresenceService,
    private membreService: MembreService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  get isEditing(): boolean {
    return this.editingRows.some(row => row);
  }

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'membre': return this.getMembreName(item.membre);
        case 'typeSanction': return this.getTypeSanctionName(item.typeSanction);
        case 'match': return this.getMatchName(item.match);
        case 'dateSanction': return new Date(item.dateSanction).getTime();
        case 'etat': return item.etat;
        default: return (item as any)[property];
      }
    };
  }

  loadData() {
    this.isLoading = true;
    forkJoin([
      this.sanctionService.getSanctionsAll(),
      this.membreService.getGroupMembers(),
      this.matchService.getAllMatch(),
      this.sanctionService.getTypeSanctions()
    ]).subscribe({
      next: ([sanctions, membres, matches, typeSanctions]) => {
        console.log('Sanctions chargées:', sanctions);
        console.log('Membres chargés:', membres);
        console.log('Matches chargés:', matches);
        console.log('TypeSanctions chargés:', typeSanctions);
        this.dataSource.data = sanctions;
        this.membres = membres;
        this.matches = matches;
        this.typeSanctions = typeSanctions;
        this.editingRows = new Array(sanctions.length).fill(false);
        this.updateMatchDates();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des données', 'Fermer', { duration: 3000 });
      }
    });
  }

  updateMatchDates() {
    const dateMap = new Map<string, Match[]>();
    this.matches.forEach(match => {
      const date = new Date(match.dateMatch).toLocaleDateString('fr-FR');
      if (!dateMap.has(date)) {
        dateMap.set(date, []);
      }
      dateMap.get(date)!.push(match);
    });
    this.matchDates = Array.from(dateMap.entries()).map(([date, matches]) => ({ date, matches }));
    this.matchDates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.filteredMatchDates = [...this.matchDates];
    console.log('MatchDates:', this.matchDates);
  }

  filterMatchesByDate(date: Date | null) {
    console.log('Filtre par date:', date);
    if (!date) {
      this.filteredMatchDates = [...this.matchDates];
      this.newSanction.match = 0;
      this.newSanction.selectedDate = '';
      return;
    }
    const formattedDate = new Date(date).toLocaleDateString('fr-FR');
    this.filteredMatchDates = this.matchDates.filter(md => md.date === formattedDate);
    if (this.filteredMatchDates.length > 0) {
      this.newSanction.selectedDate = formattedDate;
      this.newSanction.match = this.filteredMatchDates[0].matches[0].id;
      this.onMatchChange(this.newSanction);
    } else {
      this.newSanction.match = 0;
      this.newSanction.selectedDate = '';
      this.snackBar.open('Aucun match trouvé pour cette date', 'Fermer', { duration: 3000 });
    }
  }

  loadSanctions() {
    this.isLoading = true;
    this.sanctionService.getSanctionsAll().subscribe({
      next: (data) => {
        console.log('Sanctions rechargées:', data);
        this.dataSource.data = data;
        this.editingRows = new Array(data.length).fill(false);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des sanctions:', err);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des sanctions', 'Fermer', { duration: 3000 });
      }
    });
  }

  getMembreName(membre: number | Membre | undefined): string {
    if (!membre) {
      // console.log('Membre est undefined ou null');
      return 'Inconnu';
    }
    if (typeof membre === 'object' && membre !== null && 'nom' in membre && 'prenom' in membre) {
      // console.log('Membre est un objet:', membre);
      return `${membre.nom} ${membre.prenom}`;
    }
    const membreId = typeof membre === 'number' ? membre : (membre as Membre)?.id;
    if (!membreId) {
      // console.log('MembreId non défini:', membre);
      return 'Inconnu';
    }
    const found = this.membres.find(m => m.id === membreId);
    // console.log('Membre trouvé:', found, 'pour ID:', membreId, 'dans:', this.membres);
    return found ? `${found.nom} ${found.prenom}` : 'Inconnu';
  }

  getTypeSanctionName(type: number | TypeSanction | undefined): string {
    if (!type) {
      // console.log('TypeSanction est undefined ou null');
      return 'Inconnu';
    }
    if (typeof type === 'object' && type !== null && 'nom' in type) {
      // console.log('TypeSanction est un objet:', type);
      return type.nom;
    }
    const typeId = typeof type === 'number' ? type : (type as TypeSanction)?.id;
    if (!typeId) {
      // console.log('TypeSanctionId non défini:', type);
      return 'Inconnu';
    }
    const found = this.typeSanctions.find(t => t.id === typeId);
    // console.log('TypeSanction trouvé:', found, 'pour ID:', typeId, 'dans:', this.typeSanctions);
    return found ? found.nom : 'N/A';
  }

  getMatchName(match: number | Match | undefined): string {
    if (!match) {
     console.log(match)
      return 'N/A';
    }
    if (typeof match === 'object' && match !== null && 'dateMatch' in match && 'typeMatch' in match) {
    
      return `${new Date(match.dateMatch).toLocaleDateString('fr-FR')} - ${match.typeMatch} ${match.adversaire ? 'vs ' + match.adversaire : ''}`;
    }
    const matchId = typeof match === 'number' ? match : (match as Match)?.id;
    if (!matchId) {
     
      return 'N/A';
    }
    const found = this.matches.find(m => m.id === matchId);
    console.log('Match trouvé:', found, 'pour ID:', matchId, 'dans:', this.matches);
    return found ? `${new Date(found.dateMatch).toLocaleDateString('fr-FR')} - ${found.typeMatch} ${found.adversaire ? 'vs ' + found.adversaire : ''}` : 'Inconnu';
  }

  onTypeSanctionChange(sanction: Sanction & { equipeMatch?: string; selectedDate?: string }) {
    const typeSanction = this.typeSanctions.find(t => t.id === sanction.typeSanction);
    if (typeSanction && typeSanction.montantParDefaut !== undefined && typeSanction.montantParDefaut !== null) {
      sanction.montant = typeSanction.montantParDefaut;
    } else {
      this.snackBar.open('Aucun montant par défaut défini pour ce type de sanction', 'Fermer', { duration: 3000 });
    }
  }

  onMembreChange(sanction: Sanction & { equipeMatch?: string; selectedDate?: string }) {
    if (sanction.membre && sanction.match) {
      this.presenceService.getPresenceByMatchAndMembre(sanction.match, sanction.membre).subscribe({
        next: (presence) => {
          sanction.equipeMatch = presence.membre.equipe.nom || 'Non défini';
          console.log('Présence pour membre', sanction.membre, 'et match', sanction.match, ':', presence);
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de la présence:', err);
          sanction.equipeMatch = 'Non défini';
          this.snackBar.open('Aucune présence trouvée pour ce membre dans ce match', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      sanction.equipeMatch = 'Sélectionnez un match et un membre';
      this.snackBar.open('Veuillez sélectionner un match et un membre', 'Fermer', { duration: 3000 });
    }
  }

  onMatchDateChange(sanction: Sanction & { equipeMatch?: string; selectedDate?: string }, selectedDate: string) {
    sanction.selectedDate = selectedDate;
    const matchGroup = this.filteredMatchDates.find(md => md.date === selectedDate);
    if (matchGroup && matchGroup.matches.length > 0) {
      sanction.match = matchGroup.matches[0].id;
      this.onMatchChange(sanction);
    } else {
      sanction.match = 0;
      sanction.equipeMatch = '';
      this.snackBar.open('Aucun match trouvé pour cette date', 'Fermer', { duration: 3000 });
    }
  }

  onMatchChange(sanction: Sanction & { equipeMatch?: string; selectedDate?: string }) {
    if (sanction.match && sanction.membre) {
      this.presenceService.getPresenceByMatchAndMembre(sanction.match, sanction.membre).subscribe({
        next: (presence) => {
          sanction.equipeMatch = presence.membre.equipe.nom || 'Non défini';
          console.log('Présence pour membre', sanction.membre, 'et match', sanction.match, ':', presence);
          // Pré-remplir typeSanction si cartons présents
          if (presence.cartonsJaunes > 0 && this.typeSanctions.find(t => t.nom === 'JAUNE')) {
            sanction.typeSanction = this.typeSanctions.find(t => t.nom === 'JAUNE')!.id;
            this.onTypeSanctionChange(sanction);
          } else if (presence.cartonsRouges > 0 && this.typeSanctions.find(t => t.nom === 'ROUGE')) {
            sanction.typeSanction = this.typeSanctions.find(t => t.nom === 'ROUGE')!.id;
            this.onTypeSanctionChange(sanction);
          }
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de la présence:', err);
          sanction.equipeMatch = 'Non défini';
          this.snackBar.open('Aucune présence trouvée pour ce membre dans ce match', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      sanction.equipeMatch = 'Sélectionnez un membre';
    }
  }

  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewSanction();
    }
  }

  isDateValid(date: Date | string): boolean {
    if (!date) return false;
    try {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    } catch {
      return false;
    }
  }

  isCreateFormValid(): boolean {
    return (
      !!this.newSanction.membre &&
      !!this.newSanction.typeSanction &&
      this.isDateValid(this.newSanction.dateSanction) &&
      !!this.newSanction.etat
    );
  }

  saveSanction() {
    if (this.isCreateFormValid()) {
      this.isLoading = true;
      // Créer un objet temporaire pour le payload API
      const sanctionToSave: any = {
        membre: this.newSanction.membre,
        typeSanction: this.newSanction.typeSanction,
        match: this.newSanction.match,
        dateSanction: new Date(this.newSanction.dateSanction).toISOString().split('T')[0], // Convertir en yyyy-MM-dd
        montant: this.newSanction.montant,
        commentaire: this.newSanction.commentaire,
        etat: this.newSanction.etat
      };
      console.log('Payload envoyé pour saveSanction:', sanctionToSave);
      this.sanctionService.applySanction(sanctionToSave).subscribe({
        next: () => {
          this.loadSanctions();
          this.toggleCreateRow();
          this.snackBar.open('Sanction enregistrée avec succès', 'Fermer', { duration: 3000 });
        },
        error: (err) => {
          console.error('Erreur lors de la création de la sanction:', err);
          this.isLoading = false;
          this.snackBar.open('Erreur lors de l’enregistrement: ' + err.message, 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
    }
  }


  cancelCreate() {
    this.toggleCreateRow();
  }

  resetNewSanction() {
    this.newSanction = {
      id: 0,
      membre: 0,
      typeSanction: 0,
      match: 0,
      dateSanction: new Date(),
      montant: 0,
      commentaire: '',
      etat: 'NON_PAYEE',
      totalPaiements: 0,
      equipeMatch: '',
      selectedDate: ''
    };
    this.dateFilter = null;
    this.filteredMatchDates = [...this.matchDates];
  }

  editRow(index: number, sanction: Sanction) {
    this.editingRows[index] = true;
    this.editSanction = { 
      ...sanction, 
      dateSanction: new Date(sanction.dateSanction), 
      equipeMatch: '', 
      selectedDate: this.getMatchName(sanction.match).split(' - ')[0] 
    };
    this.onMatchChange(this.editSanction);
  }

  isEditFormValid(): boolean {
    return (
      !!this.editSanction.membre &&
      !!this.editSanction.typeSanction &&
      this.isDateValid(this.editSanction.dateSanction) &&
      !!this.editSanction.etat 
    );
  }

  saveEdit(index: number) {
    if (this.isEditFormValid()) {
      this.isLoading = true;
      const membreId = typeof this.editSanction.membre === 'number' ? this.editSanction.membre : (this.editSanction.membre as Membre)?.id;
      const typeSanctionId = typeof this.editSanction.typeSanction === 'number' ? this.editSanction.typeSanction : (this.editSanction.typeSanction as TypeSanction)?.id;
      const matchId = typeof this.editSanction.match === 'number' ? this.editSanction.match : (this.editSanction.match as Match)?.id;
      if (!membreId || !typeSanctionId) {
        console.error('Données non valides pour saveEdit:', { membreId, typeSanctionId, matchId, editSanction: this.editSanction });
        this.isLoading = false;
        this.snackBar.open('Données non valides pour la mise à jour', 'Fermer', { duration: 3000 });
        return;
      }
      const sanctionToSave: any = {
        id: this.editSanction.id,
        membre: membreId,
        typeSanction: typeSanctionId,
        match: matchId,
        dateSanction: new Date(this.editSanction.dateSanction).toISOString().split('T')[0],
        montant: this.editSanction.montant,
        commentaire: this.editSanction.commentaire,
        etat: this.editSanction.etat
      };
    
      this.sanctionService.updateSanction(sanctionToSave.id, sanctionToSave).subscribe({
        next: (response) => {
          console.log('Réponse de updateSanction:', response);
          this.loadSanctions();
          this.editingRows[index] = false;
          this.snackBar.open('Sanction mise à jour avec succès', 'Fermer', { duration: 3000 });
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour de la sanction:', err);
          console.error('Détails de l’erreur:', err.error, err.status, err.message);
          this.isLoading = false;
          this.snackBar.open('Erreur lors de la mise à jour: ' + (err.error?.message || err.message), 'Fermer', { duration: 3000 });
        }
      });
    } else {
      console.error('Formulaire edit non valide:', this.editSanction);
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
    }
  }
  cancelEdit(index: number) {
    this.editingRows[index] = false;
    this.editSanction = {} as Sanction & { equipeMatch?: string; selectedDate?: string };
  }

  openDeleteDialog(sanction: Sanction) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer la sanction pour ${this.getMembreName(sanction.membre)} ?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteSanction(sanction.id);
      }
    });
  }

    openPayDialog(sanction: Sanction) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous payer la sanction pour ${this.getMembreName(sanction.membre)} ?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.payerSanction(sanction.id);
      }
    });
  }


  deleteSanction(id: number) {
    this.isLoading = true;
    this.sanctionService.deleteSanction(id).subscribe({
      next: () => {
        this.loadSanctions();
        this.snackBar.open('Sanction supprimée avec succès', 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        console.error('Erreur lors de la suppression de la sanction:', err);
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
      }
    });
  }

  payerSanction(id: number) {
    this.isLoading = true;
    this.sanctionService.payerSanction(id).subscribe({
      next: () => {
        this.loadSanctions();
        this.snackBar.open('Sanction payée avec succès', 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        console.error('Erreur lors du paiement de la sanction:', err);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du paiement', 'Fermer', { duration: 3000 });
      }
    });
  }
}