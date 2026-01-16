// sortie-caisse.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

import { 
  FinancesService, 
  Exercice, 
  Caisse, 
  MouvementCaisse,
  SortieCaisseRequest 
} from '../../../../core/services/finances.service';
import { GeneralService } from '../../../../core/services/general.service';
import { MembreService } from '../../../../core/services/membre.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Membre } from '../../../../core/models/membre.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

interface TypeDepense {
  id: number;
  nom: string;
  description?: string;
  isGenerique: boolean;
  icone?: string;
  couleur?: string;
  necessiteValidation?: boolean;
  seuilValidation?: number;
}

@Component({
  selector: 'app-sortie-caisse',
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
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './sortie-caisse.component.html',
  styleUrl: './sortie-caisse.component.scss'
})
export class SortieCaisseComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  isSaving = false;

  exerciceActif: Exercice | null = null;
  caisses: Caisse[] = [];
  typesDepenses: any[] = [];
  membres: Membre[] = [];
  filteredMembres: Observable<Membre[]> = of([]);

  // Formulaire
  sortieForm!: FormGroup;

  // Dernières sorties
  dernieresSorties: MouvementCaisse[] = [];
  sortiesEnAttente: MouvementCaisse[] = [];
  dataSource = new MatTableDataSource<MouvementCaisse>([]);
  displayedColumns: string[] = ['date', 'libelle', 'caisse', 'beneficiaire', 'montant', 'statut', 'actions'];

  groupeId: number | null = null;
  selectedCaisse: Caisse | null = null;

  constructor(
    private financesService: FinancesService,
    private generalService: GeneralService,
    private membreService: MembreService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.groupeId = this.authService.getGroupe();
    if (this.groupeId) {
      this.loadData();
    } else {
      this.isLoading = false;
    }
  }

  initForm(): void {
    this.sortieForm = this.fb.group({
      caisseId: [null, Validators.required],
      typeDepenseId: [null],
      montant: [null, [Validators.required, Validators.min(1)]],
      dateMouvement: [new Date(), Validators.required],
      libelle: ['', Validators.required],
      beneficiaireId: [null],
      beneficiaireSearch: [''],
      beneficiaireTexte: [''],
      commentaire: [''],
      pieceJustificative: ['']
    });

    // Autocomplétion des membres (bénéficiaires)
    this.filteredMembres = this.sortieForm.get('beneficiaireSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => this.filterMembres(value || ''))
    );
  }

  loadData(): void {
    if (!this.groupeId) return;

    this.isLoading = true;

    forkJoin({
      exercice: this.financesService.getExerciceActif(this.groupeId),
      membres: this.membreService.getGroupMembers(),
      typesDepenses: this.generalService.getAllTypesDepenses()
    }).pipe(
      switchMap(({ exercice, membres, typesDepenses }) => {
        this.exerciceActif = exercice;
        this.membres = membres;
        this.typesDepenses = typesDepenses;

        if (exercice?.id) {
          return forkJoin({
            caisses: this.financesService.getCaissesByExercice(exercice.id),
            mouvements: this.financesService.getMouvementsExercice(exercice.id)
          });
        }
        return of({ caisses: [], mouvements: [] });
      })
    ).subscribe({
      next: ({ caisses, mouvements }) => {
        this.caisses = caisses;
        const sorties = (mouvements as MouvementCaisse[]).filter(m => m.typeMouvement === 'SORTIE');
        this.dernieresSorties = sorties.filter(s => s.statut === 'VALIDE').slice(0, 10);
        this.sortiesEnAttente = sorties.filter(s => s.statut === 'EN_ATTENTE');
        this.dataSource.data = this.dernieresSorties;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement données:', err);
        this.isLoading = false;
        this.showError('Erreur lors du chargement des données');
      }
    });
  }

  filterMembres(value: string): Membre[] {
    if (!value || typeof value !== 'string') return this.membres.slice(0, 10);
    
    const filterValue = value.toLowerCase();
    return this.membres.filter(membre => 
      membre.nom?.toLowerCase().includes(filterValue) ||
      membre.prenom?.toLowerCase().includes(filterValue)
    ).slice(0, 10);
  }

  displayMembre(membre: Membre): string {
    return membre ? `${membre.prenom} ${membre.nom}` : '';
  }

  onBeneficiaireSelected(membre: Membre): void {
    this.sortieForm.patchValue({
      beneficiaireId: membre.id,
      beneficiaireSearch: `${membre.prenom} ${membre.nom}`,
      beneficiaireTexte: ''
    });
  }

  onCaisseChange(): void {
    const caisseId = this.sortieForm.get('caisseId')?.value;
    if (caisseId) {
      this.selectedCaisse = this.caisses.find(c => c.id === caisseId) || null;
    } else {
      this.selectedCaisse = null;
    }
  }

  checkSolde(): boolean {
    if (!this.selectedCaisse) return true;
    const montant = this.sortieForm.get('montant')?.value || 0;
    return montant <= this.selectedCaisse.soldeActuel;
  }

  enregistrerSortie(): void {
    if (this.sortieForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.checkSolde()) {
      this.showError('Solde insuffisant dans la caisse sélectionnée');
      return;
    }

    // Vérifier si le montant nécessite une validation
    const typeDepenseId = this.sortieForm.get('typeDepenseId')?.value;
    const montant = this.sortieForm.get('montant')?.value;
    
    if (typeDepenseId) {
      const typeDepense = this.typesDepenses.find(t => t.id === typeDepenseId);
      if (typeDepense?.necessiteValidation && typeDepense.seuilValidation && montant >= typeDepense.seuilValidation) {
        this.showWarning(`Cette sortie sera soumise à validation (montant >= ${this.formatMontant(typeDepense.seuilValidation)})`);
      }
    }

    this.isSaving = true;
    const formData = this.sortieForm.value;

    const request: SortieCaisseRequest = {
      caisseId: formData.caisseId,
      montant: formData.montant,
      dateMouvement: this.formatDate(formData.dateMouvement),
      libelle: formData.libelle,
      typeDepenseId: formData.typeDepenseId || undefined,
      beneficiaireId: formData.beneficiaireId || undefined,
      beneficiaireTexte: formData.beneficiaireTexte || undefined,
      commentaire: formData.commentaire || undefined,
      pieceJustificative: formData.pieceJustificative || undefined
    };

    this.financesService.enregistrerSortie(request).subscribe({
      next: (mouvement) => {
        if (mouvement.statut === 'EN_ATTENTE') {
          this.showWarning('Sortie enregistrée et en attente de validation');
        } else {
          this.showSuccess('Sortie enregistrée avec succès');
        }
        this.resetForm();
        this.loadData();
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Erreur enregistrement:', err);
        this.showError(err.error?.message || 'Erreur lors de l\'enregistrement');
        this.isSaving = false;
      }
    });
  }

  validerSortie(mouvement: MouvementCaisse): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Valider la sortie',
        message: `Confirmez-vous la validation de cette sortie de ${this.formatMontant(mouvement.montant)} ?`,
        confirmText: 'Valider',
        cancelText: 'Annuler',
        color: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.financesService.validerSortie(mouvement.id!).subscribe({
          next: () => {
            this.showSuccess('Sortie validée');
            this.loadData();
          },
          error: (err) => {
            this.showError(err.error?.message || 'Erreur lors de la validation');
          }
        });
      }
    });
  }

  rejeterSortie(mouvement: MouvementCaisse): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Rejeter la sortie',
        message: `Êtes-vous sûr de rejeter cette sortie de ${this.formatMontant(mouvement.montant)} ?`,
        confirmText: 'Rejeter',
        cancelText: 'Annuler',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.financesService.rejeterSortie(mouvement.id!, 'Rejeté par l\'administrateur').subscribe({
          next: () => {
            this.showSuccess('Sortie rejetée');
            this.loadData();
          },
          error: (err) => {
            this.showError(err.error?.message || 'Erreur lors du rejet');
          }
        });
      }
    });
  }

  resetForm(): void {
    this.sortieForm.reset({
      dateMouvement: new Date()
    });
    this.selectedCaisse = null;
  }

  markFormGroupTouched(): void {
    Object.keys(this.sortieForm.controls).forEach(key => {
      this.sortieForm.get(key)?.markAsTouched();
    });
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatMontant(montant: number): string {
    return this.financesService.formatMontant(montant);
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  showWarning(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['warning-snackbar']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}