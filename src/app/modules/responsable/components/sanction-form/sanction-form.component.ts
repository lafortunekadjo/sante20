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
import { forkJoin, map, Observable } from 'rxjs';
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
import { jsPDF } from 'jspdf';
import { applyPlugin, autoTable} from 'jspdf-autotable';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
applyPlugin(jsPDF)

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
    MatSnackBarModule,
    MatButtonToggleModule,
    MatChipsModule,
    TranslateModule,
    MatTooltipModule
  ],
   animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ],
  templateUrl: './sanction-form.component.html',
  styleUrls: ['./sanction-form.component.scss']
})
export class SanctionFormComponent implements OnInit, AfterViewInit {
  viewMode: 'card' | 'list' = 'card'; // Mode d'affichage par défaut
  displayedColumnsTable: string[] = [
    'membre',
    'typeSanction',
    'dateSanction',
    'match',
    'montant',
    'etat',
    'actions'
  ];
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
  searchTerm: string = '';
  statusFilter: string = 'ALL'; // 'ALL', 'PAYEE', 'NON_PAYEE'
  allSanctions: any[] = []; // Pour stocker toutes les sanctions
  typeFilter: string = 'ALL';

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
    // private matchService: MatchService,
    private presenceService: PresenceService,
    private membreService: MembreService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  get isEditing(): boolean {
    return this.editingRows.some(row => row);
  }
   /**
   * Gestion du changement de mode de vue
   */
 onViewModeChange(): void {
  console.log('View mode changed to:', this.viewMode);
  console.log('DataSource data:', this.dataSource.data);
  
  // Optionnel : forcer la détection des changements
  setTimeout(() => {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }, 100);
  
  localStorage.setItem('sanctionsViewMode', this.viewMode);
}
  
  // Dans ngOnInit, restaurer la préférence sauvegardée
  ngOnInit() {
    // Restaurer le mode de vue sauvegardé
    const savedViewMode = localStorage.getItem('sanctionsViewMode');
    if (savedViewMode === 'card' || savedViewMode === 'list') {
      this.viewMode = savedViewMode;
    }
    
    this.loadData();
  }



  ngAfterViewInit() {
  // Lier le paginator et le sort après l'initialisation de la vue
  this.dataSource.paginator = this.paginator;
  this.dataSource.sort = this.sort;
  
  this.dataSource.sortingDataAccessor = (item, property) => {
    switch (property) {
      case 'membre': return this.getMembreName(item.membre);
      case 'typeSanction': return this.getTypeSanctionName(item.typeSanction);
      case 'match': return this.getMatchName(item.match);
      case 'dateSanction': return new Date(item.dateSanction).getTime();
      case 'etat': return item.etat;
      case 'montant': return item.montant;
      default: return (item as any)[property];
    }
  };
}

  loadData() {
    this.isLoading = true;
    forkJoin([
      this.sanctionService.getSanctionsAll(),
      this.membreService.getGroupMembers(),
      this.sanctionService.getTypeSanctions()
    ]).subscribe({
      next: ([sanctions, membres, typeSanctions]) => {
        this.allSanctions = sanctions; // Stocker toutes les sanctions
        this.dataSource.data = sanctions;
        this.membres = membres;
        this.typeSanctions = typeSanctions;
        this.editingRows = new Array(sanctions.length).fill(false);
        this.updateMatchDates();
        console.log(this.matchDates)
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

  // Assurez-vous que votre dataSource est défini (ex: dataSource = new MatTableDataSource<any>();)
// et que this.allSanctions contient toutes les données.

filterMatchesByDate(date: Date | null) {
  console.log('Filtre par date:', date);

  if (!date) {
    // 1. Si aucune date n'est sélectionnée, réinitialiser la source de données à la liste complète
    this.dataSource.data = [...this.allSanctions];
    
    // Réinitialisation de vos champs
    this.newSanction.match = 0;
    this.newSanction.selectedDate = '';
    return;
  }

  const selectedDate = new Date(date);
  
  // 2. Formatage rigoureux de la date sélectionnée au format DD/MM/YYYY
  const day = selectedDate.getDate().toString().padStart(2, '0');
  const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0'); // +1 car getMonth() est basé sur 0
  const year = selectedDate.getFullYear();
  const formattedDate = `${year}-${month}-${day}`; // Ex: "2025-09-28"

  // 3. Filtrage : on itère sur la liste complète (this.allSanctions)
  const filteredSanctions = this.allSanctions.filter(sanction => {
    // On compare la date du match de la sanction avec la date formatée
    // On ajoute une vérification pour s'assurer que 'match' et 'dateMatch' existent
    return sanction && sanction.dateSanction === formattedDate;
  });

  // 4. Mettre à jour la source de données avec les résultats filtrés
  this.dataSource.data = filteredSanctions;

  // --- Logique post-filtrage (ajustée pour la sanction) ---
  if (filteredSanctions.length > 0) {
    this.newSanction.selectedDate = formattedDate;
    
    // Assurez-vous que l'accès à l'ID de match est correct sur l'objet sanction
    this.newSanction.match = filteredSanctions[0].match.id; 
    
    // La fonction onMatchChange devrait maintenant être appelée avec la nouvelle sanction
    this.onMatchChange(this.newSanction); 
  } else {
    this.newSanction.match = 0;
    this.newSanction.selectedDate = '';
    this.snackBar.open('Aucune sanction trouvée pour cette date de match', 'Fermer', { duration: 3000 });
  }
}

getTotalUnpaid(): Observable<{ totalCount: number, totalAmount: number }> {
  // Remplacez this.sanctionService.getAllSanctions() par votre source de données réelle
  return this.sanctionService.getSanctionsAll().pipe(
    // 1. Filtrer et calculer les totaux
    map((sanctions: Sanction[]) => {
      
      let totalCount = 0;
      let totalAmount = 0;

      // Filtrer les sanctions dont le statut est 'NON_PAYE'
      const unpaidSanctions = sanctions.filter(
        sanction => sanction.etat === 'NON_PAYEE'
      );

      // Calculer le montant total
      unpaidSanctions.forEach(sanction => {
        totalAmount += sanction.montant;
      });

      // Le nombre total est la taille du tableau filtré
      totalCount = unpaidSanctions.length;

      // 2. Retourner les totaux sous forme d'objet
      return {
        totalCount: totalCount,
        totalAmount: totalAmount
      };
    })
  );
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
    
      return `${new Date(match.dateMatch).toLocaleDateString('fr-FR')} - ${match.typeMatch} ${match.equipe1 ? 'vs ' + match.equipe2 : ''}`;
    }
    const matchId = typeof match === 'number' ? match : (match as Match)?.id;
    if (!matchId) {
     
      return 'N/A';
    }
    const found = this.matches.find(m => m.id === matchId);
    console.log('Match trouvé:', found, 'pour ID:', matchId, 'dans:', this.matches);
    return found ? `${new Date(found.dateMatch).toLocaleDateString('fr-FR')} - ${found.typeMatch} ${found.equipe1 ? 'vs ' + found.equipe2 : ''}` : 'Inconnu';
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
          sanction.equipeMatch = presence.membre?.equipe?.nom || 'Non défini';
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

  onMatchChange(sanction: any & { equipeMatch?: string; selectedDate?: string }) {
    if (sanction.match && sanction.membre) {
      
      this.presenceService.getPresenceByMatchAndMembre(sanction.match.id, sanction.membre.id).subscribe({
        next: (presence) => {
          sanction.equipeMatch = presence.membre?.equipe?.nom || 'Non défini';
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


  /**
   * Applique tous les filtres combinés
   */
  applyFilters(): void {
    let filtered = [...this.allSanctions];

    // Filtre par recherche de joueur
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        this.getMembreName(s.membre).toLowerCase().includes(search)
      );
    }

    // Filtre par statut
    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(s => s.etat === this.statusFilter);
    }

     if (this.typeFilter !== 'ALL') {
      filtered = filtered.filter(s => {
        const sanctionTypeId = typeof s.typeSanction === 'number' 
          ? s.typeSanction 
          : (s.typeSanction as TypeSanction)?.id;
        return sanctionTypeId?.toString() === this.typeFilter.toString();
      });
    }

    // Filtre par date (si dateFilter est actif, c'est géré séparément)
    // On garde la logique existante

    this.dataSource.data = filtered;
    
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  /**
   * Vérifie si des filtres sont actifs
   */
  hasActiveFilters(): boolean {
    return !!this.searchTerm || 
           this.statusFilter !== 'ALL' || 
             this.typeFilter !== 'ALL' ||
           !!this.dateFilter;
  }

  /**
   * Réinitialise tous les filtres
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'ALL';
     this.typeFilter = 'ALL';
    this.dateFilter = null;
    this.filteredMatchDates = [...this.matchDates];
    this.dataSource.data = [...this.allSanctions];
    
    if (this.paginator) {
      this.paginator.firstPage();
    }
    
    this.snackBar.open('Filtres réinitialisés', 'OK', { duration: 2000 });
  }

  /**
   * Compte total de sanctions
   */
  getTotalCount(): number {
    return this.dataSource.data.length;
  }

  /**
   * Export PDF des sanctions
   */
  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Titre
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('Liste des Sanctions', pageWidth / 2, 20, { align: 'center' });
    
    // Date d'export
    doc.setFontSize(10);
    doc.setTextColor(100);
    const today = new Date().toLocaleDateString('fr-FR');
    doc.text(`Généré le ${today}`, pageWidth / 2, 28, { align: 'center' });
    
    // Statistiques
    doc.setFontSize(12);
    doc.setTextColor(0);
    const stats = [
      `Total: ${this.getTotalCount()} sanctions`,
      `Payées: ${this.getPaidCount()}`,
      `Non payées: ${this.getUnpaidCount()}`,
      `Montant total: ${this.getTotalAmount().toLocaleString()} FCFA`
    ];
    doc.text(stats.join(' | '), pageWidth / 2, 36, { align: 'right' });
    
    // Préparation des données du tableau
    const tableData = this.dataSource.data.map(s => [
      this.getMembreName(s.membre),
      this.getTypeSanctionName(s.typeSanction),
      new Date(s.dateSanction).toLocaleDateString('fr-FR'),
      // this.getMatchName(s.match),
      `${s.montant} FCFA`,
      s.etat === 'PAYEE' ? 'Payée' : 'Non payée',
      s.commentaire || '-'
    ]);
    
    // Génération du tableau
    (doc as any).autoTable({
      startY: 45,
      head: [['Membre', 'Type', 'Match', 'Montant', 'Statut', 'Commentaire']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 , halign: 'right'},
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 35 }
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      didParseCell: function(data: any) {
        // Colorer les statuts
        if (data.column.index === 5 && data.cell.section === 'body') {
          if (data.cell.raw === 'Payée') {
            data.cell.styles.textColor = [76, 175, 80];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [255, 152, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    // Footer avec numéro de page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Téléchargement
    const filename = `sanctions_${today.replace(/\//g, '-')}.pdf`;
    doc.save(filename);
    
    this.snackBar.open('PDF exporté avec succès', 'OK', { duration: 3000 });
  }

  // Ajoutez ces méthodes dans votre composant SanctionFormComponent

/**
 * Récupère les initiales d'un membre
 */
getMemberInitials(membre: number | Membre | undefined): string {
  const name = this.getMembreName(membre);
  if (name === 'Inconnu') return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Compte les sanctions non payées
 */
getUnpaidCount(): number {
  return this.dataSource.data.filter(s => s.etat === 'NON_PAYEE').length;
}

/**
 * Compte les sanctions payées
 */
getPaidCount(): number {
  return this.dataSource.data.filter(s => s.etat === 'PAYEE').length;
}

/**
 * Calcule le montant total des sanctions
 */
getTotalAmount(): number {
  return this.dataSource.data.reduce((sum, s) => sum + (s.montant || 0), 0);
}

 /**
   * Compte le nombre de sanctions par type
   */
  getCountByType(typeId: number): number {
    return this.allSanctions.filter(s => {
      const sanctionTypeId = typeof s.typeSanction === 'number' 
        ? s.typeSanction 
        : (s.typeSanction as TypeSanction)?.id;
      return sanctionTypeId === typeId;
    }).length;
  }

getCountByStatus(status: string): number {
  return this.allSanctions.filter(s => {
    let sanctionStatus: string | number;

    // 1. Déterminer la valeur du statut de la sanction
    if (typeof s.etat === 'string') {
      // Cas 1: Si s.etat est déjà une chaîne de caractères (le statut lui-même)
      sanctionStatus = s.etat;
    } else if (s.etat && typeof s.etat === 'object' && 'id' in s.etat) {
      // Cas 2: Si s.etat est un objet et contient une propriété 'id' (ex: TypeSanction)
      sanctionStatus = s.etat.id; 
    } else {
      // Cas par défaut si la structure est inattendue
      return false;
    }

    // 2. Comparer la valeur extraite avec le statut recherché
    // Note: Assurez-vous que le type de 'status' (string) correspond au type de 'sanctionStatus' (string ou number).
    // Si 'id' est un nombre, vous devrez peut-être convertir 'status' en nombre.
    return sanctionStatus === status; 
  }).length;
}
  toggleView() {
    // Optional: Add logic here if needed, e.g., refresh data or apply filters on view change
    this.applyFilters(); // If filters need to be re-applied after view switch
    // Or save to localStorage for persistence: localStorage.setItem('sanctionViewMode', this.viewMode);
  }


  
}