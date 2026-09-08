import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Groupe } from '../../../../core/models/groupe.model';
import { Membre } from '../../../../core/models/membre.model';
import { User } from '../../../../core/models/user';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MembreService } from '../../../../core/services/membre.service';
import { GroupeService } from '../../../../core/services/groupe.service';
import { UserService } from '../../../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { switchMap, forkJoin, map, lastValueFrom, finalize, Observable, of, takeUntil, Subject } from 'rxjs';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GeneralService } from '../../../../core/services/general.service';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoleCustom } from '../../../../core/models/role-custom.model';
import { RoleCustomService } from '../../../../core/services/role-custom.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExcelImportService, ImportResult } from '../../../../core/services/excel-import.service';
import { ExcelImportDialogComponent } from '../excel-import-dialog/excel-import-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { Exercice, FinancesService } from '../../../../core/services/finances.service';
import { GroupeContextService } from '../../../../core/services/groupe-context.service';
import { TirageExportDialogComponent } from '../tirage-export-dialog/tirage-export-dialog.component';

@Component({
  selector: 'app-membre-form',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
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
    FormsModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatListModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    TranslateModule,
    RouterModule
  ],
  templateUrl: './membre-form.component.html',
  styleUrls: ['./membre-form.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, height: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0, height: 0, overflow: 'hidden' }))
      ])
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ opacity: 0, height: 0 }),
        animate('300ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0, height: 0 }))
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.98)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class MembreFormComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource = new MatTableDataSource<Membre>([]);
  expandedRowIndex: number | null = null;
  showCreateRow = false;
  activeTab: 'list' | 'add' | 'filter' = 'list';
  roles: RoleCustom[] = [];
  
  // Membre vide pour création
  newMembre: Membre = this.getEmptyMembre();
  editMembre: Membre = this.getEmptyMembre();
  
  groupe: Groupe | null = null;
  users: User[] = [];
  equipes: Equipe[] = [];
  editingRows: boolean[] = [];
  selectedGroupeId = '';
  createUserForMembre = false;
  isLoading = true;
  isSaving = false;
  exerciceActif: Exercice | null = null;
  
  // Filtres
  showFilters = false;
  filters = {
    equipe: null as number | null,
    active: null as boolean | null,
    sexe: null as string | null,
    roleCustom: null as number | null,
    roleCO: null as string | null,
    cotisation: null as boolean | null,
    poste: '' as string,
    filterWithoutAccount:  null as boolean | null, // Réinitialisation du filtre
  };
  
  filteredMembers: any[] = [];
  paginatedMembers: any[] = [];
  filteredCount = 0;
  activeFiltersCount = 0;
  pageSize = 10;
  pageIndex = 0;
  filterWithoutAccount: boolean = false;
  // Près de tes autres déclarations (groupe, membres, etc.)
  typesContributions: any[] = [];

  // Gradients pour avatars
  private avatarGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  ];

  // Map pour gérer les erreurs d'images
  private brokenImages = new Set<number>();
  groupeId!: number | null;
 private destroy$ = new Subject<void>()
 
  constructor(
    private adminService: MembreService,
    private equipeService: GeneralService,
    private dialog: MatDialog,
    private groupService: GroupeService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private roleCustomService: RoleCustomService,
    private authService: AuthService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private financesService: FinancesService,
    private groupeContext : GroupeContextService,
    private exportService : ExcelImportService,
  ) {}

 // APRÈS :
ngOnInit(): void {
  this.groupeId = this.authService.getGroupe();
  this.loadData();
  this.loadRoles();
 
  // S'abonner au changement de groupe — recharger quand l'utilisateur switche
  this.groupeContext.groupeChanged$
    .pipe(takeUntil(this.destroy$))
    .subscribe((newGroupeId) => {
      this.groupeId = newGroupeId;   // ← mettre à jour groupeId
      this.loadData();               // ← recharger avec le bon groupe
      this.loadRoles();
    });
}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'user': return item.user?.username || '';
        case 'active': return item.active ? 1 : 0;
        case 'equipe': return item.equipe?.nom || '';
        default: return (item as any)[property];
      }
    };
  }

compareUsers(u1: any, u2: any): boolean {
  return u1 && u2 ? u1.id === u2.id : u1 === u2;
}

  // ===== MÉTHODES UTILITAIRES =====

  private getEmptyMembre(): Membre {
    return {
      id: 0,
      nom: '',
      prenom: '',
      dateNaissance: '',
      poste: '',
      email: '',
      cotisationPayee: false,
      estSuspendu:false,
      dateFinSuspension:null,
      roleCO: '',
      equipe: null,
      groupe: {
        id: 0, nom: '', discipline: '', ville1: 0, stade2: 0, isActive: true,
        jourMatch: '', typeEquipe: '', modeEquipes: 'STATIQUE', fraisAdhesion: 0,
        ville: { id: 0, nom: '' },
        stade: { id: 0, nom: '', stadiumLat: 0, stadiumLon: 0, radius: 0 },
        profilePhotoUrl: '', heureMatch: '', isPublic: false, abreviation: ''
      },
      buts: 0,
      passes: 0,
      cartons: 0,
      totalContributions: 0,
      soldeRestant: 0,
      soldeSanctionsRestant: 0,
      user: {
        id: 0, username: '', email: '', roles: '', active: true,
        membre: 0, motDePasse: '', groupe: 0, profilePhotoUrl: ''
      },
      active: true,
      sexe: '',
      cni: '',
      adresse: '',
      tel: '',
      assurance: false,
      roleCustom: null
    };
  }

  getGlobalIndex(paginatedIndex: number): number {
    const membre = this.paginatedMembers[paginatedIndex];
    return this.dataSource.data.findIndex(m => m.id === membre?.id);
  }

  // ===== COMPTEURS POUR HEADER =====

  getActiveCount(): number {
    return this.dataSource.data.filter(m => m.active).length;
  }

  getUnpaidCount(): number {
    return this.dataSource.data.filter(m => !m.cotisationPayee).length;
  }

  // ===== GESTION DES PHOTOS =====

  getMemberPhoto(membre: Membre): string | null {
    // Vérifier si l'image a déjà échoué
    if (this.brokenImages.has(membre.id)) {
      return null;
    }
    
    // Vérifier si le membre a un user avec une photo
    if (membre.user?.profilePhotoUrl) {
      return membre.user.profilePhotoUrl;
    }
    
    return null;
  }

  onImageError(event: Event, membre: Membre): void {
    // Marquer l'image comme cassée pour ne pas réessayer
    this.brokenImages.add(membre.id);
    
    // Cacher l'élément img
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
  }

  getInitials(prenom: string, nom: string): string {
    const prenomInitial = prenom ? prenom.charAt(0).toUpperCase() : '';
    const nomInitial = nom ? nom.charAt(0).toUpperCase() : '';
    return `${prenomInitial}${nomInitial}`;
  }

  getAvatarGradient(membre: Membre): string {
    const name = `${membre.prenom}${membre.nom}`;
    const index = name.charCodeAt(0) % this.avatarGradients.length;
    return this.avatarGradients[index];
  }

  // ===== CHARGEMENT DES DONNÉES =====

 async loadRoles(): Promise<void> {
  const groupeId = this.authService.getGroupe();  // ← getGroupe() existe
  if (groupeId === null) {
    console.warn('Aucun groupe actif défini.');
    this.roles = [];
    return;
  }
  try {
    const roles = await lastValueFrom(this.roleCustomService.getRolesByGroupe());
    this.roles = roles?.filter((r: any) => r.actif) || [];
    this.initializeRoleCustomFromRoleCO();
  } catch (err) {
    console.error('Erreur chargement rôles:', err);
    this.roles = [];
  }
}
 

  initializeRoleCustomFromRoleCO(): void {
    const roleCOMapping: { [key: string]: string } = {
      'PRESI': 'Président',
      'CAISSIER': 'Trésorier',
      'COMM': 'Secrétaire',
      'RESP': 'Capitaine'
    };

    this.dataSource.data.forEach(membre => {
      if (membre.roleCO && !membre.roleCustom) {
        const roleNom = roleCOMapping[membre.roleCO];
        if (roleNom) {
          const role = this.roles.find(r => r.nom === roleNom);
          if (role) {
            (membre as any).roleCustom = role;
          }
        }
      }
    });

    this.dataSource.data = [...this.dataSource.data];
    this.applyFilters();
  }
loadData(): void {
  this.isLoading = true;

  // 1. On récupère d'abord l'exercice actif du groupe
  this.financesService.getExerciceActif(this.groupeId!).pipe(
    switchMap((exercice) => {
      // On garde une référence de l'exercice ou des contributions si besoin dans le composant
      this.exerciceActif = exercice; 
      const exerciceId = exercice?.id;

      // 2. Maintenant que l'ID de l'exercice est disponible, on lance le forkJoin en parallèle
      return forkJoin([
        this.adminService.getGroupMembers().pipe(map(data => data || [])),
        this.groupService.getAllGroupesMembre().pipe(map(data => data || null)),
        this.userService.getAllUsers2().pipe(map(data => data || [])),
        this.equipeService.getEquipesByGroupe().pipe(map(data => data || [])),
        // Si l'exercice existe, on charge ses types de contributions, sinon on renvoie un tableau vide
        exerciceId 
          ? this.financesService.getTypesContributionByExercice(exerciceId).pipe(map(data => data || []))
          : of([])
      ]);
    })
  ).subscribe({
    // 3. Récupération des 5 résultats bien alignés dans le tableau du next
    next: ([membres, groupeResponse, users, equipes, typesContributions]) => {
      this.filteredMembers = membres || []; // Pour ton filtrage local
      this.dataSource.data = membres || [];
      this.groupe = groupeResponse || null;
      this.equipes = equipes || [];
      this.users = users || [];
      
      // Stockage des contributions pour l'affichage dynamique des badges visuels
      this.typesContributions = typesContributions || [];

      this.editingRows = new Array(this.dataSource.data.length).fill(false);
      
      if (this.groupe) {
        this.newMembre.groupe = this.groupe;
      }
     
      const membreUserIds = new Set(
        membres?.filter((m: { user: { id: any; }; }) => m.user && m.user.id).map((m: { user: any; }) => m.user!.id) || []
      );

      this.applyFilters();
      this.isLoading = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur lors du chargement des données:', err);
      this.isLoading = false;
      this.dataSource.data = [];
      this.filteredMembers = [];
      this.paginatedMembers = [];
      this.cdr.detectChanges();
    }
  });
}


  hasContributionLink(champ: string): boolean {
  if (!this.typesContributions) return false;
  return this.typesContributions.some(tc => tc.majStatutMembre && tc.champStatutMembre === champ);
}

// Les sanctions n'ont pas forcément besoin d'un TypeContribution pour exister, 
// mais on peut vérifier si le groupe gère des types de sanctions.
hasSanctionsEnabled(): boolean {
  return this.groupe?.isActive!;
}
  // ===== FILTRES =====

  applyFilters(): void {
    let filtered = [...this.dataSource.data];

    if (this.filters.equipe !== null) {
      filtered = filtered.filter(m => {
        const equipe = m.equipe as Equipe | null | undefined;
        return equipe?.id === this.filters.equipe;
      });
    }

    if (this.filters.active !== null) {
      filtered = filtered.filter(m => m.active === this.filters.active);
    }

    if (this.filters.sexe) {
      filtered = filtered.filter(m => m.sexe === this.filters.sexe);
    }

    if (this.filters.roleCustom !== null) {
      if (this.filters.roleCustom === 0) {
        filtered = filtered.filter(m => !m.roleCustom);
      } else {
        filtered = filtered.filter(m => m.roleCustom?.id === this.filters.roleCustom);
      }
    }

    if (this.filters.cotisation !== null) {
      filtered = filtered.filter(m => m.cotisationPayee === this.filters.cotisation);
    }

    if (this.filters.poste) {
      const posteSearch = this.filters.poste.toLowerCase();
      filtered = filtered.filter(m => m.poste?.toLowerCase().includes(posteSearch));
    }

      // 3. ⭐ NOUVEAU : Filtrer les membres sans compte utilisateur ⭐
    if (this.filterWithoutAccount) {
      // Si m.user est null ou indéfini, le membre n'a pas de compte utilisateur lié
      filtered = filtered.filter(m => m.user === null || m.user === undefined);
    }

    const searchFilter = this.dataSource.filter;
    if (searchFilter) {
      filtered = filtered.filter(m => {
        const searchStr = `${m.nom} ${m.prenom} ${m.email} ${m.poste}`.toLowerCase();
        return searchStr.includes(searchFilter);
      });
    }

    this.filteredMembers = filtered;
    this.filteredCount = filtered.length;
    this.activeFiltersCount = this.calculateActiveFilters();
    this.pageIndex = 0;
    this.updatePaginatedMembers();
  }

  calculateActiveFilters(): number {
    let count = 0;
    if (this.filters.equipe !== null) count++;
    if (this.filters.active !== null) count++;
    if (this.filters.sexe !== null) count++;
    if (this.filters.roleCustom !== null) count++;
    if (this.filters.cotisation !== null) count++;
    if (this.filters.poste) count++;
    return count;
  }

  clearAllFilters(): void {
    this.filters = {
      equipe: null,
      active: null,
      sexe: null,
      roleCustom: null,
      roleCO: null,
      cotisation: null,
      poste: '',
     filterWithoutAccount:null // Réinitialisation du filtre
    };
    this.applyFilters();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.applyFilters();
  }

  clearSearch(input: HTMLInputElement): void {
    input.value = '';
    this.dataSource.filter = '';
    this.applyFilters();
  }

  // ===== PAGINATION =====

  updatePaginatedMembers(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedMembers = this.filteredMembers.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePaginatedMembers();
  }

  // ===== EXPANSION =====

  expandPanel(index: number): void {
    const globalIndex = this.dataSource.data.findIndex(
      m => m.id === this.paginatedMembers[index]?.id
    );
    
    if (this.expandedRowIndex === globalIndex) {
      this.expandedRowIndex = null;
    } else {
      this.expandedRowIndex = globalIndex;
      if (this.dataSource.data[globalIndex]) {
        this.editMembre = { ...this.dataSource.data[globalIndex] };
        console.log(this.editMembre)
      }
    }
  }

  collapsePanel(index: number): void {
    this.expandedRowIndex = null;
    if (this.editingRows[index]) {
      this.cancelEdit(index);
    }
  }

  // ===== CRÉATION =====

  toggleCreateRow(): void {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewMembre();
    }
  }

  openCreateTab(): void {
    // Réinitialiser le formulaire et s'assurer que le groupe est bien assigné
    this.resetNewMembre();
    this.createUserForMembre = false;
  }

  isCreateFormValid(): boolean {
    return !!this.newMembre.nom && !!this.newMembre.sexe;
  }

  saveMembre(): void {
    if (!this.isCreateFormValid()) return;

    this.isLoading = true;
    let createMembre$: Observable<any>;

    if (this.createUserForMembre) {
      createMembre$ = this.createMembreWithUser();
    } else {
      createMembre$ = this.adminService.createMember(this.newMembre);
    }

    createMembre$.pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.showSuccessMessage(this.translate.instant('membres.createSuccess'));
        this.loadData();
        this.toggleCreateRow();
        this.activeTab = 'list'; // revenir à la liste après création
      },
      error: (err) => this.handleError(err, this.translate.instant('membres.createError'))
    });
  }

  private createMembreWithUser(): Observable<any> {
    const newUser: User = {
      id: 0,
      username: `${this.newMembre.nom.toLowerCase()}_${this.newMembre.prenom.toLowerCase()}`,
      email: this.newMembre.email || `${this.newMembre.nom.toLowerCase()}@example.com`,
      motDePasse: this.newMembre.nom,
      roles: 'MEMBRE',
      active: true,
      membre: 0,
      groupe: this.newMembre.groupe.id,
      profilePhotoUrl: ''
    };

    return this.userService.createUser2(newUser).pipe(
      switchMap((createdUser) => {
        this.newMembre.user = { id: createdUser.id } as User;
        return this.adminService.createMember(this.newMembre);
      })
    );
  }

  cancelCreate(): void {
    this.toggleCreateRow();
  }

resetNewMembre(): void {
  this.newMembre = this.getEmptyMembre();
  if (this.groupe) {
    this.newMembre.groupe = this.groupe;
  }
  // Vérification supplémentaire : s'assurer que le groupe correspond au groupe actif
  const groupeIdActif = this.authService.getGroupe();
  if (groupeIdActif && this.newMembre.groupe?.id !== groupeIdActif) {
    // Le groupe chargé ne correspond pas au groupe actif — forcer le bon
    console.warn('[MembreForm] Groupe du formulaire corrigé vers le groupe actif');
    this.newMembre.groupe = { id: groupeIdActif } as any;
  }
}
 

  toggleUserCreation(): void {
    if (this.createUserForMembre) {
      this.newMembre.user = {
        id: 0, username: '', motDePasse: '', email: '',
        roles: '', active: true, membre: 0, groupe: 0, profilePhotoUrl: ''
      };
    }
  }

  // ===== ÉDITION =====

  editRow(localIndex: number, membre: Membre): void {
    const globalIndex = this.dataSource.data.findIndex(m => m.id === membre.id);
    if (membre && globalIndex !== -1) {
      this.editingRows[globalIndex] = true;
      this.editMembre = { ...membre };
    }
  }

  isEditFormValid(): boolean {
    return !!this.editMembre.nom && !!this.editMembre.sexe;
  }

  saveEdit(index: number): void {
    const membre = this.paginatedMembers[index];
    const globalIndex = this.dataSource.data.findIndex(m => m.id === membre?.id);

    if (!this.isEditFormValid() || globalIndex === -1) return;

    this.isSaving = true;

    this.adminService.updateMembre(this.editMembre.id, this.editMembre).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSuccessMessage(this.translate.instant('membres.updateSuccess'));
        this.editingRows[globalIndex] = false;
        this.loadData();
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Erreur lors de la mise à jour:', err);
        this.showErrorMessage(this.translate.instant('membres.updateError'));
      }
    });
  }

  cancelEdit(index: number): void {
    this.editingRows[index] = false;
    this.editMembre = this.getEmptyMembre();
  }

  // ===== SUPPRESSION / ACTIVATION =====

  openDeleteDialog(membre: Membre): void {
    if (!membre) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: this.translate.instant('membres.deleteConfirmation', {
          name: `${membre.prenom} ${membre.nom}`
        })
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteMembre(membre.id);
      }
    });
  }

  openToggleActiveDialog(membre: Membre): void {
    if (!membre) return;

    const action = membre.active ? 
      this.translate.instant('membres.deactivate').toLowerCase() : 
      this.translate.instant('membres.activate').toLowerCase();
    
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: this.translate.instant('membres.toggleActiveConfirmation', {
          action,
          name: `${membre.prenom} ${membre.nom}`
        })
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (membre.active) {
          this.deactivateMembre(membre.id);
        } else {
          this.activateMembre(membre.id);
        }
      }
    });
  }

  activateMembre(id: number): void {
    this.adminService.activateMember(id).subscribe({
      next: () => {
        this.showSuccessMessage(this.translate.instant('membres.activateSuccess'));
        this.loadData();
      },
      error: (err) => {
        console.error('Erreur lors de l\'activation:', err);
        this.showErrorMessage(this.translate.instant('membres.activateError'));
      }
    });
  }

  deactivateMembre(id: number): void {
    this.adminService.deactivateMember(id).subscribe({
      next: () => {
        this.showSuccessMessage(this.translate.instant('membres.deactivateSuccess'));
        this.loadData();
      },
      error: (err) => {
        console.error('Erreur lors de la désactivation:', err);
        this.showErrorMessage(this.translate.instant('membres.deactivateError'));
      }
    });
  }

  deleteMembre(id: number): void {
    this.adminService.deleteMember(id).subscribe({
      next: () => {
        this.showSuccessMessage(this.translate.instant('membres.deleteSuccess'));
        this.loadData();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.showErrorMessage(this.translate.instant('membres.deleteError'));
      }
    });
  }

  // ===== COMPARATEURS =====

  compareEquipes(equipe1: any, equipe2: any): boolean {
    return equipe1 && equipe2 ? equipe1.id === equipe2.id : equipe1 === equipe2;
  }

  compareRoles(r1: RoleCustom, r2: RoleCustom): boolean {
    return r1 && r2 ? r1.id === r2.id : r1 === r2;
  }

  // ===== IMPORT EXCEL =====

  openExcelImportDialog(): void {
    const dialogRef = this.dialog.open(ExcelImportDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      data: { equipes: this.equipes }
    });

    dialogRef.afterClosed().subscribe((result: ImportResult | undefined) => {
      if (result) {
        if (result.successCount > 0) {
          this.showSuccessMessage(
            this.translate.instant('membres.importSuccess', { count: result.successCount })
          );
        }
        if (result.errorCount > 0) {
          this.showErrorMessage(
            this.translate.instant('membres.importErrors', { count: result.errorCount })
          );
        }
        this.loadData();
      }
    });
  }

  // ===== MESSAGES =====

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-success']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, '✕', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-error']
    });
  }

  private handleError(err: any, defaultMessage: string): void {
    console.error(defaultMessage, err);
    const errorMessage = err.error?.message || defaultMessage;
    this.showErrorMessage(errorMessage);
  }

  exportSimple(): void {
  const data = this.filteredMembers.map(m => ({
    Nom: m.nom,
    Prénom: m.prenom,
    Sexe: m.sexe,
    Email: m.email,
    Téléphone: m.tel,
    Équipe: m.equipe?.nom || '',
    Poste: m.poste,
    Rôle: m.roleCustom?.nom || '',
    Actif: m.active ? 'Oui' : 'Non',
    'Cotisation payée': m.cotisationPayee ? 'Oui' : 'Non'
  }));
  this.exportService.exportToExcel(
    data,
    `membres_${this.groupe?.nom || 'groupe'}_${new Date().toISOString().slice(0, 10)}`
  );
}

openTirageExportDialog(): void {
  const dialogRef = this.dialog.open(TirageExportDialogComponent, {
    width: '900px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    disableClose: true,
    data: { membres: this.filteredMembers, equipes: this.equipes }
  });

  dialogRef.afterClosed().subscribe((success) => {
    if (success) this.loadData();
  });
}

exportSimplePdf(): void {
  const rows = this.buildExportRows();
  this.exportService.exportToPdf({
    title: `Liste des membres — ${this.groupe?.nom || ''}`,
    subtitle: `${rows.length} membre(s)`,
    columns: [
      { header: 'Nom', dataKey: 'Nom' },
      { header: 'Prénom', dataKey: 'Prénom' },
      { header: 'Équipe', dataKey: 'Équipe' },
      { header: 'Poste', dataKey: 'Poste' },
      { header: 'Rôle', dataKey: 'Rôle' },
      { header: 'Actif', dataKey: 'Actif' },
      { header: 'Cotisation', dataKey: 'Cotisation payée' },
    ],
    rows,
    fileName: `membres_${this.groupe?.nom || 'groupe'}_${new Date().toISOString().slice(0, 10)}`,
    orientation: 'landscape'
  });
}

private buildExportRows(): any[] {
  return this.filteredMembers.map(m => ({
    Nom: m.nom,
    Prénom: m.prenom,
    Sexe: m.sexe,
    Email: m.email,
    Téléphone: m.tel,
    Équipe: m.equipe?.nom || '',
    Poste: m.poste,
    Rôle: m.roleCustom?.nom || '',
    Actif: m.active,
    'Cotisation payée': m.cotisationPayee
  }));
}

exportSimpleExcel(): void {
  const data = this.buildExportRows();
  this.exportService.exportToExcel(
    data,
    `membres_${this.groupe?.nom || 'groupe'}_${new Date().toISOString().slice(0, 10)}`
  );
}

}