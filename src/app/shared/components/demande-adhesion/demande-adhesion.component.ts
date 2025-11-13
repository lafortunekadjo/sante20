import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormArray, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { QuestionCandidature, TypeChamp } from '../../../core/models/question-candidature.model';
import { AuthService } from '../../../core/services/auth.service';
import { GroupePublic, DemandeAdhesion } from '../../../core/models/groupe-explorer.model';
import { GroupeService } from '../../../core/services/groupe.service';
import { QuestionCandidatureService } from '../../../core/services/question-candidature.service';

@Component({
  selector: 'app-demande-adhesion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
    MatSlideToggleModule
  ],
  templateUrl: './demande-adhesion.component.html',
  styleUrl: './demande-adhesion.component.scss'
})
export class DemandeAdhesionComponent implements OnInit {
  groupe: any | null = null;
  questions: QuestionCandidature[] = [];
  demandeForm: FormGroup;
  
  isLoading = true;
  isSubmitting = false;
  groupeId!: number;
  TypeChamp = TypeChamp;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private groupesService: GroupeService,
    private questionnaireService: QuestionCandidatureService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.demandeForm = this.fb.group({});
  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est connecté
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Vous devez être connecté pour faire une demande', 'Fermer', {
        duration: 3000
      });
      this.router.navigate(['/login']);
      return;
    }
    this.route.params.subscribe(params => {
      this.groupeId = +params['id'];
      this.loadGroupeAndQuestions();
    });
  }

  loadGroupeAndQuestions(): void {
    this.isLoading = true;

    this.groupesService.getGroupeId(this.groupeId).subscribe({
      next: (groupe) => {
        this.groupe = groupe;
        this.loadQuestions();
      },
      error: (err) => {
        console.error('Erreur chargement groupe:', err);
        this.snackBar.open('Groupe introuvable', 'Fermer', { duration: 3000 });
        this.router.navigate(['/explorer2']);
      }
    });
  }

  loadQuestions(): void {
    this.questionnaireService.getQuestionsByGroupe(this.groupeId).subscribe({
      next: (questions) => {
        this.questions = questions.sort((a, b) => a.ordreAffichage - b.ordreAffichage);
        this.buildForm();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement questions:', err);
        this.snackBar.open('Erreur lors du chargement du formulaire', 'Fermer', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  buildForm(): void {
    this.questions.forEach(question => {
      const validators = question.obligatoire ? [Validators.required] : [];
      let defaultValue: any = '';

      // Ajouter des validateurs spécifiques selon le type
      switch (question.typeChamp) {
        case TypeChamp.EMAIL:
          validators.push(Validators.email);
          defaultValue = '';
          break;

        case TypeChamp.TELEPHONE:
          validators.push(Validators.pattern(/^[0-9+\s\-()]{9,15}$/));
          defaultValue = '';
          break;

        case TypeChamp.NOMBRE:
          validators.push(Validators.pattern(/^\d+$/));
          defaultValue = null;
          break;

        case TypeChamp.DATE:
          defaultValue = null;
          break;

        case TypeChamp.OUI_NON:
          defaultValue = null;
          break;

        case TypeChamp.CHOIX_MULTIPLE:
          // Pour choix multiple, créer un FormArray avec des contrôles boolean
          const options = this.getOptionsArray(question.optionsChoix);
          const checkboxArray = this.fb.array(
            options.map(() => this.fb.control(false)),
            question.obligatoire ? this.minSelectedCheckboxes(1) : null
          );
          this.demandeForm.addControl(`question_${question.id}`, checkboxArray);
          return; // Important: sortir ici car on a déjà ajouté le contrôle

        case TypeChamp.TEXTE_LONG:
          validators.push(Validators.maxLength(1000));
          defaultValue = '';
          break;

        case TypeChamp.TEXTE_COURT:
          validators.push(Validators.maxLength(255));
          defaultValue = '';
          break;

        default:
          defaultValue = '';
      }

      // Créer le contrôle pour tous les types sauf CHOIX_MULTIPLE
      this.demandeForm.addControl(
        `question_${question.id}`,
        new FormControl(defaultValue, validators)
      );
    });
  }

  // Validateur personnalisé pour les checkboxes (choix multiple)
// Validateur personnalisé pour les checkboxes (choix multiple)
minSelectedCheckboxes(min: number = 1): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!(control instanceof FormArray)) {
      return null;
    }
    
    const totalSelected = control.controls
      .map(ctrl => ctrl.value)
      .reduce((prev, next) => next ? prev + 1 : prev, 0);
    
    return totalSelected >= min ? null : { minSelected: true };
  };
}

  getOptionsArray(optionsChoix: string | undefined): string[] {
    if (!optionsChoix) return [];
    return optionsChoix.split(',').map(o => o.trim()).filter(o => o.length > 0);
  }

  // Pour CHOIX_MULTIPLE avec FormArray
  getCheckboxFormArray(questionId: number): FormArray {
    return this.demandeForm.get(`question_${questionId}`) as FormArray;
  }

  // Vérifier si une checkbox est cochée (pour choix multiple)
  isCheckboxChecked(questionId: number, optionIndex: number): boolean {
    const formArray = this.getCheckboxFormArray(questionId);
    return formArray?.at(optionIndex)?.value || false;
  }

  // Obtenir l'icône selon le type de question
  getQuestionIcon(typeChamp: TypeChamp): string {
    const icons: { [key: string]: string } = {
      [TypeChamp.TEXTE_COURT]: 'text_fields',
      [TypeChamp.TEXTE_LONG]: 'subject',
      [TypeChamp.NOMBRE]: 'numbers',
      [TypeChamp.DATE]: 'calendar_today',
      [TypeChamp.EMAIL]: 'email',
      [TypeChamp.TELEPHONE]: 'phone',
      [TypeChamp.CHOIX_UNIQUE]: 'radio_button_checked',
      [TypeChamp.CHOIX_MULTIPLE]: 'check_box',
      [TypeChamp.OUI_NON]: 'toggle_on'
    };
    return icons[typeChamp] || 'help_outline';
  }

  onSubmit(): void {
    if (this.demandeForm.invalid) {
      this.snackBar.open('Veuillez répondre à toutes les questions obligatoires', 'Fermer', {
        duration: 3000
      });
      this.markFormGroupTouched(this.demandeForm);
      return;
    }

    this.isSubmitting = true;

    // Préparer les réponses
    const reponses = this.questions.map(question => {
      const controlName = `question_${question.id}`;
      let value = this.demandeForm.get(controlName)?.value;
      let reponseText = '';

      switch (question.typeChamp) {
        case TypeChamp.CHOIX_MULTIPLE:
          // Pour FormArray, récupérer les options cochées
          const options = this.getOptionsArray(question.optionsChoix);
          const selectedOptions = options.filter((_, index) => value[index]);
          reponseText = selectedOptions.join('; ');
          break;

        case TypeChamp.DATE:
          reponseText = value ? new Date(value).toISOString().split('T')[0] : '';
          break;

        case TypeChamp.OUI_NON:
          reponseText = value === true ? 'Oui' : value === false ? 'Non' : '';
          break;

        case TypeChamp.NOMBRE:
          reponseText = value !== null && value !== '' ? value.toString() : '';
          break;

        default:
          reponseText = value ? value.toString().trim() : '';
      }

      return {
        questionId: question.id,
        valeur: reponseText
      };
    });

    const demande: DemandeAdhesion = {
      
      groupeId: this.groupeId,
      statut: 'EN_ATTENTE',
      reponses: reponses
    };

    console.log('Demande à envoyer:', demande);

    this.questionnaireService.createDemandeAdhesion(this.groupeId, demande).subscribe({
      next: () => {
        this.snackBar.open('Demande envoyée avec succès !', 'Fermer', {
          duration: 4000
        });
        this.router.navigate(['/mes-demandes']);
      },
      error: (err) => {
        console.error('Erreur soumission demande:', err);
        this.snackBar.open('Erreur lors de l\'envoi de la demande', 'Fermer', {
          duration: 3000
        });
        this.isSubmitting = false;
      }
    });
  }

  // Message d'erreur personnalisé selon le type de champ
  getErrorMessage(questionId: number, question: QuestionCandidature): string {
    const control = this.demandeForm.get(`question_${questionId}`);
    
    if (!control?.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Cette réponse est obligatoire';
    }
    if (control.errors['email']) {
      return 'Email invalide';
    }
    if (control.errors['pattern']) {
      if (question.typeChamp === TypeChamp.TELEPHONE) {
        return 'Numéro de téléphone invalide (9-15 caractères)';
      }
      if (question.typeChamp === TypeChamp.NOMBRE) {
        return 'Veuillez entrer un nombre valide';
      }
      return 'Format invalide';
    }
    if (control.errors['maxLength']) {
      return `Maximum ${control.errors['maxLength'].requiredLength} caractères`;
    }
    if (control.errors['minSelected']) {
      return 'Veuillez sélectionner au moins une option';
    }

    return 'Erreur de validation';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      // Si c'est un FormArray, marquer tous ses contrôles
      if (control instanceof FormArray) {
        control.controls.forEach(c => c.markAsTouched());
      }
    });
  }

  cancel(): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Vos réponses seront perdues.')) {
      this.router.navigate(['/explorer2']);
    }
  }

  getDisciplineIcon(discipline: string): string {
    const icons: { [key: string]: string } = {
      'Football': 'sports_soccer',
      'Basketball': 'sports_basketball',
      'Volleyball': 'sports_volleyball',
      'Handball': 'sports_handball',
      'Rugby': 'sports_rugby',
      'Tennis': 'sports_tennis',
      'Badminton': 'sports_tennis'
    };
    return icons[discipline] || 'sports';
  }
}