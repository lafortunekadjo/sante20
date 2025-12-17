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
  
  newUser: User = {
    id: 0,
    username: '',
    email: '',
    roles: '',
    active: true,
    membre: 0,
    motDePasse: '',
    groupe: 0,
    profilePhotoUrl: ''
  };
  
  editUser: User = {} as User;

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
        case 'groupe': return this.getGroupeName(item.membre);
        case 'active': return item.active ? 1 : 0;
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
        user.username.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search)
      );
    }

    // Filtre rôle
    if (this.roleFilter !== 'ALL') {
      filtered = filtered.filter(user => {
        const roles = this.getRolesString(user.roles);
        return roles.toUpperCase().includes(this.roleFilter);
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
      filtered = filtered.filter(user => user.membre === groupeId);
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

  // ===== UTILITAIRES =====

  getGroupeName(groupeId: number): string {
    if (!groupeId || groupeId === 0) return 'Aucun groupe';
    const groupe = this.groupes.find(g => g.id === groupeId);
    return groupe ? groupe.nom : 'Inconnu';
  }

  getUserInitials(user: User): string {
    if (!user.username) return '?';
    const parts = user.username.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  }

  getRolesArray(roles: any): string[] {
    const rolesStr = this.getRolesString(roles);
    if (!rolesStr) return [];
    return rolesStr.split(',').map(r => r.trim()).filter(r => r);
  }

  getRolesString(roles: any): string {
    if (!roles) return '';
    if (typeof roles === 'string') return roles;
    if (roles.nom) return roles.nom;
    return '';
  }

  // ===== CRÉATION =====

  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewUser();
    }
  }

  isCreateFormValid(): boolean {
    return !!this.newUser.username && !!this.newUser.motDePasse && !!this.newUser.roles;
  }

  onRoleSelectionChange(): void {
    const selected = [...this.selectedRolesArray];
    const isResponsableSelected = selected.includes('RESPONSABLE');
    const isMembreSelected = selected.includes('MEMBRE');

    if (isResponsableSelected && !isMembreSelected) {
      selected.push('MEMBRE');
    }

    this.selectedRolesArray = [...selected];
    this.newUser.roles = this.selectedRolesArray.join(', ');
  }

  saveUser() {
    if (this.isCreateFormValid()) {
      this.isLoading = true;
      this.adminService.createUser(this.newUser).subscribe({
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
      roles: '',
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
  }

  isEditFormValid(): boolean {
    return !!this.editUser.username && !!this.editUser.email;
  }

  saveEdit(index: number) {
    if (this.isEditFormValid()) {
      this.isLoading = true;
      this.adminService.updateUser(this.editUser.id, this.editUser).subscribe({
        next: () => {
          this.loadUsers();
          this.editingRows[index] = false;
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
    // TODO: Implémenter l'export Excel
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

    // Appel API pour réinitialiser le mot de passe
    this.adminService.resetUserPassword(user.id, newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        // Ouvrir le dialog avec le nouveau mot de passe
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
    
    // Garantir au moins un caractère de chaque type
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    // Compléter avec des caractères aléatoires
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Mélanger le mot de passe
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}