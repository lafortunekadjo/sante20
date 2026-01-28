import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { forkJoin } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { PasswordResetResultDialogComponent, PasswordResetDialogData } from '../../../users/password-reset-result-dialog/password-reset-result-dialog.component';

// ✅ Interface pour les rôles (tableau d'objets)
interface RoleObject {
  id: number;
  name: string;
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
    FormsModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = ['username', 'email', 'roles', 'groupe', 'active', 'actions'];
  
  // États
  showCreateRow: boolean = false;
  isLoading: boolean = true;
  hidePassword: boolean = true;
  viewMode: 'grid' | 'list' = 'grid';
  
  // Filtres
  searchTerm: string = '';
  roleFilter: string = 'ALL';
  statusFilter: string = 'ALL';
  groupeFilter: string | number = 'ALL';
  filteredUsers: User[] = [];
  
  // Données
  groupes: Groupe[] = [];
  editingRows: boolean[] = [];
  selectedRolesArray: string[] = [];
  editSelectedRolesArray: string[] = []; // ✅ Pour l'édition
  
  newUser: any = {
    id: 0,
    username: '',
    email: '',
    roles: [],
    active: true,
    membre: 0,
    motDePasse: '',
    groupe: 0,
    profilePhotoUrl: ''
  };
  
  editUser: any = {} as any;

  constructor(
    private adminService: UserService,
    private groupService: GroupeService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadData();
  }



  ngAfterViewInit() {
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

  // ===== CHARGEMENT =====

  loadData() {
    this.isLoading = true;
    forkJoin([
      this.adminService.getAllUsers(),
      this.groupService.getAllGroupes()
    ]).subscribe({
      next: ([users, groupes]) => {
        this.dataSource.data = users;
        console.log('Users loaded:', users);
        this.groupes = groupes;
        this.editingRows = new Array(users.length).fill(false);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.isLoading = false;
      }
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.editingRows = new Array(data.length).fill(false);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        this.isLoading = false;
      }
    });
  }

  // ===== FILTRES =====

  applyFilters(): void {
    let filtered = [...this.dataSource.data];

    // Filtre recherche
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search)
      );
    }

    // Filtre rôle
    if (this.roleFilter !== 'ALL') {
      filtered = filtered.filter(user => {
        const rolesStr = this.getRolesString(user.roles);
        return rolesStr.toUpperCase().includes(this.roleFilter);
      });
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

  // ===== COMPTEURS =====

  getCountByStatus(active: boolean): number {
    return this.dataSource.data.filter(user => user.active === active).length;
  }

  // ===== UTILITAIRES POUR LES RÔLES =====

  /**
   * ✅ Extraire les rôles sous forme de tableau de strings
   * Gère: tableau d'objets [{id, name}], string, ou objet {nom}
   */
  getRolesArray(roles: any): string[] {
    if (!roles) return [];
    
    // Si c'est un tableau d'objets [{id, name}]
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
    
    // Si c'est une string
    if (typeof roles === 'string') {
      return roles.split(',').map(r => this.cleanRoleName(r.trim())).filter(r => r);
    }
    
    // Si c'est un objet {nom}
    if (roles.nom) {
      return [this.cleanRoleName(roles.nom)];
    }
    
    return [];
  }

  /**
   * ✅ Convertir les rôles en string pour affichage/filtrage
   */
  getRolesString(roles: any): string {
    return this.getRolesArray(roles).join(', ');
  }

  /**
   * ✅ Nettoyer le nom du rôle (enlever ROLE_ prefix)
   */
  cleanRoleName(roleName: string): string {
    if (!roleName) return '';
    return roleName.replace('ROLE_', '').trim();
  }

  /**
   * ✅ Convertir les strings de rôles en objets pour l'API
   */
  rolesToApiFormat(rolesArray: string[]): RoleObject[] {
    const roleMapping: { [key: string]: number } = {
      'ADMIN': 1,
      'RESPONSABLE': 2,
      'MEMBRE': 3,
      'CANDIDAT': 4
    };

    return rolesArray.map(role => ({
      id: roleMapping[role] || 0,
      name: `ROLE_${role}`
    }));
  }

  // ===== UTILITAIRES POUR LE GROUPE =====

  /**
   * ✅ Obtenir l'ID du groupe (gère objet ou nombre)
   */
  getGroupeId(user: any): number {
    if (!user) return 0;
    
    // Si groupe est un objet
    if (user.groupe && typeof user.groupe === 'object' && user.groupe.id) {
      return user.groupe.id;
    }
    
    // Si groupe est un nombre
    if (typeof user.groupe === 'number') {
      return user.groupe;
    }
    
    // Fallback sur membre
    if (user.membre && typeof user.membre === 'number') {
      return user.membre;
    }
    
    return 0;
  }

  /**
   * ✅ Obtenir le nom du groupe
   */
  getGroupeName(user: any): string {
    if (!user) return 'Aucun groupe';
    
    // Si groupe est un objet avec nom
    if (user.groupe && typeof user.groupe === 'object' && user.groupe.nom) {
      return user.groupe.nom;
    }
    
    // Sinon chercher dans la liste des groupes
    const groupeId = this.getGroupeId(user);
    if (!groupeId || groupeId === 0) return 'Aucun groupe';
    
    const groupe = this.groupes.find(g => g.id === groupeId);
    return groupe ? groupe.nom : 'Inconnu';
  }

  /**
   * ✅ Obtenir les initiales de l'utilisateur
   */
  getUserInitials(user: User): string {
    if (!user?.username) return '?';
    const parts = user.username.split(/[_\s-]/); // Split par underscore, espace ou tiret
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  }

  // ===== CRÉATION =====

  toggleCreateRow() {
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

    // Si RESPONSABLE est sélectionné, MEMBRE doit l'être aussi
    if (isResponsableSelected && !isMembreSelected) {
      selected.push('MEMBRE');
    }

    this.selectedRolesArray = [...selected];
    // Convertir en format API
    this.newUser.roles = this.rolesToApiFormat(this.selectedRolesArray);
  }

  saveUser() {
    if (this.isCreateFormValid()) {
      this.isLoading = true;
      
      // Préparer les données pour l'API
      const userData = {
        ...this.newUser,
        roles: this.rolesToApiFormat(this.selectedRolesArray),
        groupe: this.newUser.groupe ? { id: this.newUser.groupe } : null
      };

      this.adminService.createUser(userData).subscribe({
        next: () => {
          this.loadUsers();
          this.toggleCreateRow();
        },
        error: (err) => {
          console.error('Erreur lors de la création:', err);
          this.isLoading = false;
        }
      });
    }
  }

  cancelCreate() {
    this.toggleCreateRow();
  }

  resetNewUser() {
    this.newUser = {
      id: 0,
      username: '',
      email: '',
      roles: [],
      active: true,
      membre: 0,
      motDePasse: '',
      groupe: 0,
      profilePhotoUrl: ''
    };
    this.selectedRolesArray = [];
  }

  // ===== ÉDITION =====

  editRow(index: number, user: User) {
    this.editingRows[index] = true;
    this.editUser = { ...user };
    
    // ✅ Extraire les rôles pour le select multiple
    this.editSelectedRolesArray = this.getRolesArray(user.roles);
    
    console.log('Editing user:', user);
    console.log('Extracted roles:', this.editSelectedRolesArray);
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

  saveEdit(index: number) {
    if (this.isEditFormValid()) {
      this.isLoading = true;
      
      // ✅ Préparer les données pour l'API
      const userData = {
        ...this.editUser,
        roles: this.rolesToApiFormat(this.editSelectedRolesArray),
        groupe: this.editUser.groupe && typeof this.editUser.groupe === 'object' 
          ? { id: this.editUser.groupe.id } 
          : this.editUser.groupe ? { id: this.editUser.groupe } : null
      };

      this.adminService.updateUser(this.editUser.id, userData).subscribe({
        next: () => {
          this.loadUsers();
          this.editingRows[index] = false;
          this.editSelectedRolesArray = [];
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour:', err);
          this.isLoading = false;
        }
      });
    }
  }

  cancelEdit(index: number) {
    this.editingRows[index] = false;
    this.editUser = {} as User;
    this.editSelectedRolesArray = [];
  }

  // ===== ACTIONS =====

  openDeleteDialog(user: User) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { 
        title: 'Supprimer l\'utilisateur',
        message: `Voulez-vous vraiment supprimer l'utilisateur "${user.username}" ?` 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteUser(user.id);
      }
    });
  }

  openToggleActiveDialog(user: User) {
    const action = user.active ? 'désactiver' : 'activer';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { 
        title: `${user.active ? 'Désactiver' : 'Activer'} l'utilisateur`,
        message: `Voulez-vous ${action} l'utilisateur "${user.username}" ?` 
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

  activateUser(id: number) {
    this.isLoading = true;
    this.adminService.activateUser(id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => {
        console.error('Erreur lors de l\'activation:', err);
        this.isLoading = false;
      }
    });
  }

  deactivateUser(id: number) {
    this.isLoading = true;
    this.adminService.deactivateUser(id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => {
        console.error('Erreur lors de la désactivation:', err);
        this.isLoading = false;
      }
    });
  }

  deleteUser(id: number) {
    this.isLoading = true;
    this.adminService.deleteUser(id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.isLoading = false;
      }
    });
  }

  // ===== EXPORT =====

  exportToExcel(): void {
    console.log('Export Excel - à implémenter');
  }

  // ===== RESET PASSWORD =====

  resetPassword(user: User): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Réinitialiser le mot de passe',
        message: `Voulez-vous réinitialiser le mot de passe de "${user.username}" ? Un nouveau mot de passe sera généré automatiquement.`
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

    this.adminService.resetUserPassword(user.id, newPassword).subscribe({
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
