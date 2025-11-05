import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { catchError, forkJoin, switchMap, throwError } from 'rxjs';
import { Match } from '../../../../core/models/match.model';
import { Membre } from '../../../../core/models/membre.model';
import { Presence } from '../../../../core/models/presence.model';
import { MatchService } from '../../../../core/services/match.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { GroupeService } from '../../../../core/services/groupe.service';
import { MembreService } from '../../../../core/services/membre.service';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FilterByEquipePipe } from '../../../../core/pipes/filter-by-equipe.pipe';
import { FilterNonPlayersPipe } from '../../../../core/pipes/filter-non-players.pipe';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FilterByCartonsJaunesPipe } from '../../../../core/pipes/filter-by-cartons-jaunes.pipe';
import { FilterByCartonsRougesPipe } from '../../../../core/pipes/filter-by-cartons-rouges.pipe';
import { Groupe } from '../../../../core/models/groupe.model';
import { AuthService } from '../../../../core/services/auth.service';
import { FilterByEquipeAndNotPlayedPipe } from '../../../../core/pipes/filter-by-equipe-and-not-played.pipe';
import { FilterByButsPipe } from '../../../../core/pipes/filter-by-buts.pipe';
import { FilterByPassesPipe } from '../../../../core/pipes/filter-by-passes.pipe';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-presence-form',
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
    MatProgressSpinnerModule,
    FormsModule,
    RouterModule,
    FilterByEquipePipe,
    MatSnackBarModule,
    FilterByButsPipe,
    FilterByPassesPipe,
    MatExpansionModule,
  ],
  templateUrl: './presence-form.component.html',
  styleUrl: './presence-form.component.scss'
})
export class PresenceFormComponent implements OnInit{
dataSource = new MatTableDataSource<any>([]);
    displayedColumns: string[] = ['membre', 'present', 'aJoue', 'equipe', 'capitaine', 'mvpEquipe', 'mvpMatch' ,'buts' ,'bcsc' ,'penalti', 'passes', 'cartonsJaunes', 'cartonsRouges'];
  isLoading: boolean = true;
  match: Match | null = null;
  membres: Membre[] = [];
  membres2: Membre[] = [];
  groupeActif: Groupe| null = null;
  equipeNames: [string, string] = ['',''];
  membresNonPresents: Membre[] = [];
  selectedMembreIdToAdd: number | null = null;
  occasionalPlayerName:string = '';
  membreSearch: string = '';
  

  constructor(
    private matchService: MatchService,
    private presenceService: PresenceService,
    private groupeService: GroupeService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private membreService: MembreService
  ) {}

  ngOnInit() {
    const matchId = Number(this.route.snapshot.paramMap.get('matchId'));
    this.loadData(matchId);
        console.log(this.dataSource.data)
    
  }

 loadData(matchId: number) {
  this.isLoading = true;
  

  const userId = this.authService.getUserId();

  // ⭐ CRUCIAL FIX: Check if the userId is not null before proceeding.
  if (userId === null) {
    this.isLoading = false;
    this.snackBar.open('Erreur: L\'utilisateur n\'est pas connecté.', 'Fermer', { duration: 3000 });
    return; // Exit the function early if userId is null
  }

  this.groupeService.getGroupe(userId).pipe(
    switchMap(groupe => {
      if (!groupe) {
        throw new Error('Groupe non trouvé pour l\'utilisateur.');
      }
      this.groupeActif = groupe;
      
      // Now that we have the active group, we can load its members.
      return forkJoin([
        this.matchService.getMatch(matchId),
        this.presenceService.getPresencesByMatchId(matchId),
        this.presenceService.getMembreByMatch(matchId),
        this.membreService.getAllMembres()
      ]);
    }),
    catchError(err => {
      console.error('Erreur lors du chargement des données:', err);
      this.isLoading = false;
      this.snackBar.open('Erreur lors du chargement des données', 'Fermer', { duration: 3000 });
      return throwError(() => err);
    })
  ).subscribe({
    next: ([match, presences, membres, membres2]) => {
      this.match = match;
      this.membres = membres;
      this.membres2 = membres2;
      
 

        // Maintenant, nous avons la liste complète des présences, y compris les joueurs occasionnels.
        // Nous peuplons simplement `dataSource.data` avec ces présences.
         //const updatedPresences = presences.map(p => ({ ...p, present: true }));
        this.dataSource.data = presences.map(p => ({ ...p, present: true }));
        
        // Et nous peuplons la liste des membres non présents en filtrant à partir de tous les membres.
        const membresPresentsIds = presences.map(p => p.membre?.id).filter(id => id !== undefined);
        const membresOccasionnels = presences.filter(p => p.nomOccasionnel).map(p => p.nomOccasionnel);

        const safeLower = (val?: string) => (val ?? '').toLowerCase();
        
        // J'ai renommé `membres` en `allMembres` pour éviter la confusion
        this.membres = membres
          .filter(m => !membresPresentsIds.includes(m?.id))
          .sort((a, b) => {
            const nomA = safeLower(a?.nom);
            const nomB = safeLower(b?.nom);
            if (nomA < nomB) return -1;
            if (nomA > nomB) return 1;
            return safeLower(a?.prenom).localeCompare(safeLower(b?.prenom));
          });
          this.membresNonPresents = this.membres2
              .filter(m => !membresPresentsIds.includes(m?.id))
              .sort((a, b) => {
                const nomA = safeLower(a.nom);
                const nomB = safeLower(b.nom);
                if (nomA < nomB) return -1;
                if (nomA > nomB) return 1;
                return safeLower(a.prenom).localeCompare(safeLower(b.prenom));

              });
          
      this.isLoading = false;

      console.log(this.match?.adversaire)
      this.equipeNames = this.getEquipeNames(this.match?.adversaire ?? '');
    },
    error: (err) => {
      // The error is already handled by catchError, but this can be a fallback.
      console.error('Erreur de souscription:', err);
    }
  });
}

filteredMembres() {
  const searchLower = (this.membreSearch || '').toLowerCase();

  return [...this.membresNonPresents]
    .sort((a, b) => {
      const nomA = (a.nom || '').toLowerCase();
      const nomB = (b.nom || '').toLowerCase();
      if (nomA < nomB) return -1;
      if (nomA > nomB) return 1;
      return (a.prenom || '').toLowerCase().localeCompare((b.prenom || '').toLowerCase());
    })
    .filter(m =>
      (m.nom || '').toLowerCase().includes(searchLower) ||
      (m.prenom || '').toLowerCase().includes(searchLower)
    );
}

   getCapitaine(equipe: string): string {
    const capitaine = this.dataSource.data.find(p => p.equipeMatch === equipe && p.estCapitaine);
    return capitaine ? this.getMembreName(capitaine) : '_______________________';
  }

  getHommeDuMatch(): string {
    const hommeDuMatch = this.dataSource.data.find(p => p.present && p.aJoue && p.estHommeDuMatch);
    return hommeDuMatch ? this.getMembreName(hommeDuMatch) : 'Aucun';
  }

  getMvpEquipe(): string {
    const equipeJauneName = this.equipeNames[0];
    const equipeRougeName = this.equipeNames[1];

    const mvpJaune = this.dataSource.data.find(p => p.equipeMatch === equipeJauneName && p.estHommeDuMatchEq);

    const mvpRouge = this.dataSource.data.find(p => p.equipeMatch === equipeRougeName && p.estHommeDuMatchEq);

    const mvpJauneNom = mvpJaune ? this.getMembreName(mvpJaune) : 'Aucun';
    const mvpRougeNom = mvpRouge ? this.getMembreName(mvpRouge) : 'Aucun';

    return `${equipeJauneName} : ${mvpJauneNom} | ${equipeRougeName} : ${mvpRougeNom}`;
  }


  getTotalCartons(equipe: string, typeCarton: 'JAUNES' | 'ROUGES'): number {
  // Vérifie si la source de données est disponible et contient des données
  if (!this.dataSource || !this.dataSource.data) {
    return 0; // Retourne 0 si aucune donnée n'est disponible
  }

  // Filtre les présences pour l'équipe spécifiée et les joueurs qui ont joué
  return this.dataSource.data
    .filter(presence => presence.equipeMatch === equipe && presence.aJoue)
    .reduce((sum, presence) => {
      // Accumule le total des cartons en fonction du type demandé
      if (typeCarton === 'JAUNES') {
        return sum + (presence.cartonsJaunes || 0); // Ajoute les cartons jaunes, par défaut 0 si undefined
      } else {
        return sum + (presence.cartonsRouges || 0); // Ajoute les cartons rouges, par défaut 0 si undefined
      }
    }, 0); // Commence la somme à 0
}

  getScore(equipe: string): number {
    return this.dataSource.data
      .filter(p => p.present && p.aJoue && p.equipeMatch === equipe)
      .reduce((sum, p) => sum + p.buts, 0);
  }

 getMatchScore(equipe: string): number {
    let score = 0;
    const equipeAdverse = this.equipeNames.find(name => name !== equipe);

    // Calcul des buts et des penaltis de l'équipe actuelle
    score += this.dataSource.data
      .filter(p => p.present && p.aJoue && p.equipeMatch === equipe)
      .reduce((sum, p) => sum + (Number(p.buts) || 0) + (Number(p.penalti) || 0), 0);

    // Ajout des buts contre son camp (bcsc) de l'équipe adverse
    if (equipeAdverse) {
      score += this.dataSource.data
        .filter(p => p.present && p.aJoue && p.equipeMatch === equipeAdverse)
        .reduce((sum, p) => sum + (Number(p.butsContreSonCamp) || 0), 0);
    }

    return score;
  }

  getScore2(equipe: string): number {
     return this.match?.scoreAdversaire || 0;
  
  }
  // getHommeDuMatch(): string {
  //   const hommeDuMatch = this.dataSource.data.find(p => p.present && p.aJoue && p.estHommeDuMatch);
  //   return hommeDuMatch ? this.getMembreName(hommeDuMatch.membre.id) : 'Aucun';
  // }
  // getMvpEquipe(): string {
  //   // This function now returns the MVP for each team.
  //   const equipeJauneName = this.equipeNames[0];
  //   const equipeRougeName = this.equipeNames[1];

  //   // Find the MVP for the first team (yellow).
  //   const mvpJaune = this.dataSource.data.find(p => p.equipeMatch === equipeJauneName && p.estHommeDuMatchEq);

  //   // Find the MVP for the second team (red).
  //   const mvpRouge = this.dataSource.data.find(p => p.equipeMatch === equipeRougeName && p.estHommeDuMatchEq);

  //   // Format the output string to display both MVPs.
  //   const mvpJauneNom = mvpJaune ? this.getMembreName(mvpJaune.membre.id) : 'Aucun';
  //   const mvpRougeNom = mvpRouge ? this.getMembreName(mvpRouge.membre.id) : 'Aucun';

  //   // Return a formatted string with both MVPs.
  //   return `${equipeJauneName} : ${mvpJauneNom} | ${equipeRougeName} : ${mvpRougeNom}`;
  // }

 getMembreName(presence: any): string {
    if (presence.membre && presence.membre.nom && presence.membre.prenom) {
        return `${presence.membre.nom} ${presence.membre.prenom}`;
    } else if (presence.nomOccasionnel) {
        return presence.nomOccasionnel;
    }
    return 'Nom inconnu';
}

getButsDisplay(presence: any): string {
  const nomMembre = this.getMembreName(presence);
  let display = `${nomMembre}`;

  // Affichage des buts
  if (presence.buts > 0) {
    display += ` (${presence.buts})`;
  }

  // Ajout de la mention (P) pour les penalties
  if (presence.penalti > 0) {
    display += ` (${presence.penalti}P)`;
  }

  // Ajout de la mention (CSC) pour les buts contre son camp
  if (presence.butsContreSonCamp > 0) {
    display += ` (${presence.butsContreSonCamp}CSC)`;
  }
  
  return display;
}

  setCapitaine(presence: Presence) {
    if (presence.estCapitaine) {
      const equipe = presence.equipeMatch;
      this.dataSource.data.forEach(p => {
        if (p.equipeMatch === equipe && p !== presence) {
          p.estCapitaine = false;
        }
      });
    }
  }

  setMvpEquipe(presence: Presence) {
    if (presence.estHommeDuMatchEq) {
      const equipe = presence.equipeMatch;
      this.dataSource.data.forEach(p => {
        if (p.equipeMatch === equipe && p !== presence) {
          p.estHommeDuMatchEq = false;
        }
      });
    }
  }


 setHommeDuMatch(presence: Presence) {
  // Vérifie si le joueur actuel est désigné comme "Homme du Match"
  if (presence.estHommeDuMatch) {
    // Si oui, on parcourt tous les joueurs de la liste de données
    this.dataSource.data.forEach(p => {
      // Pour chaque joueur, si ce n'est pas le joueur que nous venons de sélectionner...
      if (p !== presence) {
        // ...on s'assure que son statut "Homme du Match" est désactivé
        p.estHommeDuMatch = false;
      }
    });
  }
}

  onPresenceChange(presence: Presence) {
    if (!presence.present) {
      // presence.aJoue = false;
      presence.estCapitaine = false;
      presence.buts = 0;
      presence.passes = 0;
      presence.estHommeDuMatch = false;
      presence.cartonsJaunes = 0;
      presence.cartonsRouges = 0;
    }
  }

  onAJoueChange(presence: Presence) {
    if (presence.aJoue) {
      presence.present = true;
    } else {
      presence.estCapitaine = false;
      presence.buts = 0;
      presence.passes = 0;
      presence.estHommeDuMatch = false;
      presence.cartonsJaunes = 0;
      presence.cartonsRouges = 0;
    }
  }
isPresenceValid(): boolean {
  const presentPlayers = this.dataSource.data.filter(p => p.present && p.aJoue);

  if (presentPlayers.length === 0) {
    return false;
  }

  if (this.match?.typeMatch === 'AMICAL') {
    return true; // La présence est toujours considérée comme valide pour ce critère.
  }

  // Utiliser la fonction getEquipeNames pour obtenir les noms d'équipes dynamiquement
  const [equipe1, equipe2] = this.getEquipeNames(this.match?.adversaire);

  const hasCapitaineEquipe1 = presentPlayers.some(p => p.equipeMatch === equipe1 && p.estCapitaine);
  const hasCapitaineEquipe2 = presentPlayers.some(p => p.equipeMatch === equipe2 && p.estCapitaine);

  return hasCapitaineEquipe1 && hasCapitaineEquipe2;
}



  savePresences() {
    if (this.isPresenceValid()) {
      this.isLoading = true;
      const matchId = this.match!.id;
      const presencesToSave = this.dataSource.data.filter(p => p.present);
      console.log(presencesToSave)
      this.presenceService.savePresences(matchId, presencesToSave).subscribe({
        next: () => {
          this.isLoading = false;
          console.log('Présences enregistrées avec succès');

        },
        error: (err) => {
          console.error('Erreur lors de l’enregistrement des présences:', err);
          this.isLoading = false;
        }
      });
    }
  }


  // --- DANS VOTRE COMPOSANT .ts ---

// Fonction utilitaire pour imprimer un contenu spécifique
private printContent(contentId: string): void {
    const printContent = document.getElementById(contentId);
    if (!printContent) {
        this.snackBar.open(`Erreur : Section d\'impression (${contentId}) non trouvée`, 'Fermer', { duration: 3000 });
        return;
    }

    // Créer une nouvelle fenêtre d'impression
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    
    if (printWindow) {
        // Définition des variables de couleur pour un style unifié
        const colorVariables = `
            :root {
                --primary-color: #1976d2; /* Bleu principal */
                --header-bg: #424242; /* Fond d'en-tête (gris foncé) */
                --team1-color: #1976d2; /* Jaune équipe 1 */
                --team2-color: #1976d2; /* Rouge équipe 2 */
                --captain-color: #007bff; /* Bleu Capitaine */
                --mvp-match-color: #ffc107; /* Jaune/Or pour Homme du Match */
                --mvp-equipe-color: #28a745; /* Vert pour MVP Équipe */
                --buteur-color: #dc3545; /* Rouge pour Buteurs/Statistiques */
            }
        `;

        // Blocs de style fusionnés et corrigés
        const printStyles = `
            /* Styles généraux du document d'impression */
            body {
                font-family: 'Roboto', sans-serif;
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                font-size: 10pt; /* Police de base pour A4 */
            }

            /* Section principale (contenu à imprimer) */
            .print-section {
                display: block !important;
                width: 210mm; /* Largeur A4 */
                min-height: 297mm; /* Hauteur A4 */
                margin: 10mm auto; /* Marges */
                padding: 0;
                box-sizing: border-box;
                page-break-after: always; /* Nouvelle page après cette section */
            }

            /* Titres */
            .print-title { 
                font-size: 12pt;
                color: var(--primary-color);
                text-align: center;
                margin-bottom: 4px;
                font-weight: 700;
            }
            .print-subtitle { 
                font-size: 10pt;
                background-color: var(--header-bg);
                color: #ffffff;
                padding: 3px;
                margin-bottom: 6px;
                text-align: center;
            }

            /* Mise en page des équipes */
            .print-team-layout { 
                display: flex;
                flex-wrap: nowrap;
                justify-content: space-between;
                gap: 4mm;
                margin-bottom: 6px;
            }
            .club-section { 
                flex: 1;
                border: 1px solid #000;
                padding: 2mm;
            }
            .section-title {
                font-size: 10pt;
                font-weight: 600;
                text-align: center;
                margin-bottom: 2mm;
            }
            .captain-title {
                font-size: 8pt;
                font-style: italic;
                text-align: center;
                margin-bottom: 2mm;
            }

            /* Couleurs d'équipe pour les en-têtes */
            .team1-header { background-color: var(--team1-color); color: #fff; }
            .team2-header { background-color: var(--team2-color); color: #fff; }

            /* Styles de tableau */
            .print-table { 
                width: 100%;
                font-size: 9pt; /* Taille de police unifiée */
                border-collapse: collapse;
            }
            .print-table th, .print-table td { 
                border: 1px solid #000;
                padding: 1mm 2mm;
                vertical-align: middle;
            }
            .print-table th {
                background-color: #e2e8f0; /* Fond des en-têtes */
                font-weight: 700;
                text-align: center;
                font-size: 9pt;
            }

            /* LARGEURS DE COLONNE POUR LA FEUILLE DE MATCH (Générique .club-section) */
            .club-section .print-table th:nth-child(1),
            .club-section .print-table td:nth-child(1) { 
                width: 6%; /* N° */
                text-align: center;
            }
            .club-section .print-table th:nth-child(2),
            .club-section .print-table td:nth-child(2) { 
                width: 45%; /* Joueur (augmenté pour le nom abrégé) */
                text-align: left;
                white-space: nowrap; /* EMPÊCHE le retour à la ligne du nom */
                overflow: hidden; 
                text-overflow: ellipsis; 
            }
            .club-section .print-table th:nth-child(n+3),
            .club-section .print-table td:nth-child(n+3) { 
                width: 7.33%; /* (100 - 6 - 45) / 6 colonnes restantes */
                text-align: center;
            }

            /* LARGEURS DE COLONNE POUR LA FEUILLE DE PRÉSENCE (Spécifique) */
            #print-presence-section .print-table th:nth-child(1),
            #print-presence-section .print-table td:nth-child(1) {
                width: 6%; /* N° */
            }
            #print-presence-section .print-table th:nth-child(2),
            #print-presence-section .print-table td:nth-child(2) {
                width: 45%; /* NOMS ET PRÉNOMS */
            }
            #print-presence-section .print-table th:nth-child(3),
            #print-presence-section .print-table td:nth-child(3) {
                width: 49%; /* OBSERVATION */
            }
            #print-presence-section .print-table td { 
                text-align: left; /* Aligner les noms et observations à gauche */
            }
            #print-presence-section .print-table td:nth-child(1) {
                text-align: center;
            }


            /* Styles d'accentuation (Capitaine, MVP, Cartons) */

            /* Ligne Capitaine */
            .print-table tr.highlight-captain td {
                background-color: #e0f7fa !important;
                font-weight: 700;
                color: var(--captain-color);
            }

            /* Mise en évidence des joueurs avec un Carton Rouge (CR > 0) */
            .print-table tr:has(td:last-child:not(:empty)) td { 
                background-color: #ffffff !important;
                font-style: italic;
            }
            
            /* Styles pour la section STATISTIQUES */
            .match-stats-section .print-table td:first-child {
                font-weight: 600;
            }
            .match-stats-section .print-table td.highlight-mvp {
                background-color: #0d700dff;
                font-weight: 700;
                color: var(--mvp-equipe-color);
            }
            .match-stats-section .print-table td.highlight-hommematch {
                background-color: #fffbe6;
                font-weight: 700;
                color: var(--mvp-match-color);
            }
            .match-stats-section .print-table tr:nth-child(2) td {
                color: var(--buteur-color); /* Ligne Buteurs */
            }

            /* Autres sections */
            .print-officials, .print-reporter {
                margin: 12px 0;
                padding: 8px 12px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                background-color: #f9fafb;
            }
            .print-officials p, .print-reporter p {
                margin: 4px 0;
                font-size: 0.95rem;
            }
        `;

        // Le HTML final à injecter
        const htmlToPrint = `
            <html>
            <head>
                <title>Feuille de Match</title>
                <style>
                    ${colorVariables}
                    ${printStyles}
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `;

        printWindow.document.write(htmlToPrint);
        printWindow.document.close();
        
        // Attendre que le contenu soit chargé et rendre les styles
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };

        this.snackBar.open('Impression déclenchée', 'Fermer', { duration: 3000 });
    } else {
         this.snackBar.open('Erreur : Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les bloqueurs de pop-up.', 'Fermer', { duration: 5000 });
    }
}
// Mettre à jour les appels publics
printMatchSheet() {
    this.printContent('print-section');
}

printPresenceSheet() {
    this.printContent('print-presence-section');
}

// --- DANS VOTRE COMPOSANT TS (ou service) ---

getMembreNameAbbreviated(presence: any): string {
    const prenom = presence.membre?.prenom || '';
    const nom = presence.membre?.nom || '';
    const nomMaj = nom.toUpperCase(); // Nom toujours en majuscules
    
    // Concaténation Nom + Prénoms (version complète)
    let fullName = `${nomMaj} ${prenom}`;
    const maxLength = 22; // Longueur cible pour tenir sur une ligne (ajustable)

    // 1. Si la longueur est acceptable, on la garde
    if (fullName.length <= maxLength) {
        return fullName.trim();
    }

    // --- STRATÉGIE D'ABBRÉVIATION DES PRÉNOMS ---
    
    // Sépare les prénoms (par espace ou trait d'union)
    const prenomParts = prenom.split(/[\s-]/).filter((p: string | any[]) => p.length > 0);
    
    if (prenomParts.length === 0) {
        // Pas de prénom, on retourne juste le nom
        return nomMaj;
    }

    let abbreviatedPrenoms = '';

    // Tenter de garder le premier prénom en entier
    let currentLength = nomMaj.length + 1 + prenomParts[0].length; // Nom + ' ' + PremierPrénom
    
    if (currentLength <= maxLength) {
        // Premier prénom tient, on l'ajoute
        abbreviatedPrenoms += prenomParts[0];
        
        // Abréger les prénoms suivants
        for (let i = 1; i < prenomParts.length; i++) {
            abbreviatedPrenoms += ' ' + prenomParts[i].charAt(0) + '.';
        }
    } else {
        // Le premier prénom est déjà trop long avec le nom, on abrège TOUS les prénoms
        // Ex: Jean-Christophe Marie -> J. C. M.
        abbreviatedPrenoms = prenomParts.map((p: string) => p.charAt(0) + '.').join(' ');
    }
    
    fullName = `${nomMaj} ${abbreviatedPrenoms}`;

    // --- Dernière Vérification (Ne JAMAIS tronquer le nom) ---
    if (fullName.length > maxLength) {
        // Si le résultat avec les prénoms abrégés est encore trop long (nom de famille long)
        // on ne garde que l'initiale du PREMIER prénom.
        fullName = `${nomMaj} ${prenomParts[0].charAt(0)}.`;
    }
    
    // On conserve le nom dans tous les cas, même si le texte final dépasse légèrement
    // la limite idéale de 22 (le CSS gèrera l'overflow).
    return fullName.trim();
}

//   printMatchSheet() {
//     if (!this.match || !this.dataSource.data.length) {
//       this.snackBar.open('Aucune donnée disponible pour l\'impression', 'Fermer', { duration: 3000 });
//       return;
//     }


//     const printContent = document.getElementById('print-section');
//     if (printContent) {
//       // Forcer le rendu de la section d'impression
//       printContent.style.display = 'block';
//       const originalContent = document.body.innerHTML;
//       document.body.innerHTML = printContent.innerHTML;

//       // Attendre que le DOM soit mis à jour
//        window.print();
//       setTimeout(() => {
//         window.print();
//         document.body.innerHTML = originalContent;
//         window.location.reload(); // Restaurer l'état de la page
//         this.snackBar.open('Impression déclenchée', 'Fermer', { duration: 3000 });
//       }, 100);
//     } else {
//       console.error('Section d\'impression non trouvée');
//       this.snackBar.open('Erreur : Section d\'impression non trouvée', 'Fermer', { duration: 3000 });
//     }
//       if (printContent) {
//     printContent.style.display = 'none';
//   }
//   }

//   printPresenceSheet() {

//     if (!this.match || !this.dataSource.data.length) {

//       this.snackBar.open('Aucune donnée disponible pour l\'impression', 'Fermer', { duration: 3000 });

//       return;

//     }





//     const printContent = document.getElementById('print-presence-section');

//     if (printContent) {

//       // Forcer le rendu de la section d'impression

//       printContent.style.display = 'block';

//       const originalContent = document.body.innerHTML;

//       document.body.innerHTML = printContent.innerHTML;



//       // Attendre que le DOM soit mis à jour

//       setTimeout(() => {

//         window.print();

//         document.body.innerHTML = originalContent;

//          window.location.reload(); // Restaurer l'état de la page

//         this.snackBar.open('Impression déclenchée', 'Fermer', { duration: 3000 });

//       }, 100);

//     } else {

//       console.error('Section d\'impression non trouvée');

//       this.snackBar.open('Erreur : Section d\'impression non trouvée', 'Fermer', { duration: 3000 });

//     }}



//   printPresenceSheet() {
//   if (!this.match || !this.dataSource.data.length) {
//     this.snackBar.open('Aucune donnée disponible pour l\'impression', 'Fermer', { duration: 3000 });
//     return;
//   }

//   // Affiche la section à imprimer pour la rendre visible au moment de l'impression
//   const printSection = document.getElementById('print-presence-section');
//   if (printSection) {
//     printSection.style.display = 'block';
//   }

//   // Déclenche l'impression
//   window.print();

//   // Masque à nouveau la section après l'impression (si nécessaire)
//   if (printSection) {
//     printSection.style.display = 'none';
//   }
// }

  //   getEquipeNames(adversaire: string | undefined): [string, string] {
  //   if (this.match?.typeMatch === 'INTERNE' && adversaire) {
  //     const parts = adversaire.split(' vs ').map(part => part.trim());
  //     if (parts.length === 2) {
  //       return parts as [string, string];
  //     }
  //   }
  //   return ['Locale', 'Adverse'];
  // }
  // Dans votre composant TypeScript
getEquipeNames(adversaire: string | undefined): [string, string] {
    if (adversaire) {
      const parts = adversaire.split(' vs ').map(part => part.trim());
      if (parts.length === 2) {
        return parts as [string, string];
      }
    }
    // Gère les autres types de matchs ou les erreurs
    return ['Locale', 'Adverse'];
}

addMembreToPresenceList() {

    if (this.selectedMembreIdToAdd !== null) {
      const membreToAdd = this.membres2.find(m => m.id === this.selectedMembreIdToAdd);

      if (membreToAdd) {
        const newPresence: any = {
          id: 0,
          match: this.match!,
          membre: membreToAdd,
          present: true,
          aJoue: false,
          estCapitaine: false,
          buts: 0,
          passes: 0,
          estHommeDuMatch: false,
          estHommeDuMatchEq: false,
          equipeMatch: this.match!.typeMatch === 'INTERNE' ? membreToAdd.equipe?.nom : 'LOCALE',
          cartonsJaunes: 0,
          cartonsRouges: 0,
        };

        this.dataSource.data = [...this.dataSource.data, newPresence];

        this.membresNonPresents = this.membresNonPresents.filter(m => m.id !== this.selectedMembreIdToAdd);
        this.selectedMembreIdToAdd = null;

        this.snackBar.open(`${this.getMembreName(membreToAdd.id)} a été ajouté à la feuille de présence.`, 'Fermer', {
          duration: 3000,
        });
      }
    }
  }

 // Method to add an occasional player
addOccasionalPlayer() {
    // Check if the occasional player's name is provided
    if (this.occasionalPlayerName.trim() === '') {
        console.error("Veuillez entrer un nom pour le joueur occasionnel.");
        this.snackBar.open("Veuillez entrer un nom pour le joueur occasionnel.", 'Fermer', {
            duration: 3000,
        });
        return;
    }
    
    // Create a new presence object for the occasional player
    const newPresence: any = {
        id: 0, // Placeholder ID
        match: this.match!,
        membre: null, // The member is null for an occasional player
        nomOccasionnel: this.occasionalPlayerName.trim(), // Assign the entered name
        present: true,
        aJoue: false,
        estCapitaine: false,
        buts: 0,
        passes: 0,
        estHommeDuMatch: false,
        estHommeDuMatchEq: false,
        equipeMatch: this.equipeNames,
        cartonsJaunes: 0,
        cartonsRouges: 0,
    };
    
    // Add the new presence to the data source
    this.dataSource.data = [...this.dataSource.data, newPresence];
    
    // Display a confirmation message
    this.snackBar.open(`${this.occasionalPlayerName.trim()} a été ajouté à la feuille de présence.`, 'Fermer', {
        duration: 3000,
    });
    
    // Clear the input field after adding
    this.occasionalPlayerName = '';
}



 
}
