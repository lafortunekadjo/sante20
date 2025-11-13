import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AnnoncesService } from "../../../core/services/annonces.service";
import { CommonModule } from "@angular/common";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatNativeDateModule, MatOptionModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatChipsModule } from "@angular/material/chips";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TruncatePipe } from "../../../core/pipes/truncate.pipe";
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from "rxjs";
import { trigger, state, style, transition, animate, query, stagger } from "@angular/animations";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDividerModule } from "@angular/material/divider";

interface Annonce {
  id: number;
  titre: string;
  contenu: string;
  groupeId?: number;
  equipeId?: number;
  roleCible?: string;
  actifSeulement: boolean;
  urgente?: boolean;
  accuseReception?: boolean;
  dateCreation: Date;
  dateEnvoi?: Date;
  envoyee: boolean;
  programmee: boolean;
  destinatairesCount?: number;
  readCount?: number;
}

interface Groupe {
  id: number;
  nom: string;
}

interface Equipe {
  id: number;
  nom: string;
  couleur: string;
  groupeId?: number;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule, 
    MatOptionModule, 
    MatSelectModule,
    MatFormFieldModule, 
    TranslateModule, 
    MatIconModule, 
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    TruncatePipe,
    MatTooltipModule,
    MatDividerModule

  ],
  templateUrl: './creer-annonce.component.html',
  styleUrls: ['./creer-annonce.component.scss'],
  animations: [
    trigger('slideToggle', [
      state('false', style({ height: '0', opacity: '0', overflow: 'hidden' })),
      state('true', style({ height: '*', opacity: '1', overflow: 'visible' })),
      transition('false <=> true', animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)'))
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class CreerAnnonceComponent implements OnInit, OnDestroy {
  
  // Formulaire et données
  form!: FormGroup;
  annonces: Annonce[] = [];
  filteredAnnonces: Annonce[] = [];
  paginatedAnnonces: Annonce[] = [];
  groupes: Groupe[] = [];
  equipes: Equipe[] = [];
  filteredEquipes: Equipe[] = [];
  
  // États UI
  showCreationForm = false;
  isEditing = false;
  editingId: number | null = null;
  isSubmitting = false;
  
  // Filtres et recherche
  selectedStatusFilter = 'all';
  searchQuery = '';
  private searchSubject = new Subject<string>();
  
  // Pagination
  pageSize = 10;
  currentPage = 0;
  
  // Date minimum pour la programmation
  minDate = new Date();
  
  // Destruction du composant
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private annonceService: AnnoncesService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private dialog: MatDialog
  ) {
    this.initializeSearchDebounce();
  }

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise le formulaire
   */
  private initForm(): void {
    this.form = this.fb.group({
      titre: ['', [Validators.required, Validators.maxLength(200)]],
      contenu: ['', [Validators.required, Validators.maxLength(1000)]],
      groupeId: [null],
      equipeId: [null],
      roleCible: [null],
      actifSeulement: [true],
      urgente: [false],
      accuseReception: [false],
      isScheduled: [false],
      dateEnvoiDate: [null],
      dateEnvoiHeure: [null]
    });

    // Surveillance des changements pour la validation de la programmation
    this.form.get('isScheduled')?.valueChanges.subscribe(isScheduled => {
      const dateControl = this.form.get('dateEnvoiDate');
      const timeControl = this.form.get('dateEnvoiHeure');
      
      if (isScheduled) {
        dateControl?.setValidators([Validators.required]);
        timeControl?.setValidators([Validators.required]);
      } else {
        dateControl?.clearValidators();
        timeControl?.clearValidators();
      }
      
      dateControl?.updateValueAndValidity();
      timeControl?.updateValueAndValidity();
    });

    // Surveillance des changements de groupe pour filtrer les équipes
    this.form.get('groupeId')?.valueChanges.subscribe(groupeId => {
      this.onGroupChange({ value: groupeId });
      // Reset équipe si changement de groupe
      if (this.form.get('equipeId')?.value) {
        this.form.patchValue({ equipeId: null });
      }
    });
  }

  /**
   * Initialise la recherche avec debounce
   */
  private initializeSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.filterAnnouncements();
    });
  }

  /**
   * Charge les données
   */
  private loadData(): void {
    // Charger groupes et équipes
    this.loadGroupesAndEquipes();
    
    // Charger les annonces
    this.loadAnnouncements();
  }

  /**
   * Charge les groupes et équipes
   */
  private loadGroupesAndEquipes(): void {
    // Mock data - remplace par tes vrais services
    this.groupes = [
      { id: 1, nom: 'Groupe A' },
      { id: 2, nom: 'Groupe B' },
      { id: 3, nom: 'Groupe C' }
    ];
    
    this.equipes = [
      { id: 1, nom: 'Rouge', couleur: '#f44336', groupeId: 1 },
      { id: 2, nom: 'Bleue', couleur: '#2196f3', groupeId: 1 },
      { id: 3, nom: 'Verte', couleur: '#4caf50', groupeId: 2 },
      { id: 4, nom: 'Jaune', couleur: '#ffeb3b', groupeId: 2 },
      { id: 5, nom: 'Violette', couleur: '#9c27b0', groupeId: 3 },
      { id: 6, nom: 'Orange', couleur: '#ff9800', groupeId: 3 }
    ];
    
    this.filteredEquipes = this.equipes;
  }

  /**
   * Charge les annonces
   */
  private loadAnnouncements(): void {
    this.annonceService.getMesAnnonces().subscribe({
      next: (data) => {
        this.annonces = data;
        this.filterAnnouncements();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des annonces:', error);
        this.showError(this.translate.instant('announcements.loadError'));
      }
    });
  }

  /**
   * Bascule l'affichage du formulaire de création
   */
  toggleCreationForm(): void {
    if (this.showCreationForm && !this.isEditing) {
      this.resetForm();
    }
    this.showCreationForm = !this.showCreationForm;
  }

  /**
   * Gestion du changement de groupe
   */
  onGroupChange(event: any): void {
    const groupeId = event.value;
    if (groupeId) {
      this.filteredEquipes = this.equipes.filter(e => e.groupeId === groupeId);
    } else {
      this.filteredEquipes = this.equipes;
    }
  }

  /**
   * Bascule la programmation
   */
  onScheduleToggle(event: any): void {
    const isScheduled = event.checked;
    if (!isScheduled) {
      this.form.patchValue({
        dateEnvoiDate: null,
        dateEnvoiHeure: null
      });
    } else {
      // Définir une heure par défaut
      const now = new Date();
      const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      this.form.patchValue({
        dateEnvoiHeure: defaultTime
      });
    }
  }

  /**
   * Efface la programmation
   */
  clearScheduling(): void {
    this.form.patchValue({
      isScheduled: false,
      dateEnvoiDate: null,
      dateEnvoiHeure: null
    });
  }

  /**
   * Combine date et heure pour la programmation
   */
  private combineDateTime(): string | null {
    const date = this.form.get('dateEnvoiDate')?.value;
    const time = this.form.get('dateEnvoiHeure')?.value;

    if (!date || !time) return null;

    const [hours, minutes] = time.split(':');
    const combined = new Date(date);
    combined.setHours(+hours, +minutes, 0, 0);
    return combined.toISOString();
  }

  /**
   * Soumet le formulaire
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    const payload = {
      ...this.form.value,
      dateEnvoi: this.combineDateTime()
    };

    // Nettoyer les champs non utilisés
    delete payload.isScheduled;
    if (!payload.dateEnvoi) {
      delete payload.dateEnvoiDate;
      delete payload.dateEnvoiHeure;
    }

    const operation = this.isEditing 
      ? this.annonceService.modifier(this.editingId!, payload)
      : this.annonceService.creer(payload);

    operation.subscribe({
      next: () => {
        const messageKey = this.isEditing 
          ? 'announcements.updateSuccess'
          : payload.dateEnvoi 
            ? 'announcements.scheduleSuccess'
            : 'announcements.sendSuccess';

        this.showSuccess(this.translate.instant(messageKey));
        this.resetForm();
        this.showCreationForm = false;
        this.loadAnnouncements();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Erreur lors de la soumission:', error);
        this.showError(this.translate.instant('announcements.submitError'));
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Sauvegarde comme brouillon
   */
  saveAsDraft(): void {
    if (!this.canSaveAsDraft()) return;

    // Implémentation de la sauvegarde brouillon
    const payload = {
      ...this.form.value,
      dateEnvoi: this.combineDateTime(),
      brouillon: true
    };

    this.annonceService.sauvegarderBrouillon(payload).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('announcements.draftSaved'));
        this.loadAnnouncements();
      },
      error: (error) => {
        console.error('Erreur sauvegarde brouillon:', error);
        this.showError(this.translate.instant('announcements.draftError'));
      }
    });
  }

  /**
   * Prévisualise l'annonce
   */
  previewAnnouncement(): void {
    if (this.form.invalid) return;

    // Ouvrir une modal de prévisualisation
    // this.dialog.open(AnnouncementPreviewComponent, {
    //   width: '600px',
    //   data: this.form.value
    // });
    
    // Pour l'instant, juste un snackbar
    this.showInfo(this.translate.instant('announcements.previewOpened'));
  }

  /**
   * Édite une annonce
   */
  editAnnouncement(announcement: Annonce): void {
    this.isEditing = true;
    this.editingId = announcement.id;
    this.showCreationForm = true;

    // Remplir le formulaire avec les données de l'annonce
    const formData: any = {
      titre: announcement.titre,
      contenu: announcement.contenu,
      groupeId: announcement.groupeId || null,
      equipeId: announcement.equipeId || null,
      roleCible: announcement.roleCible || null,
      actifSeulement: announcement.actifSeulement,
      urgente: announcement.urgente || false,
      accuseReception: announcement.accuseReception || false,
      isScheduled: !!announcement.dateEnvoi && !announcement.envoyee,
      dateEnvoiDate: null,
      dateEnvoiHeure: null
    };

    // Si l'annonce est programmée, extraire date et heure
    if (announcement.dateEnvoi && !announcement.envoyee) {
      const date = new Date(announcement.dateEnvoi);
      formData.dateEnvoiDate = date;
      formData.dateEnvoiHeure = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    this.form.patchValue(formData);

    // Mettre à jour les équipes filtrées si nécessaire
    if (formData.groupeId) {
      this.onGroupChange({ value: formData.groupeId });
    }
  }

  /**
   * Duplique une annonce
   */
  duplicateAnnouncement(announcement: Annonce): void {
    this.isEditing = false;
    this.editingId = null;
    this.showCreationForm = true;

    const formData = {
      titre: `${announcement.titre} (copie)`,
      contenu: announcement.contenu,
      groupeId: announcement.groupeId || null,
      equipeId: announcement.equipeId || null,
      roleCible: announcement.roleCible || null,
      actifSeulement: announcement.actifSeulement,
      urgente: announcement.urgente || false,
      accuseReception: announcement.accuseReception || false,
      isScheduled: false,
      dateEnvoiDate: null,
      dateEnvoiHeure: null
    };

    this.form.patchValue(formData);

    if (formData.groupeId) {
      this.onGroupChange({ value: formData.groupeId });
    }
  }

  /**
   * Supprime une annonce
   */
  deleteAnnouncement(id: number): void {
    if (!confirm(this.translate.instant('announcements.confirmDelete'))) {
      return;
    }

    this.annonceService.supprimer(id).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('announcements.deleteSuccess'));
        this.loadAnnouncements();
      },
      error: (error) => {
        console.error('Erreur suppression:', error);
        this.showError(this.translate.instant('announcements.deleteError'));
      }
    });
  }

  /**
   * Envoie une annonce maintenant
   */
  sendNow(id: number): void {
    if (!confirm(this.translate.instant('announcements.confirmSendNow'))) {
      return;
    }

    this.annonceService.envoyerMaintenant(id).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('announcements.sentNow'));
        this.loadAnnouncements();
      },
      error: (error) => {
        console.error('Erreur envoi:', error);
        this.showError(this.translate.instant('announcements.sendError'));
      }
    });
  }

  /**
   * Filtre les annonces
   */
  private filterAnnouncements(): void {
    let filtered = [...this.annonces];

    // Filtre par statut
    if (this.selectedStatusFilter !== 'all') {
      filtered = filtered.filter(a => {
        switch (this.selectedStatusFilter) {
          case 'draft': return !a.envoyee && !a.programmee;
          case 'scheduled': return a.programmee && !a.envoyee;
          case 'sent': return a.envoyee;
          default: return true;
        }
      });
    }

    // Filtre par recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.titre.toLowerCase().includes(query) ||
        a.contenu.toLowerCase().includes(query)
      );
    }

    this.filteredAnnonces = filtered;
    this.currentPage = 0; // Reset pagination
    this.updatePaginatedAnnouncements();
  }

  /**
   * Met à jour les annonces paginées
   */
  private updatePaginatedAnnouncements(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedAnnonces = this.filteredAnnonces.slice(startIndex, endIndex);
  }

  /**
   * Gestion du changement de page
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedAnnouncements();
  }

  /**
   * Gestion du changement de filtre de statut
   */
  onStatusFilterChange(): void {
    this.filterAnnouncements();
  }

  /**
   * Gestion du changement de recherche
   */
  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  /**
   * Efface la recherche
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchChange();
  }

  /**
   * Crée la première annonce
   */
  createFirstAnnouncement(): void {
    this.showCreationForm = true;
  }

  /**
   * Reset du formulaire
   */
  private resetForm(): void {
    this.form.reset({
      actifSeulement: true,
      urgente: false,
      accuseReception: false,
      isScheduled: false
    });
    this.isEditing = false;
    this.editingId = null;
  }

  /**
   * Marque tous les champs comme touchés
   */
  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // ===== GETTERS POUR LE TEMPLATE =====

  /**
   * Obtient la longueur du message
   */
  getMessageLength(): number {
    return this.form.get('contenu')?.value?.length || 0;
  }

  /**
   * Obtient le nombre estimé de destinataires
   */
  getEstimatedRecipients(): number {
    // Logique pour estimer le nombre de destinataires
    // basée sur les filtres sélectionnés
    return 42; // Mock
  }

  /**
   * Obtient le groupe sélectionné
   */
  getSelectedGroup(): Groupe | null {
    const groupeId = this.form.get('groupeId')?.value;
    return groupeId ? this.groupes.find(g => g.id === groupeId) || null : null;
  }

  /**
   * Obtient l'équipe sélectionnée
   */
  getSelectedTeam(): Equipe | null {
    const equipeId = this.form.get('equipeId')?.value;
    return equipeId ? this.equipes.find(e => e.id === equipeId) || null : null;
  }

  /**
   * Obtient le rôle sélectionné
   */
  getSelectedRole(): string | null {
    const role = this.form.get('roleCible')?.value;
    return role ? `roles.${role.toLowerCase()}` : null;
  }

  /**
   * Obtient la date/heure programmée
   */
  getScheduledDateTime(): Date | null {
    if (!this.form.get('isScheduled')?.value) return null;
    
    const dateEnvoi = this.combineDateTime();
    return dateEnvoi ? new Date(dateEnvoi) : null;
  }

  /**
   * Vérifie si on peut sauvegarder comme brouillon
   */
  canSaveAsDraft(): boolean {
    const titre = this.form.get('titre')?.value;
    const contenu = this.form.get('contenu')?.value;
    return !!(titre?.trim() || contenu?.trim());
  }

  /**
   * Obtient le texte d'info pour les actions
   */
  getActionInfoText(): string {
    if (this.form.get('isScheduled')?.value) {
      return this.translate.instant('announcements.willBeScheduled');
    }
    return this.translate.instant('announcements.willBeSentImmediately');
  }

  /**
   * Obtient l'icône du bouton submit
   */
  getSubmitIcon(): string {
    if (this.isEditing) return 'edit';
    return this.form.get('isScheduled')?.value ? 'schedule' : 'send';
  }

  /**
   * Obtient le texte du bouton submit
   */
  getSubmitText(): string {
    if (this.isEditing) {
      return this.translate.instant('announcements.updateAnnouncement');
    }
    return this.form.get('isScheduled')?.value 
      ? this.translate.instant('announcements.scheduleAnnouncement')
      : this.translate.instant('announcements.sendNow');
  }

  /**
   * Obtient la classe CSS pour le statut
   */
  getStatusClass(announcement: Annonce): string {
    if (announcement.envoyee) return 'sent';
    if (announcement.programmee) return 'scheduled';
    return 'draft';
  }

  /**
   * Obtient l'icône pour le statut
   */
  getStatusIcon(announcement: Annonce): string {
    if (announcement.envoyee) return 'check_circle';
    if (announcement.programmee) return 'schedule';
    return 'draft';
  }

  /**
   * Obtient le texte du statut
   */
  getStatusText(announcement: Annonce): string {
    if (announcement.envoyee) return this.translate.instant('announcements.sent');
    if (announcement.programmee) return this.translate.instant('announcements.scheduled');
    return this.translate.instant('announcements.draft');
  }

  /**
   * Obtient le texte de ciblage
   */
  getCiblageText(announcement: Annonce): string {
    const parts: string[] = [];
    
    if (announcement.groupeId) {
      const groupe = this.groupes.find(g => g.id === announcement.groupeId);
      if (groupe) parts.push(groupe.nom);
    }
    
    if (announcement.equipeId) {
      const equipe = this.equipes.find(e => e.id === announcement.equipeId);
      if (equipe) parts.push(equipe.nom);
    }
    
    if (announcement.roleCible) {
      parts.push(this.translate.instant(`roles.${announcement.roleCible.toLowerCase()}`));
    }
    
    if (announcement.actifSeulement) {
      parts.push(this.translate.instant('announcements.activeOnly'));
    }
    
    return parts.length ? parts.join(' • ') : this.translate.instant('announcements.everyone');
  }

  /**
   * Obtient le titre de l'état vide
   */
  getEmptyStateTitle(): string {
    if (this.searchQuery || this.selectedStatusFilter !== 'all') {
      return this.translate.instant('announcements.noMatchingAnnouncements');
    }
    return this.translate.instant('announcements.noAnnouncements');
  }

  /**
   * Obtient le message de l'état vide
   */
  getEmptyStateMessage(): string {
    if (this.searchQuery || this.selectedStatusFilter !== 'all') {
      return this.translate.instant('announcements.tryDifferentFilters');
    }
    return this.translate.instant('announcements.createFirstMessage');
  }

  /**
   * TrackBy pour les annonces
   */
  trackByAnnouncementId(index: number, announcement: Annonce): number {
    return announcement.id;
  }

  // ===== UTILITAIRES =====

  private showSuccess(message: string): void {
    this.snackBar.open(message, this.translate.instant('common.close'), {
      duration: 4000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, this.translate.instant('common.close'), {
      duration: 6000,
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, this.translate.instant('common.close'), {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }
}