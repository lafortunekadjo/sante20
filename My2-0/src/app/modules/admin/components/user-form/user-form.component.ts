import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { Groupe } from '../../../../core/models/groupe.model';
import { User } from '../../../../core/models/user';
import { UserService } from '../../../../core/services/user.service';
import { GroupeService } from '../../../../core/services/groupe.service';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';
import { PasswordResetResultDialogComponent, PasswordResetDialogData } from '../../../users/password-reset-result-dialog/password-reset-result-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { PartenaireService } from '../../../../core/services/partenaire.service';
import { AdminPartenaireService, PartenaireListParams } from '../../../../core/services/admin-partenaire.service';
import { PartenaireDTO } from '../../../../core/models/partenaire.model';
import { TranslateModule } from '@ngx-translate/core';

// Interface pour les rôles
interface RoleObject {
  id: number;
  name: string;
}

// Interface pour les statistiques
interface UserStats {
  total: number;
  actifs: number;
  inactifs: number;
  admins: number;
  responsables: number;
   partenaires: number;
  membres: number;
  sansGroupe: number;
}

@Component({
  selector: 'app-user-form',
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
    MatTooltipModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule,
    MatProgressSpinnerModule,
    RouterModule,
    TranslateModule
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
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit, AfterViewInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = ['username', 'email', 'roles', 'groupe', 'active', 'actions'];
  
  // États
  showCreateRow = false;
  isLoading = true;
  hidePassword = true;
  viewMode: 'grid' | 'list' = 'grid';
  isAdmin=false;
  currentUser: any; // Pour stocker l'utilisateur connecté
  isResponsable: boolean = false;
  
  // Filtres
  searchTerm = '';
  roleFilter = 'ALL';
  statusFilter = 'ALL';
  groupeFilter: string | number = 'ALL';
  filteredUsers: User[] = [];
  
  // Données
  groupes: Groupe[] = [];
  editingRows: boolean[] = [];
  selectedRolesArray: string[] = [];
  editSelectedRolesArray: string[] = [];
  partenaires: PartenaireDTO [] = [];
  
  // Statistiques
  stats: UserStats = {
    total: 0,
    actifs: 0,
    inactifs: 0,
    admins: 0,
    responsables: 0,
    membres: 0,
    sansGroupe: 0,
    partenaires: 0
  };
  
  newUser: any = {
    id: 0,
    username: '',
    email: '',
    roles: [],
    active: true,
    membre: 0,
    motDePasse: '',
    groupe: 0,
    profilePhotoUrl: '',
    partenaire:0
  };
  
  editUser: any = {} as any;

  constructor(
    private adminService: UserService,
    private groupService: GroupeService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private partenaireService: AdminPartenaireService
  ) {}

  ngOnInit(): void {
   // this.currentUser = this.authService.ge; // Ou ta méthode pour récupérer le user
    this.isResponsable = this.authService.isResponsable();
      this.isAdmin = this.authService.isAdmin();
    this.loadData();

    this.setupSearch();
    console.log(this.isAdmin)
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'groupe': return this.getGroupeName(item);
        case 'active': return item.active ? 1 : 0;
        case 'roles': return this.getRolesString(item.roles);
        default: return (item as any)[property];
      }
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== RECHERCHE =====

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  // ===== CHARGEMENT =====

  loadData(): void {
    this.isLoading = true;
    forkJoin([
      this.adminService.getAllUsers(),
      this.groupService.getAllGroupes(),
      
    ]).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ([users, groupes]) => {
        this.dataSource.data = users;
        this.groupes = groupes;
        this.editingRows = new Array(users.length).fill(false);
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
        this.loadPartenaires();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.showSnackbar('Erreur lors du chargement des données', 'error');
        this.isLoading = false;
      }
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          this.editingRows = new Array(data.length).fill(false);
          this.calculateStats();
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des utilisateurs:', err);
          this.showSnackbar('Erreur lors du chargement', 'error');
          this.isLoading = false;
        }
      });
  }

   public loadPartenaires(): void {
     this.isLoading = true;
 
     const params: PartenaireListParams = {
     
     };
 
     const sub = this.partenaireService.getPartenaires(params).subscribe({
       next: (response) => {
         this.partenaires = response.content;
         this.isLoading = false;
       },
       error: (err) => {
         console.error('Erreur chargement partenaires:', err);
         this.isLoading = false;
         this.snackBar.open('Erreur lors du chargement', 'OK', { duration: 3000 });
       }
     });
   }

  // ===== STATISTIQUES =====

  private calculateStats(): void {
    const users = this.dataSource.data;
    
    this.stats = {
      total: users.length,
      actifs: users.filter(u => u.active).length,
      inactifs: users.filter(u => !u.active).length,
      admins: users.filter(u => this.hasRole(u, 'ADMIN')).length,
      responsables: users.filter(u => this.hasRole(u, 'RESPONSABLE')).length,
      partenaires: users.filter(u => this.hasRole(u, 'PARTENAIRE')).length,
      membres: users.filter(u => this.hasRole(u, 'MEMBRE')).length,
      sansGroupe: users.filter(u => !this.getGroupeId(u)).length
    };
  }

  private hasRole(user: User, role: string): boolean {
    const roles = this.getRolesArray(user.roles);
    return roles.includes(role);
  }

  getCountByStatus(active: boolean): number {
    return this.dataSource.data.filter(user => user.active === active).length;
  }

  getCountByRole(role: string): number {
    return this.dataSource.data.filter(user => this.hasRole(user, role)).length;
  }

  // ===== FILTRES =====

  applyFilters(): void {
    let filtered = [...this.dataSource.data];

    // Filtre recherche
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        this.getGroupeName(user).toLowerCase().includes(search)
      );
    }

    // Filtre rôle
    if (this.roleFilter !== 'ALL') {
      filtered = filtered.filter(user => this.hasRole(user, this.roleFilter));
    }

    // Filtre statut
    if (this.statusFilter !== 'ALL') {
      const isActive = this.statusFilter === 'ACTIVE';
      filtered = filtered.filter(user => user.active === isActive);
    }

    // Filtre groupe
    if (this.groupeFilter !== 'ALL') {
      const groupeId = Number(this.groupeFilter);
      filtered = filtered.filter(user => {
        const userGroupeId = this.getGroupeId(user);
        if (groupeId === 0) {
          return !userGroupeId || userGroupeId === 0;
        }
        return userGroupeId === groupeId;
      });
    }

    this.filteredUsers = filtered;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.roleFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.groupeFilter = 'ALL';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' ||
           this.roleFilter !== 'ALL' ||
           this.statusFilter !== 'ALL' ||
           this.groupeFilter !== 'ALL';
  }

  // ===== UTILITAIRES POUR LES RÔLES =====

  getRolesArray(roles: any): string[] {
    if (!roles) return [];
    
    if (Array.isArray(roles)) {
      return roles.map(role => {
        if (typeof role === 'string') {
          return this.cleanRoleName(role);
        }
        if (role.name) {
          return this.cleanRoleName(role.name);
        }
        if (role.nom) {
          return this.cleanRoleName(role.nom);
        }
        return '';
      }).filter(r => r);
    }
    
    if (typeof roles === 'string') {
      return roles.split(',').map(r => this.cleanRoleName(r.trim())).filter(r => r);
    }
    
    if (roles.nom) {
      return [this.cleanRoleName(roles.nom)];
    }
    
    return [];
  }

  getRolesString(roles: any): string {
    return this.getRolesArray(roles).join(', ');
  }

  cleanRoleName(role: string): string {
    if (!role) return '';
    return role.replace('ROLE_', '').toUpperCase();
  }

  rolesToApiFormat(rolesArray: string[]): RoleObject[] {
    const roleMap: { [key: string]: number } = {
      'ADMIN': 1,
      'RESPONSABLE': 2,
      'MEMBRE': 3,
      'PARTENAIRE': 4
    };
    
    return rolesArray.map(role => ({
      id: roleMap[role] || 0,
      name: `ROLE_${role}`
    }));
  }

  getRoleIcon(role: string): string {
    switch (role.toUpperCase()) {
      case 'ADMIN': return 'admin_panel_settings';
      case 'RESPONSABLE': return 'supervisor_account';
      case 'MEMBRE': return 'person';
      case 'PARTENAIRE': return 'person';
      default: return 'person';
    }
  }

  getRoleColor(role: string): string {
    switch (role.toUpperCase()) {
      case 'ADMIN': return 'admin';
      case 'RESPONSABLE': return 'responsable';
      case 'MEMBRE': return 'membre';
      case 'PARTENAIRE': return 'partenaire';
      default: return 'membre';
    }
  }

  // ===== UTILITAIRES POUR LES GROUPES =====

  getGroupeId(user: User): number | null {
    if (!user.groupe) return null;
    if (typeof user.groupe === 'object') {
      return (user.groupe as any).id;
    }
    return user.groupe as number;
  }

  getGroupeName(user: User): string {
    if (!user.groupe) return 'Sans groupe';
    
    if (typeof user.groupe === 'object' && (user.groupe as any).nom) {
      return (user.groupe as any).nom;
    }
    
    const groupeId = this.getGroupeId(user);
    if (groupeId) {
      const groupe = this.groupes.find(g => g.id === groupeId);
      return groupe ? groupe.nom : 'Sans groupe';
    }
    
    return 'Sans groupe';
  }

  // ===== UTILITAIRES UTILISATEUR =====

  getUserInitials(user: User): string {
    if (!user.username) return '?';
    const parts = user.username.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  }

  getUserColor(user: User): string {
    const colors = [
      '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444',
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
    ];
    const index = user.username ? user.username.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }

  // ===== SNACKBAR =====

  private showSnackbar(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: type === 'error' ? 'snackbar-error' : type === 'success' ? 'snackbar-success' : ''
    });
  }

  // ===== CRÉATION =====

  toggleCreateRow(): void {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewUser();
    }
  }

  isCreateFormValid(): boolean {
    return !!this.newUser.username && 
           !!this.newUser.motDePasse && 
           this.selectedRolesArray.length > 0;
  }

  onRoleSelectionChange(): void {
    const selected = [...this.selectedRolesArray];
    const isResponsableSelected = selected.includes('RESPONSABLE');
    const isMembreSelected = selected.includes('MEMBRE');

    if (isResponsableSelected && !isMembreSelected) {
      selected.push('MEMBRE');
    }

    this.selectedRolesArray = [...selected];
    this.newUser.roles = this.rolesToApiFormat(this.selectedRolesArray);
  }

saveUser(): void {
  if (this.isCreateFormValid()) {
    this.isLoading = true;

    // Si l'utilisateur connecté n'est pas admin, on force l'ID du groupe courant
    if (!this.isAdmin) {
      this.newUser.groupe = this.authService.getCurrentGroupeId();
    }

    console.log('Données avant formatage:', this.newUser);

    // Extraction et formatage des données à envoyer
    const userData = {
      ...this.newUser,
      roles: this.rolesToApiFormat(this.selectedRolesArray)
    };

    // ⭐ CHOIX DYNAMIQUE DU SERVICE SELON LE RÔLE ⭐
    // Si ADMIN -> On appelle la nouvelle fonction (création de l'utilisateur seul)
    // Si NON-ADMIN -> On appelle l'ancienne fonction (création utilisateur + membre)
    const request$ = this.isAdmin 
      ? this.adminService.createUser(userData)
      : this.adminService.createUserOnly(userData);

    // Exécution de la requête
    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Utilisateur créé avec succès', 'success');
          this.loadUsers();
          this.toggleCreateRow();
          this.isLoading = false; // Ne pas oublier de reset le spinner de chargement
        },
        error: (err) => {
          console.error('Erreur lors de la création:', err);
          this.showSnackbar('Erreur lors de la création de l\'utilisateur', 'error');
          this.isLoading = false;
        }
      });
  }
}

  cancelCreate(): void {
    this.toggleCreateRow();
  }

  resetNewUser(): void {
    this.newUser = {
      id: 0,
      username: '',
      email: '',
      roles: [],
      active: true,
      membre: 0,
      motDePasse: '',
      groupe: 0,
      profilePhotoUrl: '',
      partenaire:0
    };
    this.selectedRolesArray = [];
  }

  // ===== ÉDITION =====

  editRow(index: number, user: User): void {
    this.editingRows[index] = true;
    this.editUser = { ...user };
    this.editSelectedRolesArray = this.getRolesArray(user.roles);
  }

  onEditRoleSelectionChange(): void {
    const selected = [...this.editSelectedRolesArray];
    const isResponsableSelected = selected.includes('RESPONSABLE');
    const isMembreSelected = selected.includes('MEMBRE');

    if (isResponsableSelected && !isMembreSelected) {
      selected.push('MEMBRE');
    }

    this.editSelectedRolesArray = [...selected];
  }

  isEditFormValid(): boolean {
    return !!this.editUser.username && this.editSelectedRolesArray.length > 0;
  }

  saveEdit(index: number): void {
    if (this.isEditFormValid()) {
      this.isLoading = true;
      
      const userData = {
        ...this.editUser,
        roles: this.rolesToApiFormat(this.editSelectedRolesArray),
        groupe: this.editUser.groupe && typeof this.editUser.groupe === 'object' 
          ? { id: this.editUser.groupe.id } 
          : this.editUser.groupe ? { id: this.editUser.groupe } : null
      };
      console.log(userData)

      this.adminService.updateUser(this.editUser.id, userData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSnackbar('Utilisateur mis à jour', 'success');
            this.loadUsers();
            this.editingRows[index] = false;
            this.editSelectedRolesArray = [];
          },
          error: (err) => {
            console.error('Erreur lors de la mise à jour:', err);
            this.showSnackbar('Erreur lors de la mise à jour', 'error');
            this.isLoading = false;
          }
        });
    }
  }

  cancelEdit(index: number): void {
    this.editingRows[index] = false;
    this.editUser = {} as User;
    this.editSelectedRolesArray = [];
  }

  // ===== ACTIONS =====

  openDeleteDialog(user: User): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { 
        title: 'Supprimer l\'utilisateur',
        message: `Voulez-vous vraiment supprimer l'utilisateur "${user.username}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteUser(user.id);
      }
    });
  }

  openToggleActiveDialog(user: User): void {
    const action = user.active ? 'désactiver' : 'activer';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { 
        title: `${user.active ? 'Désactiver' : 'Activer'} l'utilisateur`,
        message: `Voulez-vous ${action} l'utilisateur "${user.username}" ?`,
        confirmText: user.active ? 'Désactiver' : 'Activer',
        cancelText: 'Annuler',
        type: user.active ? 'warning' : 'success'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (user.active) {
          this.deactivateUser(user.id);
        } else {
          this.activateUser(user.id);
        }
      }
    });
  }

  activateUser(id: number): void {
    this.isLoading = true;
    this.adminService.activateUser(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Utilisateur activé', 'success');
          this.loadUsers();
        },
        error: (err) => {
          console.error('Erreur lors de l\'activation:', err);
          this.showSnackbar('Erreur lors de l\'activation', 'error');
          this.isLoading = false;
        }
      });
  }

  deactivateUser(id: number): void {
    this.isLoading = true;
    this.adminService.deactivateUser(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Utilisateur désactivé', 'success');
          this.loadUsers();
        },
        error: (err) => {
          console.error('Erreur lors de la désactivation:', err);
          this.showSnackbar('Erreur lors de la désactivation', 'error');
          this.isLoading = false;
        }
      });
  }

  deleteUser(id: number): void {
    this.isLoading = true;
    this.adminService.deleteUser(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Utilisateur supprimé', 'success');
          this.loadUsers();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          this.showSnackbar('Erreur lors de la suppression', 'error');
          this.isLoading = false;
        }
      });
  }

  // ===== EXPORT =====

  exportToCSV(): void {
    const headers = ['Username', 'Email', 'Rôles', 'Groupe', 'Statut'];
    const data = this.filteredUsers.map(u => [
      u.username,
      u.email || '',
      this.getRolesString(u.roles),
      this.getGroupeName(u),
      u.active ? 'Actif' : 'Inactif'
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    this.showSnackbar('Export CSV réussi', 'success');
  }

  exportToExcel(): void {
    this.showSnackbar('Export Excel en cours de développement', 'info');
  }

  // ===== RESET PASSWORD =====

  resetPassword(user: User): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Réinitialiser le mot de passe',
        message: `Voulez-vous réinitialiser le mot de passe de "${user.username}" ? Un nouveau mot de passe sera généré automatiquement.`,
        confirmText: 'Réinitialiser',
        cancelText: 'Annuler',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performPasswordReset(user);
      }
    });
  }

  private performPasswordReset(user: User): void {
    this.isLoading = true;
    const newPassword = this.generatePassword();

    this.adminService.resetUserPassword(user.id, newPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.dialog.open(PasswordResetResultDialogComponent, {
            width: '450px',
            maxWidth: '95vw',
            disableClose: true,
            data: {
              username: user.username,
              email: user.email,
              newPassword: newPassword
            } as PasswordResetDialogData
          });
        },
        error: (err) => {
          console.error('Erreur lors de la réinitialisation:', err);
          this.showSnackbar('Erreur lors de la réinitialisation', 'error');
          this.isLoading = false;
        }
      });
  }

  private generatePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const special = '@#$%&*!?';
    
    const allChars = uppercase + lowercase + numbers + special;
    
    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  compareGroupe = (g1: any, g2: any): boolean => {
    if (!g1 && !g2) return true;
    if (!g1 || !g2) return false;
    
    const id1 = typeof g1 === 'object' ? g1.id : g1;
    const id2 = typeof g2 === 'object' ? g2.id : g2;
    
    return id1 === id2;
  }
}