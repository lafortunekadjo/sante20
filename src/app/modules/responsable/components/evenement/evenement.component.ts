import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { Evenement } from '../../../../core/models/evenement.model';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GeneralService } from '../../../../core/services/general.service';
import { Membre } from '../../../../core/models/membre.model';
import { MembreService } from '../../../../core/services/membre.service';
import { MatSelectModule } from '@angular/material/select';
import { Contribution } from '../../../../core/models/contribution.model'; // Ajouté
import { ContributionDialogComponent } from '../contribution-dialog/contribution-dialog.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { GroupeContextService } from '../../../../core/services/groupe-context.service';

@Component({
  selector: 'app-evenement',
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
    RouterModule,
         MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: './evenement.component.html',
  styleUrl: './evenement.component.scss'
})
export class EvenementComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<Evenement>([]);
  displayedColumns: string[] = ['nomEvenement', 'typeEvenement', 'dateEvenement', 'estContributionOuverte', 'actions'];
  isLoading: boolean = true;
  showCreateRow: boolean = false;
    editingRows: boolean[] = [];
  editingEvenementId: number | null = null;
  editEvenement: any = {};
  private destroy$ = new Subject<void>();
// editingRows: boolean[] = [];

  // editEvenement: Evenement={
  //   id: 0,
  //   idGroupe: 0,
  //   nomEvenement: '',
  //   description: '',
  //   typeEvenement: '',
  //   dateCreation: new Date(),
  //   estContributionOuverte: false,
  //   dateEvenement: new Date(),
  // }


  newEvenement: Evenement = {
    idGroupe: 1, // Remplacez par l'ID de groupe réel
    nomEvenement: '',
    description: '',
    typeEvenement: 'Autre',
    dateCreation: new Date(),
    estContributionOuverte: false,
    idMembreLie: null,
    dateEvenement: new Date(),
    id: 0
  };

  membres: Membre[] = [];
  

  constructor(
    private evenementService: GeneralService,
    private membreService: MembreService,
    private router: Router,
    private dialog: MatDialog,
     private snackBar: MatSnackBar,
     private authService: AuthService,
    private groupeContext: GroupeContextService
  ) {}

ngOnInit(): void {
  const groupeId = this.authService.getGroupe() ?? 0;
 
  // Initialiser newEvenement avec le bon groupeId
  this.newEvenement = {
    idGroupe: groupeId,          // ← plus de hardcode à 1
    nomEvenement: '',
    description: '',
    typeEvenement: 'Autre',
    dateCreation: new Date(),
    estContributionOuverte: false,
    idMembreLie: null,
    dateEvenement: new Date(),
    id: 0
  };
 
  this.loadEvenements();
  this.loadMembres();
 
  // FIX 2 — recharger au switch de groupe
  this.groupeContext.groupeChanged$
    .pipe(takeUntil(this.destroy$))
    .subscribe((newGroupeId) => {
      this.newEvenement.idGroupe = newGroupeId;
      this.loadEvenements();
      this.loadMembres();
    });
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
 

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  /**
   * Retourne le nombre d'événements avec contributions ouvertes
   */
  getActiveEventsCount(): number {
    return (this.dataSource.data || []).filter(e => e.estContributionOuverte).length;
  }

  /**
   * Retourne le nombre total d'événements
   */
  getTotalEventsCount(): number {
    return this.dataSource.data?.length || 0;
  }
  loadEvenements() {
    this.isLoading = true;
    this.evenementService.getAllEvenements().subscribe({
      next: (data) => {
        console.log(data)
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des événements:', err);
        this.isLoading = false;
      },
    });
  }

  loadMembres() {
    this.membreService.getGroupMembers().subscribe({
      next: (membres) => {
        this.membres = membres;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des membres:', err);
      }
    });
  }

  toggleCreateRow() {
    this.showCreateRow = !this.showCreateRow;
    if (!this.showCreateRow) {
      this.resetNewEvenement();
    }
  }
resetNewEvenement(): void {
  const groupeId = this.authService.getGroupe() ?? 0;
  this.newEvenement = {
    idGroupe: groupeId,         // ← dynamique
    nomEvenement: '',
    description: '',
    typeEvenement: 'Autre',
    dateCreation: new Date(),
    estContributionOuverte: false,
    idMembreLie: null,
    dateEvenement: new Date(),
    id: 0
  };
}

  isCreateFormValid(): boolean {
    return !!this.newEvenement.nomEvenement && !!this.newEvenement.description;
  }

  saveEvenement() {
  if (this.isCreateFormValid()) {
    this.isLoading = true;

    if (this.editingEvenementId) {
        console.log(this.newEvenement)
      this.evenementService.updateEvenement(this.editingEvenementId, this.newEvenement).subscribe({
        next: () => {
          this.loadEvenements();
          this.cancelCreate();
        },
        error: (err) => {
          console.error('Erreur lors de la modification de l\'événement:', err);
          this.isLoading = false;
        },
      });
    } else {
      // Mode création
      this.evenementService.createEvenement(this.newEvenement).subscribe({
        next: () => {
          this.loadEvenements();
          this.cancelCreate();
        },
        error: (err) => {
          console.error('Erreur lors de la création de l\'événement:', err);
          this.isLoading = false;
        },
      });
    }
  }
}

// editEvenement(evenement: Evenement) {
//   console.log(evenement)
//   this.newEvenement = { ...evenement }; // copie des données
//   // this.newEvenement.idMembreLie = evenement.membreLie?.id ?? null;
//   this.editingEvenementId = evenement.id;
//   this.showCreateRow = true;
  
// }


  openDeleteDialog(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `Voulez-vous supprimer cet événement ?` },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.evenementService.deleteEvenement(id).subscribe({
          next: () => this.loadEvenements(),
          error: (err) =>
            console.error('Erreur lors de la suppression de l\'événement:', err),
        });
      }
    });
  }

  // viewContributions(evenementId: number) {
  //   this.evenementService.getContributionsByEvenement(evenementId).subscribe({
  //     next: (contributions: Contribution[]) => {
  //       const total = contributions.reduce((sum, c) => sum + 0, 0);
  //       this.dialog.open(ContributionDialogComponent, {
  //         width: '400px',
  //         data: { contributions, total }
  //       });
  //     },
  //     error: (err) => {
  //       console.error('Erreur lors du chargement des contributions:', err);
  //       this.dialog.open(ContributionDialogComponent, {
  //         width: '400px',
  //         data: { contributions: [], total: 0 }
  //       });
  //     }
  //   });
  // }

cancelCreate() {
  this.toggleCreateRow();
  this.editingEvenementId = null;
}

editRow(localIndex: number, membre: Evenement) {
  // 1. Trouver l'index global en utilisant l'ID unique du membre
  // C'est crucial car l'index 'localIndex' est affecté par le filtre/la pagination.
  const globalIndex = this.dataSource.data.findIndex(m => m.id === membre.id);

  console.log("Tentative d'édition pour Membre ID:", membre.id, "Index Global:", globalIndex);

  if (membre && globalIndex !== -1) {
    // 2. Utiliser l'index global pour activer l'édition dans le tableau 'editingRows'
    // C'est l'index que le template utilise via getGlobalIndex(i)
    this.editingRows[globalIndex] = true;
    
    // 3. Copier le membre pour l'édition
    this.editEvenement = { ...membre };
    
    // Si vous utilisez OnPush, vous pourriez avoir besoin de: this.cdr.detectChanges();
  } else {
    console.error('Erreur: Impossible de trouver l\'index global du membre pour l\'édition.');
    }
  }

  isEditFormValid(): boolean {
    return !!this.editEvenement.nomEvenement ;
  }

// Méthode saveEdit modifiée avec loading et messages
// saveEdit(index: number) {
//   const membre = this.[index];
//   const globalIndex = this.dataSource.data.findIndex(m => m.id === membre?.id);
  
//   if (!this.isEditFormValid() || globalIndex === -1) {
//     return;
//   }


//   this.evenementService.updateEvenement(this.editEvenement.id, this.editEvenement).subscribe({
//     next: () => {
//       this.showSuccessMessage('Membre modifié avec succès');
//       this.editingRows[globalIndex] = false;
//     },
//     error: (err) => {
//       console.error('Erreur lors de la mise à jour du membre:', err);
//       this.showErrorMessage('Erreur lors de la modification du membre');
//     }
//   });
// }

// Déclencher le mode édition d'une ligne/carte
startEdit(index: number, evenement: any) {
  this.editingRows[index] = true;
  // On fait une copie profonde pour ne pas altérer directement le tableau d'origine avant sauvegarde
  this.editEvenement = { ...evenement }; 
}

// Annuler la modification
cancelEdit(index: number) {
  this.editingRows[index] = false;
  this.editEvenement = {};
}

// Sauvegarder les modifications (Appel API)
saveEdit(index: number): void {
  this.isLoading = true;
  const evenementId = this.editEvenement.id ?? this.editEvenement.idEvenement;
  this.evenementService.updateEvenement(evenementId, this.editEvenement).subscribe({
    next: () => {
      this.editingRows[index] = false;
      this.loadEvenements();
      this.snackBar.open('Événement modifié avec succès', 'Fermer', { duration: 3000 });
      this.isLoading = false;
    },
    error: () => { this.isLoading = false; }
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

}