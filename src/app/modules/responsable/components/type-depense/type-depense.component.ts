import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';

import { FinancesService } from '../../../../core/services/finances.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

export interface TypeDepense {
  id?: number;
  nom: string;
  description?: string;
  isGenerique: boolean;
  groupeId?: number;
  necessiteValidation: boolean;
  seuilValidation?: number;
  icone: string;
  couleur: string;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Icônes Material disponibles pour les types de dépenses
const ICONS_DISPONIBLES = [
  { value: 'receipt', label: 'Reçu' },
  { value: 'shopping_cart', label: 'Achats' },
  { value: 'sports_soccer', label: 'Équipement sport' },
  { value: 'local_hospital', label: 'Médical' },
  { value: 'restaurant', label: 'Restauration' },
  { value: 'directions_bus', label: 'Transport' },
  { value: 'home', label: 'Local/Terrain' },
  { value: 'celebration', label: 'Événement' },
  { value: 'card_giftcard', label: 'Cadeau' },
  { value: 'build', label: 'Maintenance' },
  { value: 'print', label: 'Impression' },
  { value: 'phone', label: 'Communication' },
  { value: 'laptop', label: 'Informatique' },
  { value: 'attach_money', label: 'Frais divers' },
  { value: 'account_balance', label: 'Administratif' },
  { value: 'volunteer_activism', label: 'Solidarité' }
];

// Couleurs disponibles
const COULEURS_DISPONIBLES = [
  { value: '#6b7280', label: 'Gris' },
  { value: '#3b82f6', label: 'Bleu' },
  { value: '#10b981', label: 'Vert' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Rouge' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Rose' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#f97316', label: 'Orange foncé' }
];

@Component({
  selector: 'app-type-depense',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatDialogModule,
    MatMenuModule,
    TranslateModule
  ],
  templateUrl: './type-depense.component.html',
  styleUrl: './type-depense.component.scss'
})
export class TypeDepenseComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  isSaving = false;
  isEditing = false;
  editingId: number | null = null;

  typesDepenses: any[] = [];
  dataSource = new MatTableDataSource<TypeDepense>([]);
  displayedColumns: string[] = ['icone', 'nom', 'description', 'validation', 'statut', 'actions'];

  // Formulaire
  typeForm!: FormGroup;
  showForm = false;

  // Options
  icones = ICONS_DISPONIBLES;
  couleurs = COULEURS_DISPONIBLES;

  // Filtres
  searchTerm = '';
  filterActif: 'all' | 'actif' | 'inactif' = 'all';

  groupeId: number | null = null;

  constructor(
    private financesService: FinancesService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.groupeId = this.authService.getGroupe()|| null;
    this.loadData();
  }

  initForm(): void {
    this.typeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', Validators.maxLength(200)],
      isGenerique: [false],
      necessiteValidation: [false],
      seuilValidation: [null, [Validators.min(0)]],
      icone: ['receipt', Validators.required],
      couleur: ['#6b7280', Validators.required],
      actif: [true]
    });

    // Désactiver le seuil si validation non requise
    this.typeForm.get('necessiteValidation')?.valueChanges.subscribe(value => {
      const seuilControl = this.typeForm.get('seuilValidation');
      if (value) {
        seuilControl?.enable();
      } else {
        seuilControl?.disable();
        seuilControl?.setValue(null);
      }
    });
  }

  loadData(): void {
    this.isLoading = true;

    this.financesService.getTypesDepenses(this.groupeId).subscribe({
      next: (types) => {
        this.typesDepenses = types;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
        this.isLoading = false;
        this.showError('Erreur lors du chargement des types de dépenses');
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.typesDepenses];

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
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openForm(type?: TypeDepense): void {
    this.showForm = true;
    this.isEditing = !!type;
    this.editingId = type?.id || null;

    if (type) {
      this.typeForm.patchValue({
        nom: type.nom,
        description: type.description || '',
        isGenerique: type.isGenerique,
        necessiteValidation: type.necessiteValidation,
        seuilValidation: type.seuilValidation,
        icone: type.icone || 'receipt',
        couleur: type.couleur || '#6b7280',
        actif: type.actif
      });
    } else {
      this.typeForm.reset({
        nom: '',
        description: '',
        isGenerique: false,
        necessiteValidation: false,
        seuilValidation: null,
        icone: 'receipt',
        couleur: '#6b7280',
        actif: true
      });
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;
    this.typeForm.reset();
  }

  saveType(): void {
    if (this.typeForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving = true;
    const formData = this.typeForm.value;

    const typeDepense: Partial<any> = {
      nom: formData.nom.trim(),
      description: formData.description?.trim() || null,
      isGenerique: formData.isGenerique,
      groupeId: formData.isGenerique ? null : this.groupeId,
      necessiteValidation: formData.necessiteValidation,
      seuilValidation: formData.necessiteValidation ? formData.seuilValidation : null,
      icone: formData.icone,
      couleur: formData.couleur,
      actif: formData.actif
    };

    const request = this.isEditing && this.editingId
      ? this.financesService.updateTypeDepense(this.editingId, typeDepense)
      : this.financesService.createTypeDepense(typeDepense);

    request.subscribe({
      next: () => {
        this.showSuccess(this.isEditing ? 'Type de dépense modifié' : 'Type de dépense créé');
        this.closeForm();
        this.loadData();
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Erreur sauvegarde:', err);
        this.showError(err.error?.message || 'Erreur lors de la sauvegarde');
        this.isSaving = false;
      }
    });
  }

  toggleActif(type: TypeDepense): void {
    const newStatus = !type.actif;
    const action = newStatus ? 'activer' : 'désactiver';

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `${newStatus ? 'Activer' : 'Désactiver'} le type de dépense`,
        message: `Voulez-vous ${action} "${type.nom}" ?`,
        confirmText: newStatus ? 'Activer' : 'Désactiver',
        cancelText: 'Annuler',
        color: newStatus ? 'primary' : 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && type.id) {
        this.financesService.updateTypeDepense(type.id, { actif: newStatus }).subscribe({
          next: () => {
            this.showSuccess(`Type de dépense ${newStatus ? 'activé' : 'désactivé'}`);
            this.loadData();
          },
          error: (err) => {
            this.showError(err.error?.message || 'Erreur lors de la modification');
          }
        });
      }
    });
  }

  deleteType(type: TypeDepense): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Supprimer le type de dépense',
        message: `Êtes-vous sûr de vouloir supprimer "${type.nom}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && type.id) {
        this.financesService.deleteTypeDepense(type.id).subscribe({
          next: () => {
            this.showSuccess('Type de dépense supprimé');
            this.loadData();
          },
          error: (err) => {
            this.showError(err.error?.message || 'Erreur lors de la suppression');
          }
        });
      }
    });
  }

  getIconLabel(iconValue: string): string {
    return this.icones.find(i => i.value === iconValue)?.label || iconValue;
  }

  getCouleurLabel(couleurValue: string): string {
    return this.couleurs.find(c => c.value === couleurValue)?.label || couleurValue;
  }

  formatMontant(montant: number | undefined): string {
    if (!montant) return '-';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  markFormGroupTouched(): void {
    Object.keys(this.typeForm.controls).forEach(key => {
      this.typeForm.get(key)?.markAsTouched();
    });
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-success']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-error']
    });
  }

  // Getters pour le template
  get totalTypes(): number {
    return this.typesDepenses.length;
  }

  get typesActifs(): number {
    return this.typesDepenses.filter(t => t.actif).length;
  }

  get typesGeneriques(): number {
    return this.typesDepenses.filter(t => t.isGenerique).length;
  }

  get typesAvecValidation(): number {
    return this.typesDepenses.filter(t => t.necessiteValidation).length;
  }
}