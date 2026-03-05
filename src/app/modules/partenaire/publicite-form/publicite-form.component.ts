// ============================================================
// MY2-0 - FORMULAIRE PUBLICITÉ
// Création et édition de publicité
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PubliciteDTO, EntrepriseDTO, EMPLACEMENTS_PUBLICITE, CreatePubliciteRequest, EmplacementPublicite } from '../../../core/models/partenaire.model';
import { PartenaireService } from '../../../core/services/partenaire.service';



@Component({
  selector: 'app-publicite-form',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './publicite-form.component.html',
  styleUrls: ['./publicite-form.component.scss']
})
export class PubliciteFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isLoading = false;
  isSaving = false;
  isEditMode = false;
  publiciteId: number | null = null;
  publicite: PubliciteDTO | null = null;
  
  // Données
  entreprises: EntrepriseDTO[] = [];
  emplacementsDisponibles: string[] = [];
  
  // Upload
  imageFile: File | null = null;
  imagePreview: string | null = null;
  
  // Options
  emplacements = EMPLACEMENTS_PUBLICITE;
  
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
    this.loadInitialData();
    
    // Vérifier si mode édition
    this.publiciteId = this.route.snapshot.params['id'] 
      ? +this.route.snapshot.params['id'] 
      : null;
    
    if (this.publiciteId) {
      this.isEditMode = true;
      this.loadPublicite();
    }

    // Vérifier si entreprise présélectionnée
    const entrepriseId = this.route.snapshot.queryParams['entreprise'];
    if (entrepriseId) {
      this.form.patchValue({ entrepriseId: +entrepriseId });
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
      // Contenu
      entrepriseId: [null, [Validators.required]],
      titre: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(200)]],
      lienCible: ['', [Validators.pattern(/^https?:\/\/.*/)]],
      
      // Emplacement
      emplacement: [''],
      
      // Période
      dateDebut: [new Date()],
      dateFin: [null],
      
      // Ciblage
      villesCibles: [''],
      
      // Options
      priorite: [5]
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;

    // Charger les entreprises
    const entSub = this.partenaireService.getMesEntreprises().subscribe({
      next: (entreprises) => {
        this.entreprises = entreprises;
        
        // Si une seule entreprise, la sélectionner automatiquement
        if (entreprises.length === 1) {
          this.form.patchValue({ entrepriseId: entreprises[0].id });
        }
      }
    });
    this.subscriptions.push(entSub);

    // Charger les emplacements disponibles
    const empSub = this.partenaireService.getEmplacementsDisponibles().subscribe({
      next: (emplacements) => {
        this.emplacementsDisponibles = emplacements;
        this.isLoading = false;
      },
      error: () => {
        // Fallback: tous les emplacements
        this.emplacementsDisponibles = this.emplacements.map(e => e.value);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(empSub);
  }

  private loadPublicite(): void {
    if (!this.publiciteId) return;
    
    this.isLoading = true;
    
    const sub = this.partenaireService.getPublicite(this.publiciteId).subscribe({
      next: (publicite) => {
        this.publicite = publicite;
        this.patchForm(publicite);
        this.imagePreview = publicite.imageUrl || null;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement publicité:', err);
        this.snackBar.open('Publicité non trouvée', 'OK', { duration: 3000 });
        this.router.navigate(['/partenaire/publicites']);
      }
    });
    this.subscriptions.push(sub);
  }

  private patchForm(publicite: PubliciteDTO): void {
    this.form.patchValue({
      entrepriseId: publicite.entrepriseId,
      titre: publicite.titre,
      description: publicite.description || '',
      lienCible: publicite.lienCible || '',
      emplacement: publicite.emplacement,
      dateDebut: publicite.dateDebut ? new Date(publicite.dateDebut) : null,
      dateFin: publicite.dateFin ? new Date(publicite.dateFin) : null,
      villesCibles: publicite.villesCibles?.join(', ') || '',
      priorite: publicite.priorite || 5
    });
  }

  // ============================================================
  // FILE UPLOAD
  // ============================================================

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validation
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Le fichier doit être une image', 'OK', { duration: 3000 });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('L\'image ne doit pas dépasser 5 Mo', 'OK', { duration: 3000 });
        return;
      }
      
      this.imageFile = file;
      
      // Preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.imageFile = null;
    this.imagePreview = null;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getEmplacementInfo(value: string): { label: string; dimensions: string } | null {
    const emp = this.emplacements.find(e => e.value === value);
    if (!emp) return null;
    return {
      label: this.translateService.instant(emp.labelKey),
      dimensions: emp.dimensions
    };
  }

  isEmplacementAvailable(value: string): boolean {
    return this.emplacementsDisponibles.includes(value);
  }

  getSelectedEmplacementDimensions(): string {
    const value = this.form.get('emplacement')?.value;
    if (!value) return '';
    const emp = this.emplacements.find(e => e.value === value);
    return emp ? emp.dimensions : '';
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  onSubmit(asBrouillon: boolean = false): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Vérifier l'image
    if (!this.imagePreview && !asBrouillon) {
      this.snackBar.open('Une image est requise pour soumettre', 'OK', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    
    const villesCiblesStr = this.form.value.villesCibles?.trim();
    const villesCibles = villesCiblesStr 
      ? villesCiblesStr.split(',').map((v: string) => v.trim()).filter((v: string) => v)
      : undefined;

    const request: CreatePubliciteRequest = {
      entrepriseId: this.form.value.entrepriseId,
      titre: this.form.value.titre.trim(),
      description: this.form.value.description?.trim() || undefined,
      lienCible: this.form.value.lienCible?.trim() || undefined,
      emplacement: this.form.value.emplacement as EmplacementPublicite,
      dateDebut: this.form.value.dateDebut?.toISOString(),
      dateFin: this.form.value.dateFin?.toISOString() || undefined,
      villesCibles: villesCibles,
      priorite: this.form.value.priorite
  

    };

    if (this.isEditMode && this.publiciteId) {
      this.updatePublicite(request, asBrouillon);
    } else {
      this.createPublicite(request, asBrouillon);
    }
  }

  private createPublicite(request: CreatePubliciteRequest, asBrouillon: boolean): void {
    this.partenaireService.createPublicite(request, asBrouillon).subscribe({
      next: (publicite) => {
        if (this.imageFile) {
          this.uploadImage(publicite.id, asBrouillon);
        } else {
          this.onSuccess(asBrouillon);
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Erreur création:', err);
        this.snackBar.open(
          this.translateService.instant('partenaire.publicites.form.error'), 
          'OK', 
          { duration: 3000 }
        );
      }
    });
  }

  private updatePublicite(request: CreatePubliciteRequest, asBrouillon: boolean): void {
    this.partenaireService.updatePublicite(this.publiciteId!, request, asBrouillon).subscribe({
      next: (publicite) => {
        if (this.imageFile) {
          this.uploadImage(publicite.id, asBrouillon);
        } else {
          this.onSuccess(asBrouillon);
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Erreur mise à jour:', err);
        this.snackBar.open(
          this.translateService.instant('partenaire.publicites.form.error'), 
          'OK', 
          { duration: 3000 }
        );
      }
    });
  }

  private uploadImage(publiciteId: number, asBrouillon: boolean): void {
    if (!this.imageFile) {
      this.onSuccess(asBrouillon);
      return;
    }

    this.partenaireService.uploadPubliciteImage(publiciteId, this.imageFile).subscribe({
      next: () => {
        this.onSuccess(asBrouillon);
      },
      error: () => {
        this.snackBar.open('Publicité créée mais erreur lors de l\'upload de l\'image', 'OK', { duration: 5000 });
        this.router.navigate(['/partenaire/publicite']);
      }
    });
  }

  private onSuccess(asBrouillon: boolean): void {
    this.isSaving = false;
    const message = asBrouillon 
      ? this.translateService.instant('partenaire.publicites.form.success')
      : this.translateService.instant('partenaire.publicites.form.submitted');
    
    this.snackBar.open(message, 'OK', { duration: 3000 });
    this.router.navigate(['/partenaire/publicites']);
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  cancel(): void {
    this.router.navigate(['/partenaire/publicite']);
  }

  getTitle(): string {
    return this.isEditMode 
      ? this.translateService.instant('partenaire.publicites.form.editTitle')
      : this.translateService.instant('partenaire.publicites.form.createTitle');
  }
}