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
  ],
  templateUrl: './contribution-form.component.html',
  styleUrl: './contribution-form.component.scss'
})
export class ContributionFormComponent implements OnInit, AfterViewInit{
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
  editContribution: ContributionIndividuelle = {} as ContributionIndividuelle;
  isLoading: boolean = true;
  contributions$: Contribution[] = [];
  membres: any[] = [];

  constructor(
    private contributionIndividuelleService: ContributionService,
    private contributionService: ContributionService,
    private membreService: MembreService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadContributions();
    console.log(this.contributions$)
    this.loadMembres();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
        this.editingRows = new Array(data.length).fill(false);
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
          this.loadData();
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

  editRow(index: number, contribution: ContributionIndividuelle): void {
    this.editingRows[index] = true;
    this.editContribution = { ...contribution };
  }

  isEditFormValid(): boolean {
    return !!this.editContribution.idContribution && !!this.editContribution.idMembre && !!this.editContribution.montant;
  }

  saveEdit(index: number): void {
    if (this.isEditFormValid()) {
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
}
