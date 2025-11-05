import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { SuggestionsService } from '../../../../core/services/suggestions.service';
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
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-suggestions',
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
    MatListModule],
  templateUrl: './suggestions.component.html',
  styleUrl: './suggestions.component.scss'
})
export class SuggestionsComponent implements OnInit {
  suggestionForm: FormGroup;
  membreId!: number;
  userId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private suggestionsService: SuggestionsService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private membreService: MembreService
  ) {
    this.suggestionForm = this.fb.group({
      texte: ['', [Validators.required, Validators.minLength(10)]]
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

  onSubmit(): void {
    if (this.suggestionForm.valid && this.membreId) {
      const suggestion = {
        texte: this.suggestionForm.value.texte,
        membre: { id: this.membreId }
      };

      this.suggestionsService.createSuggestion(suggestion).subscribe(
        () => {
          this.snackBar.open('Votre suggestion a été soumise avec succès !', 'Fermer', { duration: 3000 });
          this.suggestionForm.reset();
        },
        error => {
          console.error('Erreur lors de l\'envoi de la suggestion', error);
          this.snackBar.open('Erreur lors de l\'envoi de la suggestion.', 'Fermer', { duration: 3000 });
        }
      );
    }
  }

}
