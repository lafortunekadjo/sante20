import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContributionService } from '../../../../core/services/contribution.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BaseChartDirective } from 'ng2-charts';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { switchMap , forkJoin, of, Observable} from 'rxjs';
import { Contribution, ContributionIndividuelle } from '../../../../core/models/contribution.model';
import { Membre } from '../../../../core/models/membre.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MembreService } from '../../../../core/services/membre.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { GeneralService } from '../../../../core/services/general.service';
import { Evenement } from '../../../../core/models/evenement.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-contribution-form',
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
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './contribution-form.component.html',
  styleUrl: './contribution-form.component.scss'
})
export class ContributionFormComponent implements OnInit, AfterViewInit{
  [x: string]: any;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<ContributionIndividuelle>([]);
  displayedColumns: string[] = ['contribution', 'membre', 'montant', 'dateContribution', 'actions'];
  showCreateRow: boolean = false;
  newContribution: ContributionIndividuelle = {
    id: 0,
    idContribution: 0,
    idMembre: 0,
    montant: 0,
    dateContribution: new Date(),
  };
  editingRows: boolean[] = [];
  editContribution: any = {} as any;
  isLoading: boolean = true;
  contributions$: Contribution[] = [];
  membres: Membre[] = [];
   dateRangeForm!: FormGroup;
   allContributions: any[] = [];
     minAmount: number | null = null;
  maxAmount: number | null = null;
  selectedType: string = '';
  searchValue: string = '';

  constructor(
    private contributionIndividuelleService: ContributionService,
    private contributionService: ContributionService,
    private membreService: MembreService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadContributions();
    console.log(this.contributions$)
    this.loadMembres();
        this.dateRangeForm = this['fb'].group({
      start: [null],
      end: [null]
    });
    // Initialiser le filtre personnalisé
  this.dataSource.filterPredicate = this.customFilterPredicate();
  }

  ngAfterViewInit(): void {
     this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        default: return (item as any)[property];
      }
    };
  }

  loadData(): void {
    this.isLoading = true;
    this.contributionIndividuelleService.getAllContributionsIndividuelle().subscribe({
      next: (data) => {
          console.log(data)
        this.dataSource.data = data;
        this.allContributions = data
        this.editingRows = new Array(data.length).fill(false);
          // S'assurer que le paginator et le tri sont liés à la source de données
    // après que les données soient chargées.
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des contributions individuelles:', err);
        this.isLoading = false;
      },
    });
  }

  loadContributions(): void {
     this.contributionService.getAllContributions().subscribe({
      next: (data) => {
      
        this.contributions$ = data;
      },
      error: (err) => console.error('Erreur lors du chargement des contributions:', err),
    });
   
  }

  loadMembres(): void {
    this.membreService.getGroupMembers().subscribe({
      next: (data) => {
        this.membres = data;
      },
      error: (err) => console.error('Erreur lors du chargement des membres:', err),
    });
  }

  toggleCreateRow(): void {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewContribution();
    }
  }

  isCreateFormValid(): boolean {
    return !!this.newContribution.idContribution && !!this.newContribution.idMembre && !!this.newContribution.montant;
  }

  saveContribution(): void {
    if (this.isCreateFormValid()) {
      this.contributionIndividuelleService.createIndividuelleContribution(this.newContribution).subscribe({
        next: () => {
          // this.loadData();
          this.toggleCreateRow();
        },
        error: (err) => console.error('Erreur lors de la création de la contribution individuelle:', err),
      });
    }
  }

  cancelCreate(): void {
    this.toggleCreateRow();
  }

  resetNewContribution(): void {
    this.newContribution = {
      id: 0,
      idContribution: 0,
      idMembre: 0,
      montant: 0,
      dateContribution: new Date(),
    };
  }

  editRow(index: number, contribution: any): void {
    console.log(contribution)
    this.editingRows[index] = true;
    this.editContribution = { ...contribution };
    this.editContribution.idContribution = contribution.contribution.id
        console.log(this.editContribution)
  }

  isEditFormValid(): boolean {
    return !!this.editContribution.montant;
  }

  saveEdit(index: number): void {
    if (this.isEditFormValid()) {
       console.log(this.editContribution)
      this.contributionIndividuelleService.updateIndividuelleContribution(this.editContribution.id!, this.editContribution).subscribe({
        next: () => {
          this.loadData();
          this.editingRows[index] = false;
        },
        error: (err) => console.error('Erreur lors de la mise à jour de la contribution individuelle:', err),
      });
    }
  }

  cancelEdit(index: number): void {
    this.editingRows[index] = false;
    this.editContribution = {} as ContributionIndividuelle;
  }

  openDeleteDialog(contribution: ContributionIndividuelle): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer la contribution individuelle de ${contribution.idMembre} ?` },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteContribution(contribution.id!);
      }
    });
  }

  deleteContribution(id: number): void {
    this.contributionIndividuelleService.deleteContributionIndividuelle(id).subscribe({
      next: () => this.loadData(),
      error: (err) => console.error('Erreur lors de la suppression de la contribution individuelle:', err),
    });
  }

  // // Logique de filtrage
  // applyDateFilter(): void {
  //   const { start, end } = this.dateRangeForm.value;

  //   if (start && end) {
  //     const filteredData = this.allContributions.filter(item => {
  //       const itemDate = new Date(item.dateContribution);
  //       const endDateInclusive = new Date(end);
  //       endDateInclusive.setDate(endDateInclusive.getDate() + 1);

  //       return itemDate >= start && itemDate < endDateInclusive;
  //     });
  //     this.dataSource.data = filteredData;
  //     if (this.paginator) {
  //       this.paginator.firstPage();
  //     }
  //   } else {
  //     this.dataSource.data = this.allContributions;
  //   }
  // }

  customFilterPredicate() {
  return (data: any, filter: string): boolean => {
    if (!filter) return true;
    
    const filters = JSON.parse(filter);
    
    // Filtre de recherche par nom/prénom
    const searchMatch = !filters.search || 
      (data.membre?.nom || '').toLowerCase().includes(filters.search) ||
      (data.membre?.prenom || '').toLowerCase().includes(filters.search);
    
    // Filtre par type de contribution
    const typeMatch = !filters.type || 
      (filters.type === '' || data.contribution?.id?.toString() === filters.type?.toString());
    
    // Filtre par montant
    const montantMatch = 
      (filters.minAmount === null || filters.minAmount === '' || data.montant >= Number(filters.minAmount)) &&
      (filters.maxAmount === null || filters.maxAmount === '' || data.montant <= Number(filters.maxAmount));
    
    // Filtre par date
    let dateMatch = true;
    if (filters.startDate || filters.endDate) {
      const itemDate = new Date(data.dateContribution);
      itemDate.setHours(0, 0, 0, 0); // Normaliser la date
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        dateMatch = dateMatch && itemDate >= startDate;
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
        dateMatch = dateMatch && itemDate <= endDate;
      }
    }

    return searchMatch && typeMatch && montantMatch && dateMatch;
  };
}

  resetDateFilter(): void {
    this.dateRangeForm.reset();
    this.dataSource.data = this.allContributions;
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  //  // Fonction de filtrage personnalisée
  // customFilterPredicate() {
  //   return (data: any, filter: string): boolean => {
  //     const filters = JSON.parse(filter);
      
  //     const searchMatch = !filters.search || (
  //       (data.membre?.nom || '').toLowerCase().includes(filters.search) ||
  //       (data.membre?.prenom || '').toLowerCase().includes(filters.search)
  //     );
      
  //     const typeMatch = !filters.type || (data.contribution?.id === filters.type);
      
  //     const montantMatch = 
  //       (filters.minAmount === null || data.montant >= filters.minAmount) &&
  //       (filters.maxAmount === null || data.montant <= filters.maxAmount);
        
  //     const dateMatch =
  //       (!filters.startDate || data.dateContribution >= new Date(filters.startDate)) &&
  //       (!filters.endDate || data.dateContribution < new Date(filters.endDate));

  //     return searchMatch && typeMatch && montantMatch && dateMatch;
  //   };
  // }

// Remplace la fonction applyFilter par celle-ci :
applyFilter(): void {
  const startDate = this.dateRangeForm.get('start')?.value;
  const endDate = this.dateRangeForm.get('end')?.value;
  
  const filters = {
    search: this.searchValue?.trim().toLowerCase() || '',
    type: this.selectedType || '',
    minAmount: this.minAmount,
    maxAmount: this.maxAmount,
    startDate: startDate,
    endDate: endDate
  };
  
  this.dataSource.filter = JSON.stringify(filters);

  if (this.paginator) {
    this.paginator.firstPage();
  }
}

// Modifie la fonction applyTypeFilter :
applyTypeFilter(value: string): void {
  this.selectedType = value;
  this.applyFilter();
}

// Modifie la fonction applyAmountFilter :
applyAmountFilter(): void {
  // Attendre un peu pour éviter trop d'appels pendant la saisie
  setTimeout(() => {
    this.applyFilter();
  }, 300);
}

// Modifie la fonction resetAllFilters :
resetAllFilters(): void {
  this.searchValue = '';
  this.selectedType = '';
  this.minAmount = null;
  this.maxAmount = null;
  this.dateRangeForm.reset();
  
  // Réinitialiser le filtre
  this.dataSource.filter = '';
  
  if (this.paginator) {
    this.paginator.firstPage();
  }
}

// Ajoute cette fonction pour réinitialiser tous les filtres depuis le template :
clearAllFilters(): void {
  this.resetAllFilters();
}
  
  applySearchFilter(event: Event): void {
    this.searchValue = (event.target as HTMLInputElement).value;
    this.applyFilter();
  }



  applyDateFilter(): void {
    this.applyFilter();
  }

}
