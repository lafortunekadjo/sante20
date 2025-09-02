import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
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
import { switchMap, forkJoin, of, map } from 'rxjs'; // Ajout de 'of' ici
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GeneralService } from '../../../../core/services/general.service';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

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
    MatListModule
  ],
  templateUrl: './membre-form.component.html',
  styleUrls: ['./membre-form.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class MembreFormComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<Membre>([]);
  expandedRowIndex: number | null = null;
  showCreateRow: boolean = false;
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
    groupe: { id: 0, nom: '', discipline: '', ville: 0, stade: 0, isActive: true, jourMatch: '', typeEquipe: '', modeEquipe: 'STATIQUE', fraisAdhesion: 0, ville1: { id: 0, nom: '' }, stade2: { id: 0, nom: '' } },
    buts: 0,
    passes: 0,
    cartons: 0,
    totalContributions: 0,
    soldeRestant: 0,
    soldeSanctionsRestant: 0,
    user: { id: 0, username: '', email: '', roles: '', active: true, membre: 0, motDePasse: '', groupe: 0 },
    active: true,
    sexe: ''
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
    groupe: { id: 0, nom: '', discipline: '', ville: 0, stade: 0, isActive: true, jourMatch: '', typeEquipe: '', modeEquipe: 'STATIQUE', fraisAdhesion: 0, ville1: { id: 0, nom: '' }, stade2: { id: 0, nom: '' } },
    buts: 0,
    passes: 0,
    cartons: 0,
    totalContributions: 0,
    soldeRestant: 0,
    soldeSanctionsRestant: 0,
    user: { id: 0, username: '', email: '', roles: '', active: true, membre: 0, motDePasse: '', groupe: 0 },
    active: true,
    sexe: ''
  };
  selectedGroupeId: string = '';
  createUserForMembre: boolean = false;
  isLoading: boolean = true;

  constructor(
    private adminService: MembreService,
    private equipeService: GeneralService,
    private dialog: MatDialog,
    private groupService: GroupeService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadData();
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

  loadData() {
    this.isLoading = true;
    forkJoin([
      this.adminService.getGroupMembers().pipe(
        map(data => data || [])
      ),
      this.groupService.getAllGroupesMembre().pipe(
        map(data => data || null)
      ),
      this.userService.getAllUsers().pipe(
        map(data => data || [])
      ),
      this.equipeService.getEquipesByGroupe().pipe(
        map(data => data || [])
      )
    ]).subscribe({
      next: ([membres, groupeResponse, users, equipes]) => {
        this.dataSource.data = membres || [];
        this.groupe = groupeResponse || null;
        const membreUserIds = new Set(membres?.filter(m => m.user && m.user.id).map(m => m.user!.id) || []);
        this.users = users.filter(user => !membreUserIds.has(user.id)) || [];
        this.equipes = equipes || [];
        this.editingRows = new Array(membres?.length || 0).fill(false);
        this.isLoading = false;
        this.newMembre.groupe = this.groupe;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.isLoading = false;
        this.dataSource.data = [];
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

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
          groupe: 0
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
      groupe: { id: 0, nom: '', discipline: '', ville: 0, stade: 0, isActive: true, jourMatch: '', typeEquipe: '', modeEquipe: 'STATIQUE', fraisAdhesion: 0, ville1: { id: 0, nom: '' }, stade2: { id: 0, nom: '' } },
      buts: 0,
      passes: 0,
      cartons: 0,
      totalContributions: 0,
      soldeRestant: 0,
      soldeSanctionsRestant: 0,
      user: { id: 0, username: '', email: '', roles: '', active: true, membre: 0, motDePasse: '', groupe: 0 },
      active: true,
      sexe: ''
    };
  }

  editRow(index: number, membre: Membre) {
    if (membre && this.dataSource.data[index]) {
      this.editingRows[index] = true;
      this.editMembre = { ...membre }; // Copie complète de l'objet membre
    }
  }

  isEditFormValid(): boolean {
    return !!this.editMembre.nom && !!this.editMembre.sexe;
  }

  saveEdit(index: number) {
    if (this.isEditFormValid() && this.dataSource.data[index]) {
      this.adminService.updateMembre(this.editMembre.id, this.editMembre).subscribe({
        next: () => {
          this.loadData(); // Recharge les données
          this.editingRows[index] = false;
        },
        error: (err) => console.error('Erreur lors de la mise à jour du membre:', err)
      });
    }
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
      groupe: { id: 0, nom: '', discipline: '', ville: 0, stade: 0, isActive: true, jourMatch: '', typeEquipe: '', modeEquipe: 'STATIQUE', fraisAdhesion: 0, ville1: { id: 0, nom: '' }, stade2: { id: 0, nom: '' } },
      buts: 0,
      passes: 0,
      cartons: 0,
      totalContributions: 0,
      soldeRestant: 0,
      soldeSanctionsRestant: 0,
      user: { id: 0, username: '', email: '', roles: '', active: true, membre: 0, motDePasse: '', groupe: 0 },
      active: true,
      sexe: ''
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
      this.newMembre.user = { id: 0, username: '', motDePasse: '', email: '', roles: '', active: true, membre: 0, groupe: 0 };
    }
  }

  expandPanel(index: number) {
    this.expandedRowIndex = index;
    if (this.dataSource.data[index]) {
      this.editMembre = { ...this.dataSource.data[index] };
      console.log('Expanded row:', index, this.editMembre);
    }
  }

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
}