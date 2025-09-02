import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { Evenement } from '../../../../core/models/evenement.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GeneralService } from '../../../../core/services/general.service';
import { Membre } from '../../../../core/models/membre.model';
import { MembreService } from '../../../../core/services/membre.service';
import { MatSelectModule } from '@angular/material/select';
import { Contribution } from '../../../../core/models/contribution.model'; // Ajouté
import { ContributionDialogComponent } from '../contribution-dialog/contribution-dialog.component';

@Component({
  selector: 'app-evenement',
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
    RouterModule
  ],
  templateUrl: './evenement.component.html',
  styleUrl: './evenement.component.scss'
})
export class EvenementComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<Evenement>([]);
  displayedColumns: string[] = ['nomEvenement', 'typeEvenement', 'dateCreation', 'estContributionOuverte', 'actions'];
  isLoading: boolean = true;
  showCreateRow: boolean = false;

  newEvenement: Evenement = {
    idGroupe: 1, // Remplacez par l'ID de groupe réel
    nomEvenement: '',
    description: '',
    typeEvenement: 'Autre',
    dateCreation: new Date(),
    estContributionOuverte: false,
    idMembreLie: 0,
  };

  membres: Membre[] = [];

  constructor(
    private evenementService: GeneralService,
    private membreService: MembreService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadEvenements();
    this.loadMembres();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadEvenements() {
    this.isLoading = true;
    this.evenementService.getAllEvenements().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des événements:', err);
        this.isLoading = false;
      },
    });
  }

  loadMembres() {
    this.membreService.getGroupMembers().subscribe({
      next: (membres) => {
        this.membres = membres;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des membres:', err);
      }
    });
  }

  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewEvenement();
    }
  }

  resetNewEvenement() {
    this.newEvenement = {
      idGroupe: 1,
      nomEvenement: '',
      description: '',
      typeEvenement: 'Autre',
      dateCreation: new Date(),
      estContributionOuverte: false,
      idMembreLie: 0,
    };
  }

  isCreateFormValid(): boolean {
    return !!this.newEvenement.nomEvenement && !!this.newEvenement.description;
  }

  saveEvenement() {
    if (this.isCreateFormValid()) {
      this.isLoading = true;
      this.evenementService.createEvenement(this.newEvenement).subscribe({
        next: () => {
          this.loadEvenements();
          this.toggleCreateRow();
        },
        error: (err) => {
          console.error('Erreur lors de la création de l\'événement:', err);
          this.isLoading = false;
        },
      });
    }
  }

  openDeleteDialog(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer cet événement ?` },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.evenementService.deleteEvenement(id).subscribe({
          next: () => this.loadEvenements(),
          error: (err) =>
            console.error('Erreur lors de la suppression de l\'événement:', err),
        });
      }
    });
  }

  viewContributions(evenementId: number) {
    this.evenementService.getContributionsByEvenement(evenementId).subscribe({
      next: (contributions: Contribution[]) => {
        const total = contributions.reduce((sum, c) => sum + 0, 0);
        this.dialog.open(ContributionDialogComponent, {
          width: '400px',
          data: { contributions, total }
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des contributions:', err);
        this.dialog.open(ContributionDialogComponent, {
          width: '400px',
          data: { contributions: [], total: 0 }
        });
      }
    });
  }

  cancelCreate() {
    this.toggleCreateRow();
  }
}