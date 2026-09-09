// exercice-management.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';
import { TranslateModule } from '@ngx-translate/core';

import { FinancesService, Exercice, BilanExercice } from '../../../../core/services/finances.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ExerciceEditDialogComponent } from '../exercice-edit-dialog/exercice-edit-dialog.component';

@Component({
  selector: 'app-exercice-management',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatExpansionModule,
    MatStepperModule,
    TranslateModule
  ],
  templateUrl: './exercice-management.component.html',
  styleUrl: './exercice-management.component.scss'
})
export class ExerciceManagementComponent implements OnInit {
  activeTab: 'actif'|'create'|'history' = 'actif';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  isCreating = false;
  isClosing = false;
  showCreateForm = false;
  showCloseForm = false;

  exercices: Exercice[] = [];
  exerciceActif: Exercice | null = null;
  selectedExercice: Exercice | null = null;
  bilanPreview: BilanExercice | null = null;

  dataSource = new MatTableDataSource<Exercice>([]);
  displayedColumns: string[] = ['libelle', 'annee', 'periode', 'solde', 'statut', 'actions'];

  groupeId: number | null = null;

  // Formulaire de création
  createForm!: FormGroup;

  // Options de clôture
  clotureOptions = {
    reporterImpayesAdhesion: true,
    reporterImpayesCotisations: true,
    reporterSanctionsNonPayees: false
  };

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
      this.loadExercices();
    } else {
      this.isLoading = false;
    }
  }

  initForm(): void {
    const currentYear = new Date().getFullYear();
    
    this.createForm = this.fb.group({
      libelle: [`Exercice ${currentYear}`, Validators.required],
      annee: [currentYear, [Validators.required, Validators.min(2000), Validators.max(2100)]],
      dateDebut: [new Date(currentYear, 0, 1), Validators.required],
      dateFin: [new Date(currentYear, 11, 31), Validators.required],
      reporterImpayes: [true]
    });
  }

  openEditDialog(exercice: Exercice): void {
  if (exercice.cloture) return; // sécurité, le bouton ne devrait pas apparaître de toute façon

  const dialogRef = this.dialog.open(ExerciceEditDialogComponent, {
    width: '600px',
    maxWidth: '95vw',
    data: { exercice }
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.loadExercices();
    }
  });
}

  loadExercices(): void {
    if (!this.groupeId) return;

    this.isLoading = true;
    this.financesService.getExercicesGroupe(this.groupeId).subscribe({
      next: (exercices) => {
        this.exercices = exercices;
        this.exerciceActif = exercices.find(e => e.actif) || null;
        this.dataSource.data = exercices;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement exercices:', err);
        this.isLoading = false;
        this.showError('Erreur lors du chargement des exercices');
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.initForm();
    }
  }

  onYearChange(): void {
    const year = this.createForm.get('annee')?.value;
    if (year) {
      this.createForm.patchValue({
        libelle: `Exercice ${year}`,
        dateDebut: new Date(year, 0, 1),
        dateFin: new Date(year, 11, 31)
      });
    }
  }

  creerExercice(): void {
    if (this.createForm.invalid || !this.groupeId) return;

    // Vérifier s'il y a un exercice actif non clôturé
    if (this.exerciceActif && !this.exerciceActif.cloture) {
      this.showError('Veuillez clôturer l\'exercice actif avant d\'en créer un nouveau');
      return;
    }

    this.isCreating = true;
    const formData = this.createForm.value;
    
    const data = {
      libelle: formData.libelle,
      annee: formData.annee,
      dateDebut: this.formatDate(formData.dateDebut),
      dateFin: this.formatDate(formData.dateFin),
      reporterImpayes: formData.reporterImpayes
    };

    this.financesService.creerExercice(this.groupeId, data).subscribe({
      next: (exercice) => {
        this.showSuccess('Exercice créé avec succès');
        this.loadExercices();
        this.toggleCreateForm();
        this.isCreating = false;
      },
      error: (err) => {
        console.error('Erreur création exercice:', err);
        this.showError(err.error?.message || 'Erreur lors de la création de l\'exercice');
        this.isCreating = false;
      }
    });
  }

  openCloseDialog(exercice: Exercice): void {
    this.selectedExercice = exercice;
    this.showCloseForm = true;
    this.loadBilanPreview(exercice.id!);
  }

  loadBilanPreview(exerciceId: number): void {
    this.financesService.previewBilan(exerciceId).subscribe({
      next: (bilan) => {
        this.bilanPreview = bilan;
      },
      error: (err) => {
        console.error('Erreur chargement preview bilan:', err);
      }
    });
  }

  confirmCloture(): void {
    if (!this.selectedExercice) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirmer la clôture',
        message: `Êtes-vous sûr de vouloir clôturer l'exercice "${this.selectedExercice.libelle}" ? Cette action est irréversible.`,
        confirmText: 'Clôturer',
        cancelText: 'Annuler',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cloturerExercice();
      }
    });
  }

  cloturerExercice(): void {
    if (!this.selectedExercice) return;

    this.isClosing = true;
    this.financesService.cloturerExercice(this.selectedExercice.id!, this.clotureOptions).subscribe({
      next: (bilan) => {
        this.showSuccess('Exercice clôturé avec succès');
        this.loadExercices();
        this.showCloseForm = false;
        this.selectedExercice = null;
        this.bilanPreview = null;
        this.isClosing = false;
      },
      error: (err) => {
        console.error('Erreur clôture exercice:', err);
        this.showError(err.error?.message || 'Erreur lors de la clôture de l\'exercice');
        this.isClosing = false;
      }
    });
  }

  cancelClose(): void {
    this.showCloseForm = false;
    this.selectedExercice = null;
    this.bilanPreview = null;
  }

  viewBilan(exercice: Exercice): void {
    // Navigation vers la page de bilan détaillé
    // this.router.navigate(['/finances/exercices', exercice.id, 'bilan']);
  }

formatDate(date: Date): string {
  const datePipe = new DatePipe('fr-FR');
  // Le '||' renvoie une chaîne vide en secours si le formatage échoue (évite le type null)
  return datePipe.transform(date, 'yyyy-MM-dd') || '';
}

  formatMontant(montant: number): string {
    return this.financesService.formatMontant(montant);
  }

  getStatutClass(exercice: Exercice): string {
    if (exercice.actif) return 'actif';
    if (exercice.cloture) return 'cloture';
    return 'inactif';
  }

  getStatutLabel(exercice: Exercice): string {
    if (exercice.actif) return 'Actif';
    if (exercice.cloture) return 'Clôturé';
    return 'Inactif';
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