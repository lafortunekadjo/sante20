import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Equipe } from '../../../../core/models/groupe.model copy';
import { GeneralService } from '../../../../core/services/general.service';
import { Membre } from '../../../../core/models/membre.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

interface TeamColor {
  name: string;
  value: string;
  gradient: string;
}

@Component({
  selector: 'app-paiement-sanction-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    TranslateModule
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)', height: 0 }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)', height: '*' }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)', height: 0 }))
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
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('listItem', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ],
  templateUrl: './paiement-sanction-form.component.html',
  styleUrl: './paiement-sanction-form.component.scss'
})
export class PaiementSanctionFormComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('addMemberDialog') addMemberDialogTemplate!: TemplateRef<any>;

  dataSource = new MatTableDataSource<Equipe>([]);
  filteredTeams: Equipe[] = [];
  
  isLoading = true;
  showCreateRow = false;
  searchQuery = '';
  
  newEquipe: Equipe & { couleur?: string } = { id: 0, nom: '', couleur: '' };
  editEquipe: Equipe = { id: 0, nom: '' };
  editingRows: boolean[] = [];
  
  allMembres: Membre[] = [];
  expandedEquipeId: number | null = null;
  teamDisplayState: { [key: number]: boolean } = {};
  
  // Pour le dialog d'ajout de membres
  selectedEquipeForAdd: Equipe | null = null;
  selectedMembersToAdd: number[] = [];
  addMemberDialogRef: MatDialogRef<any> | null = null;

  // Couleurs disponibles pour les équipes
  teamColors: TeamColor[] = [
    { name: 'Bleu', value: 'blue', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Vert', value: 'green', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
    { name: 'Orange', value: 'orange', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    { name: 'Rouge', value: 'red', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
    { name: 'Violet', value: 'purple', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
    { name: 'Rose', value: 'pink', gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' },
    { name: 'Cyan', value: 'cyan', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
    { name: 'Indigo', value: 'indigo', gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }
  ];

  constructor(
    private equipeService: GeneralService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadMembres();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // ===== CHARGEMENT DES DONNÉES =====

  loadEquipes(): void {
    this.isLoading = true;
    this.equipeService.getEquipesByGroupe().subscribe({
      next: (equipes: Equipe[]) => {
        this.dataSource.data = equipes;
        this.filteredTeams = [...equipes];
        this.editingRows = new Array(equipes.length).fill(false);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des équipes:', err);
        this.showSnackbar('equipe.loadError', 'error');
        this.isLoading = false;
      }
    });
  }

  loadMembres(): void {
    this.isLoading = true;
    this.equipeService.getGroupMembers().subscribe({
      next: (membres: Membre[]) => {
        this.allMembres = membres;
        this.loadEquipes();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des membres:', err);
        this.showSnackbar('equipe.loadMembersError', 'error');
        this.isLoading = false;
      }
    });
  }

  // ===== RECHERCHE ET FILTRAGE =====

  filterTeams(): void {
    if (!this.searchQuery.trim()) {
      this.filteredTeams = [...this.dataSource.data];
      return;
    }
    
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredTeams = this.dataSource.data.filter(equipe => 
      equipe.nom.toLowerCase().includes(query)
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredTeams = [...this.dataSource.data];
  }

  // ===== GESTION DES ÉQUIPES =====

  toggleCreateRow(): void {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewEquipe();
    }
  }

  isCreateFormValid(): boolean {
    return !!this.newEquipe.nom?.trim();
  }

  saveEquipe(): void {
    if (this.isCreateFormValid()) {
      this.equipeService.createEquipe(this.newEquipe).subscribe({
        next: () => {
          this.loadEquipes();
          this.toggleCreateRow();
          this.showSnackbar('equipe.createSuccess', 'success');
        },
        error: (err) => {
          console.error('Erreur lors de la création:', err);
          this.showSnackbar('equipe.createError', 'error');
        }
      });
    }
  }

  cancelCreate(): void {
    this.toggleCreateRow();
  }

  resetNewEquipe(): void {
    this.newEquipe = { id: 0, nom: '', couleur: '' };
  }

  editRow(index: number, equipe: Equipe): void {
    this.editingRows = this.editingRows.map((_, i) => i === index);
    this.editEquipe = { ...equipe };
  }

  isEditFormValid(): boolean {
    return !!this.editEquipe.nom?.trim();
  }

  saveEdit(index: number): void {
    if (this.isEditFormValid()) {
      this.equipeService.updateEquipe(this.editEquipe.id, this.editEquipe).subscribe({
        next: () => {
          this.loadEquipes();
          this.editingRows[index] = false;
          this.showSnackbar('equipe.updateSuccess', 'success');
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour:', err);
          this.showSnackbar('equipe.updateError', 'error');
        }
      });
    }
  }

  cancelEdit(index: number): void {
    this.editingRows[index] = false;
    this.editEquipe = { id: 0, nom: '' };
  }

  openDeleteDialog(equipe: Equipe): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { 
        message: this.translate.instant('equipe.deleteConfirmation', { name: equipe.nom })
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.desactivateEquipe(equipe.id);
      }
    });
  }

  desactivateEquipe(id: number): void {
    this.equipeService.desactivateEquipe(id).subscribe({
      next: () => {
        this.loadEquipes();
        this.showSnackbar('equipe.deleteSuccess', 'success');
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.showSnackbar('equipe.deleteError', 'error');
      }
    });
  }

  // ===== EXPANSION DES CARTES =====

  toggleEquipeRow(equipeId: number): void {
    this.expandedEquipeId = this.expandedEquipeId === equipeId ? null : equipeId;
  }

  toggleMembersList(equipeId: number): void {
    this.teamDisplayState[equipeId] = !this.teamDisplayState[equipeId];
  }

  getDisplayState(equipeId: number): boolean {
    return this.teamDisplayState[equipeId] || false;
  }

  // ===== GESTION DES MEMBRES =====

  getMembersByEquipeId(equipeId: number): string {
    const membres = this.allMembres.filter(m => m.equipe?.id === equipeId);
    
    if (membres.length === 0) {
      return this.translate.instant('equipe.noMembers');
    }
    
    const memberNames = membres.map(m => `${m.prenom} ${m.nom.charAt(0)}.`);
    
    if (memberNames.length > 3) {
      return memberNames.slice(0, 3).join(', ') + ` (+${membres.length - 3})`;
    }
    
    return memberNames.join(', ');
  }

  getFullMembersByEquipeId(equipeId: number): Membre[] {
    return this.allMembres.filter(m => m.equipe?.id === equipeId);
  }

  getMembresNonAssignes(): Membre[] {
    return this.allMembres.filter(m => !m.equipe || !m.equipe.id);
  }

  // ===== AJOUT DE MEMBRES =====

  openAddMemberDialog(equipe: Equipe): void {
    this.selectedEquipeForAdd = equipe;
    this.selectedMembersToAdd = [];
    
    this.addMemberDialogRef = this.dialog.open(this.addMemberDialogTemplate, {
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'add-member-dialog-panel'
    });
  }

  toggleMemberSelection(membre: Membre): void {
    const index = this.selectedMembersToAdd.indexOf(membre.id);
    if (index === -1) {
      this.selectedMembersToAdd.push(membre.id);
    } else {
      this.selectedMembersToAdd.splice(index, 1);
    }
  }

  confirmAddMembers(): void {
    if (!this.selectedEquipeForAdd || this.selectedMembersToAdd.length === 0) {
      return;
    }

    const equipeId = this.selectedEquipeForAdd.id;
    let completed = 0;
    let errors = 0;

    this.selectedMembersToAdd.forEach(membreId => {
      const membre = this.allMembres.find(m => m.id === membreId);
      if (membre) {
        // Appel au service pour assigner le membre à l'équipe
        this.equipeService.assignMemberToTeam(membreId, equipeId).subscribe({
          next: () => {
            completed++;
            // Mettre à jour localement
            membre.equipe = { id: equipeId, nom: this.selectedEquipeForAdd!.nom };
            
            if (completed + errors === this.selectedMembersToAdd.length) {
              this.finishAddMembers(completed, errors);
            }
          },
          error: (err) => {
            console.error('Erreur assignation membre:', err);
            errors++;
            
            if (completed + errors === this.selectedMembersToAdd.length) {
              this.finishAddMembers(completed, errors);
            }
          }
        });
      }
    });
  }

  private finishAddMembers(completed: number, errors: number): void {
    if (this.addMemberDialogRef) {
      this.addMemberDialogRef.close();
    }

    if (errors === 0) {
      this.showSnackbar('equipe.membersAddedSuccess', 'success');
    } else if (completed > 0) {
      this.showSnackbar('equipe.membersAddedPartial', 'warning');
    } else {
      this.showSnackbar('equipe.membersAddedError', 'error');
    }

    this.loadMembres(); // Recharger pour être sûr d'avoir les données à jour
  }

  removeMemberFromTeam(membre: Membre, equipe: Equipe): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { 
        message: this.translate.instant('equipe.removeMemberConfirmation', { 
          memberName: `${membre.prenom} ${membre.nom}`,
          teamName: equipe.nom 
        })
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.equipeService.removeMemberFromTeam(membre.id).subscribe({
          next: () => {
            membre.equipe = undefined;
            this.showSnackbar('equipe.memberRemovedSuccess', 'success');
            this.loadMembres();
          },
          error: (err) => {
            console.error('Erreur lors du retrait:', err);
            this.showSnackbar('equipe.memberRemovedError', 'error');
          }
        });
      }
    });
  }

  // ===== UTILITAIRES VISUELS =====

  getInitials(membre: Membre): string {
    if (!membre) return '?';
    const prenom = membre.prenom || '';
    const nom = membre.nom || '';
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }

  getTeamInitial(equipe: Equipe): string {
    return equipe.nom?.charAt(0)?.toUpperCase() || 'E';
  }

  getAvatarGradient(membre: Membre): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    ];
    
    const name = `${membre.prenom}${membre.nom}`;
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  }

  getTeamGradient(equipe: Equipe): string {
    // Si l'équipe a une couleur définie
    const colorDef = this.teamColors.find(c => c.value === (equipe as any).couleur);
    if (colorDef) {
      return colorDef.gradient;
    }
    
    // Sinon, générer un gradient basé sur le nom
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    ];
    
    const index = equipe.nom.charCodeAt(0) % gradients.length;
    return gradients[index];
  }

  getTeamColor(equipe: Equipe): string {
    const colorMap: { [key: string]: string } = {
      'blue': '#667eea',
      'green': '#10b981',
      'orange': '#f59e0b',
      'red': '#ef4444',
      'purple': '#8b5cf6',
      'pink': '#ec4899',
      'cyan': '#06b6d4',
      'indigo': '#6366f1'
    };
    
    return colorMap[(equipe as any).couleur] || '#667eea';
  }

  // ===== SNACKBAR =====

  private showSnackbar(messageKey: string, type: 'success' | 'error' | 'warning'): void {
    const message = this.translate.instant(messageKey);
    const panelClass = type === 'success' ? 'snackbar-success' : 
                       type === 'error' ? 'snackbar-error' : 'snackbar-warning';
    
    this.snackBar.open(message, '✕', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
  }
}