import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
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
import { MatSort } from '@angular/material/sort';
import { forkJoin } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
  showCreateRow: boolean = false;
  isLoading: boolean = true;
  newUser: User = {
    id: 0,
    username: '',
    email: '',
    roles: '',
    active: true,
    membre: 0,
    motDePasse: '',
    groupe:0
  };
  groupes: Groupe[] = [];
  editingRows: boolean[] = [];
  editUser: User = {} as User;
  selectedRolesArray: string[] = [];

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
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        this.isLoading = false;
      }
    });
  }

  onRoleSelectionChange(): void {
  const selected = [...this.selectedRolesArray]; // Crée une copie pour éviter les effets de bord

  // Logique pour s'assurer que 'MEMBRE' est inclus si 'RESPONSABLE' est sélectionné
  const isResponsableSelected = selected.includes('RESPONSABLE');
  const isMembreSelected = selected.includes('MEMBRE');

  if (isResponsableSelected && !isMembreSelected) {
    selected.push('MEMBRE');
  } else if (!isResponsableSelected && isMembreSelected) {
    // Si 'RESPONSABLE' est désélectionné, on retire 'MEMBRE' s'il était ajouté automatiquement
    const index = selected.indexOf('MEMBRE');
    if (index > -1) {
      selected.splice(index, 1);
    }
  }

  // Met à jour le tableau du mat-select avec les modifications
  this.selectedRolesArray = [...selected];

  // Convertit le tableau final en une chaîne de caractères séparée par des virgules
  this.newUser.roles = this.selectedRolesArray.join(', ');
}

  loadGroupes() {
    this.groupService.getAllGroupes().subscribe({
      next: (data) => this.groupes = data,
      error: (err) => console.error('Erreur lors du chargement des groupes:', err)
    });
  }

  getGroupeName(groupeId: number): string {
    const groupe = this.groupes.find(g => g.id === groupeId);
    return groupe ? groupe.nom : 'Aucun';
  }

  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewUser();
    }
  }

  isCreateFormValid(): boolean {
    return !!this.newUser.username && !!this.newUser.email && !!this.newUser.motDePasse && !!this.newUser.roles;
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
          console.error('Erreur lors de la création de l’utilisateur:', err);
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
      groupe: 0 
    };
  }

  editRow(index: number, user: User) {
    this.editingRows[index] = true;
    this.editUser = { ...user };
  }

  isEditFormValid(): boolean {
    return !!this.editUser.username && !!this.editUser.email && !!this.editUser.roles;
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
          console.error('Erreur lors de la mise à jour de l’utilisateur:', err);
          this.isLoading = false;
        }
      });
    }
  }

  cancelEdit(index: number) {
    this.editingRows[index] = false;
    this.editUser = {} as User;
  }

  openDeleteDialog(user: User) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer l'utilisateur ${user.username} ?` }
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
      data: { message: `Voulez-vous ${action} l'utilisateur ${user.username} ?` }
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
        console.error('Erreur lors de l’activation de l’utilisateur:', err);
        this.isLoading = false;
      }
    });
  }

  deactivateUser(id: number) {
    this.isLoading = true;
    this.adminService.deactivateUser(id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => {
        console.error('Erreur lors de la désactivation de l’utilisateur:', err);
        this.isLoading = false;
      }
    });
  }

  deleteUser(id: number) {
    this.isLoading = true;
    this.adminService.deleteUser(id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => {
        console.error('Erreur lors de la suppression de l’utilisateur:', err);
        this.isLoading = false;
      }
    });
  }
}
