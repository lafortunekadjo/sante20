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
import { AdminPartenaireService, PartenaireListParams } from '../../../../core/services/admin-partenaire.service';
import { PartenaireDTO } from '../../../../core/models/partenaire.model';
import { TranslateModule } from '@ngx-translate/core';
import { GroupeContextService } from '../../../../core/services/groupe-context.service';


interface RoleObject {
  id: number;
  name: string;
}

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
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatInputModule, MatFormFieldModule, MatSelectModule,
    MatCheckboxModule, MatPaginatorModule, MatSortModule, MatTooltipModule,
    MatButtonToggleModule, MatMenuModule, MatChipsModule, MatDialogModule,
    MatSnackBarModule, FormsModule, MatProgressSpinnerModule, RouterModule,
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

  private destroy$     = new Subject<void>();
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  // Source principale — contient TOUS les users chargés
  allUsers: User[] = [];
  // DataSource connecté au template — contient les users FILTRÉS
  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = ['username', 'email', 'roles', 'groupe', 'active', 'actions'];

  // Getter pour le HTML — pointe sur dataSource.data (filtrés)
  // Le HTML peut continuer à utiliser filteredUsers sans changement
  get filteredUsers(): User[] {
    return this.dataSource.data;
  }

  // États
  showCreateRow = false;
  isLoading     = true;
  hidePassword  = true;
  viewMode: 'grid' | 'list' = 'grid';
  activeTab: 'list' | 'filter' | 'create' = 'list';
  isAdmin       = false;
  isResponsable = false;
  currentUser: any;

  // Filtres
  searchTerm   = '';
  roleFilter   = 'ALL';
  statusFilter = 'ALL';
  groupeFilter: string | number = 'ALL';

  // Données
  groupes: Groupe[]    = [];
  partenaires: PartenaireDTO[] = [];
  editingRows: boolean[] = [];
  selectedRolesArray: string[]     = [];
  editSelectedRolesArray: string[] = [];

  // Statistiques
  stats: UserStats = {
    total: 0, actifs: 0, inactifs: 0,
    admins: 0, responsables: 0, membres: 0,
    sansGroupe: 0, partenaires: 0
  };

  newUser: any = {
    id: 0, username: '', email: '', roles: [],
    active: true, membre: 0, motDePasse: '',
    groupe: 0, profilePhotoUrl: '', partenaire: 0
  };

  editUser: any = {} as any;

  constructor(
    private adminService:     UserService,
    private groupService:     GroupeService,
    private authService:      AuthService,
    private router:           Router,
    private dialog:           MatDialog,
    private snackBar:         MatSnackBar,
    private partenaireService: AdminPartenaireService,
    private groupeContext:    GroupeContextService    // ← FIX : écoute du switch groupe
  ) {}

  ngOnInit(): void {
    this.isResponsable = this.authService.isResponsable();
    this.isAdmin       = this.authService.isAdmin();
    this.loadData();
    this.setupSearch();

    // FIX : recharger si l'utilisateur switche de groupe
    this.groupeContext.groupeChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'groupe': return this.getGroupeName(item);
        case 'active': return item.active ? 1 : 0;
        case 'roles':  return this.getRolesString(item.roles);
        default:       return (item as any)[property];
      }
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Recherche ──────────────────────────────────────────────

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  // ── Chargement ─────────────────────────────────────────────

  loadData(): void {
    this.isLoading = true;
    forkJoin([
      this.adminService.getAllUsers(),
      this.groupService.getAllGroupes()
    ]).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([users, groupes]) => {
          this.allUsers  = users;                 // ← garder la source complète
          this.groupes   = groupes;
          this.editingRows = new Array(users.length).fill(false);
          this.calculateStats();
          this.applyFilters();                    // ← met à jour dataSource
          this.isLoading = false;
          this.loadPartenaires();
        },
        error: (err) => {
          console.error('Erreur chargement:', err);
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
          this.allUsers    = data;
          this.editingRows = new Array(data.length).fill(false);
          this.calculateStats();
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.showSnackbar('Erreur lors du chargement', 'error');
          this.isLoading = false;
        }
      });
  }

  public loadPartenaires(): void {
    this.partenaireService.getPartenaires({} as PartenaireListParams).subscribe({
      next: (response) => { this.partenaires = response.content; },
      error: (err) => {
        console.error('Erreur partenaires:', err);
        this.snackBar.open('Erreur lors du chargement', 'OK', { duration: 3000 });
      }
    });
  }

  // ── Statistiques ───────────────────────────────────────────

  private calculateStats(): void {
    const users = this.allUsers;
    this.stats = {
      total:        users.length,
      actifs:       users.filter(u =>  u.active).length,
      inactifs:     users.filter(u => !u.active).length,
      admins:       users.filter(u => this.hasRole(u, 'ADMIN')).length,
      responsables: users.filter(u => this.hasRole(u, 'RESPONSABLE')).length,
      partenaires:  users.filter(u => this.hasRole(u, 'PARTENAIRE')).length,
      membres:      users.filter(u => this.hasRole(u, 'MEMBRE')).length,
      sansGroupe:   users.filter(u => !this.getGroupeId(u)).length
    };
  }

  private hasRole(user: User, role: string): boolean {
    return this.getRolesArray(user.roles).includes(role);
  }

  getCountByStatus(active: boolean): number {
    return this.allUsers.filter(u => u.active === active).length;
  }

  getCountByRole(role: string): number {
    return this.allUsers.filter(u => this.hasRole(u, role)).length;
  }

  // ── Filtres ────────────────────────────────────────────────

  applyFilters(): void {
    // FIX : filtrer depuis allUsers (source complète)
    // et assigner au dataSource.data (connecté au template)
    let filtered = [...this.allUsers];

    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.username?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        this.getGroupeName(u).toLowerCase().includes(search)
      );
    }

    if (this.roleFilter !== 'ALL') {
      filtered = filtered.filter(u => this.hasRole(u, this.roleFilter));
    }

    if (this.statusFilter !== 'ALL') {
      const isActive = this.statusFilter === 'ACTIVE';
      filtered = filtered.filter(u => u.active === isActive);
    }

    if (this.groupeFilter !== 'ALL') {
      const groupeId = Number(this.groupeFilter);
      filtered = filtered.filter(u => {
        const uid = this.getGroupeId(u);
        return groupeId === 0 ? (!uid || uid === 0) : uid === groupeId;
      });
    }

    // FIX : mettre à jour dataSource.data (pas filteredUsers)
    // MatTableDataSource se recharge automatiquement dans le template
    this.dataSource.data = filtered;
  }

  resetFilters(): void {
    this.searchTerm   = '';
    this.roleFilter   = 'ALL';
    this.statusFilter = 'ALL';
    this.groupeFilter = 'ALL';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' ||
           this.roleFilter   !== 'ALL'   ||
           this.statusFilter !== 'ALL'   ||
           this.groupeFilter !== 'ALL';
  }

  // ── Rôles ──────────────────────────────────────────────────

  getRolesArray(roles: any): string[] {
    if (!roles) return [];
    if (Array.isArray(roles)) {
      return roles.map(role => {
        if (typeof role === 'string') return this.cleanRoleName(role);
        if (role.name) return this.cleanRoleName(role.name);
        if (role.nom)  return this.cleanRoleName(role.nom);
        return '';
      }).filter(Boolean);
    }
    if (typeof roles === 'string') {
      return roles.split(',').map(r => this.cleanRoleName(r.trim())).filter(Boolean);
    }
    if (roles.nom) return [this.cleanRoleName(roles.nom)];
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
    const roleMap: Record<string, number> = {
      'ADMIN': 1, 'RESPONSABLE': 2, 'MEMBRE': 3, 'PARTENAIRE': 4
    };
    return rolesArray.map(role => ({
      id: roleMap[role] || 0,
      name: `ROLE_${role}`
    }));
  }

  getRoleIcon(role: string): string {
    const map: Record<string, string> = {
      ADMIN: 'admin_panel_settings', RESPONSABLE: 'supervisor_account',
      MEMBRE: 'person', PARTENAIRE: 'handshake'
    };
    return map[role.toUpperCase()] ?? 'person';
  }

  getRoleColor(role: string): string {
    const map: Record<string, string> = {
      ADMIN: 'admin', RESPONSABLE: 'responsable',
      MEMBRE: 'membre', PARTENAIRE: 'partenaire'
    };
    return map[role.toUpperCase()] ?? 'membre';
  }

  // ── Groupes ────────────────────────────────────────────────

  getGroupeId(user: User): number | null {
    if (!user.groupe) return null;
    if (typeof user.groupe === 'object') return (user.groupe as any).id ?? null;
    return user.groupe as number;
  }

  getGroupeName(user: User): string {
    if (!user.groupe) return 'Sans groupe';
    if (typeof user.groupe === 'object' && (user.groupe as any).nom) {
      return (user.groupe as any).nom;
    }
    const id = this.getGroupeId(user);
    if (id) {
      const g = this.groupes.find(g => g.id === id);
      return g ? g.nom : 'Sans groupe';
    }
    return 'Sans groupe';
  }

  // ── Utilisateur ────────────────────────────────────────────

 getUserInitials(user: any): string {
  // Priorité : userProfile > membre > username
  const nom    = user.userProfile?.nom    || user.membre?.nom    || user.username || '';
  const prenom = user.userProfile?.prenom || user.membre?.prenom || '';
 
  if (nom && prenom) return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  if (nom)           return nom.substring(0, 2).toUpperCase();
  return user.username?.substring(0, 2).toUpperCase() ?? '??';
}

getDisplayName(user: any): string {
  const nom    = user.userProfile?.nom    || user.membre?.nom    || '';
  const prenom = user.userProfile?.prenom || user.membre?.prenom || '';
  const full   = `${prenom} ${nom}`.trim();
  return full || user.username;
}
 
// Helper pour afficher tel dans la liste
getDisplayTel(user: any): string {
  return user.userProfile?.tel || user.membre?.tel || '—';
}

  getUserColor(user: User): string {
    const colors = [
      '#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ef4444',
      '#06b6d4','#ec4899','#14b8a6','#f97316','#6366f1'
    ];
    return colors[(user.username?.charCodeAt(0) ?? 0) % colors.length];
  }

  // ── Création ───────────────────────────────────────────────

  toggleCreateRow(): void {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) this.resetNewUser();
  }

  isCreateFormValid(): boolean {
    return !!this.newUser.username &&
           !!this.newUser.motDePasse &&
           this.selectedRolesArray.length > 0;
  }

  onRoleSelectionChange(): void {
    const selected = [...this.selectedRolesArray];
    if (selected.includes('RESPONSABLE') && !selected.includes('MEMBRE')) {
      selected.push('MEMBRE');
    }
    this.selectedRolesArray = selected;
    this.newUser.roles = this.rolesToApiFormat(this.selectedRolesArray);
  }

  saveUser(): void {
    if (!this.isCreateFormValid()) return;

    this.isLoading = true;

    // FIX : utiliser getGroupe() au lieu de getCurrentGroupeId()
    if (!this.isAdmin) {
      this.newUser.groupe = this.authService.getGroupe();
    }

    const userData = {
      ...this.newUser,
      roles: this.rolesToApiFormat(this.selectedRolesArray)
    };

    const request$ = this.isAdmin
      ? this.adminService.createUser(userData)
      : this.adminService.createUserOnly(userData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showSnackbar('Utilisateur créé avec succès', 'success');
        this.loadUsers();
        this.toggleCreateRow();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur création:', err);
        this.showSnackbar("Erreur lors de la création de l'utilisateur", 'error');
        this.isLoading = false;
      }
    });
  }

  cancelCreate(): void { this.toggleCreateRow(); }

  resetNewUser(): void {
    this.newUser = {
      id: 0, username: '', email: '', roles: [],
      active: true, membre: 0, motDePasse: '',
      groupe: 0, profilePhotoUrl: '', partenaire: 0
    };
    this.selectedRolesArray = [];
  }

  // ── Édition ────────────────────────────────────────────────

  editRow(index: number, user: User): void {
    this.editingRows[index]      = true;
    this.editUser                = { ...user };
    this.editSelectedRolesArray  = this.getRolesArray(user.roles);
  }

  onEditRoleSelectionChange(): void {
    const selected = [...this.editSelectedRolesArray];
    if (selected.includes('RESPONSABLE') && !selected.includes('MEMBRE')) {
      selected.push('MEMBRE');
    }
    this.editSelectedRolesArray = selected;
  }

  isEditFormValid(): boolean {
    return !!this.editUser.username && this.editSelectedRolesArray.length > 0;
  }

  saveEdit(index: number): void {
    if (!this.isEditFormValid()) return;

    this.isLoading = true;
    const userData = {
      ...this.editUser,
      roles: this.rolesToApiFormat(this.editSelectedRolesArray),
      groupe: this.editUser.groupe && typeof this.editUser.groupe === 'object'
        ? { id: this.editUser.groupe.id }
        : this.editUser.groupe ? { id: this.editUser.groupe } : null
    };

    this.adminService.updateUser(this.editUser.id, userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackbar('Utilisateur mis à jour', 'success');
          this.loadUsers();
          this.editingRows[index]     = false;
          this.editSelectedRolesArray = [];
          this.isLoading              = false;
        },
        error: (err) => {
          console.error('Erreur mise à jour:', err);
          this.showSnackbar('Erreur lors de la mise à jour', 'error');
          this.isLoading = false;
        }
      });
  }

  cancelEdit(index: number): void {
    this.editingRows[index]     = false;
    this.editUser               = {} as User;
    this.editSelectedRolesArray = [];
  }

  // ── Actions ────────────────────────────────────────────────

  openDeleteDialog(user: User): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: "Supprimer l'utilisateur",
        message: `Voulez-vous vraiment supprimer "${user.username}" ?`,
        confirmText: 'Supprimer', cancelText: 'Annuler', type: 'danger'
      }
    }).afterClosed().subscribe(result => { if (result) this.deleteUser(user.id); });
  }

  openToggleActiveDialog(user: User): void {
    const action = user.active ? 'désactiver' : 'activer';
    this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `${user.active ? 'Désactiver' : 'Activer'} l'utilisateur`,
        message: `Voulez-vous ${action} "${user.username}" ?`,
        confirmText: user.active ? 'Désactiver' : 'Activer',
        cancelText: 'Annuler',
        type: user.active ? 'warning' : 'success'
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        user.active ? this.deactivateUser(user.id) : this.activateUser(user.id);
      }
    });
  }

  activateUser(id: number): void {
    this.isLoading = true;
    this.adminService.activateUser(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.showSnackbar('Utilisateur activé', 'success'); this.loadUsers(); },
      error: () => { this.showSnackbar("Erreur lors de l'activation", 'error'); this.isLoading = false; }
    });
  }

  deactivateUser(id: number): void {
    this.isLoading = true;
    this.adminService.deactivateUser(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.showSnackbar('Utilisateur désactivé', 'success'); this.loadUsers(); },
      error: () => { this.showSnackbar('Erreur lors de la désactivation', 'error'); this.isLoading = false; }
    });
  }

  deleteUser(id: number): void {
    this.isLoading = true;
    this.adminService.deleteUser(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.showSnackbar('Utilisateur supprimé', 'success'); this.loadUsers(); },
      error: () => { this.showSnackbar('Erreur lors de la suppression', 'error'); this.isLoading = false; }
    });
  }

  // ── Export CSV ─────────────────────────────────────────────

  exportToCSV(): void {
    const headers = ['Username', 'Email', 'Rôles', 'Groupe', 'Statut'];
    const data    = this.dataSource.data.map(u => [
      u.username, u.email || '',
      this.getRolesString(u.roles),
      this.getGroupeName(u),
      u.active ? 'Actif' : 'Inactif'
    ]);

    const csv  = [headers, ...data].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    this.showSnackbar('Export CSV réussi', 'success');
  }

  exportToExcel(): void {
    this.showSnackbar('Export Excel en cours de développement', 'info');
  }

  // ── Reset password ─────────────────────────────────────────

  resetPassword(user: User): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Réinitialiser le mot de passe',
        message: `Voulez-vous réinitialiser le mot de passe de "${user.username}" ?`,
        confirmText: 'Réinitialiser', cancelText: 'Annuler', type: 'warning'
      }
    }).afterClosed().subscribe(result => {
      if (result) this.performPasswordReset(user);
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
            width: '450px', maxWidth: '95vw', disableClose: true,
            data: { username: user.username, email: user.email, newPassword } as PasswordResetDialogData
          });
        },
        error: () => {
          this.showSnackbar('Erreur lors de la réinitialisation', 'error');
          this.isLoading = false;
        }
      });
  }

  private generatePassword(length = 12): string {
    const up   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const low  = 'abcdefghjkmnpqrstuvwxyz';
    const num  = '23456789';
    const spec = '@#$%&*!?';
    const all  = up + low + num + spec;

    let pwd = [up, low, num, spec].map(c => c[Math.floor(Math.random() * c.length)]).join('');
    for (let i = pwd.length; i < length; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  }

  compareGroupe = (g1: any, g2: any): boolean => {
    if (!g1 && !g2) return true;
    if (!g1 || !g2) return false;
    const id1 = typeof g1 === 'object' ? g1.id : g1;
    const id2 = typeof g2 === 'object' ? g2.id : g2;
    return id1 === id2;
  };

  private showSnackbar(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: type === 'error' ? 'snackbar-error' : type === 'success' ? 'snackbar-success' : ''
    });
  }
}