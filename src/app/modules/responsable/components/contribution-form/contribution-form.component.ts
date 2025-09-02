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
import { switchMap , forkJoin, of} from 'rxjs';
import { Contribution, ContributionIndividuelle } from '../../../../core/models/contribution.model';
import { Membre } from '../../../../core/models/membre.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MembreService } from '../../../../core/services/membre.service';

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
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './contribution-form.component.html',
  styleUrl: './contribution-form.component.scss'
})
export class ContributionFormComponent implements OnInit, AfterViewInit{
 @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<ContributionIndividuelle>([]);
  displayedColumns: string[] = ['membre', 'montant', 'dateContribution', 'actions'];
  isLoading: boolean = true;
  showCreateRow: boolean = false;

  nouvelleContributionIndividuelle: ContributionIndividuelle = {
    idContribution: 0, // Sera défini en ngOnInit
    idMembre: 1, // Remplacez par l'ID du membre connecté
    montant: 0,
    dateContribution: new Date(),
  };
  membres: Membre[] = [];
  contributionCampagne: Contribution | undefined;
  contributions: Contribution | undefined;

  constructor(
    private contributionService: ContributionService,
    private membreService: MembreService,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'membre':
          return this.getMembreName(item.idMembre);
        case 'dateContribution':
          return new Date(item.dateContribution).getTime();
        default:
          return (item as any)[property];
      }
    };
  }

  loadData() {
    this.isLoading = true;
    const evenementIdParam = this.route.snapshot.paramMap.get('evenementId');

    if (!evenementIdParam) {
      console.error('ID d\'événement non trouvé dans l\'URL.');
      this.isLoading = false;
      return;
    }
    const evenementId = parseInt(evenementIdParam, 10);
    if (isNaN(evenementId)) {
      console.error('ID d\'événement non valide.');
      this.isLoading = false;
      return;
    }

    this.contributionService.getContributionByEvenementId(evenementId).pipe(
      switchMap((contribution) => {
        this.contributionCampagne = contribution;
        if (contribution) {
          this.contributions = contribution
          this.nouvelleContributionIndividuelle.idContribution =
            contribution.idContribution!;
          return forkJoin([
            this.contributionService.getContributionsIndividuellesByContributionId(
              contribution.idContribution!
            ),
            this.membreService.getGroupMembers(),
          ]);
        } else {
          return forkJoin([of([]), this.membreService.getGroupMembers()]);
        }
      })
    ).subscribe({
      next: ([contributions, membres]) => {
        this.dataSource.data = contributions;
        this.membres = membres;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.isLoading = false;
      },
    });
  }

  getMembreName(membreId: number): string {
    const found = this.membres.find((m) => m.id === membreId);
    return found ? `${found.nom} ${found.prenom}` : 'Inconnu';
  }

  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewContribution();
    }
  }

  isCreateFormValid(): boolean {
    return (
      !!this.nouvelleContributionIndividuelle.idMembre &&
      this.nouvelleContributionIndividuelle.montant > 0
    );
  }

  saveContributionIndividuelle() {
    if (this.isCreateFormValid()) {
      this.isLoading = true;
      this.contributionService.createIndividuelleContribution(this.nouvelleContributionIndividuelle).subscribe({
        next: () => {
          this.loadData();
          this.toggleCreateRow();
        },
        error: (err) => {
          console.error('Erreur lors de la création de la contribution:', err);
          this.isLoading = false;
        },
      });
    }
  }

  cancelCreate() {
    this.toggleCreateRow();
  }

  resetNewContribution() {
    this.nouvelleContributionIndividuelle = {
      idContribution: this.contributionCampagne?.idContribution!,
      idMembre: 1,
      montant: 0,
      dateContribution: new Date(),
    };
  }

  openDeleteDialog(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer cette contribution ?` },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.contributionService.deleteIndividuelleContribution(id).subscribe({
          next: () => this.loadData(),
          error: (err) =>
            console.error('Erreur lors de la suppression de la contribution:', err),
        });
      }
    });
  }


}
