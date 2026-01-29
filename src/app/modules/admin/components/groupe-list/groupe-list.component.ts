import { AfterViewInit, Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';

import { Groupe } from '../../../../core/models/groupe.model';
import { Stade } from '../../../../core/models/stade';
import { Ville } from '../../../../core/models/ville';
import { GroupeService } from '../../../../core/services/groupe.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { GroupeFormDialogComponent } from '../groupe-form-dialog/groupe-form-dialog.component';

interface GroupeStats {
  total: number;
  actifs: number;
  inactifs: number;
  totalMembres: number;
}

@Component({
  selector: 'app-groupe-list',
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
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    MatBadgeModule,
    MatButtonToggleModule,
    MatSnackBarModule
  ],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
  templateUrl: './groupe-list.component.html',
  styleUrl: './groupe-list.component.scss'
})
export class GroupeListComponent implements OnInit, AfterViewInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['nom', 'discipline', 'ville', 'stade', 'membres', 'isActive', 'actions'];
  
  // États
  isLoading = true;
  viewMode: 'card' | 'table' = 'card';
  showCreateForm = false;
  
  // Données
  groupes: any[] = [];
  villes: Ville[] = [];
  stades: Stade[] = [];
  
  // Filtres
  searchText = '';
  filterStatus = 'all'; // 'all', 'active', 'inactive'
  filterVille = 'all';
  
  // Statistiques
  stats: GroupeStats = {
    total: 0,
    actifs: 0,
    inactifs: 0,
    totalMembres: 0
  };
  
  // Formulaire création/édition
  newGroupe: Partial<Groupe> = this.getEmptyGroupe();
  editingGroupe: Groupe | null = null;
  editingRows: boolean[] = [];
  editGroupe: Groupe = {} as Groupe;

  constructor(
    private groupeService: GroupeService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupSearch();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'ville': return this.getVilleName(item.ville);
        case 'stade': return this.getStadeName(item.stade);
        case 'isActive': return item.isActive ? 1 : 0;
        case 'membres': return item.membres?.length || 0;
        default: return (item as any)[property];
      }
    };
    
    this.dataSource.filterPredicate = (data: Groupe, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.nom?.toLowerCase().includes(searchStr) ||
        data.discipline?.toLowerCase().includes(searchStr) ||
        this.getVilleName(data.ville).toLowerCase().includes(searchStr) ||
        this.getStadeName(data.stade).toLowerCase().includes(searchStr)
      );
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ CHARGEMENT ============

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchText => {
      this.dataSource.filter = searchText.trim().toLowerCase();
    });
  }

  loadData(): void {
    this.isLoading = true;
    
    forkJoin([
      this.groupeService.getAllGroupes(),
      this.groupeService.getVilles(),
      this.groupeService.getStades()
    ]).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ([groupes, villes, stades]) => {
        this.groupes = groupes;
        this.dataSource.data = groupes;
        this.villes = villes;
        this.stades = stades;
        this.editingRows = new Array(groupes.length).fill(false);
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.showSnackbar('Erreur lors du chargement des données', 'error');
        this.isLoading = false;
      }
    });
  }

  private calculateStats(): void {
    this.stats = {
      total: this.groupes.length,
      actifs: this.groupes.filter(g => g.isActive).length,
      inactifs: this.groupes.filter(g => !g.isActive).length,
      totalMembres: this.groupes.reduce((sum, g) => sum + (g.membres?.length || 0), 0)
    };
  }

  // ============ FILTRES ============

  onSearchChange(value: string): void {
    this.searchText = value;
    this.searchSubject.next(value);
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  onFilterVilleChange(villeId: string): void {
    this.filterVille = villeId;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.groupes];
    
    // Filtre par statut
    if (this.filterStatus === 'active') {
      filtered = filtered.filter(g => g.isActive);
    } else if (this.filterStatus === 'inactive') {
      filtered = filtered.filter(g => !g.isActive);
    }
    
    // Filtre par ville
    if (this.filterVille !== 'all') {
      filtered = filtered.filter(g => {
        const villeId = typeof g.ville === 'object' ? g.ville?.id : g.ville;
        return villeId?.toString() === this.filterVille;
      });
    }
    
    this.dataSource.data = filtered;
    
    // Appliquer aussi la recherche texte si présente
    if (this.searchText) {
      this.dataSource.filter = this.searchText.trim().toLowerCase();
    }
  }

  resetFilters(): void {
    this.searchText = '';
    this.filterStatus = 'all';
    this.filterVille = 'all';
    this.dataSource.data = this.groupes;
    this.dataSource.filter = '';
  }

  // ============ HELPERS ============

  private getEmptyGroupe(): Partial<Groupe> {
    return {
      id: 0,
      nom: '',
      discipline: '',
      ville: undefined,
      stade: undefined,
      isActive: true,
      jourMatch: 'Dimanche',
      typeEquipe: '',
      modeEquipe: 'STATIQUE',
      fraisAdhesion: 0,
      profilePhotoUrl: '',
      heureMatch: '',
      isPublic: true,
      abreviation: ''
    };
  }

  getVilleName(ville: number | Ville | undefined): string {
    if (!ville) return 'Non définie';
    
    if (typeof ville === 'object' && ville !== null && 'nom' in ville) {
      return ville.nom;
    }
    
    const villeId = typeof ville === 'number' ? ville : (ville as Ville)?.id;
    if (!villeId) return 'Non définie';
    
    const found = this.villes.find(v => v.id === villeId);
    return found ? found.nom : 'Non définie';
  }

  getStadeName(stade: number | Stade | undefined): string {
    if (!stade) return 'Non défini';
    
    if (typeof stade === 'object' && stade !== null && 'nom' in stade) {
      return stade.nom;
    }
    
    const stadeId = typeof stade === 'number' ? stade : (stade as Stade)?.id;
    if (!stadeId) return 'Non défini';
    
    const found = this.stades.find(s => s.id === stadeId);
    return found ? found.nom : 'Non défini';
  }

  getMembresCount(groupe: any): number {
    return groupe.membres?.filter((m: { isDelete: any; }) => !m.isDelete).length || 0;
  }

  getInitials(nom: string): string {
    if (!nom) return '?';
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getGroupeColor(groupe: Groupe): string {
    // Générer une couleur basée sur le nom du groupe
    const colors = [
      '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444',
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
    ];
    const index = groupe.nom ? groupe.nom.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: type === 'error' ? 'snackbar-error' : type === 'success' ? 'snackbar-success' : ''
    });
  }

  // ============ ACTIONS CRUD ============

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.newGroupe = this.getEmptyGroupe();
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(GroupeFormDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: {
        groupe: null,
        villes: this.villes,
        stades: this.stades,
        isEdit: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createGroupe(result);
      }
    });
  }

  openEditDialog(groupe: Groupe): void {
    const dialogRef = this.dialog.open(GroupeFormDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: {
        groupe: { ...groupe },
        villes: this.villes,
        stades: this.stades,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateGroupe(result);
      }
    });
  }

  createGroupe(groupeData: Partial<Groupe>): void {
    this.isLoading = true;
    
    this.groupeService.createGroupe(groupeData as Groupe)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Groupe créé avec succès', 'success');
          this.loadData();
          this.showCreateForm = false;
        },
        error: (err) => {
          console.error('Erreur lors de la création:', err);
          this.showSnackbar('Erreur lors de la création du groupe', 'error');
          this.isLoading = false;
        }
      });
  }

  updateGroupe(groupe: Groupe): void {
    this.isLoading = true;
    
    this.groupeService.updateGroupe(groupe.id, groupe)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Groupe mis à jour avec succès', 'success');
          this.loadData();
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour:', err);
          this.showSnackbar('Erreur lors de la mise à jour', 'error');
          this.isLoading = false;
        }
      });
  }

  openDeleteDialog(groupe: Groupe): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Supprimer le groupe',
        message: `Êtes-vous sûr de vouloir supprimer le groupe "${groupe.nom}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteGroupe(groupe.id);
      }
    });
  }

  deleteGroupe(id: number): void {
    this.isLoading = true;
    
    this.groupeService.deleteGroupe(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Groupe supprimé avec succès', 'success');
          this.loadData();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          this.showSnackbar('Erreur lors de la suppression', 'error');
          this.isLoading = false;
        }
      });
  }

  openToggleActiveDialog(groupe: Groupe): void {
    const action = groupe.isActive ? 'désactiver' : 'activer';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `${groupe.isActive ? 'Désactiver' : 'Activer'} le groupe`,
        message: `Voulez-vous ${action} le groupe "${groupe.nom}" ?`,
        confirmText: groupe.isActive ? 'Désactiver' : 'Activer',
        cancelText: 'Annuler',
        type: groupe.isActive ? 'warning' : 'success'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (groupe.isActive) {
          this.deactivateGroupe(groupe.id);
        } else {
          this.activateGroupe(groupe.id);
        }
      }
    });
  }

  activateGroupe(id: number): void {
    this.isLoading = true;
    
    this.groupeService.activateGroupe(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Groupe activé avec succès', 'success');
          this.loadData();
        },
        error: (err) => {
          console.error('Erreur lors de l\'activation:', err);
          this.showSnackbar('Erreur lors de l\'activation', 'error');
          this.isLoading = false;
        }
      });
  }

  deactivateGroupe(id: number): void {
    this.isLoading = true;
    
    this.groupeService.disableGroupe(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Groupe désactivé avec succès', 'success');
          this.loadData();
        },
        error: (err) => {
          console.error('Erreur lors de la désactivation:', err);
          this.showSnackbar('Erreur lors de la désactivation', 'error');
          this.isLoading = false;
        }
      });
  }

  // ============ NAVIGATION ============

  viewGroupeDetails(groupe: Groupe): void {
    this.router.navigate(['/admin/groupes', groupe.id]);
  }

  viewGroupeMembers(groupe: Groupe): void {
    this.router.navigate(['/admin/groupes', groupe.id, 'membres']);
  }

  // ============ EDITION EN LIGNE (pour vue table) ============

  editRow(index: number, groupe: Groupe): void {
    this.editingRows[index] = true;
    this.editGroupe = { ...groupe };
  }

  isEditFormValid(): boolean {
    return !!(this.editGroupe.nom && this.editGroupe.discipline && this.editGroupe.ville && this.editGroupe.stade);
  }

  saveEdit(index: number): void {
    if (this.isEditFormValid()) {
      this.updateGroupe(this.editGroupe);
      this.editingRows[index] = false;
    }
  }

  cancelEdit(index: number): void {
    this.editingRows[index] = false;
    this.editGroupe = {} as Groupe;
  }

  // ============ EXPORT ============

  exportToExcel(): void {
    // Implémenter l'export Excel
    this.showSnackbar('Export Excel en cours de développement', 'info');
  }

  exportToCSV(): void {
    const headers = ['Nom', 'Discipline', 'Ville', 'Stade', 'Membres', 'Statut'];
    const data = this.dataSource.data.map(g => [
      g.nom,
      g.discipline,
      this.getVilleName(g.ville),
      this.getStadeName(g.stade),
      this.getMembresCount(g),
      g.isActive ? 'Actif' : 'Inactif'
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `groupes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    this.showSnackbar('Export CSV réussi', 'success');
  }
}