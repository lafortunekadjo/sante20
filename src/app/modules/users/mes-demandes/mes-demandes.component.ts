import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { QuestionCandidatureService } from '../../../core/services/question-candidature.service';
import { DemandeAdhesion } from '../../../core/models/groupe-explorer.model';


interface DemandeAvecGroupe extends DemandeAdhesion {
  groupe?: {
    nom: string;
    discipline: string;
    ville: string;
    imageUrl?: string;
  };
  dateReponse?: Date;
}

@Component({
  selector: 'app-mes-demandes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './mes-demandes.component.html',
  styleUrl: './mes-demandes.component.scss'
})
export class MesDemandesComponent implements OnInit {
  demandes: DemandeAvecGroupe[] = [];
  isLoading = true;
  
  filtreStatut: 'TOUS' | 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' = 'TOUS';

  constructor(
    private questionnaireService: QuestionCandidatureService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    this.isLoading = true;

    this.questionnaireService.getMesDemandesAdhesion().subscribe({
      next: (demandes) => {
        this.demandes = demandes.sort((a, b) => {
          const dateA = a.dateCreation ? new Date(a.dateCreation).getTime() : 0;
          const dateB = b.dateCreation ? new Date(b.dateCreation).getTime() : 0;
          return dateB - dateA;
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement demandes:', err);
        this.snackBar.open('Erreur lors du chargement des demandes', 'Fermer', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  get demandesFiltrees(): DemandeAvecGroupe[] {
    if (this.filtreStatut === 'TOUS') {
      return this.demandes;
    }
    return this.demandes.filter(d => d.statut === this.filtreStatut);
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'ACCEPTEE': 'Acceptée',
      'REFUSEE': 'Refusée'
    };
    return labels[statut] || statut;
  }

  getStatutIcon(statut: string): string {
    const icons: { [key: string]: string } = {
      'EN_ATTENTE': 'hourglass_empty',
      'ACCEPTEE': 'check_circle',
      'REFUSEE': 'cancel'
    };
    return icons[statut] || 'help_outline';
  }

  getDisciplineIcon(discipline: string): string {
    const icons: { [key: string]: string } = {
      'Football': 'sports_soccer',
      'Basketball': 'sports_basketball',
      'Volleyball': 'sports_volleyball',
      'Handball': 'sports_handball',
      'Rugby': 'sports_rugby',
      'Tennis': 'sports_tennis',
      'Badminton': 'sports_tennis'
    };
    return icons[discipline] || 'sports';
  }

  viewDetails(demande: DemandeAvecGroupe): void {
    // Naviguer vers les détails de la demande ou afficher un dialog
    if (demande.id) {
      this.router.navigate(['/mes-demandes', demande.id]);
    }
  }

  goToGroupe(groupeId: number): void {
    this.router.navigate(['/groupes', groupeId]);
  }

  annulerDemande(demande: DemandeAvecGroupe): void {
    if (demande.statut !== 'EN_ATTENTE') {
      this.snackBar.open('Vous ne pouvez annuler que les demandes en attente', 'Fermer', {
        duration: 3000
      });
      return;
    }

    const groupeNom = demande.groupe?.nom || 'ce groupe';
    
    if (confirm(`Êtes-vous sûr de vouloir annuler votre demande pour "${groupeNom}" ?`)) {
      if (!demande.id) return;

      this.questionnaireService.annulerDemandeAdhesion(demande.id).subscribe({
        next: () => {
          this.snackBar.open('Demande annulée avec succès', 'Fermer', {
            duration: 3000
          });
          this.loadDemandes();
        },
        error: (err) => {
          console.error('Erreur annulation demande:', err);
          this.snackBar.open('Erreur lors de l\'annulation', 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }

  getCountByStatus(statut: string): number {
    if (statut === 'TOUS') {
      return this.demandes.length;
    }
    return this.demandes.filter(d => d.statut === statut).length;
  }

  retourExplorer(): void {
    this.router.navigate(['/explorer']);
  }
}