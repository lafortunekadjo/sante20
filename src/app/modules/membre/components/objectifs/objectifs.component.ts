import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of, forkJoin } from 'rxjs';
import { Presence } from '../../../../core/models/presence.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ObjectifsService } from '../../../../core/services/objectifs.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { Objectif } from '../../../../core/models/objectifs.model';
import { MembreService } from '../../../../core/services/membre.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-objectifs',
  standalone: true,
  imports: [ FormsModule,  CommonModule,
    ReactiveFormsModule,
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
    MatDatepickerModule,
    MatExpansionModule, // Ajouté,
    MatProgressBarModule,
    MatListModule],
  templateUrl: './objectifs.component.html',
  styleUrl: './objectifs.component.scss'
})
export class ObjectifsComponent implements OnInit {
  objectifForm: FormGroup;
  objectifs: Objectif[] = [];
  membreId!: number;
  userId: number | null = null;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private objectifsService: ObjectifsService,
    private presenceService: PresenceService,
    private membreService: MembreService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.objectifForm = this.fb.group({
      type: ['', Validators.required],
      valeurCible: [null, [Validators.required, Validators.min(0)]],
      dateDebut: [null, Validators.required],
      dateFin: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    // Récupération de l'ID du membre connecté (à adapter selon votre logique d'authentification)
    // this.userId = this.authService.getUserId()
    this.userId = this.authService.getUserId();
    if (!this.userId) {
      console.error('Utilisateur non connecté.');
      this.snackBar.open('Erreur: Vous devez être connecté pour voir vos objectifs.', 'Fermer', {
        duration: 3000,
      });
      return;
    }
    
    this.membreService.getMembreByUserId(this.userId).subscribe(
      membre => {
        if (membre) {
          this.membreId = membre.id;
          this.loadObjectifs();
        } else {
          console.error('Aucun membre trouvé pour cet utilisateur.');
          this.snackBar.open('Erreur: Aucun membre trouvé pour cet utilisateur.', 'Fermer', {
            duration: 3000,
          });
        }
      },
      error => {
        console.error('Erreur lors de la récupération du membre:', error);
        this.snackBar.open('Erreur lors du chargement des objectifs.', 'Fermer', {
          duration: 3000,
        });
      }
    );
  }

  loadObjectifs(): void {
    this.isLoading = true;
    this.objectifsService.getObjectifsByMembre(this.membreId).subscribe(
      data => {
        this.objectifs = data;
        this.calculateProgress();
      },
      error => {
        console.error('Erreur lors du chargement des objectifs', error);
        this.isLoading = false;
      }
    );
  }

  calculateProgress(): void {
    const presenceObservables = this.objectifs.map(o =>
      this.presenceService.getPresencesByMembreId(this.membreId)
        .pipe(catchError(err => {
          console.error(`Erreur lors du calcul de la progression pour l'objectif de type ${o.type}:`, err);
          return of([]);
        }))
    );

    forkJoin(presenceObservables).subscribe(
      (results: Presence[][]) => {
        this.objectifs.forEach((o, index) => {
          const presences = results[index];
          let valeurActuelle = 0;
          switch (o.type) {
            case 'BUTS':
              valeurActuelle = presences.reduce((sum, p) => sum + (p.buts || 0), 0);
              break;
            case 'PASSES':
              valeurActuelle = presences.reduce((sum, p) => sum + (p.passes || 0), 0);
              break;
            case 'PRESENCE':
              valeurActuelle = presences.filter(p => p.present).length;
              break;
            case 'CARTON':
              valeurActuelle = presences.reduce((sum, p) => sum + (p.cartonsJaunes || 0) + (p.cartonsRouges || 0), 0);
              break;
          }
          (o as any).valeurActuelle = valeurActuelle;
        });
        this.isLoading = false;
      }
    );
  }

  onSubmit(): void {
    if (this.objectifForm.valid) {
      const nouvelObjectif = { ...this.objectifForm.value, membre: { id: this.membreId } };
      this.objectifsService.createObjectif(nouvelObjectif).subscribe(
        () => {
          this.snackBar.open('Objectif créé avec succès !', 'Fermer', { duration: 3000 });
          this.objectifForm.reset();
          this.loadObjectifs();
        },
        error => {
          this.snackBar.open('Erreur lors de la création de l\'objectif.', 'Fermer', { duration: 3000 });
          console.error(error);
        }
      );
    }
  }

  getProgressBarMode(objectif: any): string {
    return 'determinate' ;
  }

  getProgressBarValue(objectif: any): number {
    return Math.min(100, (objectif.valeurActuelle / objectif.valeurCible) * 100);
  }

  getProgressBarColor(objectif: any): string {
    return objectif.valeurActuelle >= objectif.valeurCible ? 'primary' : 'warn';
  }

}
