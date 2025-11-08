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
import { TranslateModule } from '@ngx-translate/core';


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
    MatSnackBarModule,
    TranslateModule
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





  // viewDetails(demande: DemandeAvecGroupe): void {
  //   // Naviguer vers les détails de la demande ou afficher un dialog
  //   if (demande.id) {
  //     this.router.navigate(['/mes-demandes', demande.id]);
  //   }
  // }

  // goToGroupe(groupeId: number): void {
  //   this.router.navigate(['/groupes', groupeId]);
  // }

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

  // retourExplorer(): void {
  //   this.router.navigate(['/explorer']);
  // }

  // ===== AJOUTS POUR TON COMPOSANT MES-DEMANDES EXISTANT =====
// Ajoute ces méthodes à ton MesDemandesComponent

// ===== NOUVELLES MÉTHODES HELPER =====

/**
 * TrackBy function pour optimiser le rendu de la liste
 */
trackByDemandeId(index: number, demande: any): any {
  return demande?.id || index;
}

/**
 * Définir le filtre de statut avec animation
 */
setFilter(statut: 'TOUS' | 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'): void {
  this.filtreStatut = statut;
  // Tu peux ajouter ici une logique d'analytics si besoin
  console.log('Filter changed to:', statut);
}

/**
 * Obtenir le label traduit du statut
 */
getStatutLabel(statut: string): string {
  const labels: { [key: string]: string } = {
    'EN_ATTENTE': 'status.pending',
    'ACCEPTEE': 'status.accepted',
    'REFUSEE': 'status.rejected',
    'TOUS': 'common.all'
  };
  return labels[statut] || statut;
}

/**
 * Partager une demande
 */
shareRequest(demande: any): void {
  if (!demande?.id) return;
  
  const shareData = {
    title: `Demande d'adhésion - ${demande.groupe?.nom || 'Groupe'}`,
    text: `Ma demande d'adhésion pour ${demande.groupe?.nom} est ${this.getStatutLabel(demande.statut)}`,
    url: `${window.location.origin}/mes-demandes/${demande.id}`
  };

  if (navigator.share) {
    navigator.share(shareData).catch(console.error);
  } else {
    // Fallback pour navigateurs qui ne supportent pas Web Share API
    navigator.clipboard.writeText(shareData.url).then(() => {
      this.snackBar.open('Lien copié dans le presse-papiers', 'Fermer', { duration: 2000 });
    }).catch(console.error);
  }
}

/**
 * Calculer le temps écoulé depuis une date
 */
getTimeAgo(date: Date | string): string {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `Il y a ${diffInMinutes} minute(s)`;
    }
    return `Il y a ${diffInHours} heure(s)`;
  } else if (diffInDays === 1) {
    return 'Hier';
  } else if (diffInDays < 7) {
    return `Il y a ${diffInDays} jour(s)`;
  } else {
    return past.toLocaleDateString();
  }
}

/**
 * Obtenir la couleur du statut
 */
getStatutColor(statut: string): string {
  const colors: { [key: string]: string } = {
    'EN_ATTENTE': '#f59e0b',
    'ACCEPTEE': '#10b981',
    'REFUSEE': '#ef4444'
  };
  return colors[statut] || '#6b7280';
}

/**
 * Vérifier si une demande peut être annulée
 */
canCancelRequest(demande: any): boolean {
  return demande?.statut === 'EN_ATTENTE';
}

/**
 * Obtenir l'icône de discipline avec fallback
 */
getDisciplineIcon(discipline: string): string {
  const icons: { [key: string]: string } = {
    'Football': 'sports_soccer',
    'Basketball': 'sports_basketball',
    'Volleyball': 'sports_volleyball',
    'Handball': 'sports_handball',
    'Rugby': 'sports_rugby',
    'Tennis': 'sports_tennis',
    'Badminton': 'sports_tennis',
    'Natation': 'pool',
    'Course': 'directions_run',
    'Cyclisme': 'directions_bike',
    'Musculation': 'fitness_center',
    'Boxe': 'sports_martial_arts'
  };
  return icons[discipline] || 'sports';
}

/**
 * Obtenir l'icône de statut
 */
getStatutIcon(statut: string): string {
  const icons: { [key: string]: string } = {
    'EN_ATTENTE': 'hourglass_empty',
    'ACCEPTEE': 'check_circle',
    'REFUSEE': 'cancel'
  };
  return icons[statut] || 'help_outline';
}

/**
 * Formater la date de création
 */
formatCreationDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Obtenir les statistiques des demandes
 */
getDemandesStats(): { total: number; pending: number; accepted: number; rejected: number } {
  const stats = {
    total: this.demandes.length,
    pending: this.demandes.filter(d => d.statut === 'EN_ATTENTE').length,
    accepted: this.demandes.filter(d => d.statut === 'ACCEPTEE').length,
    rejected: this.demandes.filter(d => d.statut === 'REFUSEE').length
  };
  
  return stats;
}

/**
 * Obtenir le pourcentage de réussite
 */
getSuccessRate(): number {
  const stats = this.getDemandesStats();
  if (stats.total === 0) return 0;
  
  return Math.round((stats.accepted / stats.total) * 100);
}

/**
 * Filtrer les demandes par période
 */
filterByPeriod(period: 'week' | 'month' | 'year'): any[] {
  const now = new Date();
  const filterDate = new Date();
  
  switch (period) {
    case 'week':
      filterDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      filterDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      filterDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return this.demandes.filter(d => {
    const creationDate = new Date(d.dateCreation);
    return creationDate >= filterDate;
  });
}

/**
 * Naviguer vers les détails avec état
 */
viewDetails(demande: any): void {
  if (demande?.id) {
    // Passer des données d'état si nécessaire
    this.router.navigate(['/mes-demandes', demande.id], {
      state: { 
        fromList: true,
        demande: demande 
      }
    });
  }
}

/**
 * Naviguer vers le groupe avec paramètres
 */
goToGroupe(groupeId: number): void {
  if (groupeId) {
    this.router.navigate(['/groupes', groupeId], {
      queryParams: { 
        from: 'requests' 
      }
    });
  }
}

/**
 * Confirmation avant annulation
 */
confirmAndCancelRequest(demande: any): void {
  if (!this.canCancelRequest(demande)) {
    this.snackBar.open('Vous ne pouvez annuler que les demandes en attente', 'Fermer', {
      duration: 3000
    });
    return;
  }

  const groupeNom = demande.groupe?.nom || 'ce groupe';
  const confirmMessage = `Êtes-vous sûr de vouloir annuler votre demande pour "${groupeNom}" ?`;
  
  // Tu peux remplacer confirm() par un dialog Material plus élégant
  if (confirm(confirmMessage)) {
    this.annulerDemande(demande);
  }
}

/**
 * Retour intelligent vers l'explorer
 */
retourExplorer(): void {
  // Préserver certains filtres ou états si nécessaire
  this.router.navigate(['/explorer'], {
    queryParams: {
      from: 'requests'
    }
  });
}

/**
 * Exporter les demandes (fonctionnalité future)
 */
exportRequests(): void {
  const data = this.demandesFiltrees.map(d => ({
    groupe: d.groupe?.nom,
    discipline: d.groupe?.discipline,
    statut: this.getStatutLabel(d.statut),
    dateCreation: this.formatCreationDate(d.dateCreation),
    dateReponse: d.dateReponse ? this.formatCreationDate(d.dateReponse) : ''
  }));
  
  console.log('Export data:', data);
  // Implémenter l'export CSV/Excel plus tard
}

// ===== MÉTHODE À MODIFIER DANS TON COMPOSANT =====

/**
 * Modifie ta méthode annulerDemande existante pour utiliser confirmAndCancelRequest
 */
// remplace annulerDemande(demande: DemandeAvecGroupe): void par :
// confirmAndCancelRequest(demande: DemandeAvecGroupe): void
}