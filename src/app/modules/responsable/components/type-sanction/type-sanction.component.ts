import { Component, OnInit, ViewChild } from '@angular/core';
import { SanctionService } from '../../../../core/services/sanction.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-type-sanction',
  imports: [CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule],
  templateUrl: './type-sanction.component.html',
  styleUrl: './type-sanction.component.scss'
})
export class TypeSanctionComponent implements OnInit{
   displayedColumns: string[] = ['id', 'nom', 'type', 'description', 'montantParDefaut', 'duree', 'createdDate', 'actions'];
  dataSource = new MatTableDataSource<any>();
  isLoading = true;
  showCreateRow = false;
  editingRows: boolean[] = [];
  newTypeSanction: any = { nom: '', type: '', description: '', montantParDefaut: null, duree: null };
  editTypeSanction: any = { id: null, nom: '', type: '', description: '', montantParDefaut: null, duree: null };
  dateFilter: Date | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private dashboardService: SanctionService) {}

  ngOnInit(): void {
    this.loadTypeSanctions();
  }

  loadTypeSanctions(): void {
    this.isLoading = true;
    this.dashboardService.getTypeSanctions().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.editingRows = new Array(data.length).fill(false);
        this.isLoading = false;
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des types de sanctions : ' + err.message;
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  filterByDate(date: Date | null): void {
    this.dateFilter = date;
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      this.dataSource.data = this.dataSource.data.filter((item: any) =>
        item.createdDate && item.createdDate.split('T')[0] === formattedDate
      );
    } else {
      this.loadTypeSanctions();
    }
  }

  toggleCreateRow(): void {
    this.showCreateRow = !this.showCreateRow;
    this.newTypeSanction = { nom: '', type: '', description: '', montantParDefaut: null, duree: null };
    this.errorMessage = null;
    this.successMessage = null;
  }

  saveTypeSanction(): void {
    if (!this.isCreateFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (Nom, Type, Montant par défaut, Durée pour Suspension).';
      return;
    }
    console.log(this.newTypeSanction)
    this.dashboardService.createTypeSanction(this.newTypeSanction).subscribe({
      next: () => {
        this.successMessage = 'Type de sanction créé avec succès.';
        this.showCreateRow = false;
        this.loadTypeSanctions();
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la création : ' + err.message;
        console.error(err);
      }
    });
  }

  cancelCreate(): void {
    this.showCreateRow = false;
    this.errorMessage = null;
    this.successMessage = null;
  }

  editRow(index: number, typeSanction: any): void {
    this.editingRows[index] = true;
    this.editTypeSanction = { ...typeSanction };
    this.errorMessage = null;
    this.successMessage = null;
  }

  saveEdit(index: number): void {
    if (!this.isEditFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (Nom, Type, Montant par défaut, Durée pour Suspension).';
      return;
    }
    this.dashboardService.updateTypeSanction(this.editTypeSanction.id, this.editTypeSanction).subscribe({
      next: () => {
        this.successMessage = 'Type de sanction mis à jour avec succès.';
        this.editingRows[index] = false;
        this.loadTypeSanctions();
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la mise à jour : ' + err.message;
        console.error(err);
      }
    });
  }

  cancelEdit(index: number): void {
    this.editingRows[index] = false;
    this.errorMessage = null;
    this.successMessage = null;
  }

  openDeleteDialog(typeSanction: any): void {
    if (confirm('Voulez-vous vraiment supprimer ce type de sanction ?')) {
      this.dashboardService.deleteTypeSanction(typeSanction.id).subscribe({
        next: () => {
          this.successMessage = 'Type de sanction supprimé avec succès.';
          this.loadTypeSanctions();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la suppression : ' + err.message;
          console.error(err);
        }
      });
    }
  }

  isCreateFormValid(): boolean {
    const isSuspension = this.newTypeSanction.type === 'SUSPENSION';
    return this.newTypeSanction.nom.trim() !== '' &&
           this.newTypeSanction.type.trim() !== '' &&
           (!isSuspension || (isSuspension && this.newTypeSanction.duree != null && this.newTypeSanction.duree > 0));
  }

  isEditFormValid(): boolean {
    const isSuspension = this.editTypeSanction.type === 'SUSPENSION';
    return this.editTypeSanction.nom.trim() !== '' &&
           this.editTypeSanction.type.trim() !== '' &&
           (!isSuspension || (isSuspension && this.editTypeSanction.duree != null && this.editTypeSanction.duree > 0));
  }

  onTypeChange(form: any): void {
    if (form.type !== 'SUSPENSION') {
      form.duree = null; // Réinitialiser la durée si le type n'est pas SUSPENSION
    }
  }

}
