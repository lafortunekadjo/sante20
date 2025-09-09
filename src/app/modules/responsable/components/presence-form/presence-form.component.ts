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
    displayedColumns: string[] = ['membre', 'present', 'aJoue', 'equipe', 'capitaine', 'mvpEquipe', 'mvpMatch' ,'buts', 'passes', 'cartonsJaunes', 'cartonsRouges'];
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

      this.dataSource.data = membres.map(membre => {
        const existingPresence = presences.find(p => p.membre?.id === membre?.id);
        
        if (existingPresence) {
          return {
            ...existingPresence,
            match: match,
            present: true,
            cartonsJaunes: existingPresence.cartonsJaunes || 0,
            cartonsRouges: existingPresence.cartonsRouges || 0
          };
        }
        return {
          id:0,
          match: match,
          membre: membre,
          present: false,
          aJoue: false,
          estCapitaine: false,
          buts: 0,
          passes: 0,
          estHommeDuMatch: false,
          estHommeDuMatchEq: false,
          equipeMatch: match.typeMatch === 'INTERNE' ? membre?.equipe?.nom : 'LOCALE',
          cartonsJaunes: 0,
          cartonsRouges: 0,
          nomOccasionnel:0,
        };
      });

      const membresPresentsIds = presences.map(p => p.membre?.id);
      const safeLower = (val?: string) => (val ?? '').toLowerCase();

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


  printMatchSheet() {
    if (!this.match || !this.dataSource.data.length) {
      this.snackBar.open('Aucune donnée disponible pour l\'impression', 'Fermer', { duration: 3000 });
      return;
    }


    const printContent = document.getElementById('print-section');
    if (printContent) {
      // Forcer le rendu de la section d'impression
      printContent.style.display = 'block';
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;

      // Attendre que le DOM soit mis à jour
      setTimeout(() => {
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Restaurer l'état de la page
        this.snackBar.open('Impression déclenchée', 'Fermer', { duration: 3000 });
      }, 100);
    } else {
      console.error('Section d\'impression non trouvée');
      this.snackBar.open('Erreur : Section d\'impression non trouvée', 'Fermer', { duration: 3000 });
    }
  }

  printPresenceSheet() {
    if (!this.match || !this.dataSource.data.length) {
      this.snackBar.open('Aucune donnée disponible pour l\'impression', 'Fermer', { duration: 3000 });
      return;
    }


    const printContent = document.getElementById('print-presence-section');
    if (printContent) {
      // Forcer le rendu de la section d'impression
      printContent.style.display = 'block';
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;

      // Attendre que le DOM soit mis à jour
      setTimeout(() => {
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Restaurer l'état de la page
        this.snackBar.open('Impression déclenchée', 'Fermer', { duration: 3000 });
      }, 100);
    } else {
      console.error('Section d\'impression non trouvée');
      this.snackBar.open('Erreur : Section d\'impression non trouvée', 'Fermer', { duration: 3000 });
    }
  }

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
