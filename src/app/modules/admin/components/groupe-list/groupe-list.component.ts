import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Groupe } from '../../../../core/models/groupe.model';
import { GroupeService } from '../../../../core/services/groupe.service';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Stade } from '../../../../core/models/stade';
import { Ville } from '../../../../core/models/ville';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatSort } from '@angular/material/sort';
import { forkJoin } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-groupe-list',
 standalone: true,
  imports:   [CommonModule,
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
    SidebarComponent,
    RouterModule],
  templateUrl: './groupe-list.component.html',
  styleUrl: './groupe-list.component.scss'
})
export class GroupeListComponent implements OnInit, AfterViewInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<Groupe>([]);
  displayedColumns: string[] = ['nom', 'discipline', 'ville', 'stade', 'isActive', 'actions'];
  currentView: 'dashboard' | 'groupes' | 'users' | 'members' | 'matches' | 'sanctions' | 'cotisations' = 'dashboard';
  showCreateRow: boolean = false;
  isLoading: boolean = true;
  newGroupe: Groupe = {
    id: 0,
    nom: '',
    discipline: '',
    ville: 0,
    stade: 0,
      ville1:{id: 0, nom: ''},
      stade2: {id: 0, nom: ''},
    isActive: true,
    jourMatch: '',
    typeEquipe: '',
    modeEquipe: 'STATIQUE',
    fraisAdhesion: 0
  };
  villes: Ville[] = [];
  stades: Stade[] = [];
  editingRows: boolean[] = [];
  editGroupe: Groupe = {} as Groupe;
   filterValue: string = '';

  constructor(private adminService: GroupeService, private router: Router, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadData();
  }

    selectView(view: string) {
    this.currentView = view as 'dashboard' | 'groupes' | 'users' | 'members' | 'matches' | 'sanctions' | 'cotisations';
    this.filterValue = '';
  }

  

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'ville': return this.getVilleName(item.ville);
        case 'stade': return this.getStadeName(item.stade);
        case 'isActive': return item.isActive ? 1 : 0;
        default: return (item as any)[property];
      }
    };
  }

  loadData() {
    this.isLoading = true;
    forkJoin([
      this.adminService.getAllGroupes(),
      this.adminService.getVilles(),
      this.adminService.getStades()
    ]).subscribe({
      next: ([groupes, villes, stades]) => {
        this.dataSource.data = groupes;
        this.villes = villes;
        this.stades = stades;
        this.editingRows = new Array(groupes.length).fill(false);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.isLoading = false;
      }
    });
  }

  loadGroupes() {
    this.isLoading = true;
    this.adminService.getAllGroupes().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.editingRows = new Array(data.length).fill(false);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des groupes:', err);
        this.isLoading = false;
      }
    });
  }

  loadVilles() {
    this.adminService.getVilles().subscribe({
      next: (data) => this.villes = data,
      error: (err) => console.error('Erreur lors du chargement des villes:', err)
    });
  }

  loadStades() {
    this.adminService.getStades().subscribe({
      next: (data) => this.stades = data,
      error: (err) => console.error('Erreur lors du chargement des stades:', err)
    });
  }

  // getVilleName(villeId: number): string {
  //   const ville = this.villes.find(v => v.id === villeId);
  //   return ville ? ville.nom : 'Inconnue';
  // }

  getVilleName(membre: number | Ville | undefined): string {
      if (!membre) {
        // console.log('Membre est undefined ou null');
        return 'Inconnu';
      }
      if (typeof membre === 'object' && membre !== null && 'nom' in membre ) {
        // console.log('Membre est un objet:', membre);
        return `${membre.nom} `;
      }
      const membreId = typeof membre === 'number' ? membre : (membre as Ville)?.id;
      if (!membreId) {
        // console.log('MembreId non défini:', membre);
        return 'Inconnu';
      }
      const found = this.villes.find(m => m.id === membreId);
      // console.log('Membre trouvé:', found, 'pour ID:', membreId, 'dans:', this.membres);
      return found ? `${found.nom}` : 'Inconnu';
    }


    getStadeName(membre: number | Stade | undefined): string {

      if (!membre) {
        // console.log('Membre est undefined ou null');
        return 'Inconnu';
      }
      if (typeof membre === 'object' && membre !== null && 'nom' in membre ) {
        // console.log('Membre est un objet:', membre);
        return `${membre.nom} `;
      }
      const membreId = typeof membre === 'number' ? membre : (membre as Stade)?.id;
      if (!membreId) {
        // console.log('MembreId non défini:', membre);
        return 'Inconnu';
      }
      const found = this.stades.find(m => m.id === membreId);
      // console.log('Membre trouvé:', found, 'pour ID:', membreId, 'dans:', this.membres);
      return found ? `${found.nom}` : 'Inconnu';
    }

  // getStadeName(stadeId: number): string {
  //   const stade = this.stades.find(s => s.id === stadeId);
  //   return stade ? stade.nom : 'Inconnu';
  // }

  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewGroupe();
    }
  }

  isCreateFormValid(): boolean {
    return !!this.newGroupe.nom && !!this.newGroupe.discipline && !!this.newGroupe.ville && !!this.newGroupe.stade;
  }

  saveGroupe() {
    if (this.isCreateFormValid()) {
      this.isLoading = true;
      this.adminService.createGroupe(this.newGroupe).subscribe({
        next: () => {
          this.loadGroupes();
          this.toggleCreateRow();
        },
        error: (err) => {
          console.error('Erreur lors de la création du groupe:', err);
          this.isLoading = false;
        }
      });
    }
  }

  cancelCreate() {
    this.toggleCreateRow();
  }

  resetNewGroupe() {
    this.newGroupe = {
      id: 0,
      nom: '',
      discipline: '',
      ville1:{id: 0, nom: ''},
      stade2: {id: 0, nom: ''},
      ville:0,
      stade: 0,
      isActive: true,
      jourMatch: '',
      typeEquipe: '',
      modeEquipe: 'STATIQUE',
      fraisAdhesion: 0
    };
  }

  editRow(index: number, groupe: Groupe) {
    this.editingRows[index] = true;
    this.editGroupe = { ...groupe };
  }

  isEditFormValid(): boolean {
    return !!this.editGroupe.nom && !!this.editGroupe.discipline && !!this.editGroupe.ville && !!this.editGroupe.stade;
  }

  saveEdit(index: number) {
    if (this.isEditFormValid()) {
      this.isLoading = true;
      this.adminService.updateGroupe(this.editGroupe.id, this.editGroupe).subscribe({
        next: () => {
          this.loadGroupes();
          this.editingRows[index] = false;
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du groupe:', err);
          this.isLoading = false;
        }
      });
    }
  }

  cancelEdit(index: number) {
    this.editingRows[index] = false;
    this.editGroupe = {} as Groupe;
  }

  openDeleteDialog(groupe: Groupe) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer le groupe ${groupe.nom} ?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteGroupe(groupe.id);
      }
    });
  }

  openToggleActiveDialog(groupe: Groupe) {
    const action = groupe.isActive ? 'désactiver' : 'activer';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous ${action} le groupe ${groupe.nom} ?` }
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

  activateGroupe(id: number) {
    this.isLoading = true;
    this.adminService.activateGroupe(id).subscribe({
      next: () => this.loadGroupes(),
      error: (err) => {
        console.error('Erreur lors de l’activation du groupe:', err);
        this.isLoading = false;
      }
    });
  }

  deactivateGroupe(id: number) {
    this.isLoading = true;
    this.adminService.disableGroupe(id).subscribe({
      next: () => this.loadGroupes(),
      error: (err) => {
        console.error('Erreur lors de la désactivation du groupe:', err);
        this.isLoading = false;
      }
    });
  }

  deleteGroupe(id: number) {
    this.isLoading = true;
    this.adminService.deleteGroupe(id).subscribe({
      next: () => this.loadGroupes(),
      error: (err) => {
        console.error('Erreur lors de la suppression du groupe:', err);
        this.isLoading = false;
      }
    });
  }


}
