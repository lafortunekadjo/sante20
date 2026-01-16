// entree-caisse.component.ts
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
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, startWith, debounceTime, switchMap } from 'rxjs/operators';

import { 
  FinancesService, 
  Exercice, 
  Caisse, 
  TypeContribution,
  MouvementCaisse,
  EntreeCaisseRequest 
} from '../../../../core/services/finances.service';
import { MembreService } from '../../../../core/services/membre.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Membre } from '../../../../core/models/membre.model';

@Component({
  selector: 'app-entree-caisse',
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
    TranslateModule
  ],
  templateUrl: './entree-caisse.component.html',
  styleUrl: './entree-caisse.component.scss'
})
export class EntreeCaisseComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  isSaving = false;
  showForm = true;

  exerciceActif: Exercice | null = null;
  caisses: Caisse[] = [];
  typesContributions: TypeContribution[] = [];
  membres: Membre[] = [];
  filteredMembres: Observable<Membre[]> = of([]);

  // Formulaire
  entreeForm!: FormGroup;

  // Dernières entrées
  dernieresEntrees: MouvementCaisse[] = [];
  dataSource = new MatTableDataSource<MouvementCaisse>([]);
  displayedColumns: string[] = ['date', 'membre', 'type', 'caisse', 'montant', 'statut'];

  groupeId: number | null = null;

  constructor(
    private financesService: FinancesService,
    private membreService: MembreService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
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
    this.entreeForm = this.fb.group({
      membreId: [null, Validators.required],
      membreSearch: [''],
      caisseId: [null, Validators.required],
      typeContributionId: [null],
      montant: [null, [Validators.required, Validators.min(1)]],
      dateMouvement: [new Date(), Validators.required],
      libelle: ['', Validators.required],
      commentaire: ['']
    });

    // Autocomplétion des membres
    this.filteredMembres = this.entreeForm.get('membreSearch')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map(value => this.filterMembres(value || ''))
    );
  }

  loadData(): void {
    if (!this.groupeId) return;

    this.isLoading = true;

    forkJoin({
      exercice: this.financesService.getExerciceActif(this.groupeId),
      membres: this.membreService.getGroupMembers()
    }).pipe(
      switchMap(({ exercice, membres }) => {
        this.exerciceActif = exercice;
        this.membres = membres;

        if (exercice?.id) {
          return forkJoin({
            caisses: this.financesService.getCaissesByExercice(exercice.id),
            types: this.financesService.getTypesContributionByExercice(exercice.id),
            mouvements: this.financesService.getMouvementsExercice(exercice.id)
          });
        }
        return of({ caisses: [], types: [], mouvements: [] });
      })
    ).subscribe({
      next: ({ caisses, types, mouvements }) => {
        this.caisses = caisses;
        this.typesContributions = types;
        this.dernieresEntrees = (mouvements as MouvementCaisse[])
          .filter(m => m.typeMouvement === 'ENTREE')
          .slice(0, 10);
        this.dataSource.data = this.dernieresEntrees;
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

  onMembreSelected(membre: Membre): void {
    this.entreeForm.patchValue({
      membreId: membre.id,
      membreSearch: `${membre.prenom} ${membre.nom}`
    });
  }

  onTypeContributionChange(): void {
    const typeId = this.entreeForm.get('typeContributionId')?.value;
    if (typeId) {
      const type = this.typesContributions.find(t => t.id === typeId);
      if (type) {
        // Pré-remplir le montant et le libellé
        if (type.montantStandard) {
          this.entreeForm.patchValue({ montant: type.montantStandard });
        }
        this.entreeForm.patchValue({ libelle: type.nom });
        
        // Sélectionner la caisse associée
        if (type.caisse?.id) {
          this.entreeForm.patchValue({ caisseId: type.caisse.id });
        }
      }
    }
  }

  enregistrerEntree(): void {
    if (this.entreeForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving = true;
    const formData = this.entreeForm.value;

    const request: EntreeCaisseRequest = {
      caisseId: formData.caisseId,
      membreId: formData.membreId,
      montant: formData.montant,
      dateMouvement: this.formatDate(formData.dateMouvement),
      libelle: formData.libelle,
      typeContributionId: formData.typeContributionId || undefined,
      commentaire: formData.commentaire || undefined
    };

    this.financesService.enregistrerEntree(request).subscribe({
      next: (mouvement) => {
        this.showSuccess('Entrée enregistrée avec succès');
        this.resetForm();
        this.loadData(); // Recharger les dernières entrées
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Erreur enregistrement:', err);
        this.showError(err.error?.message || 'Erreur lors de l\'enregistrement');
        this.isSaving = false;
      }
    });
  }

  resetForm(): void {
    this.entreeForm.reset({
      dateMouvement: new Date()
    });
  }

  markFormGroupTouched(): void {
    Object.keys(this.entreeForm.controls).forEach(key => {
      this.entreeForm.get(key)?.markAsTouched();
    });
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatMontant(montant: number): string {
    return this.financesService.formatMontant(montant);
  }

  getFrequenceLabel(frequence: string): string {
    return this.financesService.getFrequenceLabel(frequence as any);
  }

  getCaisseColor(caisse: Caisse): string {
    return caisse.couleur || '#2563eb';
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