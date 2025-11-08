import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaiementSanctionService } from '../../../../core/services/paiement-sanction.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BaseChartDirective } from 'ng2-charts';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { GeneralService } from '../../../../core/services/general.service';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Membre } from '../../../../core/models/membre.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule
  ],
   animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ opacity: 0, maxHeight: 0 }),
        animate('300ms ease-out', style({ opacity: 1, maxHeight: '500px' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, maxHeight: 0 }))
      ])
    ])
  ],
  templateUrl: './paiement-sanction-form.component.html',
  styleUrl: './paiement-sanction-form.component.scss'
})
export class PaiementSanctionFormComponent implements OnInit, AfterViewInit {
 @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Equipe>([]);
  displayedColumns: string[] = ['id', 'nom', 'membres', 'actions'];
  
  isLoading: boolean = true;
  showCreateRow: boolean = false;
  newEquipe: Equipe = { id: 0, nom: '' };
  membresEquipe: any[]=[]
 teamDisplayState: { [key: number]: boolean } = {};

 
  
  editingRows: boolean[] = [];
  editEquipe: Equipe = { id: 0, nom: '' };
  // Nouvelles propriétés pour la gestion des membres
  allMembres: Membre[] = [];
   expandedEquipeId: number | null = null;

  constructor(private equipeService: GeneralService, private dialog: MatDialog) {}
  // Dans votre composant, ajoutez ces imports pour les animations




  ngOnInit() {
    this.loadMembres();
    // this.loadEquipes();

  }

// Méthode pour basculer l'état (afficher/cacher) pour UNE équipe spécifique
  toggleMembersList(equipeId: number) {
    // Si l'état n'existe pas, il est considéré comme 'false' (caché)
    this.teamDisplayState[equipeId] = !this.teamDisplayState[equipeId];
  }
  
  // Méthode pour vérifier l'état d'affichage
  getDisplayState(equipeId: number): boolean {
    return this.teamDisplayState[equipeId] || false;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

  }

  loadEquipes() {
    this.isLoading = true;
    this.equipeService.getEquipesByGroupe().subscribe({
      next: (equipes: Equipe[]) => {
        this.dataSource.data = equipes;
        
        this.editingRows = new Array(equipes.length).fill(false);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des équipes:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Toggle l'ouverture/fermeture de la ligne d'équipe.
   */
  toggleEquipeRow(equipeId: number): void {
    this.expandedEquipeId = this.expandedEquipeId === equipeId ? null : equipeId;
  }

  /**
   * Vérifie si la ligne d'une équipe est ouverte.
   */
  isEquipeExpanded(equipeId: number): boolean {
    return this.expandedEquipeId === equipeId;
  }
  

    /**
   * Charge tous les membres pour les lier aux équipes.
   */
  loadMembres() {
    this.isLoading = true;
    // Assurez-vous que votre service a une méthode pour récupérer tous les membres
    this.equipeService.getGroupMembers().subscribe({
        next: (membres: any[]) => {
            this.allMembres = membres;
            this.loadEquipes(); // Charger les équipes après les membres
        },
        error: (err: any) => {
            console.error('Erreur lors du chargement des membres:', err);
            this.isLoading = false;
        }
    });
  }


  /**
   * Retourne une chaîne de caractères contenant les noms des membres d'une équipe.
   */
  getMembersByEquipeId(equipeId: number): string {

    const membres = this.allMembres.filter(m => m.equipe?.id === equipeId);
    
    if (membres.length === 0) {
      return 'Aucun membre';
    }
    
    // Limiter l'affichage pour éviter de surcharger la colonne
    const memberNames = membres.map(m => `${m.prenom} ${m.nom.charAt(0)}.`);
    
    if (memberNames.length > 3) {
      return memberNames.slice(0, 3).join(', ') + ` (+${membres.length - 3} autres)`;
    }
    
    return memberNames.join(', ');
  }

    /**
   * Retourne le tableau complet des membres pour la ligne d'expansion.
   */
  getFullMembersByEquipeId(equipeId: number): Membre[] {
      return this.allMembres.filter(m => m.equipe?.id === equipeId);
  }


  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewEquipe();
    }
  }

  isCreateFormValid(): boolean {
    return !!this.newEquipe.nom;
  }

  saveEquipe() {
    if (this.isCreateFormValid()) {
      this.equipeService.createEquipe(this.newEquipe).subscribe({
        next: () => {
          this.loadEquipes();
          this.toggleCreateRow();
        },
        error: (err) => console.error('Erreur lors de la création de l\'équipe:', err)
      });
    }
  }

  cancelCreate() {
    this.toggleCreateRow();
  }

  resetNewEquipe() {
    this.newEquipe = { id: 0, nom: '' };
  }

  editRow(index: number, equipe: Equipe) {
    this.editingRows = this.editingRows.map((val, i) => i === index);
    this.editEquipe = { ...equipe }; // Crée une copie pour l'édition
  }

  isEditFormValid(): boolean {
    return !!this.editEquipe.nom;
  }

  saveEdit(index: number) {
    if (this.isEditFormValid()) {
      this.equipeService.updateEquipe(this.editEquipe.id, this.editEquipe).subscribe({
        next: () => {
          this.loadEquipes();
          this.editingRows[index] = false;
        },
        error: (err: any) => console.error('Erreur lors de la mise à jour de l\'équipe:', err)
      });
    }
  }

  cancelEdit(index: number) {
    this.editingRows[index] = false;
    this.editEquipe = { id: 0, nom: '' };
  }

  openDeleteDialog(equipe: Equipe) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer l'équipe "${equipe.nom}" ?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.desactivateEquipe(equipe.id);
      }
    });
  }

  desactivateEquipe(id: number) {
    this.equipeService.desactivateEquipe(id).subscribe({
      next: () => this.loadEquipes(),
      error: (err) => console.error('Erreur lors de la suppression de l\'équipe:', err)
    });
  }


getInitials(membre: Membre): string {
  if (!membre) return '?';
  const prenom = membre.prenom || '';
  const nom = membre.nom || '';
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

/**
 * Génère un gradient aléatoire pour les avatars (basé sur le nom pour cohérence)
 */
getAvatarGradient(membre: Membre): string {
  const gradients = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #30cfd0, #330867)',
    'linear-gradient(135deg, #a8edea, #fed6e3)',
    'linear-gradient(135deg, #ff9a9e, #fecfef)'
  ];
  
  // Utiliser le nom pour générer un index cohérent
  const name = `${membre.prenom}${membre.nom}`;
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}

  
}

