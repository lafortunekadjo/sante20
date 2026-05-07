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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { TypeSanction } from '../../../../core/models/sanction.model';

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
  { value: 'rule', label: 'Règlement' },
  { value: 'verified', label: 'Validation' },
  { value: 'priority_high', label: 'Urgent' },
  { value: 'cancel', label: 'Annulation' },
  { value: 'check_circle', label: 'Approbation' }
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
  displayedColumns: string[] = ['libelle', 'montantParDefaut', 'duree', 'caisse',  'actions'];
  dataSource = new MatTableDataSource<TypeSanction>();
  isLoading = true;
  showCreateRow = false;
  editingRows: boolean[] = [];
  iconPickerOpen = false;
  
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
  notificationTimeout: any;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private sanctionService: SanctionService,
    private financesService: FinancesService,
    private authService: AuthService,
    private translate: TranslateService
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
        this.setupFilter();
        this.editingRows = new Array(typeSanctions.length).fill(false);
        this.caisses = caisses;
        this.isLoading = false;
        this.errorMessage = null;
      },
      error: (err) => {
        this.showError('Erreur lors du chargement des données : ' + err.message);
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  setupFilter(): void {
    this.dataSource.filterPredicate = (data: TypeSanction, filter: string) => {
      const searchString = filter.toLowerCase();
      const matchesSearch = data.nom?.toLowerCase().includes(searchString) ||
                           data.description?.toLowerCase().includes(searchString) || false;
      
      let matchesStatus = true;
      if (this.filterActif === 'actif') {
        matchesStatus = data.actif === true;
      } else if (this.filterActif === 'inactif') {
        matchesStatus = data.actif === false;
      }
      
      return matchesSearch && matchesStatus;
    };
  }

  applyFilters(): void {
    const filterValue = this.searchTerm.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  toggleCreateRow(): void {
    this.showCreateRow = !this.showCreateRow;
    if (this.showCreateRow) {
      this.newTypeSanction = this.getEmptyTypeSanction();
    }
    this.errorMessage = null;
    this.successMessage = null;
  }

  addType(): void {
    if (!this.isCreateFormValid()) {
      this.showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const data = {
      ...this.newTypeSanction,
      caisse: this.newTypeSanction.caisseId ? { id: this.newTypeSanction.caisseId } : null
    };

    this.sanctionService.createTypeSanction(data).subscribe({
      next: () => {
        this.showSuccess('Type de sanction créé avec succès');
        this.showCreateRow = false;
        this.loadData();
        this.newTypeSanction = this.getEmptyTypeSanction();
      },
      error: (err) => {
        this.showError('Erreur lors de la création : ' + err.message);
      }
    });
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
      this.showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const data = {
      ...this.editTypeSanction,
      caisse: this.editTypeSanction.caisseId ? { id: this.editTypeSanction.caisseId } : null
    };

    this.sanctionService.updateTypeSanction(this.editTypeSanction.id!, data).subscribe({
      next: () => {
        this.showSuccess('Type de sanction mis à jour avec succès');
        this.editingRows[index] = false;
        this.loadData();
      },
      error: (err) => {
        this.showError('Erreur lors de la mise à jour : ' + err.message);
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
        this.showSuccess(`Type de sanction ${newStatus ? 'activé' : 'désactivé'}`);
        this.loadData();
      },
      error: (err) => {
        this.showError('Erreur lors de la modification : ' + err.message);
      }
    });
  }

  openDeleteDialog(typeSanction: TypeSanction): void {
    if (confirm(`Voulez-vous vraiment supprimer "${typeSanction.nom}" ?`)) {
      this.sanctionService.deleteTypeSanction(typeSanction.id!).subscribe({
        next: () => {
          this.showSuccess('Type de sanction supprimé avec succès');
          this.loadData();
        },
        error: (err) => {
          this.showError('Erreur lors de la suppression : ' + err.message);
        }
      });
    }
  }

  // Méthode pour le sélecteur d'icônes
  selectIcon(iconValue: string): void {
    this.newTypeSanction.icone = iconValue;
    this.iconPickerOpen = false;
  }

  // Méthode utilitaire pour obtenir le libellé du type
  getTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'AMENDE': 'sanction.financial',
      'SUSPENSION': 'sanction.suspension',
      'DISCIPLINE': 'sanction.warning'
      // 'MATERIEL':'sanction.material'
    };
    return typeLabels[type] || type;
  }

  isCreateFormValid(): boolean {
    const isSuspension = this.newTypeSanction.type === 'SUSPENSION';
    return this.newTypeSanction.nom?.trim() !== '' &&
           this.newTypeSanction.type !== undefined &&
           this.newTypeSanction.montantParDefaut >= 0 &&
           (!isSuspension || (isSuspension && this.newTypeSanction.duree != null && this.newTypeSanction.duree > 0));
  }

  isEditFormValid(): boolean {
    const isSuspension = this.editTypeSanction.type === 'SUSPENSION';
    return this.editTypeSanction.nom?.trim() !== '' &&
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

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = null;
    this.clearMessagesAfterDelay();
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;
    this.clearMessagesAfterDelay();
  }

  clearMessagesAfterDelay(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notificationTimeout = setTimeout(() => {
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