import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContributionService } from '../../../../core/services/contribution.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { forkJoin, of, switchMap } from 'rxjs';
import { Contribution, ContributionIndividuelle } from '../../../../core/models/contribution.model';
import { Evenement } from '../../../../core/models/evenement.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { GeneralService } from '../../../../core/services/general.service';
import { ContributionDialogComponent } from '../contribution-dialog/contribution-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-contribution',
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
    CurrencyPipe,
    DatePipe,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: './contribution.component.html',
  styleUrl: './contribution.component.scss'
})
export class ContributionComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Le type du dataSource est maintenant `Contribution[]` car le modèle est mis à jour
  dataSource = new MatTableDataSource<Contribution>([]);
  // La colonne groupe est supprimée car gérée au backend
  displayedColumns: string[] = ['commentaire', 'idEvenement', 'delaiContribution', 'montantMin', 'montantCible', 'montantCollecteActuel', 'active', 'adhesion', 'actions'];
  
  showCreateRow: boolean = false;
  
  newContribution: Contribution = {
    evenement: {} as Evenement, // Initialisation avec un Evenement vide
    commentaire: '',
    description: '',
    delaiContribution: new Date(),
    montantMin: 0,
    montantCible: 0,
    groupe: 0,
    montantCollecteActuel: 0,
    open: true,
    isAdhesion: false,
  };
  
  editingRows: boolean[] = [];
  editContribution: Contribution = {} as Contribution;
  
  isLoading: boolean = true;
  evenements: Evenement[] = [];

  constructor(
    private contributionService: ContributionService,
    private evenementService: GeneralService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }
get activeContributionsCount(): number {
  return (this.dataSource.data || []).filter(c => c.open).length;
}
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadAllData(): void {
  this.isLoading = true;

  forkJoin({
    contributions: this.contributionService.getAllContributions(),
    evenements: this.evenementService.getAllEvenements(),
  }).pipe(
    switchMap(({ contributions, evenements }) => {
      const evenementMap = new Map(evenements.map(e => [e.id, e]));
      const contributionsWithDetails: Contribution[] = contributions.map(c => {
        let evenementAssocie: Evenement | null = null;

        if (c.evenement && c.evenement.id) {
          evenementAssocie = evenementMap.get(c.evenement.id) || null;
        }

        return {
          ...c,
          idEvenement: evenementAssocie // null si pas d'événement lié
        };
      });

      this.dataSource.data = contributionsWithDetails;
      this.evenements = evenements;
      this.editingRows = new Array(contributionsWithDetails.length).fill(false);
      this.isLoading = false;

      return of(null);
    })
  ).subscribe({
    error: (err) => {
      console.error('Erreur lors du chargement des données:', err);
      this.isLoading = false;
    }
  });
}

  toggleCreateRow(): void {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewContribution();
    }
  }

  isCreateFormValid(): boolean {
    return !!this.newContribution.description;
  }

  saveContribution(): void {
    if (this.isCreateFormValid()) {
      this.contributionService.addContribution(this.newContribution).subscribe({
        next: () => {
          this.loadAllData();
          this.toggleCreateRow();
        },
        error: (err) => console.error('Erreur lors de la création de la contribution:', err),
      });
    }
  }

  cancelCreate(): void {
    this.toggleCreateRow();
  }

  resetNewContribution(): void {
    this.newContribution = {
      evenement: {} as Evenement,
      commentaire: '',
      description: '',
      delaiContribution: new Date(),
      montantMin: 0,
      montantCible: 0,
      groupe: 0,
      montantCollecteActuel: 0,
      open: false,
      isAdhesion:false
    };
  }

  editRow(index: number, contribution: Contribution): void {
    this.editingRows[index] = true;
    this.editContribution = { ...contribution };
  }

  isEditFormValid(): boolean {
    return true;
  }

  saveEdit(index: number): void {
    if (this.isEditFormValid()) {
      this.contributionService.updateContribution1(this.editContribution.id!, this.editContribution).subscribe({
        next: () => {
          this.loadAllData();
          this.editingRows[index] = false;
        },
        error: (err) => console.error('Erreur lors de la mise à jour de la contribution:', err),
      });
    }
  }

  cancelEdit(index: number): void {
    this.editingRows[index] = false;
    this.editContribution = {} as Contribution;
  }

  openDeleteDialog(contribution: Contribution): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer la contribution "${contribution.commentaire}" ?` },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteContribution(contribution.id!);
      }
    });
  }

  deleteContribution(id: number): void {
    this.contributionService.deleteContribution(id).subscribe({
      next: () => this.loadAllData(),
      error: (err) => console.error('Erreur lors de la suppression de la contribution:', err),
    });
  
}
viewContributions(contributionId: number) {
  this.evenementService.getContributionIndividuellesByContributionId(contributionId).subscribe({
    next: (contributions: any[]) => {
      const groupedMap = new Map<number, {
        montant: number,
        membre: {
          id: number,
          nom: string,
          prenom: string,
          tel?: string,
          adresse?: string,
          email?: string,
          poste?: string
        }
      }>();

      for (const c of contributions) {
        const membre = c.membre;
        if (!membre?.id) continue;

        const montant = c.montant ?? 0;

        if (!groupedMap.has(membre.id)) {
          groupedMap.set(membre.id, {
            montant,
            membre: {
              id: membre.id,
              nom: membre.nom?.trim() ?? '',
              prenom: membre.prenom?.trim() ?? '',
              tel: membre.tel,
              adresse: membre.adresse,
              email: membre.email,
              poste: membre.poste
            }
          });
        } else {
          const existing = groupedMap.get(membre.id)!;
          existing.montant += montant;
        }
      }

      const formattedContributions = Array.from(groupedMap.values());
      const total = formattedContributions.reduce((sum, c) => sum + c.montant, 0);

      this.dialog.open(ContributionDialogComponent, {
        width: '600px',
        data: {
          contributions: formattedContributions,
          total
        }
      });
    },

    error: (err) => {
      console.error('Erreur lors du chargement des contributions:', err);
      this.dialog.open(ContributionDialogComponent, {
        width: '600px',
        data: {
          contributions: [],
          total: 0
        }
      });
    }
  });
}


}
