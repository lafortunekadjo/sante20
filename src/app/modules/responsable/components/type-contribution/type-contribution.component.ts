// type-contribution.component.ts
import { Component, inject, OnInit, ViewChild } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { 
  FinancesService, 
  Exercice, 
  Caisse, 
  TypeContribution,
  FrequenceContribution 
} from '../../../../core/services/finances.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-type-contribution',
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
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    TranslateModule,
    MatDatepickerModule
  ],
  templateUrl: './type-contribution.component.html',
  styleUrl: './type-contribution.component.scss'
})
export class TypeContributionComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private translate = inject(TranslateService);

  isLoading = true;
  isSaving = false;
  showCreateForm = false;
  editingId: number | null = null;
  isLoadingToggle = false;

  exerciceActif: Exercice | null = null;
  caisses: Caisse[] = [];
  typesContributions: TypeContribution[] = [];

  dataSource = new MatTableDataSource<TypeContribution>([]);
  displayedColumns: string[] = ['nom', 'frequence', 'montant', 'caisse', 'options', 'actions'];

  // Formulaire
  typeForm!: FormGroup;

  // Options de fréquence
  frequences: { value: FrequenceContribution; label: string }[] = [
    { value: 'UNIQUE', label: 'Unique (une fois)' },
    { value: 'PAR_MATCH', label: 'Par match' },
    { value: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
    { value: 'MENSUELLE', label: 'Mensuelle' },
    { value: 'TRIMESTRIELLE', label: 'Trimestrielle' },
    { value: 'SEMESTRIELLE', label: 'Semestrielle' },
    { value: 'ANNUELLE', label: 'Annuelle' },
    { value: 'PONCTUELLE', label: 'Ponctuelle (événement)' }
  ];

  // Champs de statut membre
  champsStatut = [
    { value: 'adhesionPayee', label: 'Adhésion payée' },
    { value: 'cotisationAJour', label: 'Cotisation à jour' },
    { value: 'sanctionsPayees', label: 'Sanctions payées' }
  ];

  groupeId: number | null = null;

  constructor(
    private financesService: FinancesService,
    private authService: AuthService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.groupeId = this.authService.getGroupe();
    if (this.groupeId) {
      this.loadData();
      console.log(this.typesContributions)
    } else {
      this.isLoading = false;
    }
  }

  initForm(): void {
    this.typeForm = this.fb.group({
      nom: ['', Validators.required],
      description: [''],
      frequence: ['MENSUELLE', Validators.required],
      montantStandard: [null],
      montantMinimum: [null],
      caisseId: [null, Validators.required],
      obligatoire: [false],
      genererEcheancesAuto: [false],
      jourEcheance: [1],
      lieEvenement: [false],
      majStatutMembre: [false],
      champStatutMembre: [null],
      reportable: [true],
      actif: [true],
      delai: []
    });
  }

toggleStatus(entity: any): void {
  if (this.isLoadingToggle) return;

  this.isLoadingToggle = true;
  const nouveauStatut = !entity.isActive; // Inversion du booléen

  // Remplacez 'monService.update' par votre service réel (GroupeService, MembreService, etc.)
  this.financesService.patchStatus(entity.id, nouveauStatut).subscribe({
    next: () => {
      entity.isActive = nouveauStatut;
      this.isLoadingToggle = false;
      
      const msg = this.translate.instant('common.messages.update_success');
      this.snackBar.open(msg, 'OK', { duration: 3000 });
    },
    error: (err) => {
      this.isLoadingToggle = false;
      const msg = this.translate.instant('common.messages.update_error');
      this.snackBar.open(msg, 'Fermer', { panelClass: ['error-snackbar'] });
      console.error('Erreur de bascule statut:', err);
    }
  });
}

  loadData(): void {
    if (!this.groupeId) return;

    this.isLoading = true;

    this.financesService.getExerciceActif(this.groupeId).pipe(
      switchMap(exercice => {
        this.exerciceActif = exercice;
        if (exercice?.id) {
          return forkJoin({
            caisses: this.financesService.getCaissesByExercice(exercice.id),
            types: this.financesService.getTypesContributionByExercice(exercice.id)
          });
        }
        return forkJoin({ caisses: [], types: [] });
      })
    ).subscribe({
      next: ({ caisses, types }) => {
        this.caisses = caisses as Caisse[];
        this.typesContributions = types as TypeContribution[];
        this.dataSource.data = this.typesContributions;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
        this.isLoading = false;
        this.showError('Erreur lors du chargement des données');
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingId = null;
    if (this.showCreateForm) {
      this.initForm();
    }
  }

  editType(type: TypeContribution): void {
    console.log(type)
    this.editingId = type.id!;
    this.showCreateForm = true;
    this.typeForm.patchValue({
      nom: type.nom,
      description: type.description,
      frequence: type.frequence,
      montantStandard: type.montantStandard,
      montantMinimum: type.montantMinimum,
      caisseId: type.caisse?.id,
      obligatoire: type.obligatoire,
      genererEcheancesAuto: type.genererEcheancesAuto,
      jourEcheance: type.jourEcheance,
      lieEvenement: type.lieEvenement,
      majStatutMembre: type.majStatutMembre,
      champStatutMembre: type.champStatutMembre,
      reportable: type.reportable,
      delai: type.delaiContribution,
      actif: type.actif
      
    });
  }

  saveType(): void {
    if (this.typeForm.invalid || !this.exerciceActif) return;

    this.isSaving = true;
    const formData = this.typeForm.value;

    if (formData.delai) {
    const d = new Date(formData.delai);
    formData.delai = d.toISOString().split('T')[0];
  }

    const data = {
      ...formData,
      exerciceId: this.exerciceActif.id,
      
      delaiContribution: formData.delai
    };

    const request = this.editingId
      ? this.financesService.updateTypeContribution(this.editingId, data)
      : this.financesService.creerTypeContribution(data);

    request.subscribe({
      next: () => {
        this.showSuccess(this.editingId ? 'Type modifié avec succès' : 'Type créé avec succès');
        this.loadData();
        this.toggleCreateForm();
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.showError(err.error?.message || 'Erreur lors de l\'enregistrement');
        this.isSaving = false;
      }
    });
  }

  deleteType(type: TypeContribution): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Supprimer le type',
        message: `Êtes-vous sûr de vouloir désactiver le type "${type.nom}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.financesService.deleteTypeContribution(type.id!).subscribe({
          next: () => {
            this.showSuccess('Type désactivé');
            this.loadData();
          },
          error: (err) => {
            this.showError(err.error?.message || 'Erreur lors de la suppression');
          }
        });
      }
    });
  }

  formatMontant(montant: number | undefined): string {
    return montant ? this.financesService.formatMontant(montant) : '-';
  }

  getFrequenceLabel(frequence: FrequenceContribution): string {
    return this.financesService.getFrequenceLabel(frequence);
  }

  getCaisseColor(caisse: Caisse | undefined): string {
    return caisse?.couleur || '#6b7280';
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}