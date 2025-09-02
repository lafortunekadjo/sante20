import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaiementSanctionService } from '../../../../core/services/paiement-sanction.service';
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
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { GeneralService } from '../../../../core/services/general.service';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Membre } from '../../../../core/models/membre.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-paiement-sanction-form',
  standalone: true,
    imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './paiement-sanction-form.component.html',
  styleUrl: './paiement-sanction-form.component.scss'
})
export class PaiementSanctionFormComponent implements OnInit, AfterViewInit {
 @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Equipe>([]);
  displayedColumns: string[] = ['id', 'nom', 'actions'];
  
  isLoading: boolean = true;
  showCreateRow: boolean = false;
  newEquipe: Equipe = { id: 0, nom: '' };
  
  editingRows: boolean[] = [];
  editEquipe: Equipe = { id: 0, nom: '' };

  constructor(private equipeService: GeneralService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadEquipes();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadEquipes() {
    this.isLoading = true;
    this.equipeService.getEquipesByGroupe().subscribe({
      next: (equipes: Equipe[]) => {
        this.dataSource.data = equipes;
        this.editingRows = new Array(equipes.length).fill(false);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des équipes:', err);
        this.isLoading = false;
      }
    });
  }

  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewEquipe();
    }
  }

  isCreateFormValid(): boolean {
    return !!this.newEquipe.nom;
  }

  saveEquipe() {
    if (this.isCreateFormValid()) {
      this.equipeService.createEquipe(this.newEquipe).subscribe({
        next: () => {
          this.loadEquipes();
          this.toggleCreateRow();
        },
        error: (err) => console.error('Erreur lors de la création de l\'équipe:', err)
      });
    }
  }

  cancelCreate() {
    this.toggleCreateRow();
  }

  resetNewEquipe() {
    this.newEquipe = { id: 0, nom: '' };
  }

  editRow(index: number, equipe: Equipe) {
    this.editingRows = this.editingRows.map((val, i) => i === index);
    this.editEquipe = { ...equipe }; // Crée une copie pour l'édition
  }

  isEditFormValid(): boolean {
    return !!this.editEquipe.nom;
  }

  saveEdit(index: number) {
    if (this.isEditFormValid()) {
      this.equipeService.updateEquipe(this.editEquipe.id, this.editEquipe).subscribe({
        next: () => {
          this.loadEquipes();
          this.editingRows[index] = false;
        },
        error: (err: any) => console.error('Erreur lors de la mise à jour de l\'équipe:', err)
      });
    }
  }

  cancelEdit(index: number) {
    this.editingRows[index] = false;
    this.editEquipe = { id: 0, nom: '' };
  }

  openDeleteDialog(equipe: Equipe) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer l'équipe "${equipe.nom}" ?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.desactivateEquipe(equipe.id);
      }
    });
  }

  desactivateEquipe(id: number) {
    this.equipeService.desactivateEquipe(id).subscribe({
      next: () => this.loadEquipes(),
      error: (err) => console.error('Erreur lors de la suppression de l\'équipe:', err)
    });
  }
}

