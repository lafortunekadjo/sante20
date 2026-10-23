import { t } from '../../../../core/i18n/traduire';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { SuggestionsService } from '../../../../core/services/suggestions.service';
import { SuggestionEnvoyee } from '../../../../core/models/suggestion.model';
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
import { PubliciteAffichageComponent } from '../../../publicite/publicite-affichage/publicite-affichage.component';
import { PubliciteBannerComponent } from '../../../publicite/publicite-banner/publicite-banner.component';
import { PubliciteFeedComponent } from '../../../publicite/publicite-feed/publicite-feed.component';
import { TranslateModule } from '@ngx-translate/core';

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
    MatListModule,
      PubliciteBannerComponent,
      PubliciteAffichageComponent,
      PubliciteFeedComponent,
      TranslateModule
  ],
  templateUrl: './suggestions.component.html',
  styleUrl: './suggestions.component.scss'
})
export class SuggestionsComponent implements OnInit {
  tipsExpanded = false;
  examplesExpanded = false;
  suggestionForm: FormGroup;
  userId: number | null = null;
  mesSuggestions: SuggestionEnvoyee[] = [];
  historiqueChargement = true;
  historiqueErreur = false;
  envoiEnCours = false;
  /** Suggestion dont le texte complet est déplié. */
  depliee: number | null = null;
  userVille: string | undefined;

  constructor(
    private fb: FormBuilder,
    private suggestionsService: SuggestionsService,
    private snackBar: MatSnackBar,
    private authService: AuthService
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
      this.snackBar.open(t('ui.ts_erreur_vous_devez_etre_connecte__7315'), 'Fermer', {
        duration: 3000,
      });
      return;
    }
    this.chargerHistorique();
  }

  chargerHistorique(): void {
    this.historiqueChargement = true;
    this.historiqueErreur = false;
    this.suggestionsService.mesSuggestions().subscribe({
      next: l => { this.mesSuggestions = l; this.historiqueChargement = false; },
      error: () => { this.historiqueErreur = true; this.historiqueChargement = false; }
    });
  }

  onSubmit(): void {
    if (this.suggestionForm.invalid || this.envoiEnCours) return;
    this.envoiEnCours = true;
    this.suggestionsService.createSuggestion(this.suggestionForm.value.texte).subscribe({
      next: envoyee => {
        this.envoiEnCours = false;
        this.snackBar.open(t('ui.ts_votre_suggestion_a_ete_soumise_a_004b'), 'Fermer', { duration: 3000 });
        this.suggestionForm.reset();
        this.mesSuggestions = [envoyee, ...this.mesSuggestions];   // visible tout de suite dans l'historique
      },
      error: err => {
        this.envoiEnCours = false;
        const message = err?.status === 429 ? t('suggestions.form.errors.tooMany')
          : err?.status === 400 && err?.error?.message ? err.error.message
          : t('ui.ts_erreur_lors_de_l_envoi_de_la_sug_1ab4');
        this.snackBar.open(message, 'Fermer', { duration: 4000 });
      }
    });
  }

  basculer(id: number): void {
    this.depliee = this.depliee === id ? null : id;
  }

}