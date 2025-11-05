// src/app/modules/responsable/components/gestion-demandes-groupe/gestion-demandes-groupe.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { of, map, catchError, forkJoin } from 'rxjs';
import { DemandeAdhesion, GroupePublic } from '../../../../core/models/groupe-explorer.model';
import { GroupeService } from '../../../../core/services/groupe.service';
import { QuestionCandidatureService } from '../../../../core/services/question-candidature.service';
import { MatchRequest, MatchRequestResponse, MatchRequestService } from '../../../../core/services/match-request.service';
import { Groupe } from '../../../../core/models/groupe.model';
import { TranslateModule } from '@ngx-translate/core';
import { GroupeDetailsDialogComponent } from '../../../membre/components/groupe-details-dialog/groupe-details-dialog.component';
import { DiscussionMatchDialogComponent } from '../discussion-match-dialog/discussion-match-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';

interface DemandeAvecCandidat extends DemandeAdhesion {
  candidat?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    photoUrl?: string;
  };
  reponsesDetaillees?: {
    questionId: number;
    texteQuestion: string;
    typeChamp: string;
    reponse: string;
  }[];
  dateReponse?: Date;
}

@Component({
  selector: 'app-gestion-demandes-groupe',
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
    MatDialogModule,
    MatExpansionModule,
    MatDividerModule,
    MatTabsModule,
    TranslateModule,
    MatBadgeModule
  ],
  templateUrl: './gestion-demandes-groupe.component.html',
  styleUrl: './gestion-demandes-groupe.component.scss'
})
export class GestionDemandesGroupeComponent implements OnInit {
  // Demandes d'adhésion
  demandesAdhesion: DemandeAvecCandidat[] = [];
  
  // Demandes de matchs
  demandesMatchEnvoyees: MatchRequestResponse[] = [];
  demandesMatchRecues: MatchRequestResponse[] = [];
  
  groupe: Groupe | null = null;
  isLoading = true;
  processingDemandeId: number | null = null;
  
  groupeId!: number;
  
  // Filtres pour chaque onglet
  filtreAdhesion: 'TOUS' | 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE' = 'EN_ATTENTE';
  filtreMatchEnvoyes: 'TOUS' | 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE' = 'TOUS';
  filtreMatchRecus: 'TOUS' | 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE' = 'EN_ATTENTE';
  
  // Onglet actif
  activeTab = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionnaireService: QuestionCandidatureService,
    private groupeService: GroupeService,
    private authService: AuthService,
    private matchRequestService: MatchRequestService,
    private snackBar: MatSnackBar,
     private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.groupeId = +this.route.snapshot.params['id'];
    this.loadGroupeInfo();
    this.loadAllDemandes();
  }

  loadGroupeInfo(): void {
    this.groupeService.getGroupeConn().subscribe({
      next: (groupe) => {
        this.groupe = groupe;
      },
      error: (err) => {
        console.error('Erreur chargement groupe:', err);
        this.snackBar.open('Erreur lors du chargement du groupe', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  loadAllDemandes(): void {
    this.isLoading = true;
    
    forkJoin({
      adhesions: this.loadDemandesAdhesion(),
      matchsEnvoyes: this.loadDemandesMatchEnvoyees(),
      matchsRecus: this.loadDemandesMatchRecues()
    }).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement demandes:', err);
        this.isLoading = false;
      }
    });
  }

  // ==================== DEMANDES D'ADHÉSION ====================

  loadDemandesAdhesion() {
    return this.questionnaireService.getDemandesParGroupe().pipe(
      map((demandes: DemandeAvecCandidat[]) => {
        this.demandesAdhesion = demandes.sort((a, b) => {
          const dateA = a.dateCreation ? new Date(a.dateCreation).getTime() : 0;
          const dateB = b.dateCreation ? new Date(b.dateCreation).getTime() : 0;
          return dateB - dateA;
        });
        
        this.loadReponsesDetaillees();
        return demandes;
      }),
      catchError(err => {
        console.error('Erreur chargement demandes adhésion:', err);
        return of([]);
      })
    );
  }

  loadReponsesDetaillees(): void {
    const demandesAvecReponses$ = this.demandesAdhesion.map(demande => {
      if (!demande.id) return of(demande);
      
      return this.questionnaireService.getReponsesByDemandeId(demande.id).pipe(
        map(reponses => {
          demande.reponsesDetaillees = reponses.map((rep: any) => ({
            questionId: rep.questionId,
            texteQuestion: rep.question?.texteQuestion || 'Question',
            typeChamp: rep.question?.typeChamp || 'TEXTE_COURT',
            reponse: rep.valeur
          }));
          return demande;
        }),
        catchError(err => {
          console.error(`Erreur chargement réponses demande ${demande.id}:`, err);
          return of(demande);
        })
      );
    });

    if (demandesAvecReponses$.length > 0) {
      forkJoin(demandesAvecReponses$).subscribe({
        next: (demandesEnrichies) => {
          this.demandesAdhesion = demandesEnrichies;
        }
      });
    }
  }

  get demandesAdhesionFiltrees(): DemandeAvecCandidat[] {
    if (this.filtreAdhesion === 'TOUS') {
      return this.demandesAdhesion;
    }
    return this.demandesAdhesion.filter(d => d.statut === this.filtreAdhesion);
  }

  accepterDemandeAdhesion(demande: DemandeAvecCandidat): void {
    const candidatNom = demande.candidat ? 
      `${demande.candidat.prenom} ${demande.candidat.nom}` : 'ce candidat';
    
    if (confirm(`Êtes-vous sûr de vouloir accepter la demande de ${candidatNom} ?`)) {
      if (!demande.id) return;
      
      this.processingDemandeId = demande.id;

      this.questionnaireService.traiterDemandeAdhesion(demande.id, 'ACCEPTEE').subscribe({
        next: () => {
          this.snackBar.open(`Demande de ${candidatNom} acceptée avec succès`, 'Fermer', {
            duration: 4000
          });
          this.loadDemandesAdhesion().subscribe();
          this.processingDemandeId = null;
        },
        error: (err) => {
          console.error('Erreur acceptation demande:', err);
          this.snackBar.open('Erreur lors de l\'acceptation', 'Fermer', {
            duration: 3000
          });
          this.processingDemandeId = null;
        }
      });
    }
  }

  refuserDemandeAdhesion(demande: DemandeAvecCandidat): void {
    const candidatNom = demande.candidat ? 
      `${demande.candidat.prenom} ${demande.candidat.nom}` : 'ce candidat';
      
    const motif = prompt(`Pourquoi refusez-vous la demande de ${candidatNom} ? (optionnel)`);
    
    if (motif !== null) {
      if (!demande.id) return;
      
      this.processingDemandeId = demande.id;

      this.questionnaireService.traiterDemandeAdhesion(demande.id, 'REFUSEE', motif || undefined).subscribe({
        next: () => {
          this.snackBar.open(`Demande de ${candidatNom} refusée`, 'Fermer', {
            duration: 3000
          });
          this.loadDemandesAdhesion().subscribe();
          this.processingDemandeId = null;
        },
        error: (err) => {
          console.error('Erreur refus demande:', err);
          this.snackBar.open('Erreur lors du refus', 'Fermer', {
            duration: 3000
          });
          this.processingDemandeId = null;
        }
      });
    }
  }

  // ==================== DEMANDES DE MATCH ENVOYÉES ====================

  loadDemandesMatchEnvoyees() {
    return this.matchRequestService.getMyGroupRequests().pipe(
      map((demandes: MatchRequestResponse[]) => {
        this.demandesMatchEnvoyees = demandes.sort((a, b) => {
          return new Date(b['dateCreation']).getTime() - new Date(a['dateCreation']).getTime();
        });
        return demandes;
      }),
      catchError(err => {
        console.error('Erreur chargement demandes match envoyées:', err);
        return of([]);
      })
    );
  }

  get demandesMatchEnvoyeesFiltrees(): MatchRequestResponse[] {
    if (this.filtreMatchEnvoyes === 'TOUS') {
      return this.demandesMatchEnvoyees;
    }
    return this.demandesMatchEnvoyees.filter(d => d.statut === this.filtreMatchEnvoyes);
  }

  annulerDemandeMatch(demande: MatchRequestResponse): void {
    const groupeNom = demande.groupeCible?.nom || 'ce groupe';
    
    if (confirm(`Êtes-vous sûr de vouloir annuler la demande de match avec ${groupeNom} ?`)) {
      this.processingDemandeId = demande.id;

      this.matchRequestService.cancelRequest(demande.id).subscribe({
        next: () => {
          this.snackBar.open('Demande de match annulée', 'Fermer', {
            duration: 3000
          });
          this.loadDemandesMatchEnvoyees().subscribe();
          this.processingDemandeId = null;
        },
        error: (err) => {
          console.error('Erreur annulation demande:', err);
          this.snackBar.open('Erreur lors de l\'annulation', 'Fermer', {
            duration: 3000
          });
          this.processingDemandeId = null;
        }
      });
    }
  }

  // ==================== DEMANDES DE MATCH REÇUES ====================

  loadDemandesMatchRecues() {
    return this.matchRequestService.getReceivedRequests().pipe(
      map((demandes: MatchRequestResponse[]) => {
        this.demandesMatchRecues = demandes.sort((a, b) => {
          return new Date(b['dateCreation']).getTime() - new Date(a['dateCreation']).getTime();
        });
        return demandes;
      }),
      catchError(err => {
        console.error('Erreur chargement demandes match reçues:', err);
        return of([]);
      })
    );
  }

  get demandesMatchRecuesFiltrees(): MatchRequestResponse[] {
    if (this.filtreMatchRecus === 'TOUS') {
      return this.demandesMatchRecues;
    }
    return this.demandesMatchRecues.filter(d => d.statut === this.filtreMatchRecus);
  }

  accepterDemandeMatch(demande: MatchRequestResponse): void {
    const groupeNom = demande.groupeDemandeur?.nom || 'ce groupe';
    
    if (confirm(`Êtes-vous sûr de vouloir accepter la demande de match avec ${groupeNom} ?`)) {
      this.processingDemandeId = demande.id;

      this.matchRequestService.acceptRequest(demande.id).subscribe({
        next: () => {
          this.snackBar.open('Demande de match acceptée avec succès', 'Fermer', {
            duration: 4000
          });
          this.loadDemandesMatchRecues().subscribe();
          this.processingDemandeId = null;
        },
        error: (err) => {
          console.error('Erreur acceptation demande:', err);
          this.snackBar.open('Erreur lors de l\'acceptation', 'Fermer', {
            duration: 3000
          });
          this.processingDemandeId = null;
        }
      });
    }
  }

  refuserDemandeMatch(demande: MatchRequestResponse): void {
    const groupeNom = demande.groupeDemandeur?.nom || 'ce groupe';
    
    if (confirm(`Êtes-vous sûr de vouloir refuser la demande de match avec ${groupeNom} ?`)) {
      this.processingDemandeId = demande.id;

      this.matchRequestService.refuseRequest(demande.id).subscribe({
        next: () => {
          this.snackBar.open('Demande de match refusée', 'Fermer', {
            duration: 3000
          });
          this.loadDemandesMatchRecues().subscribe();
          this.processingDemandeId = null;
        },
        error: (err) => {
          console.error('Erreur refus demande:', err);
          this.snackBar.open('Erreur lors du refus', 'Fermer', {
            duration: 3000
          });
          this.processingDemandeId = null;
        }
      });
    }
  }

  // ==================== UTILITAIRES ====================

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

  getCountAdhesionByStatus(statut: string): number {
    if (statut === 'TOUS') {
      return this.demandesAdhesion.length;
    }
    return this.demandesAdhesion.filter(d => d.statut === statut).length;
  }

  getCountMatchEnvoyesByStatus(statut: string): number {
    if (statut === 'TOUS') {
      return this.demandesMatchEnvoyees.length;
    }
    return this.demandesMatchEnvoyees.filter(d => d.statut === statut).length;
  }

  getCountMatchRecusByStatus(statut: string): number {
    if (statut === 'TOUS') {
      return this.demandesMatchRecues.length;
    }
    return this.demandesMatchRecues.filter(d => d.statut === statut).length;
  }

  voirProfilCandidat(candidatId: number): void {
    this.router.navigate(['/profil', candidatId]);
  }

  voirDetailsGroupe(groupeId: number): void {
    this.router.navigate(['/groupes', groupeId]);
  }

    viewGroupeDetails(groupe: Groupe): void {
      console.log(groupe)
      const dialogRef = this.dialog.open(GroupeDetailsDialogComponent, {
        width: '900px',
        maxWidth: '95vw',
        data: { groupe },
        panelClass: 'groupe-details-dialog'
      });
  
   
    }

  retourGroupe(): void {
    this.router.navigate(['/responsable']);
  }

  getTypeChampIcon(typeChamp: string): string {
    const icons: { [key: string]: string } = {
      'TEXTE_COURT': 'text_fields',
      'TEXTE_LONG': 'subject',
      'NOMBRE': 'numbers',
      'DATE': 'calendar_today',
      'EMAIL': 'email',
      'TELEPHONE': 'phone',
      'CHOIX_UNIQUE': 'radio_button_checked',
      'CHOIX_MULTIPLE': 'check_box',
      'OUI_NON': 'toggle_on'
    };
    return icons[typeChamp] || 'help_outline';
  }

  exporterDemandes(): void {
    // À implémenter selon l'onglet actif
    this.snackBar.open('Export en cours de développement', 'OK', { duration: 2000 });
  }

  /**
   * Ouvrir la discussion pour une demande de match reçue
   */
  ouvrirDiscussion(demande: MatchRequestResponse): void {
    const dialogRef = this.dialog.open(DiscussionMatchDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      height: '80vh',
      maxHeight: '800px',
      panelClass: 'discussion-dialog-panel',
      data: {
        defiMatchId: demande.id,
        groupeDemandeur: demande.groupeDemandeur?.nom || 'Groupe émetteur',
        groupeCibleNom: demande.groupeCible?.nom || 'Groupe cible',
        isGroupeCible: this.estGroupeCible(demande)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Optionnel : rafraîchir les demandes après fermeture de la discussion
      if (result?.shouldRefresh) {
        this.loadDemandesMatchRecues().subscribe();
      }
    });
  }

  /**
   * Déterminer si le groupe actuel est le groupe cible
   */
  private estGroupeCible(demande: MatchRequestResponse): boolean {
    return demande.groupeCible?.id === this.groupeId;
  }

  /**
   * Vérifier si l'utilisateur peut discuter (est responsable)
   */
  peutDiscuter(): boolean {
    const roles = this.authService.getRoles();
    return roles.includes('RESPONSABLE');
  }
}