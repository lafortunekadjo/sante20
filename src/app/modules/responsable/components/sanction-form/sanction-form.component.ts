import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Models
import { Match } from '../../../../core/models/match.model';
import { Membre } from '../../../../core/models/membre.model';
import { Sanction } from '../../../../core/models/sanction.model';
import { TypeSanction } from '../../../../core/models/typeSanction.model';

// Services
import { SanctionService } from '../../../../core/services/sanction.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { MembreService } from '../../../../core/services/membre.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

applyPlugin(jsPDF);

// ============ INTERFACES ============
interface SanctionFilters {
  search: string;
  typeId: number | null;
  status: string;
  dateDebut: Date | null;
  dateFin: Date | null;
  membreId: number | null;
  montantMin: number | null;
  montantMax: number | null;
}

interface SanctionStats {
  total: number;
  payees: number;
  nonPayees: number;
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  parType: { type: string; count: number; montant: number }[];
  parMembre: { membre: string; membreId: number; count: number; montant: number; paye: number }[];
}

interface GroupedSanction {
  membre: Membre;
  sanctions: Sanction[];
  totalMontant: number;
  totalPaye: number;
  totalRestant: number;
  countPayees: number;
  countNonPayees: number;
  expanded: boolean;
}

interface ExportOptions {
  groupByMembre: boolean;
  includePayees: boolean;
  includeNonPayees: boolean;
  includeStats: boolean;
  includeSummary: boolean;
  dateRange: boolean;
}

@Component({
  selector: 'app-sanction-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatBadgeModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatTabsModule,
    TranslateModule
  ],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ]),
    trigger('staggerList', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ],
  templateUrl: './sanction-form.component.html',
  styleUrls: ['./sanction-form.component.scss']
})
export class SanctionFormComponent implements OnInit, AfterViewInit, OnDestroy {
  
  private destroy$ = new Subject<void>();

  // ViewChild
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // États
  isLoading = true;
  showCreateForm = false;
  showAdvancedFilters = false;
  showExportDialog = false;
  viewMode: 'cards' | 'table' | 'grouped' = 'cards';

  // Données
  allSanctions: Sanction[] = [];
  filteredSanctions: Sanction[] = [];
  groupedSanctions: GroupedSanction[] = [];
  membres: Membre[] = [];
  typeSanctions: TypeSanction[] = [];
  matches: Match[] = [];
  
  // Table
  dataSource = new MatTableDataSource<Sanction>([]);
  displayedColumns = ['select', 'membre', 'typeSanction', 'dateSanction', 'match', 'montant', 'etat', 'actions'];

  // Sélection multiple
  selectedSanctions: Set<number> = new Set();
  selectAll = false;

  // Formulaire filtres
  filterForm: FormGroup;
  
  // Statistiques
  stats: SanctionStats = {
    total: 0,
    payees: 0,
    nonPayees: 0,
    montantTotal: 0,
    montantPaye: 0,
    montantRestant: 0,
    parType: [],
    parMembre: []
  };

  // Nouveau sanction
  newSanction: Partial<Sanction> & { equipeMatch?: string; selectedDate?: string } = this.getEmptySanction();

  // Edition
  editingRows: Map<number, boolean> = new Map();
  editSanction: Partial<Sanction> & { equipeMatch?: string; selectedDate?: string } = {};

  // Export options
  exportOptions: ExportOptions = {
    groupByMembre: true,
    includePayees: true,
    includeNonPayees: true,
    includeStats: true,
    includeSummary: true,
    dateRange: false
  };

  // Filtres rapides prédéfinis
  quickFilters = [
    { label: 'Toutes', value: 'all', icon: 'list', count: 0 },
    { label: 'Non payées', value: 'unpaid', icon: 'schedule', count: 0 },
    { label: 'Payées', value: 'paid', icon: 'check_circle', count: 0 },
    { label: 'Cette semaine', value: 'week', icon: 'date_range', count: 0 },
    { label: 'Ce mois', value: 'month', icon: 'calendar_today', count: 0 }
  ];
  activeQuickFilter = 'all';

  constructor(
    private fb: FormBuilder,
    private sanctionService: SanctionService,
    private presenceService: PresenceService,
    private membreService: MembreService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      typeId: [null],
      status: ['ALL'],
      dateDebut: [null],
      dateFin: [null],
      membreId: [null],
      montantMin: [null],
      montantMax: [null]
    });
  }

  // ============ LIFECYCLE ============

  ngOnInit(): void {
    this.restorePreferences();
    this.loadData();
    this.setupFilterListener();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.setupCustomSorting();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ CHARGEMENT DONNÉES ============

  loadData(): void {
    this.isLoading = true;
    
    forkJoin([
      this.sanctionService.getSanctionsAll(),
      this.membreService.getGroupMembers(),
      this.sanctionService.getTypeSanctions()
    ]).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([sanctions, membres, typeSanctions]) => {
          this.allSanctions = sanctions;
          this.membres = membres;
          this.typeSanctions = typeSanctions;
          
          this.applyFilters();
          this.calculateStats();
          this.updateQuickFilterCounts();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur chargement données:', err);
          this.isLoading = false;
          this.showError('Erreur lors du chargement des données');
        }
      });
  }

  // ============ FILTRES ============

  setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.activeQuickFilter = 'all';
        this.applyFilters();
      });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.allSanctions];

    // Recherche textuelle
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        this.getMembreName(s.membre).toLowerCase().includes(search) ||
        this.getTypeSanctionName(s.typeSanction).toLowerCase().includes(search) ||
        (s.commentaire && s.commentaire.toLowerCase().includes(search))
      );
    }

    // Type de sanction
    if (filters.typeId) {
      filtered = filtered.filter(s => {
        const typeId = typeof s.typeSanction === 'number' ? s.typeSanction : (s.typeSanction as TypeSanction)?.id;
        return typeId === filters.typeId;
      });
    }

    // Statut
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter(s => s.etat === filters.status);
    }

    // Date début
    if (filters.dateDebut) {
      const dateDebut = new Date(filters.dateDebut);
      dateDebut.setHours(0, 0, 0, 0);
      filtered = filtered.filter(s => new Date(s.dateSanction) >= dateDebut);
    }

    // Date fin
    if (filters.dateFin) {
      const dateFin = new Date(filters.dateFin);
      dateFin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(s => new Date(s.dateSanction) <= dateFin);
    }

    // Membre spécifique
    if (filters.membreId) {
      filtered = filtered.filter(s => {
        const membreId = typeof s.membre === 'number' ? s.membre : (s.membre as Membre)?.id;
        return membreId === filters.membreId;
      });
    }

    // Montant min
    if (filters.montantMin !== null && filters.montantMin !== undefined) {
      filtered = filtered.filter(s => s.montant >= filters.montantMin);
    }

    // Montant max
    if (filters.montantMax !== null && filters.montantMax !== undefined) {
      filtered = filtered.filter(s => s.montant <= filters.montantMax);
    }

    this.filteredSanctions = filtered;
    this.dataSource.data = filtered;
    this.updateGroupedSanctions();
    this.calculateFilteredStats();

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  applyQuickFilter(filterValue: string): void {
    this.activeQuickFilter = filterValue;
    this.filterForm.reset({
      search: '',
      typeId: null,
      status: 'ALL',
      dateDebut: null,
      dateFin: null,
      membreId: null,
      montantMin: null,
      montantMax: null
    }, { emitEvent: false });

    let filtered = [...this.allSanctions];
    const now = new Date();

    switch (filterValue) {
      case 'unpaid':
        filtered = filtered.filter(s => s.etat === 'NON_PAYEE');
        break;
      case 'paid':
        filtered = filtered.filter(s => s.etat === 'PAYEE');
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(s => new Date(s.dateSanction) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(s => new Date(s.dateSanction) >= monthAgo);
        break;
    }

    this.filteredSanctions = filtered;
    this.dataSource.data = filtered;
    this.updateGroupedSanctions();
    this.calculateFilteredStats();
  }

  updateQuickFilterCounts(): void {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    this.quickFilters[0].count = this.allSanctions.length;
    this.quickFilters[1].count = this.allSanctions.filter(s => s.etat === 'NON_PAYEE').length;
    this.quickFilters[2].count = this.allSanctions.filter(s => s.etat === 'PAYEE').length;
    this.quickFilters[3].count = this.allSanctions.filter(s => new Date(s.dateSanction) >= weekAgo).length;
    this.quickFilters[4].count = this.allSanctions.filter(s => new Date(s.dateSanction) >= monthStart).length;
  }

  hasActiveFilters(): boolean {
    const filters = this.filterForm.value;
    return !!(
      filters.search ||
      filters.typeId ||
      (filters.status && filters.status !== 'ALL') ||
      filters.dateDebut ||
      filters.dateFin ||
      filters.membreId ||
      filters.montantMin !== null ||
      filters.montantMax !== null
    );
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      typeId: null,
      status: 'ALL',
      dateDebut: null,
      dateFin: null,
      membreId: null,
      montantMin: null,
      montantMax: null
    });
    this.activeQuickFilter = 'all';
    this.applyFilters();
    this.showSuccess('Filtres réinitialisés');
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // ============ STATISTIQUES ============

  calculateStats(): void {
    this.stats = {
      total: this.allSanctions.length,
      payees: this.allSanctions.filter(s => s.etat === 'PAYEE').length,
      nonPayees: this.allSanctions.filter(s => s.etat === 'NON_PAYEE').length,
      montantTotal: this.allSanctions.reduce((sum, s) => sum + (s.montant || 0), 0),
      montantPaye: this.allSanctions.filter(s => s.etat === 'PAYEE').reduce((sum, s) => sum + (s.montant || 0), 0),
      montantRestant: this.allSanctions.filter(s => s.etat === 'NON_PAYEE').reduce((sum, s) => sum + (s.montant || 0), 0),
      parType: this.calculateStatsByType(),
      parMembre: this.calculateStatsByMembre()
    };
  }

  calculateFilteredStats(): void {
    // Stats sur les données filtrées (affichées dans le header)
  }

  calculateStatsByType(): { type: string; count: number; montant: number }[] {
    const typeMap = new Map<number, { type: string; count: number; montant: number }>();
    
    this.allSanctions.forEach(s => {
      const typeId = typeof s.typeSanction === 'number' ? s.typeSanction : (s.typeSanction as TypeSanction)?.id;
      const typeName = this.getTypeSanctionName(s.typeSanction);
      
      if (!typeMap.has(typeId)) {
        typeMap.set(typeId, { type: typeName, count: 0, montant: 0 });
      }
      
      const stat = typeMap.get(typeId)!;
      stat.count++;
      stat.montant += s.montant || 0;
    });

    return Array.from(typeMap.values()).sort((a, b) => b.count - a.count);
  }

  calculateStatsByMembre(): { membre: string; membreId: number; count: number; montant: number; paye: number }[] {
    const membreMap = new Map<number, { membre: string; membreId: number; count: number; montant: number; paye: number }>();
    
    this.allSanctions.forEach(s => {
      const membreId = typeof s.membre === 'number' ? s.membre : (s.membre as Membre)?.id;
      const membreName = this.getMembreName(s.membre);
      
      if (!membreMap.has(membreId)) {
        membreMap.set(membreId, { membre: membreName, membreId, count: 0, montant: 0, paye: 0 });
      }
      
      const stat = membreMap.get(membreId)!;
      stat.count++;
      stat.montant += s.montant || 0;
      if (s.etat === 'PAYEE') {
        stat.paye += s.montant || 0;
      }
    });

    return Array.from(membreMap.values()).sort((a, b) => b.montant - a.montant);
  }

  // ============ GROUPEMENT PAR MEMBRE ============

  updateGroupedSanctions(): void {
    const membreMap = new Map<number, GroupedSanction>();
    
    this.filteredSanctions.forEach(s => {
      const membreId = typeof s.membre === 'number' ? s.membre : (s.membre as Membre)?.id;
      const membreObj = this.membres.find(m => m.id === membreId);
      
      if (!membreMap.has(membreId)) {
        membreMap.set(membreId, {
          membre: membreObj || { id: membreId, nom: 'Inconnu', prenom: '' } as Membre,
          sanctions: [],
          totalMontant: 0,
          totalPaye: 0,
          totalRestant: 0,
          countPayees: 0,
          countNonPayees: 0,
          expanded: false
        });
      }
      
      const group = membreMap.get(membreId)!;
      group.sanctions.push(s);
      group.totalMontant += s.montant || 0;
      
      if (s.etat === 'PAYEE') {
        group.totalPaye += s.montant || 0;
        group.countPayees++;
      } else {
        group.totalRestant += s.montant || 0;
        group.countNonPayees++;
      }
    });

    this.groupedSanctions = Array.from(membreMap.values())
      .sort((a, b) => b.totalRestant - a.totalRestant);
  }

  toggleGroupExpansion(group: GroupedSanction): void {
    group.expanded = !group.expanded;
  }

  expandAllGroups(): void {
    this.groupedSanctions.forEach(g => g.expanded = true);
  }

  collapseAllGroups(): void {
    this.groupedSanctions.forEach(g => g.expanded = false);
  }

  // ============ SÉLECTION MULTIPLE ============

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.filteredSanctions.forEach(s => {
        if (s.etat !== 'PAYEE') {
          this.selectedSanctions.add(s.id);
        }
      });
    } else {
      this.selectedSanctions.clear();
    }
  }

  toggleSelection(sanction: Sanction): void {
    if (this.selectedSanctions.has(sanction.id)) {
      this.selectedSanctions.delete(sanction.id);
    } else {
      this.selectedSanctions.add(sanction.id);
    }
    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    const selectableCount = this.filteredSanctions.filter(s => s.etat !== 'PAYEE').length;
    this.selectAll = selectableCount > 0 && this.selectedSanctions.size === selectableCount;
  }

  isSelected(sanction: Sanction): boolean {
    return this.selectedSanctions.has(sanction.id);
  }

  getSelectedCount(): number {
    return this.selectedSanctions.size;
  }

  getSelectedTotal(): number {
    return this.filteredSanctions
      .filter(s => this.selectedSanctions.has(s.id))
      .reduce((sum, s) => sum + (s.montant || 0), 0);
  }

  paySelectedSanctions(): void {
    if (this.selectedSanctions.size === 0) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { 
        message: `Voulez-vous marquer ${this.selectedSanctions.size} sanction(s) comme payée(s) ?
                  Montant total: ${this.formatMontant(this.getSelectedTotal())}`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        const ids = Array.from(this.selectedSanctions);
        
        // Payer les sanctions sélectionnées en séquence
        this.payMultipleSanctions(ids, 0);
      }
    });
  }

  private payMultipleSanctions(ids: number[], index: number): void {
    if (index >= ids.length) {
      this.loadData();
      this.selectedSanctions.clear();
      this.selectAll = false;
      this.showSuccess(`${ids.length} sanction(s) payée(s) avec succès`);
      return;
    }

    this.sanctionService.payerSanction(ids[index]).subscribe({
      next: () => this.payMultipleSanctions(ids, index + 1),
      error: (err) => {
        console.error('Erreur paiement sanction:', err);
        this.payMultipleSanctions(ids, index + 1);
      }
    });
  }

  // ============ CRUD SANCTIONS ============

  getEmptySanction(): Partial<Sanction> & { equipeMatch?: string; selectedDate?: string } {
    return {
      id: 0,
      membre: 0,
      typeSanction: 0,
      match: 0,
      dateSanction: new Date(),
      montant: 0,
      commentaire: '',
      etat: 'NON_PAYEE',
      totalPaiements: 0,
      equipeMatch: '',
      selectedDate: ''
    };
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.newSanction = this.getEmptySanction();
    }
  }

  isCreateFormValid(): boolean {
    return !!(
      this.newSanction.membre &&
      this.newSanction.typeSanction &&
      this.newSanction.dateSanction &&
      this.newSanction.montant && this.newSanction.montant > 0
    );
  }

  onTypeSanctionChange(sanction: any): void {
    const type = this.typeSanctions.find(t => t.id === sanction.typeSanction);
    if (type?.montantParDefaut) {
      sanction.montant = type.montantParDefaut;
    }
  }

  saveSanction(): void {
    if (!this.isCreateFormValid()) {
      this.showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading = true;
    const payload = {
      membre: this.newSanction.membre,
      typeSanction: this.newSanction.typeSanction,
      match: this.newSanction.match || null,
      dateSanction: this.formatDateForApi(this.newSanction.dateSanction as Date),
      montant: this.newSanction.montant,
      commentaire: this.newSanction.commentaire || '',
      etat: 'NON_PAYEE'
    };

    this.sanctionService.applySanction(payload).subscribe({
      next: () => {
        this.loadData();
        this.toggleCreateForm();
        this.showSuccess('Sanction créée avec succès');
      },
      error: (err) => {
        console.error('Erreur création sanction:', err);
        this.isLoading = false;
        this.showError('Erreur lors de la création');
      }
    });
  }

  cancelCreate(): void {
    this.toggleCreateForm();
  }

  editRow(sanction: Sanction): void {
    this.editingRows.set(sanction.id, true);
    this.editSanction = { 
      ...sanction,
      dateSanction: new Date(sanction.dateSanction)
    };
  }

  saveEdit(sanction: Sanction): void {
    if (!this.editSanction.membre || !this.editSanction.typeSanction) {
      this.showError('Données invalides');
      return;
    }

    this.isLoading = true;
    const membreId = typeof this.editSanction.membre === 'number' ? this.editSanction.membre : (this.editSanction.membre as Membre)?.id;
    const typeId = typeof this.editSanction.typeSanction === 'number' ? this.editSanction.typeSanction : (this.editSanction.typeSanction as TypeSanction)?.id;
    const matchId = typeof this.editSanction.match === 'number' ? this.editSanction.match : this.editSanction?.match;

    const payload = {
      id: sanction.id,
      membre: membreId,
      typeSanction: typeId,
      match: matchId || null,
      dateSanction: this.formatDateForApi(this.editSanction.dateSanction as Date),
      montant: this.editSanction.montant,
      commentaire: this.editSanction.commentaire || '',
      etat: this.editSanction.etat
    };

    this.sanctionService.updateSanction(sanction.id, payload).subscribe({
      next: () => {
        this.loadData();
        this.editingRows.delete(sanction.id);
        this.showSuccess('Sanction mise à jour');
      },
      error: (err) => {
        console.error('Erreur mise à jour:', err);
        this.isLoading = false;
        this.showError('Erreur lors de la mise à jour');
      }
    });
  }

  cancelEdit(sanction: Sanction): void {
    this.editingRows.delete(sanction.id);
    this.editSanction = {};
  }

  isEditing(sanction: Sanction): boolean {
    return this.editingRows.get(sanction.id) || false;
  }

  openDeleteDialog(sanction: Sanction): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { 
        message: `Supprimer la sanction de ${this.getMembreName(sanction.membre)} ?
                  Montant: ${this.formatMontant(sanction.montant)}`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteSanction(sanction.id);
      }
    });
  }

  deleteSanction(id: number): void {
    this.isLoading = true;
    this.sanctionService.deleteSanction(id).subscribe({
      next: () => {
        this.loadData();
        this.showSuccess('Sanction supprimée');
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.isLoading = false;
        this.showError('Erreur lors de la suppression');
      }
    });
  }

  openPayDialog(sanction: Sanction): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { 
        message: `Marquer la sanction de ${this.getMembreName(sanction.membre)} comme payée ?
                  Montant: ${this.formatMontant(sanction.montant)}`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.payerSanction(sanction.id);
      }
    });
  }

  payerSanction(id: number): void {
    this.isLoading = true;
    this.sanctionService.payerSanction(id).subscribe({
      next: () => {
        this.loadData();
        this.showSuccess('Sanction payée avec succès');
      },
      error: (err) => {
        console.error('Erreur paiement:', err);
        this.isLoading = false;
        this.showError('Erreur lors du paiement');
      }
    });
  }

  // ============ EXPORT PDF ============

  toggleExportDialog(): void {
    this.showExportDialog = !this.showExportDialog;
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // ===== EN-TÊTE =====
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT DES SANCTIONS', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    doc.text(`Généré le ${today}`, pageWidth / 2, 30, { align: 'center' });

    // Période si filtre de dates actif
    const filters = this.filterForm.value;
    if (filters.dateDebut || filters.dateFin) {
      const debut = filters.dateDebut ? new Date(filters.dateDebut).toLocaleDateString('fr-FR') : 'Début';
      const fin = filters.dateFin ? new Date(filters.dateFin).toLocaleDateString('fr-FR') : 'Aujourd\'hui';
      doc.text(`Période: ${debut} - ${fin}`, pageWidth / 2, 36, { align: 'center' });
    }

    yPos = 50;

    // ===== RÉSUMÉ STATISTIQUES =====
    if (this.exportOptions.includeStats) {
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RÉSUMÉ', 14, yPos);
      yPos += 8;

      // Boîtes de stats
      const boxWidth = (pageWidth - 38) / 4;
      const boxHeight = 25;
      const statsData = [
        { label: 'Total', value: this.filteredSanctions.length.toString(), color: [102, 126, 234] },
        { label: 'Non payées', value: this.filteredSanctions.filter(s => s.etat === 'NON_PAYEE').length.toString(), color: [245, 158, 11] },
        { label: 'Payées', value: this.filteredSanctions.filter(s => s.etat === 'PAYEE').length.toString(), color: [16, 185, 129] },
        { label: 'Montant dû', value: this.formatMontant(this.filteredSanctions.filter(s => s.etat === 'NON_PAYEE').reduce((s, x) => s + x.montant, 0)), color: [239, 68, 68] }
      ];

      statsData.forEach((stat, i) => {
        const x = 14 + (i * (boxWidth + 4));
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(stat.label, x + boxWidth / 2, yPos + 8, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value, x + boxWidth / 2, yPos + 18, { align: 'center' });
        doc.setFont('helvetica', 'normal');
      });

      yPos += boxHeight + 15;
    }

    // ===== EXPORT GROUPÉ PAR MEMBRE =====
    if (this.exportOptions.groupByMembre) {
      this.exportGroupedPDF(doc, yPos);
    } else {
      this.exportFlatPDF(doc, yPos);
    }

    // ===== FOOTER =====
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Téléchargement
    const filename = `sanctions_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    this.showSuccess('PDF exporté avec succès');
    this.showExportDialog = false;
  }

  private exportGroupedPDF(doc: jsPDF, startY: number): void {
    let yPos = startY;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAIL PAR MEMBRE', 14, yPos);
    yPos += 10;

    this.groupedSanctions.forEach((group, groupIndex) => {
      // Filtrer selon les options
      let sanctions = group.sanctions;
      if (!this.exportOptions.includePayees) {
        sanctions = sanctions.filter(s => s.etat !== 'PAYEE');
      }
      if (!this.exportOptions.includeNonPayees) {
        sanctions = sanctions.filter(s => s.etat !== 'NON_PAYEE');
      }

      if (sanctions.length === 0) return;

      // Vérifier espace page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // En-tête membre
      doc.setFillColor(240, 242, 245);
      doc.roundedRect(14, yPos, pageWidth - 28, 12, 2, 2, 'F');
      
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const membreName = `${group.membre.nom} ${group.membre.prenom}`;
      doc.text(membreName, 18, yPos + 8);

      // Stats membre
      const statsText = `${sanctions.length} sanction(s) | Dû: ${this.formatMontant(group.totalRestant)}`;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(statsText, pageWidth - 18, yPos + 8, { align: 'right' });
      
      yPos += 16;

      // Tableau des sanctions du membre
      const tableData = sanctions.map(s => [
        this.getTypeSanctionName(s.typeSanction),
        new Date(s.dateSanction).toLocaleDateString('fr-FR'),
        this.formatMontant(s.montant),
        s.etat === 'PAYEE' ? 'Payée' : 'Non payée',
        s.commentaire || '-'
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: [['Type', 'Date', 'Montant', 'Statut', 'Commentaire']],
        body: tableData,
        theme: 'plain',
        margin: { left: 18, right: 18 },
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [100, 100, 100],
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 'auto' }
        },
        didParseCell: (data: any) => {
          if (data.column.index === 3 && data.cell.section === 'body') {
            data.cell.styles.textColor = data.cell.raw === 'Payée' ? [16, 185, 129] : [245, 158, 11];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    });
  }

  private exportFlatPDF(doc: jsPDF, startY: number): void {
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LISTE DES SANCTIONS', 14, startY);

    let sanctions = this.filteredSanctions;
    if (!this.exportOptions.includePayees) {
      sanctions = sanctions.filter(s => s.etat !== 'PAYEE');
    }
    if (!this.exportOptions.includeNonPayees) {
      sanctions = sanctions.filter(s => s.etat !== 'NON_PAYEE');
    }

    const tableData = sanctions.map(s => [
      this.getMembreName(s.membre),
      this.getTypeSanctionName(s.typeSanction),
      new Date(s.dateSanction).toLocaleDateString('fr-FR'),
      this.formatMontant(s.montant),
      s.etat === 'PAYEE' ? 'Payée' : 'Non payée'
    ]);

    (doc as any).autoTable({
      startY: startY + 8,
      head: [['Membre', 'Type', 'Date', 'Montant', 'Statut']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'center' }
      },
      didParseCell: (data: any) => {
        if (data.column.index === 4 && data.cell.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'Payée' ? [16, 185, 129] : [245, 158, 11];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
  }

  // ============ HELPERS ============

  getMembreName(membre: number | Membre | undefined): string {
    if (!membre) return 'Inconnu';
    if (typeof membre === 'object' && 'nom' in membre) {
      return `${membre.nom} ${membre.prenom}`;
    }
    const found = this.membres.find(m => m.id === membre);
    return found ? `${found.nom} ${found.prenom}` : 'Inconnu';
  }

  getTypeSanctionName(type: number | TypeSanction | undefined): string {
    if (!type) return 'N/A';
    if (typeof type === 'object' && 'nom' in type) {
      return type.nom;
    }
    const found = this.typeSanctions.find(t => t.id === type);
    return found ? found.nom : 'N/A';
  }

  getMatchName(match: number | Match | undefined): string {
    if (!match) return '-';
    if (typeof match === 'object' && 'dateMatch' in match) {
      return `${new Date(match.dateMatch).toLocaleDateString('fr-FR')} - ${match.typeMatch}`;
    }
    const found = this.matches.find(m => m.id === match);
    return found ? `${new Date(found.dateMatch).toLocaleDateString('fr-FR')} - ${found.typeMatch}` : '-';
  }

  getMemberInitials(membre: number | Membre | undefined): string {
    const name = this.getMembreName(membre);
    if (name === 'Inconnu') return '?';
    const parts = name.split(' ');
    return parts.length >= 2 
      ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  formatMontant(montant: number | undefined): string {
    if (montant === undefined || montant === null) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getStatusIcon(etat: string): string {
    return etat === 'PAYEE' ? 'check_circle' : 'schedule';
  }

  getStatusClass(etat: string): string {
    return etat === 'PAYEE' ? 'status-paid' : 'status-unpaid';
  }

  setupCustomSorting(): void {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'membre': return this.getMembreName(item.membre);
        case 'typeSanction': return this.getTypeSanctionName(item.typeSanction);
        case 'dateSanction': return new Date(item.dateSanction).getTime();
        default: return (item as any)[property];
      }
    };
  }

  // ============ PRÉFÉRENCES ============

  restorePreferences(): void {
    const savedViewMode = localStorage.getItem('sanctionsViewMode');
    if (savedViewMode === 'cards' || savedViewMode === 'table' || savedViewMode === 'grouped') {
      this.viewMode = savedViewMode;
    }
  }

  onViewModeChange(): void {
    localStorage.setItem('sanctionsViewMode', this.viewMode);
    if (this.viewMode === 'grouped') {
      this.updateGroupedSanctions();
    }
  }

  // ============ NOTIFICATIONS ============

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}
