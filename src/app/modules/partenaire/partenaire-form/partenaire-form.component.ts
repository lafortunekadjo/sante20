// ============================================================
// MY2-0 - FORMULAIRE CRÉATION PARTENAIRE (Admin)
// Création et édition des partenaires
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { TypeContrat, FrequenceFacturation, PartenaireDTO, EMPLACEMENTS_PUBLICITE, StatutPartenaire } from '../../../core/models/partenaire.model';
import { AdminPartenaireService } from '../../../core/services/admin-partenaire.service';



// Types de contrat disponibles
const TYPES_CONTRAT: { value: TypeContrat; label: string; description: string }[] = [
  { value: 'ESSAI', label: 'Essai', description: 'Période d\'essai gratuite de 30 jours' },
  { value: 'BASIC', label: 'Basic', description: 'Accès limité - 1 entreprise, 3 publicités' },
  { value: 'STANDARD', label: 'Standard', description: 'Accès standard - 3 entreprises, 10 publicités' },
  { value: 'PREMIUM', label: 'Premium', description: 'Accès complet - Illimité' },
  { value: 'PERSONNALISE', label: 'Personnalisé', description: 'Contrat sur mesure' }
];

const FREQUENCES_FACTURATION: { value: FrequenceFacturation; label: string }[] = [
  { value: 'PONCTUEL', label: 'Paiement unique' },
  { value: 'MENSUEL', label: 'Mensuel' },
  { value: 'TRIMESTRIEL', label: 'Trimestriel' },
  { value: 'ANNUEL', label: 'Annuel' }
];

@Component({
  selector: 'app-partenaire-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    TranslateModule
  ],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true }
    }
  ],
  templateUrl: './partenaire-form.component.html',
  styleUrls: ['./partenaire-form.component.scss']
})
export class PartenaireFormComponent implements OnInit, OnDestroy {
  // Formulaires par étape
  infoForm!: FormGroup;
  contactForm!: FormGroup;
  contratForm!: FormGroup;
  utilisateurForm!: FormGroup;

  // États
  isLoading = false;
  isSaving = false;
  isEditMode = false;
  partenaireId: number | null = null;
  partenaire: PartenaireDTO | null = null;

  // Options
  typesContrat = TYPES_CONTRAT;
  frequencesFacturation = FREQUENCES_FACTURATION;
  emplacements = EMPLACEMENTS_PUBLICITE;
  selectedEmplacements: string[] = [];

  // Limites par défaut selon le type de contrat
  limitsPresets: Record<TypeContrat, { maxEntreprises: number; maxPublicites: number; emplacements: string[] }> = {
    'ESSAI': { maxEntreprises: 1, maxPublicites: 2, emplacements: ['FEED', 'SIDEBAR'] },
    'BASIC': { maxEntreprises: 1, maxPublicites: 3, emplacements: ['FEED', 'SIDEBAR', 'FOOTER'] },
    'STANDARD': { maxEntreprises: 3, maxPublicites: 10, emplacements: ['FEED', 'SIDEBAR', 'FOOTER', 'HEADER', 'BETWEEN_SECTIONS'] },
    'PREMIUM': { maxEntreprises: 99, maxPublicites: 99, emplacements: this.emplacements.map(e => e.value) },
    'PERSONNALISE': { maxEntreprises: 5, maxPublicites: 20, emplacements: [] }
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminPartenaireService,
    private translateService: TranslateService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    // Vérifier si mode édition
    this.partenaireId = this.route.snapshot.params['id']
      ? +this.route.snapshot.params['id']
      : null;

    if (this.partenaireId) {
      this.isEditMode = true;
      this.loadPartenaire();
    } else {
      // Valeurs par défaut pour création
      this.setDefaultValues();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================
  // INITIALISATION DES FORMULAIRES
  // ============================================================

  private initForms(): void {
    // Étape 1: Informations générales
    this.infoForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      personneContact: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9\s\+\-\.]{8,20}$/)]],
    });

    // Étape 2: Adresse
    this.contactForm = this.fb.group({
      adresse: [''],
      ville: ['', [Validators.required]],
      codePostal: [''],
      pays: ['Cameroun']
    });

    // Étape 3: Contrat
    this.contratForm = this.fb.group({
      typeContrat: ['STANDARD', [Validators.required]],
      dateDebutContrat: [new Date(), [Validators.required]],
      dateFinContrat: [this.getDefaultEndDate()],
      montantContrat: [0, [Validators.min(0)]],
      frequenceFacturation: ['MENSUEL'],
      maxEntreprises: [3, [Validators.required, Validators.min(1)]],
      maxPublicitesActives: [10, [Validators.required, Validators.min(1)]],
      emplacementsAutorises: [[], [Validators.required]],
      notes: ['']
    });

    // Étape 4: Utilisateur admin
    this.utilisateurForm = this.fb.group({
      creerUtilisateur: [true],
      prenom: [''],
      nomUtilisateur: [''],
      emailUtilisateur: [''],
      telephoneUtilisateur: [''],
      envoyerCredentials: [true]
    });

    // Copier l'email du partenaire pour l'utilisateur par défaut
    this.infoForm.get('email')?.valueChanges.subscribe(email => {
      if (!this.utilisateurForm.get('emailUtilisateur')?.dirty) {
        this.utilisateurForm.patchValue({ emailUtilisateur: email });
      }
    });

    // Appliquer les presets selon le type de contrat
    this.contratForm.get('typeContrat')?.valueChanges.subscribe(type => {
      this.applyContratPreset(type);
    });
  }

  private setDefaultValues(): void {
    // Appliquer le preset STANDARD par défaut
    this.applyContratPreset('STANDARD');
  }

  private applyContratPreset(type: TypeContrat): void {
    const preset = this.limitsPresets[type];
    if (preset) {
      this.contratForm.patchValue({
        maxEntreprises: preset.maxEntreprises,
        maxPublicitesActives: preset.maxPublicites
      });
      this.selectedEmplacements = [...preset.emplacements];
      this.contratForm.patchValue({ emplacementsAutorises: this.selectedEmplacements });
    }
  }

  private getDefaultEndDate(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }

  // ============================================================
  // CHARGEMENT PARTENAIRE (MODE ÉDITION)
  // ============================================================

  private loadPartenaire(): void {
    if (!this.partenaireId) return;

    this.isLoading = true;

    const sub = this.adminService.getPartenaire(this.partenaireId).subscribe({
      next: (partenaire) => {
        this.partenaire = partenaire;
        this.patchForms(partenaire);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement partenaire:', err);
        this.snackBar.open('Partenaire non trouvé', 'OK', { duration: 3000 });
        this.router.navigate(['/admin/partenaires']);
      }
    });
    this.subscriptions.push(sub);
  }

  private patchForms(p: PartenaireDTO): void {
    this.infoForm.patchValue({
      nom: p.nom,
      description: p.description || '',
      personneContact: p.personneContact || '',
      email: p.email || '',
      telephone: p.telephone || ''
    });

    this.contactForm.patchValue({
      adresse: p.adresse || '',
      ville: p.ville || ''
    });

    this.contratForm.patchValue({
      typeContrat: p.typeContrat,
      dateDebutContrat: p.dateDebutContrat ? new Date(p.dateDebutContrat) : null,
      dateFinContrat: p.dateFinContrat ? new Date(p.dateFinContrat) : null,
      montantContrat: p.montantContrat || 0,
      frequenceFacturation: p.frequenceFacturation || 'MENSUEL',
      maxEntreprises: p.maxEntreprises || 5,
      maxPublicitesActives: p.maxPublicitesActives || 10,
      emplacementsAutorises: p.emplacementsAutorises || []
    });

    this.selectedEmplacements = p.emplacementsAutorises || [];

    // En mode édition, pas besoin de créer d'utilisateur
    this.utilisateurForm.patchValue({ creerUtilisateur: false });
  }

  // ============================================================
  // GESTION DES EMPLACEMENTS
  // ============================================================

  toggleEmplacement(value: string): void {
    const index = this.selectedEmplacements.indexOf(value);
    if (index === -1) {
      this.selectedEmplacements.push(value);
    } else {
      this.selectedEmplacements.splice(index, 1);
    }
    this.contratForm.patchValue({ emplacementsAutorises: this.selectedEmplacements });
  }

  isEmplacementSelected(value: string): boolean {
    return this.selectedEmplacements.includes(value);
  }

  selectAllEmplacements(): void {
    this.selectedEmplacements = this.emplacements.map(e => e.value);
    this.contratForm.patchValue({ emplacementsAutorises: this.selectedEmplacements });
  }

  clearEmplacements(): void {
    this.selectedEmplacements = [];
    this.contratForm.patchValue({ emplacementsAutorises: [] });
  }

  // ============================================================
  // SOUMISSION
  // ============================================================

  onSubmit(): void {
    // Valider tous les formulaires
    if (this.infoForm.invalid || this.contactForm.invalid || this.contratForm.invalid) {
      this.markAllAsTouched();
      this.snackBar.open('Veuillez corriger les erreurs', 'OK', { duration: 3000 });
      return;
    }

    // Validation utilisateur si création
    if (this.utilisateurForm.get('creerUtilisateur')?.value && this.utilisateurForm.invalid) {
      this.utilisateurForm.markAllAsTouched();
      this.snackBar.open('Veuillez remplir les informations utilisateur', 'OK', { duration: 3000 });
      return;
    }

    this.isSaving = true;

    const request = this.buildRequest();

    if (this.isEditMode && this.partenaireId) {
      this.updatePartenaire(request);
    } else {
      this.createPartenaire(request);
    }
  }

  private buildRequest(): any {
    const info = this.infoForm.value;
    const contact = this.contactForm.value;
    const contrat = this.contratForm.value;
    const user = this.utilisateurForm.value;

    const request: any = {
      nom: info.nom.trim(),
      description: info.description?.trim() || null,
      personneContact: info.personneContact.trim(),
      email: info.email.trim(),
      telephone: info.telephone.trim(),
      adresse: contact.adresse?.trim() || null,
      ville: contact.ville.trim(),
      typeContrat: contrat.typeContrat,
      dateDebutContrat: contrat.dateDebutContrat?.toISOString(),
      dateFinContrat: contrat.dateFinContrat?.toISOString() || null,
      montantContrat: contrat.montantContrat || 0,
      frequenceFacturation: contrat.frequenceFacturation,
      maxEntreprises: contrat.maxEntreprises,
      maxPublicitesActives: contrat.maxPublicitesActives,
      emplacementsAutorises: this.selectedEmplacements,
      statut: 'ACTIF' as StatutPartenaire
    };

    // Ajouter infos utilisateur si création
    if (!this.isEditMode && user.creerUtilisateur) {
      request.utilisateurAdmin = {
        prenom: user.prenom.trim(),
        nom: user.nomUtilisateur.trim(),
        email: user.emailUtilisateur?.trim() || info.email.trim(),
        telephone: user.telephoneUtilisateur?.trim() || info.telephone.trim(),
        envoyerCredentials: user.envoyerCredentials
      };
    }

    return request;
  }

  private createPartenaire(request: any): void {
    this.adminService.createPartenaire(request).subscribe({
      next: (partenaire) => {
        this.isSaving = false;
        this.snackBar.open('Partenaire créé avec succès', 'OK', { duration: 3000 });
        this.router.navigate(['/admin/partenaires', partenaire.id]);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Erreur création:', err);
        const message = err.error?.message || 'Erreur lors de la création';
        this.snackBar.open(message, 'OK', { duration: 5000 });
      }
    });
  }

  private updatePartenaire(request: any): void {
    this.adminService.updatePartenaire(this.partenaireId!, request).subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open('Partenaire mis à jour', 'OK', { duration: 3000 });
        this.router.navigate(['/admin/partenaires', this.partenaireId]);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Erreur mise à jour:', err);
        const message = err.error?.message || 'Erreur lors de la mise à jour';
        this.snackBar.open(message, 'OK', { duration: 5000 });
      }
    });
  }

  private markAllAsTouched(): void {
    this.infoForm.markAllAsTouched();
    this.contactForm.markAllAsTouched();
    this.contratForm.markAllAsTouched();
    this.utilisateurForm.markAllAsTouched();
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getTypeContratDescription(type: string): string {
    const found = this.typesContrat.find(t => t.value === type);
    return found?.description || '';
  }

  getEmplacementLabel(value: string): string {
    const found = this.emplacements.find(e => e.value === value);
    return found ? this.translateService.instant(found.labelKey) : value;
  }

  getEmplacementIcon(value: string): string {
    const icons: Record<string, string> = {
      'HEADER': 'web',
      'SIDEBAR': 'view_sidebar',
      'FEED': 'dynamic_feed',
      'BETWEEN_SECTIONS': 'view_day',
      'FOOTER': 'call_to_action',
      'SPLASH_SCREEN': 'mobile_screen_share',
      'PDF_FOOTER': 'picture_as_pdf',
      'IMAGE_MATCH': 'sports_soccer',
      'MODAL': 'open_in_new',
      'EXPLORER_TOP': 'explore'
    };
    return icons[value] || 'campaign';
  }

  cancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/admin/partenaires', this.partenaireId]);
    } else {
      this.router.navigate(['/admin/partenaires']);
    }
  }

  getTitle(): string {
    return this.isEditMode ? 'Modifier le partenaire' : 'Nouveau partenaire';
  }
}