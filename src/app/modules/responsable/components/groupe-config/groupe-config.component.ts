import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Groupe } from '../../../../core/models/groupe.model';
import { QuestionCandidature, TYPE_CHAMP_CONFIG, TypeChamp } from '../../../../core/models/question-candidature.model';
import { Stade } from '../../../../core/models/stade';
import { Ville } from '../../../../core/models/ville';
import { AuthService } from '../../../../core/services/auth.service';
import { GroupeService } from '../../../../core/services/groupe.service';
import { QuestionCandidatureService } from '../../../../core/services/question-candidature.service';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../environment';


@Component({
  selector: 'app-groupe-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatExpansionModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    DragDropModule
  ],
  templateUrl: './groupe-config.component.html',
  styleUrl: './groupe-config.component.scss'
})
export class GroupeConfigComponent implements OnInit {
  groupeForm: FormGroup;
  questionForm: FormGroup;
  
  groupe: Groupe | null = null;
  questions: QuestionCandidature[] = [];
  villes: Ville[] = [];
  stades: Stade[] = [];
  
  isLoading = true;
  isSaving = false;
  editingQuestion: QuestionCandidature | null = null;
  showQuestionForm = false;
  imageUrl=environment.imageUrl
  // Pour l'aperçu de l'image
  profilePhotoPreview: string | null = null;
  selectedFile: File | null = null;
  typeChampConfig = TYPE_CHAMP_CONFIG;
  joursMatch = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  disciplines = ['Football', 'Basketball', 'Volleyball', 'Handball', 'Rugby'];
  typesEquipe = ['Senior', 'Junior', 'Vétéran', 'Féminin', 'Masculin', 'Mixte'];
   isDialogOpen = signal(false);
   isUploadingPhoto = false;

  // Signal pour stocker la valeur de l'input du nom du stade
  stadeNom : string | ''='';
    stadeLatitude: number | null = null;
  stadeLongitude: number | null = null;
  stadeRayon: number = 500; // Valeur par défaut : 500m
  
  // États de l'interface
  isGettingLocation: boolean = false;
  locationMessage: string = '';
  locationMessageType: 'success' | 'error' = 'success';
  
  // Signal de démo pour stocker les stades ajoutés
  stades2 = signal<string[]>([]);

  constructor(
    private fb: FormBuilder,
    private groupeService: GroupeService,
    private questionService: QuestionCandidatureService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.groupeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      isPublic: [true],
      discipline: ['', Validators.required],
      ville: [null, Validators.required],
      stade: [null, Validators.required],
      jourMatch: ['', Validators.required],
      typeEquipe: [''],
      modeEquipe: ['STATIQUE'],
      fraisAdhesion: [0, [Validators.required, Validators.min(0)]],
      heureMatch: [null, Validators.required],
      abreviation: ['']
    });

    this.questionForm = this.fb.group({
      texteQuestion: ['', [Validators.required, Validators.minLength(5)]],
      typeChamp: [TypeChamp.TEXTE_COURT, Validators.required],
      optionsChoix: [''],
      obligatoire: [false]
    });
  }

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null); 

  ngOnInit(): void {
    this.loadData();
  }

  openNewStadeDialog(): void {
    this.isDialogOpen.set(true);
  }

  // /**
  //  * Ferme le dialogue.
  //  */
  // closeDialog(): void {
  //   this.isDialogOpen.set(false);
  // }

  // /**
  //  * Computed signal pour valider si le nom du stade est rempli.
  //  */
  // isFormValid = computed(() => {
  //   return this.stadeNom().trim().length >= 2;
  // });

  /**
   * Gère la soumission du formulaire et l'enregistrement du stade.
   */
  // submitStade(): void {
  //   if (this.isFormValid()) {
  //     const nouveauNom = this.stadeNom().trim();
  //     this.closeDialog();
  //   }
  // }

  //   submitStade(): void {
  //   // 0. Vérification de la validité
  //   if (!this.isFormValid() || this.isSubmitting()) {
  //     console.warn("Le formulaire n'est pas valide ou une soumission est déjà en cours.");
  //     return;
  //   }

  //   const nouveauNom = this.stadeNom().trim();
  //   this.isSubmitting.set(true); // 1. Début de la soumission
  //   this.errorMessage.set(null); // 2. Réinitialise les erreurs

  //   const payload: any = {
  //     nom: nouveauNom
  //   };

  //   // 3. Appel du service et abonnement à l'Observable
  //   this.groupeService.createStade(payload).pipe(
  //     // Exécuté après succès ou erreur (équivalent du 'finally')
  //     finalize(() => {
  //       this.isSubmitting.set(false);
  //     })
  //   ).subscribe({
  //     // Gère le cas de succès (code 2xx)
  //     next: (stadeCree: Stade) => {
  //       // 4. Traitement après succès
  //       console.log(`Stade créé avec succès (ID: ${stadeCree.id}). Fermeture du dialogue.`);
        
  //       // Réinitialiser le champ
  //       this.stadeNom.set(''); 
        
  //       // Fermer le dialogue seulement après confirmation du serveur
  //       this.closeDialog(); 
  //     },
  //     // Gère le cas d'erreur (code 4xx ou 5xx)
  //     error: (error) => {
  //       // 5. Gestion des erreurs
  //       console.error("Erreur RxJS lors de la création du stade:", error);
  //       // Afficher un message d'erreur clair à l'utilisateur
  //       this.errorMessage.set(`Échec de la création du stade. Détails: ${error.message || 'Erreur inconnue.'}`);
  //     }
  //   });
    
  //   console.log("Appel au service déclenché. En attente de la réponse du serveur...");
  //   // Le code continue ici immédiatement, sans attendre la réponse HTTP.
  // }

  getVilleName(membre: number | Ville | undefined): string {
      if (!membre) {
        // console.log('Membre est undefined ou null');
        return 'Inconnu';
      }
      if (typeof membre === 'object' && membre !== null && 'nom' in membre ) {
        // console.log('Membre est un objet:', membre);
        return `${membre.nom} `;
      }
      const membreId = typeof membre === 'number' ? membre : (membre as Ville)?.id;
      if (!membreId) {
        // console.log('MembreId non défini:', membre);
        return 'Inconnu';
      }
      const found = this.villes.find(m => m.id === membreId);
      // console.log('Membre trouvé:', found, 'pour ID:', membreId, 'dans:', this.membres);
      return found ? `${found.nom}` : 'Inconnu';
    }


    getStadeName(membre: number | Stade | undefined): string {

      if (!membre) {
        // console.log('Membre est undefined ou null');
        return 'Inconnu';
      }
      if (typeof membre === 'object' && membre !== null && 'nom' in membre ) {
        // console.log('Membre est un objet:', membre);
        return `${membre.nom} `;
      }
      const membreId = typeof membre === 'number' ? membre : (membre as Stade)?.id;
      if (!membreId) {
        // console.log('MembreId non défini:', membre);
        return 'Inconnu';
      }
      const found = this.stades.find(m => m.id === membreId);
      // console.log('Membre trouvé:', found, 'pour ID:', membreId, 'dans:', this.membres);
      return found ? `${found.nom}` : 'Inconnu';
    }

loadData(): void {
  this.isLoading = true;
  
  // 1. Charger les listes de Villes et Stades en premier
  // Utilisez un forkJoin si possible, ou enchaînez les observables si nécessaire.
  // Pour la simplicité, utilisons les callbacks (next) pour enchaîner l'ordre:

  // ÉTAPE 1: Charger les villes et stades
  this.loadVillesEtStades(() => {
    // ÉTAPE 2: Charger les données du Groupe une fois que les listes de référence sont prêtes
    this.groupeService.getGroupeConn().subscribe({
      next: (groupe) => {
        this.groupe = groupe;
        if (groupe) {
          // --- CORRECTION CLÉ ---
          // Si l'objet 'groupe' contient l'entité 'ville' complète,
          // vous devez extraire l'ID de la ville pour le formControl.
          const villeId = typeof groupe.ville === 'object' && groupe.ville !== null ? groupe.ville.id : groupe.ville;
          const stadeId = typeof groupe.stade === 'object' && groupe.stade !== null ? groupe.stade.id : groupe.stade;
          
          this.groupeForm.patchValue({
            ...groupe, // Applique toutes les autres valeurs
            ville: villeId, // Applique seulement l'ID de la ville au FormControl 'ville'
            stade:stadeId
          });
          
          this.loadQuestions(groupe.id);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement groupe:', err);
        this.snackBar.open('Erreur lors du chargement du groupe', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  });
}

 // Modifiez loadVillesEtStades pour prendre un callback ou retourner un Observable
loadVillesEtStades(callback: () => void): void {
  // Utilisez un forkJoin pour charger les deux en parallèle si ce sont des Observables
  // Sinon, si ce sont de simples appels API, adaptez la logique.

  // Supposons que ce sont des Observables que vous voulez exécuter :
  this.groupeService.getVilles().subscribe(villes => {
    this.villes = villes;

    this.groupeService.getStades().subscribe(stades => {
      console.log(stades)
      this.stades = stades;
      callback(); // Appel du callback une fois les deux listes chargées
    });
  });
}

  loadQuestions(groupeId: number): void {
    this.questionService.getQuestionsByGroupe(groupeId).subscribe({
      next: (questions) => {
        this.questions = questions.sort((a, b) => a.ordreAffichage - b.ordreAffichage);
      },
      error: (err) => {
        console.error('Erreur chargement questions:', err);
        this.snackBar.open('Erreur lors du chargement des questions', 'Fermer', { duration: 3000 });
      }
    });
  }

  // Gestion du formulaire groupe
  saveGroupe(): void {
    if (this.groupeForm.valid && this.groupe) {
      this.isSaving = true;
      const groupeData = {
        ...this.groupe,
        ...this.groupeForm.value
      };

      this.groupeService.updateGroupe(this.groupe.id, groupeData).subscribe({
        next: () => {
          this.snackBar.open('Groupe mis à jour avec succès !', 'Fermer', { duration: 3000 });
          this.isSaving = false;
          this.loadData();
        },
        error: (err) => {
          console.error('Erreur sauvegarde groupe:', err);
          this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
          this.isSaving = false;
        }
      });
    }
  }

  /**
   * Gère la sélection d'un fichier image
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Veuillez sélectionner une image', 'Fermer', { duration: 3000 });
        return;
      }
      
      // Vérifier la taille (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('L\'image ne doit pas dépasser 5MB', 'Fermer', { duration: 3000 });
        return;
      }
      
      this.selectedFile = file;
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profilePhotoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Upload de l'image de profil
   */
  uploadProfilePhoto(): void {
    if (!this.selectedFile || !this.groupe) {
      return;
    }
    
    this.isUploadingPhoto = true;
    const formData = new FormData();
    formData.append('profilePhoto', this.selectedFile);
    
    this.groupeService.uploadGroupePhoto(this.groupe.id, formData).pipe(
      finalize(() => {
        this.isUploadingPhoto = false;
      })
    ).subscribe({
      next: (response) => {
        this.snackBar.open('Photo de profil mise à jour avec succès', 'Fermer', { duration: 3000 });
        // Mettre à jour l'URL de la photo dans le groupe
        if (this.groupe && response.url) {
          this.groupe.profilePhotoUrl = response.url;
        }
        this.selectedFile = null;
      },
      error: (error) => {
        console.error('Erreur upload photo:', error);
        this.snackBar.open('Erreur lors de l\'upload de la photo', 'Fermer', { duration: 3000 });
      }
    });
  }

  /**
   * Annuler la sélection de photo
   */
  cancelPhotoSelection(): void {
    this.selectedFile = null;
    this.profilePhotoPreview = null;
    // Réinitialiser l'input file
    const fileInput = document.getElementById('photoInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Gestion des questions
  toggleQuestionForm(): void {
    this.showQuestionForm = !this.showQuestionForm;
    if (!this.showQuestionForm) {
      this.questionForm.reset({
        typeChamp: TypeChamp.TEXTE_COURT,
        obligatoire: false
      });
      this.editingQuestion = null;
    }
  }

  onTypeChampChange(typeChamp: TypeChamp): void {
    const config = this.typeChampConfig.find(t => t.value === typeChamp);
    if (config && !config.needsOptions) {
      this.questionForm.patchValue({ optionsChoix: '' });
    }
  }

  needsOptions(): boolean {
    const typeChamp = this.questionForm.get('typeChamp')?.value;
    const config = this.typeChampConfig.find(t => t.value === typeChamp);
    return config?.needsOptions || false;
  }

  getTypeChampIcon(typeChamp: TypeChamp): string {
    const config = this.typeChampConfig.find(t => t.value === typeChamp);
    return config?.icon || 'help';
  }

  getTypeChampLabel(typeChamp: TypeChamp): string {
    const config = this.typeChampConfig.find(t => t.value === typeChamp);
    return config?.label || typeChamp;
  }

  saveQuestion(): void {
    if (this.questionForm.valid && this.groupe) {
      const questionData: QuestionCandidature = {
        id: this.editingQuestion?.id || 0,
        groupe: this.groupe.id,
        ...this.questionForm.value,
        ordreAffichage: this.editingQuestion?.ordreAffichage || this.questions.length + 1
      };

      const operation = this.editingQuestion
        ? this.questionService.updateQuestion(this.editingQuestion.id, questionData)
        : this.questionService.createQuestion(this.groupe.id, questionData);

      operation.subscribe({
        next: () => {
          this.snackBar.open(
            this.editingQuestion ? 'Question mise à jour !' : 'Question ajoutée !',
            'Fermer',
            { duration: 3000 }
          );
          this.loadQuestions(this.groupe!.id);
          this.toggleQuestionForm();
        },
        error: (err) => {
          console.error('Erreur sauvegarde question:', err);
          this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  editQuestion(question: QuestionCandidature): void {
    this.editingQuestion = question;
    this.showQuestionForm = true;
    this.questionForm.patchValue(question);
  }

  deleteQuestion(question: QuestionCandidature): void {
    if (confirm(`Voulez-vous vraiment supprimer cette question ?`)) {
      this.questionService.deleteQuestion(question.id).subscribe({
        next: () => {
          this.snackBar.open('Question supprimée !', 'Fermer', { duration: 3000 });
          this.loadQuestions(this.groupe!.id);
        },
        error: (err) => {
          console.error('Erreur suppression question:', err);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  duplicateQuestion(question: QuestionCandidature): void {
    this.questionService.duplicateQuestion(question.id).subscribe({
      next: () => {
        this.snackBar.open('Question dupliquée !', 'Fermer', { duration: 3000 });
        this.loadQuestions(this.groupe!.id);
      },
      error: (err) => {
        console.error('Erreur duplication question:', err);
        this.snackBar.open('Erreur lors de la duplication', 'Fermer', { duration: 3000 });
      }
    });
  }

  // Drag & drop pour réorganiser
  drop(event: CdkDragDrop<QuestionCandidature[]>): void {
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
    
    // Mettre à jour l'ordre
    this.questions.forEach((q, index) => {
      q.ordreAffichage = index + 1;
    });

    this.questionService.updateOrdreQuestions(this.questions).subscribe({
      next: () => {
        this.snackBar.open('Ordre mis à jour !', 'Fermer', { duration: 2000 });
      },
      error: (err) => {
        console.error('Erreur mise à jour ordre:', err);
        this.snackBar.open('Erreur lors de la réorganisation', 'Fermer', { duration: 3000 });
        this.loadQuestions(this.groupe!.id); // Recharger en cas d'erreur
      }
    });
  }

  getOptionsArray(optionsChoix: string | undefined): string[] {
    if (!optionsChoix) return [];
    return optionsChoix.split(';').map(o => o.trim()).filter(o => o.length > 0);
  }

  /**
   * Obtenir la position GPS actuelle
   */
  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.showLocationMessage('La géolocalisation n\'est pas supportée par ce navigateur', 'error');
      return;
    }

    this.isGettingLocation = true;
    this.locationMessage = '';

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 secondes
      maximumAge: 60000 // Cache d'1 minute
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Succès - récupération des coordonnées
        this.stadeLatitude = this.roundCoordinate(position.coords.latitude);
        this.stadeLongitude = this.roundCoordinate(position.coords.longitude);
        
        this.showLocationMessage(
          `Position obtenue avec précision de ±${Math.round(position.coords.accuracy)}m`, 
          'success'
        );
        
        this.isGettingLocation = false;
      },
      (error) => {
        // Erreur de géolocalisation
        this.handleGeolocationError(error);
        this.isGettingLocation = false;
      },
      options
    );
  }

  /**
   * Gérer les erreurs de géolocalisation
   */
  private handleGeolocationError(error: GeolocationPositionError): void {
    let message = '';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Accès à la localisation refusé. Veuillez autoriser l\'accès dans votre navigateur.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Position indisponible. Vérifiez votre connexion et réessayez.';
        break;
      case error.TIMEOUT:
        message = 'Délai d\'attente dépassé. Réessayez ou entrez les coordonnées manuellement.';
        break;
      default:
        message = 'Erreur inconnue lors de la géolocalisation.';
        break;
    }
    
    this.showLocationMessage(message, 'error');
  }

  /**
   * Afficher un message de statut de localisation
   */
  private showLocationMessage(message: string, type: 'success' | 'error'): void {
    this.locationMessage = message;
    this.locationMessageType = type;
    
    // Effacer le message après 5 secondes
    setTimeout(() => {
      this.locationMessage = '';
    }, 5000);
  }

  /**
   * Arrondir les coordonnées à 6 décimales (précision ~1m)
   */
  private roundCoordinate(coord: number): number {
    return Math.round(coord * 1000000) / 1000000;
  }

  /**
   * Vérifier si les coordonnées sont valides
   */
  hasValidCoordinates(): boolean {
    return this.stadeLatitude !== null && 
           this.stadeLongitude !== null &&
           this.isValidLatitude(this.stadeLatitude) &&
           this.isValidLongitude(this.stadeLongitude);
  }

  /**
   * Valider une latitude (-90 à 90)
   */
  private isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  /**
   * Valider une longitude (-180 à 180)
   */
  private isValidLongitude(lng: number): boolean {
    return lng >= -180 && lng <= 180;
  }

  /**
   * Valider le formulaire complet
   */
  isFormValid(): boolean {
    return !!(
      this.stadeNom && 
      this.stadeNom.trim().length > 0 &&
      this.stadeNom.trim().length <= 50 &&
      this.hasValidCoordinates() &&
      this.stadeRayon >= 10 &&
      this.stadeRayon <= 5000
    );
  }

  /**
   * Soumettre le formulaire
   */
  submitStade(): void {
    if (!this.isFormValid()) {
      return;
    }

   this.isSubmitting.set(true);

    const stadeData = {
      nom: this.stadeNom.trim(),
      latitude: this.stadeLatitude,
      longitude: this.stadeLongitude,
      rayon: this.stadeRayon
    };

    console.log('Données du stade à enregistrer:', stadeData);

    // Appel à votre service pour enregistrer le stade
    this.groupeService.createStade(stadeData).subscribe({
      next: (response) => {
        console.log('Stade créé avec succès:', response);
        this.showSuccessMessage('Stade créé avec succès !');
        this.closeDialog();
         this.isSubmitting.set(false);
         this.loadData();
      },
      error: (error) => {
        console.error('Erreur lors de la création du stade:', error);
        this.showErrorMessage('Erreur lors de la création du stade');
         this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Réinitialiser le formulaire
   */
  resetForm(): void {
    this.stadeNom = '';
    this.stadeLatitude = null;
    this.stadeLongitude = null;
    this.stadeRayon = 500;
    this.locationMessage = '';
    this.isGettingLocation = false;
    this.isSubmitting.set(false);
  }

  /**
   * Fermer le dialog
   */
  closeDialog(): void {
    this.resetForm();
    this.isDialogOpen.set(false);
    // Votre logique existante pour fermer le dialog
  }

  /**
   * Méthodes utilitaires pour les messages (si pas déjà présentes)
   */
  private showSuccessMessage(message: string): void {
     this.isSubmitting.set(false);
    this.snackBar.open(message, 'Fermer', {
    duration: 4000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
    panelClass: ['success-snackbar']
  });
  }

  private showErrorMessage(message: string): void {
     this.isSubmitting.set(false);
    this.snackBar.open(message, 'Fermer', {
    duration: 6000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
    panelClass: ['error-snackbar']
  });
  }

  /**
   * Calculer la distance entre deux points GPS (optionnel pour validation)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance en mètres
  }

  /**
   * Formater les coordonnées pour l'affichage
   */
  formatCoordinate(coord: number | null): string {
    return coord !== null ? coord.toFixed(6) : '';
  }

  /**
   * Obtenir une estimation de la précision GPS
   */
  getAccuracyEstimate(): string {
    if (this.hasValidCoordinates()) {
      return 'Précision GPS estimée: ±10-50m';
    }
    return '';
  }
}