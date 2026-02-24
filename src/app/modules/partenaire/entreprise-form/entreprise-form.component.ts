// ============================================================
// MY2-0 - FORMULAIRE ENTREPRISE
// Création et édition d'entreprise
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { EntrepriseDTO, CATEGORIES_ENTREPRISE, CreateEntrepriseRequest, CategorieEntreprise } from '../../../core/models/partenaire.model';
import { PartenaireService } from '../../../core/services/partenaire.service';


@Component({
  selector: 'app-entreprise-form',
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
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './entreprise-form.component.html',
  styleUrls: ['./entreprise-form.component.scss'] 
})
export class EntrepriseFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isLoading = false;
  isSaving = false;
  isEditMode = false;
  entrepriseId: number | null = null;
  entreprise: EntrepriseDTO | null = null;
  
  // Upload
  logoFile: File | null = null;
  logoPreview: string | null = null;
  bannerFile: File | null = null;
  bannerPreview: string | null = null;
  
  // Options
  categories = CATEGORIES_ENTREPRISE;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private partenaireService: PartenaireService,
    private translateService: TranslateService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    // Vérifier si mode édition
    this.entrepriseId = this.route.snapshot.params['id'] 
      ? +this.route.snapshot.params['id'] 
      : null;
    
    if (this.entrepriseId) {
      this.isEditMode = true;
      this.loadEntreprise();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ============================================================
  // FORM SETUP
  // ============================================================

  private createForm(): FormGroup {
    return this.fb.group({
      // Informations de base
      nom: ['', [Validators.required, Validators.maxLength(100)]],
      slogan: ['', [Validators.maxLength(150)]],
      description: ['', [Validators.maxLength(500)]],
      categorie: ['', [Validators.required]],
      
      // Contact
      telephone: ['', [Validators.pattern(/^[0-9\s\+\-\.]{8,20}$/)]],
      email: ['', [Validators.email]],
      siteWeb: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      whatsapp: [''],
      
      // Localisation
      adresse: [''],
      ville: [''],
      quartier: [''],
      
      // Réseaux sociaux
      facebookUrl: ['', [Validators.pattern(/^https?:\/\/(www\.)?facebook\.com\/.+/)]],
      instagramUrl: ['', [Validators.pattern(/^https?:\/\/(www\.)?instagram\.com\/.+/)]]
    });
  }

  private loadEntreprise(): void {
    if (!this.entrepriseId) return;
    
    this.isLoading = true;
    
    const sub = this.partenaireService.getEntreprise(this.entrepriseId).subscribe({
      next: (entreprise) => {
        this.entreprise = entreprise;
        this.patchForm(entreprise);
        this.logoPreview = entreprise.logoUrl || null;
        this.bannerPreview = entreprise.bannerUrl || null;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement entreprise:', err);
        this.snackBar.open('Entreprise non trouvée', 'OK', { duration: 3000 });
        this.router.navigate(['/partenaire/entreprises']);
      }
    });
    this.subscriptions.push(sub);
  }

  private patchForm(entreprise: EntrepriseDTO): void {
    this.form.patchValue({
      nom: entreprise.nom,
      slogan: entreprise.slogan || '',
      description: entreprise.description || '',
      categorie: entreprise.categorie,
      telephone: entreprise.telephone || '',
      email: entreprise.email || '',
      siteWeb: entreprise.siteWeb || '',
      whatsapp: entreprise.whatsapp || '',
      adresse: entreprise.adresse || '',
      ville: entreprise.ville || '',
      quartier: entreprise.quartier || '',
      facebookUrl: entreprise.facebookUrl || '',
      instagramUrl: entreprise.instagramUrl || ''
    });
  }

  // ============================================================
  // FILE UPLOAD
  // ============================================================

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validation
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Le fichier doit être une image', 'OK', { duration: 3000 });
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        this.snackBar.open('L\'image ne doit pas dépasser 2 Mo', 'OK', { duration: 3000 });
        return;
      }
      
      this.logoFile = file;
      
      // Preview
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Le fichier doit être une image', 'OK', { duration: 3000 });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('L\'image ne doit pas dépasser 5 Mo', 'OK', { duration: 3000 });
        return;
      }
      
      this.bannerFile = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.bannerPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    this.logoFile = null;
    this.logoPreview = null;
  }

  removeBanner(): void {
    this.bannerFile = null;
    this.bannerPreview = null;
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    
    const request: CreateEntrepriseRequest = {
      nom: this.form.value.nom.trim(),
      slogan: this.form.value.slogan?.trim() || undefined,
      description: this.form.value.description?.trim() || undefined,
      categorie: this.form.value.categorie as CategorieEntreprise,
      telephone: this.form.value.telephone?.trim() || undefined,
      email: this.form.value.email?.trim() || undefined,
      siteWeb: this.form.value.siteWeb?.trim() || undefined,
      whatsapp: this.form.value.whatsapp?.trim() || undefined,
      adresse: this.form.value.adresse?.trim() || undefined,
      ville: this.form.value.ville?.trim() || undefined,
      quartier: this.form.value.quartier?.trim() || undefined,
      facebookUrl: this.form.value.facebookUrl?.trim() || undefined,
      instagramUrl: this.form.value.instagramUrl?.trim() || undefined
    };

    if (this.isEditMode && this.entrepriseId) {
      this.updateEntreprise(request);
    } else {
      this.createEntreprise(request);
    }
  }

  private createEntreprise(request: CreateEntrepriseRequest): void {
    this.partenaireService.createEntreprise(request).subscribe({
      next: (entreprise) => {
        // Upload des fichiers si présents
        this.uploadFiles(entreprise.id);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Erreur création:', err);
        this.snackBar.open(
          this.translateService.instant('partenaire.entreprises.form.error'), 
          'OK', 
          { duration: 3000 }
        );
      }
    });
  }

  private updateEntreprise(request: CreateEntrepriseRequest): void {
    this.partenaireService.updateEntreprise(this.entrepriseId!, request).subscribe({
      next: (entreprise) => {
        this.uploadFiles(entreprise.id);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Erreur mise à jour:', err);
        this.snackBar.open(
          this.translateService.instant('partenaire.entreprises.form.error'), 
          'OK', 
          { duration: 3000 }
        );
      }
    });
  }

  private uploadFiles(entrepriseId: number): void {
    const uploads: Promise<any>[] = [];

    if (this.logoFile) {
      uploads.push(
        this.partenaireService.uploadLogo(entrepriseId, this.logoFile).toPromise()
      );
    }

    if (this.bannerFile) {
      uploads.push(
        this.partenaireService.uploadBanner(entrepriseId, this.bannerFile).toPromise()
      );
    }

    if (uploads.length > 0) {
      Promise.all(uploads)
        .then(() => this.onSuccess())
        .catch(() => {
          // Les fichiers n'ont pas été uploadés mais l'entreprise a été créée
          this.snackBar.open('Entreprise créée mais erreur lors de l\'upload des images', 'OK', { duration: 5000 });
          this.router.navigate(['/partenaire/entreprises']);
        });
    } else {
      this.onSuccess();
    }
  }

  private onSuccess(): void {
    this.isSaving = false;
    this.snackBar.open(
      this.translateService.instant('partenaire.entreprises.form.success'), 
      'OK', 
      { duration: 3000 }
    );
    this.router.navigate(['/partenaire/entreprise']);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  cancel(): void {
    this.router.navigate(['/partenaire/entreprise']);
  }

  getTitle(): string {
    return this.isEditMode 
      ? this.translateService.instant('partenaire.entreprises.form.editTitle')
      : this.translateService.instant('partenaire.entreprises.form.createTitle');
  }
}