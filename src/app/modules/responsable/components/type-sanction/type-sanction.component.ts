import { Component, OnInit, ViewChild } from '@angular/core';
import { SanctionService } from '../../../../core/services/sanction.service';
import { FinancesService, Caisse } from '../../../../core/services/finances.service';
import { AuthService } from '../../../../core/services/auth.service';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { TypeSanction } from '../../../../core/models/sanction.model';

// // Interface TypeSanction étendue
// export interface TypeSanction {
//   id?: number;
//   nom: string;
//   description?: string;
//   montantParDefaut: number;
//   duree?: number;
//   type: 'AMENDE' | 'SUSPENSION' | 'DISCIPLINE';
//   groupe?: any;
//   // Nouveaux champs pour liaison financière
//   caisseId?: number;
//   caisse?: Caisse;
//   typeContributionId?: number;
//   genererMouvementAuto: boolean;
//   icone: string;
//   couleur: string;
//   actif: boolean;
//   createdDate?: string;
// }

// Icônes disponibles
const ICONS_DISPONIBLES = [
  { value: 'gavel', label: 'Sanction' },
  { value: 'schedule', label: 'Retard' },
  { value: 'event_busy', label: 'Absence' },
  { value: 'warning', label: 'Avertissement' },
  { value: 'style', label: 'Carton' },
  { value: 'sports_soccer', label: 'Match' },
  { value: 'block', label: 'Suspension' },
  { value: 'money_off', label: 'Amende' },
  { value: 'report_problem', label: 'Indiscipline' },
  { value: 'rule', label: 'Règlement' }
];

// Couleurs disponibles
const COULEURS_DISPONIBLES = [
  { value: '#ef4444', label: 'Rouge' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#eab308', label: 'Jaune' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#10b981', label: 'Vert' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#3b82f6', label: 'Bleu' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Rose' },
  { value: '#6b7280', label: 'Gris' }
];

@Component({
  selector: 'app-type-sanction',
  standalone: true,
  imports: [
    CommonModule,
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
    MatSlideToggleModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    TranslateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './type-sanction.component.html',
  styleUrl: './type-sanction.component.scss'
})
export class TypeSanctionComponent implements OnInit {
  displayedColumns: string[] = ['icone', 'nom', 'type', 'montantParDefaut', 'duree', 'caisse', 'validation', 'statut', 'actions'];
  dataSource = new MatTableDataSource<TypeSanction>();
  isLoading = true;
  showCreateRow = false;
  editingRows: boolean[] = [];
  
  // Données de référence
  caisses: Caisse[] = [];
  icones = ICONS_DISPONIBLES;
  couleurs = COULEURS_DISPONIBLES;
  
  // Nouveau type de sanction
  newTypeSanction: TypeSanction = this.getEmptyTypeSanction();
  editTypeSanction: TypeSanction = this.getEmptyTypeSanction();
  
  // Filtres
  dateFilter: Date | null = null;
  searchTerm = '';
  filterActif: 'all' | 'actif' | 'inactif' = 'all';
  
  // Messages
  errorMessage: string | null = null;
  successMessage: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private sanctionService: SanctionService,
    private financesService: FinancesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  getEmptyTypeSanction(): TypeSanction {
    return {
      id: 0,
      nom: '',
      type: 'AMENDE',
      description: '',
      montantParDefaut: 0,
      duree: undefined,
      caisseId: undefined,
      genererMouvementAuto: true,
      icone: 'gavel',
      couleur: '#ef4444',
      actif: true
    };
  }

  loadData(): void {
    this.isLoading = true;
    const groupeId = this.authService.getGroupe();

    forkJoin({
      typeSanctions: this.sanctionService.getTypeSanctions(),
      caisses: groupeId ? this.financesService.getCaissesByGroupe(groupeId) : []
    }).subscribe({
      next: ({ typeSanctions, caisses }) => {
        this.dataSource.data = typeSanctions;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.editingRows = new Array(typeSanctions.length).fill(false);
        this.caisses = caisses;
        this.isLoading = false;
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des données : ' + err.message;
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.dataSource.data];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.nom.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search)
      );
    }

    // Filtre par statut
    if (this.filterActif === 'actif') {
      filtered = filtered.filter(t => t.actif);
    } else if (this.filterActif === 'inactif') {
      filtered = filtered.filter(t => !t.actif);
    }

    this.dataSource.data = filtered;
  }

  filterByDate(date: Date | null): void {
    this.dateFilter = date;
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      this.dataSource.data = this.dataSource.data.filter((item: any) =>
        item.createdDate && item.createdDate.split('T')[0] === formattedDate
      );
    } else {
      this.loadData();
    }
  }

  toggleCreateRow(): void {
    this.showCreateRow = !this.showCreateRow;
    this.newTypeSanction = this.getEmptyTypeSanction();
    this.errorMessage = null;
    this.successMessage = null;
  }

  saveTypeSanction(): void {
    if (!this.isCreateFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    // Préparer les données
    const data = {
      ...this.newTypeSanction,
      caisse: this.newTypeSanction.caisseId ? { id: this.newTypeSanction.caisseId } : null
    };

    this.sanctionService.createTypeSanction(data).subscribe({
      next: () => {
        this.successMessage = 'Type de sanction créé avec succès.';
        this.showCreateRow = false;
        this.loadData();
        this.clearMessagesAfterDelay();
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

  editRow(index: number, typeSanction: TypeSanction): void {
    this.editingRows[index] = true;
    this.editTypeSanction = { 
      ...typeSanction,
      caisseId: typeSanction.caisse?.id
    };
    this.errorMessage = null;
    this.successMessage = null;
  }

  saveEdit(index: number): void {
    if (!this.isEditFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    const data = {
      ...this.editTypeSanction,
      caisse: this.editTypeSanction.caisseId ? { id: this.editTypeSanction.caisseId } : null
    };

    this.sanctionService.updateTypeSanction(this.editTypeSanction.id!, data).subscribe({
      next: () => {
        this.successMessage = 'Type de sanction mis à jour avec succès.';
        this.editingRows[index] = false;
        this.loadData();
        this.clearMessagesAfterDelay();
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

  toggleActif(typeSanction: TypeSanction): void {
    const newStatus = !typeSanction.actif;
    this.sanctionService.updateTypeSanction(typeSanction.id!, { actif: newStatus }).subscribe({
      next: () => {
        this.successMessage = `Type de sanction ${newStatus ? 'activé' : 'désactivé'}`;
        this.loadData();
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la modification : ' + err.message;
      }
    });
  }

  openDeleteDialog(typeSanction: TypeSanction): void {
    if (confirm('Voulez-vous vraiment supprimer ce type de sanction ?')) {
      this.sanctionService.deleteTypeSanction(typeSanction.id!).subscribe({
        next: () => {
          this.successMessage = 'Type de sanction supprimé avec succès.';
          this.loadData();
          this.clearMessagesAfterDelay();
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
           this.newTypeSanction.type !== undefined &&
           this.newTypeSanction.montantParDefaut >= 0 &&
           (!isSuspension || (isSuspension && this.newTypeSanction.duree != null && this.newTypeSanction.duree > 0));
  }

  isEditFormValid(): boolean {
    const isSuspension = this.editTypeSanction.type === 'SUSPENSION';
    return this.editTypeSanction.nom.trim() !== '' &&
           this.editTypeSanction.type !== undefined &&
           this.editTypeSanction.montantParDefaut >= 0 &&
           (!isSuspension || (isSuspension && this.editTypeSanction.duree != null && this.editTypeSanction.duree > 0));
  }

  onTypeChange(form: TypeSanction): void {
    if (form.type !== 'SUSPENSION') {
      form.duree = undefined;
    }
  }

  getCaisseName(caisseId: number | undefined): string {
    if (!caisseId) return 'Par défaut';
    const caisse = this.caisses.find(c => c.id === caisseId);
    return caisse ? caisse.nom : 'Non définie';
  }

  getIconLabel(iconValue: string): string {
    return this.icones.find(i => i.value === iconValue)?.label || iconValue;
  }

  getCouleurLabel(couleurValue: string): string {
    return this.couleurs.find(c => c.value === couleurValue)?.label || couleurValue;
  }

  formatMontant(montant: number | undefined): string {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.successMessage = null;
      this.errorMessage = null;
    }, 5000);
  }

  // Getters pour les stats
  get totalTypes(): number {
    return this.dataSource.data.length;
  }

  get typesActifs(): number {
    return this.dataSource.data.filter(t => t.actif).length;
  }

  get typesAvecMouvement(): number {
    return this.dataSource.data.filter(t => t.genererMouvementAuto).length;
  }
}