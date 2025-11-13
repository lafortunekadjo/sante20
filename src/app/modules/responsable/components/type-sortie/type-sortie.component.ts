import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { forkJoin, switchMap, of } from 'rxjs';
import { Groupe } from '../../../../core/models/groupe.model';
import { GroupeService } from '../../../../core/services/groupe.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SortieDeCaisse } from '../../../../core/models/sortieDeCaisse';
import { TypeDepense } from '../../../../core/models/typeDepense';
import { GeneralService } from '../../../../core/services/general.service';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/models/user';
import { MembreService } from '../../../../core/services/membre.service';
import { Membre } from '../../../../core/models/membre.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-type-sortie',
  imports: [ CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    CurrencyPipe,
    TranslateModule,
    DatePipe],
  templateUrl: './type-sortie.component.html',
  styleUrl: './type-sortie.component.scss'
})
export class TypeSortieComponent implements OnInit, AfterViewInit{
   @ViewChild('sortiesPaginator') sortiesPaginator!: MatPaginator;
  @ViewChild('sortiesSort') sortiesSort!: MatSort;
  @ViewChild('typesPaginator') typesPaginator!: MatPaginator;
  @ViewChild('typesSort') typesSort!: MatSort;
  
  // Data Sources and columns for SortieDeCaisse
  sortiesDataSource = new MatTableDataSource<SortieDeCaisse>([]);
  sortiesDisplayedColumns: string[] = ['description', 'montant', 'typeDepense', 'utilisateur', 'dateSortie', 'actions'];

  // Data Sources and columns for TypeDepense
  typesDataSource = new MatTableDataSource<TypeDepense>([]);
  typesDisplayedColumns: string[] = ['nom', 'isGenerique', 'groupe', 'actions'];
  
  showCreateSortieRow: boolean = false;
  showCreateTypeRow: boolean = false;
  
  isLoadingSorties: boolean = true;
  isLoadingTypes: boolean = true;
  
  // Models for creation
  newSortie: SortieDeCaisse = {
    id: null,
    description: '',
    montant: 0,
    dateSortie: new Date(),
    utilisateur: {} as Membre,
    typeDepense: {} as TypeDepense
  };

  newType: TypeDepense = {
    id: null,
    nom: '',
    isGenerique: true,
    groupe: null
  };

  // Data for selects
  typesDepenses: TypeDepense[] = [];
  utilisateurs: Membre[] = [];
  groupes: Groupe[] = [];
  
  // Editing state
  editingSortieRows: boolean[] = [];
  editSortie: SortieDeCaisse = {} as SortieDeCaisse;
  editingTypeRows: boolean[] = [];
  editType: TypeDepense = {} as TypeDepense;

  constructor(
    private sortieDeCaisseService: GeneralService,
    private typeDepenseService: GeneralService,
    private groupeService: GroupeService,
    private utilisateurService: MembreService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    this.sortiesDataSource.paginator = this.sortiesPaginator;
    this.sortiesDataSource.sort = this.sortiesSort;
    this.typesDataSource.paginator = this.typesPaginator;
    this.typesDataSource.sort = this.typesSort;
  }

  loadAllData(): void {
    this.isLoadingSorties = true;
    this.isLoadingTypes = true;
    
    // Load all necessary data in parallel
    forkJoin({
      sorties: this.sortieDeCaisseService.getAllSortiesDeCaisse(),
      types: this.typeDepenseService.getAllTypesDepenses(),
      groupes: this.groupeService.getAllGroupes(),
      utilisateurs: this.utilisateurService.getGroupMembers()
    }).pipe(
      switchMap(({ sorties, types, groupes, utilisateurs }) => {
        this.utilisateurs = utilisateurs;
        this.groupes = groupes;
        this.typesDepenses = types;

        // Map data to improve display
        const typeMap = new Map(types.map(t => [t.id, t]));
        const utilisateurMap = new Map(utilisateurs.map(u => [u.id, u]));

        const sortiesWithDetails = sorties.map(s => ({
          ...s,
          typeDepense: typeMap.get(s.typeDepense?.id) as TypeDepense,
          utilisateur: utilisateurMap.get(s.utilisateur?.id) as Membre
        }));

        this.sortiesDataSource.data = sortiesWithDetails;
        this.typesDataSource.data = types;
        
        this.editingSortieRows = new Array(sortiesWithDetails.length).fill(false);
        this.editingTypeRows = new Array(types.length).fill(false);
        
        this.isLoadingSorties = false;
        this.isLoadingTypes = false;
        
        return of(null);
      })
    ).subscribe({
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.isLoadingSorties = false;
        this.isLoadingTypes = false;
      }
    });
  }

  // --- Logic for SortieDeCaisse ---
  toggleCreateSortieRow(): void {
    this.showCreateSortieRow = !this.showCreateSortieRow;
    this.resetNewSortie();
  }

  isCreateSortieFormValid(): boolean {
    return !!this.newSortie.description && !!this.newSortie.montant && !!this.newSortie.typeDepense?.id && !!this.newSortie.utilisateur?.id;
  }

  saveNewSortie(): void {
    if (this.isCreateSortieFormValid()) {
      this.sortieDeCaisseService.createSortieDeCaisse(this.newSortie).subscribe({
        next: () => {
          this.loadAllData();
          this.toggleCreateSortieRow();
        },
        error: (err) => console.error('Erreur lors de la création de la sortie:', err)
      });
    }
  }
  
  cancelCreateSortie(): void {
    this.toggleCreateSortieRow();
  }
  
  resetNewSortie(): void {
    this.newSortie = {
      id: null,
      description: '',
      montant: 0,
      dateSortie: new Date(),
      utilisateur: {} as Membre,
      typeDepense: {} as TypeDepense
    };
  }
  
  editSortieRow(index: number, sortie: SortieDeCaisse): void {
    this.editingSortieRows[index] = true;
    this.editSortie = { ...sortie };
  }
  
  isEditSortieFormValid(): boolean {
    return !!this.editSortie.description && !!this.editSortie.montant && !!this.editSortie.typeDepense?.id && !!this.editSortie.utilisateur?.id;
  }
  
  saveEditSortie(index: number): void {
    if (this.isEditSortieFormValid()) {
      this.sortieDeCaisseService.updateSortieDeCaisse(this.editSortie.id!, this.editSortie).subscribe({
        next: () => {
          this.loadAllData();
          this.editingSortieRows[index] = false;
        },
        error: (err) => console.error('Erreur lors de la mise à jour de la sortie:', err)
      });
    }
  }
  
  cancelEditSortie(index: number): void {
    this.editingSortieRows[index] = false;
    this.editSortie = {} as SortieDeCaisse;
  }
  
  openDeleteSortieDialog(sortie: SortieDeCaisse): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer la sortie "${sortie.description}" ?` },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteSortie(sortie.id!);
      }
    });
  }

  deleteSortie(id: number): void {
    this.sortieDeCaisseService.deleteSortieDeCaisse(id).subscribe({
      next: () => this.loadAllData(),
      error: (err) => console.error('Erreur lors de la suppression de la sortie:', err),
    });
  }

  // --- Logic for TypeDepense ---
  toggleCreateTypeRow(): void {
    this.showCreateTypeRow = !this.showCreateTypeRow;
    this.resetNewType();
  }

  isCreateTypeFormValid(): boolean {
    return !!this.newType.nom && (!this.newType.isGenerique ? !!this.newType.groupe?.id : true);
  }

  saveNewType(): void {
    if (this.isCreateTypeFormValid()) {
      this.typeDepenseService.createTypeDepense(this.newType).subscribe({
        next: () => {
          this.loadAllData();
          this.toggleCreateTypeRow();
        },
        error: (err) => console.error('Erreur lors de la création du type:', err)
      });
    }
  }

  cancelCreateType(): void {
    this.toggleCreateTypeRow();
  }

  resetNewType(): void {
    this.newType = {
      id: null,
      nom: '',
      isGenerique: true,
      groupe: null
    };
  }

  editTypeRow(index: number, type: TypeDepense): void {
    this.editingTypeRows[index] = true;
    this.editType = { ...type };
  }

  isEditTypeFormValid(): boolean {
    return !!this.editType.nom && (!this.editType.isGenerique ? !!this.editType.groupe?.id : true);
  }

  saveEditType(index: number): void {
    if (this.isEditTypeFormValid()) {
      this.typeDepenseService.updateTypeDepense(this.editType.id!, this.editType).subscribe({
        next: () => {
          this.loadAllData();
          this.editingTypeRows[index] = false;
        },
        error: (err) => console.error('Erreur lors de la mise à jour du type:', err)
      });
    }
  }

  cancelEditType(index: number): void {
    this.editingTypeRows[index] = false;
    this.editType = {} as TypeDepense;
  }

  openDeleteTypeDialog(type: TypeDepense): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer le type de dépense "${type.nom}" ?` },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteType(type.id!);
      }
    });
  }

  deleteType(id: number): void {
    this.typeDepenseService.deleteTypeDepense(id).subscribe({
      next: () => this.loadAllData(),
      error: (err) => console.error('Erreur lors de la suppression du type:', err),
    });
  }

  // In your component class (e.g., TypeSortieComponent)

getTypeDepenseName(typeDepense: any): string {
  if (!typeDepense) return 'N/A';
  if (typeof typeDepense === 'object' && typeDepense.nom) {
    return typeDepense.nom;
  }
  // If typeDepense is an ID, lookup from typesDepenses array
  const type = this.typesDepenses.find(t => t.id === typeDepense);
  return type ? type.nom : 'N/A';
}

}
