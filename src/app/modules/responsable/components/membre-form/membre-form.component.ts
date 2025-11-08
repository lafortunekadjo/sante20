import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { switchMap, forkJoin, of, map, lastValueFrom } from 'rxjs'; // Ajout de 'of' ici
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GeneralService } from '../../../../core/services/general.service';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoleCustom } from '../../../../core/models/role-custom.model';
import { RoleCustomService } from '../../../../core/services/role-custom.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';

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
    MatExpansionModule, // Ajouté,
    MatListModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule
  ],
  
  templateUrl: './membre-form.component.html',
  styleUrls: ['./membre-form.component.scss'],
 // Ajoutez ces animations dans le décorateur @Component
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
]
})
export class MembreFormComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<Membre>([]);
  expandedRowIndex: number | null = null;
  showCreateRow: boolean = false;
   roles: RoleCustom[] = [];
  newMembre: Membre = {
    id: 0,
    nom: '',
    prenom: '',
    dateNaissance: '',
    poste: '',
    email: '',
    cotisationPayee: false,
    roleCO: '',
    equipe: { id: 0, nom: '' },
    groupe: {
      id: 0, nom: '', discipline: '', ville1: 0, stade2: 0, isActive: true, jourMatch: '', typeEquipe: '', modeEquipe: 'STATIQUE', fraisAdhesion: 0, ville: { id: 0, nom: '' }, stade: { id: 0, nom: '' },
      profilePhotoUrl: '',
      heureMatch: '',
      isPublic: false,
      abreviation: ''
    },
    buts: 0,
    passes: 0,
    cartons: 0,
    totalContributions: 0,
    soldeRestant: 0,
    soldeSanctionsRestant: 0,
    user: {
      id: 0, username: '', email: '', roles: '', active: true, membre: 0, motDePasse: '', groupe: 0,
      profilePhotoUrl: ''
    },
    active: true,
    sexe: '',
    cni: '',
    adresse: '',
    tel: '',
    assurance: false
  };
  groupe: Groupe | null = null;
  users: User[] = [];
  equipes: Equipe[] = [];
  editingRows: boolean[] = [];
  editMembre: Membre = {
    id: 0,
    nom: '',
    prenom: '',
    dateNaissance: '',
    poste: '',
    email: '',
    cotisationPayee: false,
    roleCO: '',
    equipe: { id: 0, nom: '' },
    groupe: {
      id: 0, nom: '', discipline: '', ville1: 0, stade2: 0, isActive: true, jourMatch: '', typeEquipe: '', modeEquipe: 'STATIQUE', fraisAdhesion: 0, ville: { id: 0, nom: '' }, stade: { id: 0, nom: '' },
      profilePhotoUrl: '',
      heureMatch: '',
      isPublic: false,
      abreviation: ''
    },
    buts: 0,
    passes: 0,
    cartons: 0,
    totalContributions: 0,
    soldeRestant: 0,
    soldeSanctionsRestant: 0,
    user: {
      id: 0, username: '', email: '', roles: '', active: true, membre: 0, motDePasse: '', groupe: 0,
      profilePhotoUrl: ''
    },
    active: true,
    sexe: '',
    cni: '',
    adresse: '',
    tel: '',
    assurance: false
  };
  selectedGroupeId: string = '';
  createUserForMembre: boolean = false;
  isLoading: boolean = true;
  showFilters = false;
filters = {
  equipe: null as number | null,
  active: null as boolean | null,
  sexe: null as string | null,
  roleCustom: null as number | null,
  roleCO: null as string | null,
  cotisation: null as boolean | null,
  poste: '' as string
};
filteredMembers: Membre[] = [];
paginatedMembers: Membre[] = [];
filteredCount = 0;
activeFiltersCount = 0;
pageSize = 10;
pageIndex = 0;
isSaving = false;

// Couleurs pour les avatars
private avatarColors = [
  '#1976d2', '#388e3c', '#f57c00', '#d32f2f',
  '#7b1fa2', '#0097a7', '#689f38', '#fbc02d'
];

  constructor(
    private adminService: MembreService,
    private equipeService: GeneralService,
    private dialog: MatDialog,
    private groupService: GroupeService,
    private userService: UserService,
    private snackBar: MatSnackBar,
     private roleCustomService: RoleCustomService, 
     private authService: AuthService
  ) {}



  ngOnInit() {
    this.loadData();
    this.loadRoles();
  }

  ngAfterViewInit() {
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

  

  // Méthode pour obtenir l'index global depuis l'index paginé
getGlobalIndex(paginatedIndex: number): number {
  const membre = this.paginatedMembers[paginatedIndex];
  return this.dataSource.data.findIndex(m => m.id === membre?.id);
}


 async loadRoles(): Promise<void> {
        // 1. Récupération synchrone de l'ID du groupe
        const groupeId = this.authService.getCurrentGroupeId();

        if (groupeId === null) {
            console.warn('Aucun groupe actif défini. Les rôles ne peuvent pas être chargés.');
            this.roles = [];
            return;
        }

        try {
            // 2. Conversion de l'Observable en Promesse avec lastValueFrom
            const roles = await lastValueFrom(
                this.roleCustomService.getRolesByGroupe()
            );
            
            // 3. Traitement des données
            this.roles = roles?.filter(r => r.actif) || [];
            
            // 4. Logique de continuation
            this.initializeRoleCustomFromRoleCO();

        } catch (err) {
            console.error('Erreur chargement rôles:', err);
            this.roles = [];
        }
  }

  /**
   * Initialiser roleCustom depuis l'ancien roleCO
   */
  initializeRoleCustomFromRoleCO(): void {
    // Mapping entre les anciens codes roleCO et les nouveaux noms de rôles
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
            membre.roleCustom = role;
            console.log(`Membre ${membre.prenom} ${membre.nom} : roleCO "${membre.roleCO}" → roleCustom "${role.nom}"`);
          }
        }
      }
    });

    // Rafraîchir le dataSource
    this.dataSource.data = [...this.dataSource.data];
    this.applyFilters();
  }


/**
   * Assigner un rôle personnalisé à un membre
   */
  assignRole(membre: Membre, role: RoleCustom | null, rowIndex: number): void {
    const roleText = role ? `assigner le rôle "${role.nom}"` : 'retirer le rôle';

    if (!confirm(`Voulez-vous vraiment ${roleText} à ${membre.prenom} ${membre.nom} ?`)) {
      return;
    }

    this.isSaving = true;

    const roleId = role?.id || null;

    this.roleCustomService.assignRoleToMembre(membre.id, roleId).subscribe({
      next: () => {
        // Mettre à jour le membre localement
        const globalIndex = this.getGlobalIndex(rowIndex);
        this.dataSource.data[globalIndex].roleCustom = role;
        
        // Si on est en mode édition, mettre à jour aussi editMembre
        if (this.editingRows[globalIndex]) {
          this.editMembre.roleCustom = role;
        }

        this.snackBar.open(
          role ? `Rôle "${role.nom}" assigné avec succès` : 'Rôle retiré avec succès',
          'Fermer',
          { duration: 3000 }
        );
        
        this.isSaving = false;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Erreur assignation rôle:', err);
        this.snackBar.open(
          err.error?.message || 'Erreur lors de l\'assignation',
          'Fermer',
          { duration: 3000 }
        );
        this.isSaving = false;
      }
    });
  }

  /**
   * Vérifier si un membre a un rôle spécifique
   */
  hasRole(membre: Membre, roleId: number): boolean {
    return membre.roleCustom?.id === roleId;
  }

  /**
   * Obtenir le rôle d'un membre
   */
  getMembreRole(membre: Membre): RoleCustom | null {
    return membre.roleCustom || null;
  }

  /**
   * Obtenir le nom du rôle à afficher
   */
  getRoleName(membre: Membre): string {
    return membre.roleCustom?.nom || 'Sans rôle';
  }

  /**
   * Obtenir la couleur du rôle
   */
  getRoleColor(membre: Membre): string {
    return membre.roleCustom?.couleur || '#9e9e9e';
  }

  /**
   * Obtenir l'icône du rôle
   */
  getRoleIcon(membre: Membre): string {
    return membre.roleCustom?.icone || 'badge';
  }

  // Modifiez loadData pour appliquer les filtres après chargement
loadData() {
  this.isLoading = true;
  forkJoin([
    this.adminService.getGroupMembers().pipe(map(data => data || [])),
    this.groupService.getAllGroupesMembre().pipe(map(data => data || null)),
    this.userService.getAllUsers().pipe(map(data => data || [])),
    this.equipeService.getEquipesByGroupe().pipe(map(data => data || []))
    
  ]).subscribe({
    next: ([membres, groupeResponse, users, equipes]) => {
      this.dataSource.data = membres || [];
      this.groupe = groupeResponse || null;
      const membreUserIds = new Set(membres?.filter(m => m.user && m.user.id).map(m => m.user!.id) || []);
      this.users = users.filter(user => !membreUserIds.has(user.id)) || [];
      this.equipes = equipes || [];
      this.editingRows = new Array(membres?.length || 0).fill(false);
      this.newMembre.groupe = this.groupe;
      
      // Appliquer les filtres après chargement
      this.applyFilters();
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Erreur lors du chargement des données:', err);
      this.isLoading = false;
      this.dataSource.data = [];
      this.filteredMembers = [];
      this.paginatedMembers = [];
    }
  });
}

  // loadData() {
  //   this.isLoading = true;
  //   console.log("la2")
  //   forkJoin([
  //     this.adminService.getGroupMembers().pipe(
  //       map(data => data || [])
  //     ),
  //     this.groupService.getAllGroupesMembre().pipe(
  //       map(data => data || null)
  //     ),
  //     this.userService.getAllUsers().pipe(
  //       map(data => data || [])
  //     ),
  //     this.equipeService.getEquipesByGroupe().pipe(
  //       map(data => data || [])
  //     )
  //   ]).subscribe({
  //     next: ([membres, groupeResponse, users, equipes]) => {
  //       this.dataSource.data = membres || [];
  //       console.log("la")
  //       this.groupe = groupeResponse || null;
  //       const membreUserIds = new Set(membres?.filter(m => m.user && m.user.id).map(m => m.user!.id) || []);
  //       this.users = users.filter(user => !membreUserIds.has(user.id)) || [];
  //       this.equipes = equipes || [];
  //       this.editingRows = new Array(membres?.length || 0).fill(false);
  
  //       this.newMembre.groupe = this.groupe;
  //             this.isLoading = false;
  //             console.log("la2")
  //     },
  //     error: (err) => {
  //       console.error('Erreur lors du chargement des données:', err);
  //       this.isLoading = false;
  //       this.dataSource.data = [];
  //     }
  //   });
    
  // }

  // applyFilter(event: Event) {
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   this.dataSource.filter = filterValue.trim().toLowerCase();
  // }

  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewMembre();
    }
  }

  isCreateFormValid(): boolean {
    return !!this.newMembre.nom && !!this.newMembre.prenom && !!this.newMembre.sexe && !!this.newMembre.groupe?.id;
  }

  saveMembre() {
    if (this.isCreateFormValid()) {
      if (this.createUserForMembre) {
        const newUser: User = {
          id: 0,
          username: `${this.newMembre.nom.toLowerCase()}_${this.newMembre.prenom.toLowerCase()}`,
          email: this.newMembre.email || `${this.newMembre.nom.toLowerCase()}@example.com`,
          motDePasse: this.newMembre.nom,
          roles: 'MEMBRE',
          active: true,
          membre: this.newMembre.id,
          groupe: 0,
          profilePhotoUrl: ''
        };
        this.userService.createUser(newUser).pipe(
          switchMap((createdUser) => {
            this.newMembre.user = createdUser;
            return this.adminService.createMember(this.newMembre);
          })
        ).subscribe({
          next: () => {
            this.loadData();
            this.toggleCreateRow();
          },
          error: (err) => console.error('Erreur lors de la création du membre:', err)
        });
      } else {
        this.adminService.createMember(this.newMembre).subscribe({
          next: () => {
            this.loadData();
            this.toggleCreateRow();
          },
          error: (err) => console.error('Erreur lors de la création du membre:', err)
        });
      }
    }
  }

  cancelCreate() {
    this.toggleCreateRow();
  }

  resetNewMembre() {
    this.newMembre = {
      id: 0,
      nom: '',
      prenom: '',
      dateNaissance: '',
      poste: '',
      email: '',
      cotisationPayee: false,
      roleCO: '',
      equipe: { id: 0, nom: '' },
      groupe: {
        id: 0, nom: '', discipline: '', ville1: 0, stade2: 0, isActive: true, jourMatch: '', typeEquipe: '', modeEquipe: 'STATIQUE', fraisAdhesion: 0, ville: { id: 0, nom: '' }, stade: { id: 0, nom: '' },
        profilePhotoUrl: '',
        heureMatch: '',
        isPublic: false,
        abreviation: ''
      },
      buts: 0,
      passes: 0,
      cartons: 0,
      totalContributions: 0,
      soldeRestant: 0,
      soldeSanctionsRestant: 0,
      user: {
        id: 0, username: '', email: '', roles: '', active: true, membre: 0, motDePasse: '', groupe: 0,
        profilePhotoUrl: ''
      },
      active: true,
      sexe: '',
      cni:'',
      adresse:'',
      tel:'',
      assurance: true,
    };
  }

editRow(localIndex: number, membre: Membre) {
  // 1. Trouver l'index global en utilisant l'ID unique du membre
  // C'est crucial car l'index 'localIndex' est affecté par le filtre/la pagination.
  const globalIndex = this.dataSource.data.findIndex(m => m.id === membre.id);

  console.log("Tentative d'édition pour Membre ID:", membre.id, "Index Global:", globalIndex);

  if (membre && globalIndex !== -1) {
    // 2. Utiliser l'index global pour activer l'édition dans le tableau 'editingRows'
    // C'est l'index que le template utilise via getGlobalIndex(i)
    this.editingRows[globalIndex] = true;
    
    // 3. Copier le membre pour l'édition
    this.editMembre = { ...membre };
    
    // Si vous utilisez OnPush, vous pourriez avoir besoin de: this.cdr.detectChanges();
  } else {
    console.error('Erreur: Impossible de trouver l\'index global du membre pour l\'édition.');
    }
  }

  isEditFormValid(): boolean {
    return !!this.editMembre.nom && !!this.editMembre.sexe;
  }

// Méthode saveEdit modifiée avec loading et messages
saveEdit(index: number) {
  const membre = this.paginatedMembers[index];
  const globalIndex = this.dataSource.data.findIndex(m => m.id === membre?.id);
  
  if (!this.isEditFormValid() || globalIndex === -1) {
    return;
  }

  this.isSaving = true;

  this.adminService.updateMembre(this.editMembre.id, this.editMembre).subscribe({
    next: () => {
      this.isSaving = false;
      this.showSuccessMessage('Membre modifié avec succès');
      this.editingRows[globalIndex] = false;
      this.loadData();
    },
    error: (err) => {
      this.isSaving = false;
      console.error('Erreur lors de la mise à jour du membre:', err);
      this.showErrorMessage('Erreur lors de la modification du membre');
    }
  });
}

  // Méthodes pour afficher les messages
showSuccessMessage(message: string) {
  this.snackBar.open(message, 'Fermer', {
    duration: 4000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
    panelClass: ['message-snackbar', 'success']
  });
}

showErrorMessage(message: string) {
  this.snackBar.open(message, 'Fermer', {
    duration: 5000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
    panelClass: ['message-snackbar', 'error']
  });
}

  cancelEdit(index: number) {
    this.editingRows[index] = false;
    this.editMembre = {
      id: 0,
      nom: '',
      prenom: '',
      dateNaissance: '',
      poste: '',
      email: '',
      cotisationPayee: false,
      roleCO: '',
      equipe: { id: 0, nom: '' },
      groupe: {
        id: 0, nom: '', discipline: '', ville1: 0, stade2: 0, isActive: true, jourMatch: '', typeEquipe: '', modeEquipe: 'STATIQUE', fraisAdhesion: 0, ville: { id: 0, nom: '' }, stade: { id: 0, nom: '' },
        profilePhotoUrl: '',
        heureMatch: '',
        isPublic: false,
        abreviation: ''
      },
      buts: 0,
      passes: 0,
      cartons: 0,
      totalContributions: 0,
      soldeRestant: 0,
      soldeSanctionsRestant: 0,
      user: {
        id: 0, username: '', email: '', roles: '', active: true, membre: 0, motDePasse: '', groupe: 0,
        profilePhotoUrl: ''
      },
      active: true,
      sexe: '',
       cni:'',
      adresse:'',
      tel:'',
      assurance: true,
    };
  }

  openDeleteDialog(membre: Membre) {
    if (membre) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: { message: `Voulez-vous supprimer le membre ${membre.nom} ${membre.prenom} ?` }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.deleteMembre(membre.id);
        }
      });
    }
  }

  openToggleActiveDialog(membre: Membre) {
    if (membre) {
      const action = membre.active ? 'désactiver' : 'activer';
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: { message: `Voulez-vous ${action} le membre ${membre.nom} ${membre.prenom} ?` }
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
  }

  activateMembre(id: number) {
    this.adminService.activateMember(id).subscribe({
      next: () => this.loadData(),
      error: (err) => console.error('Erreur lors de l’activation du membre:', err)
    });
  }

  deactivateMembre(id: number) {
    this.adminService.deactivateMember(id).subscribe({
      next: () => this.loadData(),
      error: (err) => console.error('Erreur lors de la désactivation du membre:', err)
    });
  }

  deleteMembre(id: number) {
    this.adminService.deleteMembre(id).subscribe({
      next: () => this.loadData(),
      error: (err) => console.error('Erreur lors de la suppression du membre:', err)
    });
  }

  toggleUserCreation() {
    if (this.createUserForMembre) {
      this.newMembre.user = { id: 0, username: '', motDePasse: '', email: '', roles: '', active: true, membre: 0, groupe: 0, profilePhotoUrl: '' };
    }
  }

  // expandPanel(index: number) {
  //   this.expandedRowIndex = index;
  //   if (this.dataSource.data[index]) {
  //     this.editMembre = { ...this.dataSource.data[index] };
  //     console.log('Expanded row:', index, this.editMembre);
  //   }
  // }

  collapsePanel(index: number) {
    this.expandedRowIndex = null;
    if (this.editingRows[index]) {
      this.cancelEdit(index); // Réinitialise si en mode édition
    }
  }

  compareEquipes(equipe1: any, equipe2: any): boolean {
    return equipe1 && equipe2 ? equipe1.id === equipe2.id : equipe1 === equipe2;
  }

  isDateValid(date: string): boolean {
    if (!date) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    try {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(date);
    } catch {
      return false;
    }
  }

  // Méthode pour appliquer tous les filtres
applyFilters() {
  let filtered = [...this.dataSource.data];

  // Filtre par équipe
  if (this.filters.equipe !== null) {
    filtered = filtered.filter(m => m.equipe?.id === this.filters.equipe);
  }

  // Filtre par statut actif
  if (this.filters.active !== null) {
    filtered = filtered.filter(m => m.active === this.filters.active);
  }

  // Filtre par sexe
  if (this.filters.sexe) {
    filtered = filtered.filter(m => m.sexe === this.filters.sexe);
  }

  // Filtre par rôle CO
  if (this.filters.roleCO !== null) {
    if (this.filters.roleCO === '') {
      filtered = filtered.filter(m => !m.roleCO);
    } else {
      filtered = filtered.filter(m => m.roleCO === this.filters.roleCO);
    }
  }

  // ✅ AJOUTER ce nouveau filtre
    if (this.filters.roleCustom !== null) {
      if (this.filters.roleCustom === 0) {
        // Filtrer les membres sans rôle
        filtered = filtered.filter(m => !m.roleCustom);
      } else {
        filtered = filtered.filter(m => m.roleCustom?.id === this.filters.roleCustom);
      }
    }

  // Filtre par cotisation
  if (this.filters.cotisation !== null) {
    filtered = filtered.filter(m => m.cotisationPayee === this.filters.cotisation);
  }

  // Filtre par poste
  if (this.filters.poste) {
    const posteSearch = this.filters.poste.toLowerCase();
    filtered = filtered.filter(m => 
      m.poste?.toLowerCase().includes(posteSearch)
    );
  }

  // Appliquer le filtre de recherche si présent
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
  this.pageIndex = 0; // Reset à la première page
  this.updatePaginatedMembers();
}

// Calculer le nombre de filtres actifs
calculateActiveFilters(): number {
  let count = 0;
  if (this.filters.equipe !== null) count++;
  if (this.filters.active !== null) count++;
  if (this.filters.sexe !== null) count++;
  if (this.filters.roleCO !== null) count++;
  if (this.filters.cotisation !== null) count++;
  if (this.filters.poste) count++;
  return count;
}

// Effacer tous les filtres
clearAllFilters() {
  this.filters = {
    equipe: null,
    active: null,
    sexe: null,
    roleCO: null,
    roleCustom: null,
    cotisation: null,
    poste: ''
  };
  this.applyFilters();
}

// Mise à jour du filtre de recherche
applyFilter(event: Event) {
  const filterValue = (event.target as HTMLInputElement).value;
  this.dataSource.filter = filterValue.trim().toLowerCase();
  this.applyFilters();
}

// Effacer la recherche
clearSearch(input: HTMLInputElement) {
  input.value = '';
  this.dataSource.filter = '';
  this.applyFilters();
}

// Mise à jour des membres paginés
updatePaginatedMembers() {
  const startIndex = this.pageIndex * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  this.paginatedMembers = this.filteredMembers.slice(startIndex, endIndex);
}

// Gestion de la pagination
onPageChange(event: PageEvent) {
  this.pageSize = event.pageSize;
  this.pageIndex = event.pageIndex;
  this.updatePaginatedMembers();
}

// Obtenir les initiales
getInitials(prenom: string, nom: string): string {
  const prenomInitial = prenom ? prenom.charAt(0).toUpperCase() : '';
  const nomInitial = nom ? nom.charAt(0).toUpperCase() : '';
  return `${prenomInitial}${nomInitial}`;
}

// Obtenir une couleur d'avatar
getAvatarColor(index: number): string {
  return this.avatarColors[index % this.avatarColors.length];
}

// Modifiez expandPanel pour utiliser l'index de la liste paginée
expandPanel(index: number) {
  const globalIndex = this.dataSource.data.findIndex(
    m => m.id === this.paginatedMembers[index].id
  );
  this.expandedRowIndex = globalIndex;
  if (this.dataSource.data[globalIndex]) {
    this.editMembre = { ...this.dataSource.data[globalIndex] };
  }
}

// ✅ AJOUTER cette méthode dans le composant TypeScript

/**
 * Comparer deux rôles pour le mat-select
 */
compareRoles(r1: RoleCustom, r2: RoleCustom): boolean {
  return r1 && r2 ? r1.id === r2.id : r1 === r2;
}



// Modifiez les autres méthodes pour gérer correctement les index
// editRow(index: number, membre: Membre) {
//   const globalIndex = this.dataSource.data.findIndex(m => m.id === membre.id);
//   if (globalIndex !== -1 && this.dataSource.data[globalIndex]) {
//     this.editingRows[globalIndex] = true;
//     this.editMembre = { ...membre };
//   }
// }

// saveEdit(index: number) {
//   const membre = this.paginatedMembers[index];
//   const globalIndex = this.dataSource.data.findIndex(m => m.id === membre.id);
  
//   if (this.isEditFormValid() && globalIndex !== -1) {
//     this.adminService.updateMembre(this.editMembre.id, this.editMembre).subscribe({
//       next: () => {
//         this.loadData();
//         this.editingRows[globalIndex] = false;
//       },
//       error: (err) => console.error('Erreur lors de la mise à jour du membre:', err)
//     });
//   }
// }

// cancelEdit(index: number) {
//   const membre = this.paginatedMembers[index];
//   const globalIndex = this.dataSource.data.findIndex(m => m.id === membre.id);
  
//   if (globalIndex !== -1) {
//     this.editingRows[globalIndex] = false;
//     this.editMembre = {
//       id: 0, nom: '', prenom: '', dateNaissance: '', poste: '', email: '',
//       cotisationPayee: false, roleCO: '', equipe: { id: 0, nom: '' },
//       groupe: { id: 0, nom: '', discipline: '', ville: 0, stade: 0, isActive: true, 
//                 jourMatch: '', typeEquipe: '', modeEquipe: 'STATIQUE', fraisAdhesion: 0,
//                 ville1: { id: 0, nom: '' }, stade2: { id: 0, nom: '' } },
//       buts: 0, passes: 0, cartons: 0, totalContributions: 0, soldeRestant: 0,
//       soldeSanctionsRestant: 0, user: { id: 0, username: '', email: '', roles: '',
//       active: true, membre: 0, motDePasse: '', groupe: 0 }, active: true,
//       sexe: '', cni: '', adresse: '', tel: '', assurance: true
//     };
//   }
}