import { Component, OnInit, OnDestroy, Inject, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBottomSheet, MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslateModule } from '@ngx-translate/core';
import { PubliciteBannerComponent } from '../../../publicite/publicite-banner/publicite-banner.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ObjectifsService } from '../../../../core/services/objectifs.service';
import { GroupeContextService } from '../../../../core/services/groupe-context.service';
import { ObjectifDTO } from '../../../../core/models/objectifs.model';


// ── Interfaces alignées sur ObjectifDTO backend ──────────────

export interface MonGroupe { groupeId: number; nom: string; }

@Component({
  selector: 'app-objectifs',
  standalone: true,
  imports: [
    FormsModule, CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule,
    MatPaginatorModule, MatSortModule, MatProgressSpinnerModule, MatDialogModule,
    MatDatepickerModule, MatExpansionModule, MatProgressBarModule, MatListModule,
    MatBottomSheetModule, MatTooltipModule, MatChipsModule, MatSlideToggleModule,
    TranslateModule, PubliciteBannerComponent,
  ],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, height: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, height: 0, overflow: 'hidden' }))
      ])
    ])
  ],
  templateUrl: './objectifs.component.html',
  styleUrl: './objectifs.component.scss'
})
export class ObjectifsComponent implements OnInit, OnDestroy {

  private destroy$      = new Subject<void>();
  private authService   = inject(AuthService);
  private objectifsSvc  = inject(ObjectifsService);
  private groupeContext = inject(GroupeContextService);
  private fb            = inject(FormBuilder);
  private snackBar      = inject(MatSnackBar);
  private bottomSheet   = inject(MatBottomSheet);

  // ── State ─────────────────────────────────────────────────
  objectifs: ObjectifDTO[]     = [];
  mesGroupes: MonGroupe[]      = [];
  isLoading                    = true;
  isSaving                     = false;
  activeTab: 'list' | 'form'   = 'list';
  activeListFilter: 'tous' | 'personnel' | 'groupe' = 'tous';
  editingObjectif: ObjectifDTO | null = null;
  isResponsable                = false;
  userVille: string | undefined;

  // ── Formulaire ────────────────────────────────────────────
  objectifForm: FormGroup;

  // Types disponibles
  readonly types = [
    { value: 'BUTS',      label: 'Buts marqués',      icon: 'sports_soccer' },
    { value: 'PASSES',    label: 'Passes décisives',   icon: 'arrow_forward' },
    { value: 'PRESENCE',  label: 'Matchs joués',       icon: 'check_circle'  },
    { value: 'CARTON',    label: 'Cartons',            icon: 'warning'       },
    { value: 'MOTM',      label: 'Homme du match',     icon: 'star'          },
    { value: 'MVP_EQUIPE',label: 'MVP Équipe',         icon: 'emoji_events'  },
  ];

  constructor() {
    this.objectifForm = this.fb.group({
      type:         ['',   Validators.required],
      valeurCible:  [null, [Validators.required, Validators.min(1)]],
      dateDebut:    [null, Validators.required],
      dateFin:      [null, Validators.required],
      titre:        [''],
      description:  [''],
      // Scope
      scopeGlobal:  [false],    // toggle : false = groupe spécifique, true = tous groupes
      groupeId:     [null],     // null si global
      // Pour responsable
      pourTousMembres: [true],  // toggle : tous les membres ou membres spécifiques
    });

    // Quand scopeGlobal change → vider groupeId si global
    this.objectifForm.get('scopeGlobal')?.valueChanges.subscribe(global => {
      if (global) {
        this.objectifForm.patchValue({ groupeId: null });
        this.objectifForm.get('groupeId')?.clearValidators();
      } else {
        this.objectifForm.get('groupeId')?.setValidators(Validators.required);
      }
      this.objectifForm.get('groupeId')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.isResponsable = this.authService.isResponsable();
    this.mesGroupes    = this.authService.getMesGroupesCache()
      .map(g => ({ groupeId: g.groupeId, nom: g.nom }));

    // Pré-remplir le groupeId avec le groupe actif
    const groupeActif = this.authService.getGroupe();
    if (groupeActif) {
      this.objectifForm.patchValue({ groupeId: groupeActif });
    }

    this.loadObjectifs();

    // Recharger au switch de groupe
    this.groupeContext.groupeChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadObjectifs());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Chargement ────────────────────────────────────────────

  loadObjectifs(): void {
    this.isLoading = true;
    this.objectifsSvc.getMesObjectifs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.objectifs = data || [];
          this.isLoading = false;
        },
        error: () => {
          this.snackBar.open('Erreur lors du chargement des objectifs', 'Fermer', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  // ── Filtres de la liste ───────────────────────────────────

  get objectifsFiltres(): ObjectifDTO[] {
    switch (this.activeListFilter) {
      case 'personnel':
        return this.objectifs.filter(o =>
          o.scope === 'PERSONNEL_GLOBAL' || o.scope === 'PERSONNEL_GROUPE');
      case 'groupe':
        return this.objectifs.filter(o =>
          o.scope === 'GROUPE_GLOBAL' || o.scope === 'GROUPE_SPECIFIQUE');
      default:
        return this.objectifs;
    }
  }

  // ── Formulaire ────────────────────────────────────────────

  openCreateForm(): void {
    this.editingObjectif = null;
    this.objectifForm.reset({
      scopeGlobal: false,
      pourTousMembres: true,
      groupeId: this.authService.getGroupe()
    });
    this.activeTab = 'form';
  }

  editObjectif(objectif: ObjectifDTO): void {
    this.editingObjectif = objectif;
    this.objectifForm.patchValue({
      type:         objectif.type,
      valeurCible:  objectif.valeurCible,
      dateDebut:    new Date(objectif.dateDebut),
      dateFin:      new Date(objectif.dateFin),
      titre:        objectif.titre,
      description:  objectif.description,
      scopeGlobal:  !objectif.groupeId,
      groupeId:     objectif.groupeId ?? null,
    });
    this.activeTab = 'form';
  }

  onSubmit(): void {
    if (!this.objectifForm.valid) return;

    this.isSaving = true;
    const f = this.objectifForm.value;

    const isPersonnel = !this.isResponsable ||
      (f.scopeGlobal && !f.groupeId) ||
      (f.groupeId && !f.pourTousMembres === false);

    const payload = {
      type:        f.type,
      valeurCible: f.valeurCible,
      dateDebut:   f.dateDebut,
      dateFin:     f.dateFin,
      titre:       f.titre,
      description: f.description,
      groupeId:    f.scopeGlobal ? null : f.groupeId,
    };

    const call$ = this.editingObjectif
      ? this.objectifsSvc.updateObjectif(this.editingObjectif.id, payload)
      : this.isResponsable && !f.scopeGlobal
        ? this.objectifsSvc.creerObjectifGroupe({
            ...payload,
            membreIds: f.pourTousMembres ? [] : [],  // [] = tous les membres
          })
        : this.objectifsSvc.creerObjectifPersonnel(payload);

    call$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open(
          this.editingObjectif ? 'Objectif modifié !' : 'Objectif créé !',
          'Fermer', { duration: 3000 }
        );
        this.editingObjectif = null;
        this.objectifForm.reset();
        this.activeTab = 'list';
        this.loadObjectifs();
        this.isSaving = false;
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'enregistrement', 'Fermer', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  cancelEdit(): void {
    this.editingObjectif = null;
    this.objectifForm.reset();
    this.activeTab = 'list';
  }

  deleteObjectif(objectif: ObjectifDTO): void {
    if (!confirm('Supprimer cet objectif ?')) return;
    this.objectifsSvc.deleteObjectif(objectif.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Objectif supprimé', 'Fermer', { duration: 3000 });
          this.loadObjectifs();
        },
        error: () => this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 })
      });
  }

  // ── Helpers ───────────────────────────────────────────────

  getScopeLabel(scope: string): string {
    const map: Record<string, string> = {
      PERSONNEL_GLOBAL:   'Personnel · Tous groupes',
      PERSONNEL_GROUPE:   'Personnel · 1 groupe',
      GROUPE_GLOBAL:      'Groupe · Tous membres',
      GROUPE_SPECIFIQUE:  'Groupe · Pour moi',
    };
    return map[scope] ?? scope;
  }

  getScopeColor(scope: string): string {
    const map: Record<string, string> = {
      PERSONNEL_GLOBAL:  '#6366f1',
      PERSONNEL_GROUPE:  '#2563eb',
      GROUPE_GLOBAL:     '#059669',
      GROUPE_SPECIFIQUE: '#d97706',
    };
    return map[scope] ?? '#64748b';
  }

  getScopeIcon(scope: string): string {
    const map: Record<string, string> = {
      PERSONNEL_GLOBAL:  'public',
      PERSONNEL_GROUPE:  'person',
      GROUPE_GLOBAL:     'groups',
      GROUPE_SPECIFIQUE: 'assignment_ind',
    };
    return map[scope] ?? 'flag';
  }

  getObjectifStatus(objectif: ObjectifDTO): 'completed' | 'expired' | 'in-progress' {
    if (objectif.atteint)  return 'completed';
    if (objectif.expire)   return 'expired';
    return 'in-progress';
  }

  getObjectifStatusLabel(objectif: ObjectifDTO): string {
    const s = this.getObjectifStatus(objectif);
    return s === 'completed' ? 'Objectif atteint !' : s === 'expired' ? 'Expiré' : 'En cours…';
  }

  getObjectifStatusIcon(objectif: ObjectifDTO): string {
    const s = this.getObjectifStatus(objectif);
    return s === 'completed' ? 'check_circle' : s === 'expired' ? 'schedule' : 'timer';
  }

  getProgressBarValue(objectif: ObjectifDTO): number {
    return objectif.pourcentage ?? 0;
  }

  getProgressBarColor(objectif: ObjectifDTO): 'primary' | 'accent' | 'warn' {
    const s = this.getObjectifStatus(objectif);
    return s === 'completed' ? 'primary' : s === 'expired' ? 'warn' : 'accent';
  }

  getTypeIcon(type: string): string {
    return this.types.find(t => t.value === type)?.icon ?? 'flag';
  }

  getTypeLabel(type: string): string {
    return this.types.find(t => t.value === type)?.label ?? type;
  }

  // Partage
  shareObjectif(objectif: ObjectifDTO): void {
    const text = `🎯 ${this.getTypeLabel(objectif.type)}\n📊 ${objectif.valeurActuelle}/${objectif.valeurCible} (${objectif.pourcentage}%)\n${objectif.groupeNom}`;
    if (navigator.share) {
      navigator.share({ title: 'Mon objectif My2-0', text, url: window.location.href });
    } else {
      this.bottomSheet.open(ShareBottomSheetComponent, { data: { title: 'Mon objectif', text } });
    }
  }
}

// ── Share bottom sheet ────────────────────────────────────────
@Component({
  selector: 'app-share-bottom-sheet',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule],
  template: `
    <div style="padding:16px 0">
      <h3 style="margin:0 0 8px;padding:0 16px 16px;font-size:18px;font-weight:600;border-bottom:1px solid #e0e0e0">
        Partager cet objectif
      </h3>
      <mat-nav-list>
        <a mat-list-item (click)="copy()"><mat-icon matListItemIcon>content_copy</mat-icon><span matListItemTitle>Copier</span></a>
        <a mat-list-item (click)="whatsapp()"><mat-icon matListItemIcon>chat</mat-icon><span matListItemTitle>WhatsApp</span></a>
      </mat-nav-list>
      <button mat-button (click)="close()" style="width:100%;margin-top:8px">Annuler</button>
    </div>
  `
})
export class ShareBottomSheetComponent {
  constructor(
    private bs: MatBottomSheet,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { title: string; text: string }
  ) {}
  copy()     { navigator.clipboard.writeText(this.data.text).then(() => this.bs.dismiss('copied')); }
  whatsapp() { window.open(`https://wa.me/?text=${encodeURIComponent(this.data.text)}`, '_blank'); this.close(); }
  close()    { this.bs.dismiss(); }
}