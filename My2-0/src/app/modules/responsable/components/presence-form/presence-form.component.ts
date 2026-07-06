// presence-form.component.ts - isAmicalWithPlatformGroupersion avec support matchs amicaux inter-groupes

import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, forkJoin, switchMap, throwError, of } from 'rxjs';

import { Membre } from '../../../../core/models/membre.model';
import { Presence } from '../../../../core/models/presence.model';
import { Groupe } from '../../../../core/models/groupe.model';
import { MatchService } from '../../../../core/services/match.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { GroupeService } from '../../../../core/services/groupe.service';
import { MembreService } from '../../../../core/services/membre.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Match } from '../../../../core/models/match.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'
import { MatchImageService } from '../../../../core/services/match-image.service';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-presence-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatTabsModule,
    RouterModule,
    MatMenuTrigger,
    MatMenuModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './presence-form.component.html',
  styleUrls: ['./presence-form.component.scss']
})
export class PresenceFormComponent implements OnInit {

  dataSource = new MatTableDataSource<Presence>([]);
  isLoading = true;
  isGeneratingPdf = false;
  match: Match | null = null;
  groupeActif: Groupe | null = null;
  groupeAdverse: Groupe | null = null;

  // Ajouter cette propriété
isGeneratingImage = false;
selectedImageFormat: 'full' | 'story' | 'square' = 'full';
  
  // Membres des deux groupes
  membres: Membre[] = [];
  membresDisponibles: Membre[] = [];
  membresAdverse: Membre[] = [];
  membresNonPresents: Membre[] = [];
  membresAdverseNonPresents: Membre[] = [];
  
  // Noms des équipes
  equipeNames: [string, string] = ['Équipe 1', 'Équipe 2'];
  
  // Pour ajouter des membres
  selectedMembreIdToAdd: number | null = null;
  selectedMembreAdverseIdToAdd: number | null = null;
  occasionalPlayerName = '';
  occasionalPlayerTeam = '';
  membreSearch = '';
  membreAdverseSearch = '';
  today = new Date();
  selectedMemberIds: Set<number> = new Set();
  selectedMembreIdsToAdd: number[] = [];
  selectedMembreAdverseIdsToAdd: number[] = [];
  public _refreshCounter = 0;
  cdRef: any;

  constructor(
    private matchService: MatchService,
    private presenceService: PresenceService,
    private groupeService: GroupeService,
    private membreService: MembreService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private matchImageService: MatchImageService
  ) {}

  ngOnInit(): void {
    const matchId = Number(this.route.snapshot.paramMap.get('matchId'));
    this.loadData(matchId);
  }


  // 2. Fonction d'ajout groupé avec déduction d'équipe
// addMembresToPresenceList(): void {
//   if (!this.selectedMembreIdsToAdd || this.selectedMembreIdsToAdd.length === 0) return;

//   const membersToProcess = this.membresDisponibles.filter(m => 
//     this.selectedMembreIdsToAdd.includes(m.id)
//   );

//   membersToProcess.forEach(membre => {
//     let position = 1; // Par défaut Equipe 1
//     let nomEquipe = this.equipeNames[0];

//     // Si le membre a déjà une équipe définie dans son profil
//     if (membre.equipe) {
//       // On vérifie si son équipe correspond à l'équipe 2 du match
//       if (this.equipeNames[1] && membre.equipe.nom === this.equipeNames[1]) {
//         position = 2;
//         nomEquipe = this.equipeNames[1];
//       } else {
//         // Par défaut équipe 1 ou son équipe spécifique
//         position = 1;
//         nomEquipe = this.equipeNames[0];
//       }
//     }

//     const newPresence: any = {
//       match: this.match,
//       membre: membre,
//       equipePosition: position,
//       equipeMatch: nomEquipe,
//       aJoue: true,
//       buts: 0,
//       penalti: 0,
//       butsContreSonCamp: 0,
//       cartonsJaunes: 0,
//       cartonsRouges: 0
//     };

//     this.dataSource.data = [...this.dataSource.data, newPresence];
//   });

//   // Nettoyage de la liste des disponibles
//   this.membresDisponibles = this.membresDisponibles.filter(m => 
//     !this.selectedMembreIdsToAdd.includes(m.id)
//   );


  

//   // Reset du formulaire
//   this.selectedMembreIdsToAdd = [];
//   this.membreSearch = '';
//    this.refreshView();
//   this.showSnackbar(`${membersToProcess.length} membres ajoutés à la feuille de match`, 'success');
// }

isMemberSuspended(membre: Membre): boolean {
  // Ajustez selon votre backend : peut être membre.suspendu, !membre.actif, etc.
  return membre.estSuspendu === true; 
}


addMembresToPresenceList(): void {
  // Vérification de sécurité
  if (!this.selectedMembreIdsToAdd || this.selectedMembreIdsToAdd.length === 0) {
    this.showSnackbar('Veuillez sélectionner au moins un membre', 'error');
    return;
  }

  const idsToProcess = [...this.selectedMembreIdsToAdd]; // Copie pour éviter les effets de bord
  const membersToProcess = this.membresNonPresents.filter(m => idsToProcess.includes(m.id));

  if (membersToProcess.length === 0) {
    console.error("Aucun membre trouvé dans membresDisponibles pour les IDs:", idsToProcess);
    return;
  }

  const newPresences: Presence[] = [];

  membersToProcess.forEach(membre => {
    // Déduction automatique de l'équipe
    let position = 1;
    let nomEquipe = this.equipeNames[0];

    // Si le membre appartient déjà à l'équipe 2 du match
    if (membre.equipe && this.equipeNames[1] && membre.equipe.nom === this.equipeNames[1]) {
      position = 2;
      nomEquipe = this.equipeNames[1];
    }

    const newPresence: any = {
    id: 0,
      match: this.match!,
      membre: membre,
      present: true,
      aJoue: true,
      estCapitaine: false,
      buts: 0,
      passes: 0,
      penalti: 0,
      butsContreSonCamp: 0,
      estHommeDuMatch: false,
      estHommeDuMatchEq: false,
      equipeMatch: this.getDefaultTeamForNewPlayer(membre, false),
      cartonsJaunes: 0,
      cartonsRouges: 0,
      nomOccasionnel: '',
      estGardien: false,
      points: 0,
      paniers2pts: 0,
      paniers3pts: 0,
      lancersFrancs: 0,
      rebonds: 0,
      interceptions: 0,
      contres: 0,
      fautes: 0,
      jets7m: 0,
      deuxMinutes: 0,
      equipePosition: 0
    };
    newPresences.push(newPresence);
  });

  // Mise à jour de la source de données (Immutable update)
  this.dataSource.data = [...this.dataSource.data, ...newPresences];

  // Nettoyage de la liste des disponibles
  this.membresNonPresents = this.membresNonPresents.filter(m => !idsToProcess.includes(m.id));

  // Reset des champs de sélection
  const totalAdded = membersToProcess.length;
  this.selectedMembreIdsToAdd = []; 
  this.membreSearch = '';
  
  this._refreshCounter++;
     this.refreshView();
  this.showSnackbar(`${totalAdded} membre(s) ajouté(s) avec succès`, 'success');
}

// Optionnel: Sélectionner tout ce qui est filtré
selectAllMembres(): void {
  const currentFilteredIds = this.filteredMembres().map(m => m.id);
  this.selectedMembreIdsToAdd = [...currentFilteredIds];
}


  // Couleurs par défaut des équipes (RGB)
team1Color: number[] = [25, 118, 210];   // Bleu par défaut
team2Color: number[] = [211, 47, 47];    // Rouge par défaut

// Couleurs light pour les fonds
team1ColorLight: number[] = [227, 242, 253];  // Bleu clair
team2ColorLight: number[] = [255, 235, 238];  // Rouge clair

// ===== AJOUTER CETTE MÉTHODE DANS ngOnInit OU loadData =====

/**
 * Initialise les couleurs des équipes depuis le match
 * À appeler après avoir chargé le match
 */
private initTeamColors(): void {
  // Équipe 1
  if (this.match?.equipe1?.couleur) {
    this.team1Color = this.hexToRgb(this.match.equipe1.couleur);
    this.team1ColorLight = this.lightenColor(this.team1Color, 0.85);
  } else if (this.match?.equipe1?.couleur) {
    this.team1Color = this.hexToRgb(this.match.equipe1.couleur);
    this.team1ColorLight = this.lightenColor(this.team1Color, 0.85);
  }

  // Équipe 2
  if (this.match?.equipe2?.couleur) {
    this.team2Color = this.hexToRgb(this.match.equipe2.couleur);
    this.team2ColorLight = this.lightenColor(this.team2Color, 0.85);
  } else if (this.match?.equipe2?.couleur) {
    this.team2Color = this.hexToRgb(this.match.equipe2.couleur);
    this.team2ColorLight = this.lightenColor(this.team2Color, 0.85);
  }

  console.log('[Colors] Team1:', this.team1Color, 'Team2:', this.team2Color);
}


// Méthode d'ajout groupé
addSelectedMembersToTeam(position: number): void {
  const membersToAdd = this.membresNonPresents.filter(m => this.selectedMemberIds.has(m.id));
  
  membersToAdd.forEach(membre => {
    // On réutilise votre logique existante mais en fixant la position
    const newPresence: any = {
      match: this.match,
      membre: membre,
      equipePosition: position,
      equipeMatch: this.equipeNames[position - 1],
      aJoue: true,
      buts: 0, penalti: 0, butsContreSonCamp: 0,
      cartonsJaunes: 0, cartonsRouges: 0
    };
    
    this.dataSource.data = [...this.dataSource.data, newPresence];
  });

  // Nettoyage : on retire les membres ajoutés de la liste de choix
  this.membresNonPresents = this.membresNonPresents.filter(m => !this.selectedMemberIds.has(m.id));
  this.selectedMemberIds.clear();
  this.membreSearch = '';
  
  this._refreshCounter++; // Pour déclencher les getters equipe1Players/equipe2Players
  this.refreshView();
  this.showSnackbar(`${membersToAdd.length} joueurs ajoutés.`, 'success');
}
/**
 * Convertit une couleur hex en RGB
 */
private hexToRgb(hex: string): number[] {
  if (!hex) return [128, 128, 128]; // Gris par défaut
  
  // Nettoyer le hex
  hex = hex.replace('#', '');
  
  // Gérer les formats courts (ex: "fff")
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return [isNaN(r) ? 128 : r, isNaN(g) ? 128 : g, isNaN(b) ? 128 : b];
}

/**
 * Éclaircit une couleur pour les fonds
 */
private lightenColor(rgb: number[], factor: number): number[] {
  return rgb.map(c => Math.round(c + (255 - c) * factor));
}

/**
 * Assombrit une couleur pour les textes sur fond clair
 */
private darkenColor(rgb: number[], factor: number): number[] {
  return rgb.map(c => Math.round(c * (1 - factor)));
}


// ============================================================
// FEUILLE DE MATCH PDF - AVEC COULEURS DYNAMIQUES
// ============================================================

// async downloadMatchSheetAsPdf(): Promise<void> {
//   const element = document.getElementById('print-section');
//   if (!element) return;

//   this.isLoading = true;
  
//   try {
//     element.style.display = 'block';
//     element.style.position = 'absolute';
//     element.style.left = '-9999px';
//     element.style.width = '210mm';

//     await new Promise(resolve => setTimeout(resolve, 500));

//     const canvas = await html2canvas(element, {
//       scale: 2,
//       useCORS: true,
//       logging: false,
//       allowTaint: true,
//       backgroundColor: '#ffffff'
//     });

//     const imgData = canvas.toDataURL('image/jpeg', 0.7);

//     const pdf = new jsPDF({
//       orientation: 'portrait',
//       unit: 'mm',
//       format: 'a4',
//       compress: true
//     });

//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const imgWidth = pdfWidth - 20;
//     const imgHeight = (canvas.height * imgWidth) / canvas.width;

//     pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
    
//     pdf.save(`Match_${Date.now()}.pdf`);

//     element.style.display = 'none';
//     canvas.width = 0;
//     canvas.height = 0;

//   } catch (error) {
//     console.error('Erreur PDF:', error);
//   } finally {
//     this.isLoading = false;
//   }
// }


  // ===== GETTERS =====

get equipe1Players(): Presence[] {
  const _ = this._refreshCounter;
  return this.dataSource.data.filter(p => {
    // 1. Si la position est explicitement 1
    if (p.equipePosition === 1) return true;
    
    // 2. Si pas de position, on déduit par le nom
    if (!p.equipePosition || p.equipePosition === 0) {
      return p.equipeMatch === this.equipeNames[0] || !p.equipeMatch; 
      // Note: !p.equipeMatch renvoie true pour mettre par défaut dans l'équipe 1
    }
    
    return false;
  });
}

get equipe2Players(): Presence[] {
  const _ = this._refreshCounter;
  return this.dataSource.data.filter(p => {
    // 1. Si la position est explicitement 2
    if (p.equipePosition === 2) return true;
    
    // 2. Si pas de position, on déduit par le nom
    if (!p.equipePosition || p.equipePosition === 0) {
      return p.equipeMatch === this.equipeNames[1];
    }
    
    return false;
  });
}

// Filtrer les membres disponibles par recherche
  get filteredMembresDisponibles(): Membre[] {
    if (!this.membreSearch) return this.membresNonPresents;
    const search = this.membreSearch.toLowerCase();
    return this.membresNonPresents.filter(m => 
      (m.nom + ' ' + m.prenom).toLowerCase().includes(search)
    );
  }

  toggleMemberSelection(membreId: number): void {
    if (this.selectedMemberIds.has(membreId)) {
      this.selectedMemberIds.delete(membreId);
    } else {
      this.selectedMemberIds.add(membreId);
    }
  }

  // Ajout groupé
  addSelectedMembers(position: number): void {
    if (this.selectedMemberIds.size === 0) return;

    const toAdd = this.membresNonPresents.filter(m => this.selectedMemberIds.has(m.id));
    
    toAdd.forEach(membre => {
      const newPresence: any = {
        match: this.match,
        membre: membre,
        equipePosition: position,
        equipeMatch: this.equipeNames[position - 1],
        aJoue: true,
        buts: 0,
        penalti: 0,
        butsContreSonCamp: 0
      };
      this.dataSource.data.push(newPresence);
    });

    // Nettoyage
    this.membresNonPresents = this.membresNonPresents.filter(m => !this.selectedMemberIds.has(m.id));
    this.selectedMemberIds.clear();
    this.membreSearch = '';
    this._refreshCounter++;
    this.refreshView();
    this.showSnackbar('Membres ajoutés avec succès', 'success');
  }

  // onEquipeChange(presence: Presence): void {
  //   presence.equipePosition = (presence.equipeMatch === this.equipeNames[0]) ? 1 : 2;
  //   this._refreshCounter++;
  //   this.updateCounts();
  // }
  get equipe1Count(): number {
    return this.equipe1Players.length;
  }

  get equipe2Count(): number {
    return this.equipe2Players.length;
  }

  get buteursPlayers(): Presence[] {
    return this.dataSource.data.filter(p => 
      (p.buts && p.buts > 0) || 
      (p.penalti && p.penalti > 0) || 
      (p.butsContreSonCamp && p.butsContreSonCamp > 0)
    );
  }

  get passeursPlayers(): Presence[] {
    return this.dataSource.data.filter(p => p.passes && p.passes > 0);
  }

  get isAmicalWithPlatformGroup(): boolean {
    return this.match?.typeMatch === 'AMICAL' && 
           !!this.match?.groupeAdverse?.id;
  }

  get isAmicalWithManualAdversary(): boolean {
    return this.match?.typeMatch === 'AMICAL' && 
           !this.match?.groupeAdverse?.id &&
           !!this.match?.nomAdversaireManuel;
  }

  get cartonsJaunesPlayers(): Presence[] {
    return this.dataSource.data.filter(p => p.cartonsJaunes && p.cartonsJaunes > 0);
  }

  get cartonsRougesPlayers(): Presence[] {
    return this.dataSource.data.filter(p => p.cartonsRouges && p.cartonsRouges > 0);
  }

  // ===== TRACK BY =====

  trackByPresence(index: number, presence: Presence): any {
    return presence.id || `${presence.membre?.id || presence.nomOccasionnel}-${index}`;
  }

  // ===== CHARGEMENT DES DONNÉES =====

  loadData(matchId: number): void {
    this.isLoading = true;
    const userId = this.authService.getUserId();

    if (userId === null) {
      this.isLoading = false;
      this.showSnackbar('Erreur: Utilisateur non connecté', 'error');
      return;
    }

    this.groupeService.getGroupe(userId).pipe(
      switchMap(groupe => {
        if (!groupe) {
          throw new Error('Groupe non trouvé');
        }
        this.groupeActif = groupe;

        return forkJoin([
          this.matchService.getMatch(matchId),
          this.presenceService.getPresencesByMatchId(matchId),
          this.membreService.getAllMembres()
        ]);
      }),
      switchMap(([match, presences, allMembres]) => {
        this.match = match;
        this.membres = allMembres;
        
        this.equipeNames = this.getEquipeNamesFromMatch(match);
        
        // Si match amical avec groupe adverse, charger ses membres
        if (match.typeMatch === 'AMICAL' && match.groupeAdverse?.id) {
          this.groupeAdverse = match.groupeAdverse;
          
          return this.membreService.getMembresByGroupeId(match.groupeAdverse.id).pipe(
            catchError(err => {
              console.error('Erreur chargement membres adverses:', err);
              return of([] as Membre[]);
            }),
            switchMap(membresAdverse => {
              this.membresAdverse = membresAdverse;
              return of({ presences, allMembres });
            })
          );
        }
        
        return of({ presences, allMembres });
      }),
      catchError(err => {
        console.error('Erreur chargement:', err);
        this.isLoading = false;
        this.showSnackbar('Erreur lors du chargement', 'error');
        return throwError(() => err);
      })
    ).subscribe({
      next: ({ presences }) => {
        this.dataSource.data = presences.map(p => ({ ...p, present: true }));
          this.initTeamColors();
        this.assignDefaultTeams();
        
        const presentMemberIds = presences
          .filter(p => p?.membre?.id)
          .map(p => p?.membre!.id);
        
        this.membresNonPresents = this.membres
          .filter(m => !presentMemberIds.includes(m.id))
          .sort((a, b) => a.nom.localeCompare(b.nom));
        
        if (this.isAmicalWithPlatformGroup) {
          this.membresAdverseNonPresents = this.membresAdverse
            .filter(m => !presentMemberIds.includes(m.id))
            .sort((a, b) => a.nom.localeCompare(b.nom));
        }

        this.isLoading = false;
        this.refreshView();
      }
    });
  }

  private refreshView(): void {
    this._refreshCounter++;
    this.cdr.detectChanges();
  }

  // ===== NOMS D'ÉQUIPES =====

  getEquipeNamesFromMatch(match: Match | null): [string, string] {
    if (!match || !match.typeMatch) return ['Équipe 1', 'Équipe 2'];

    switch (match.typeMatch) {
      case 'INTERNE':
      case 'DUEL':
        return [
          match.equipe1?.nom || 'Équipe 1',
          match.equipe2?.nom || 'Équipe 2'
        ];

      case 'AMICAL':
        console.log(match)
        const localeName = this.groupeActif?.abreviation || this.groupeActif?.nom || 'Locale';
        let adversaireName = 'Adverse';
        
        if (match.groupeAdverse) {
          adversaireName = match.groupeAdverse.abreviation || match.groupeAdverse.nom;
        } else if (match.nomAdversaireManuel) {
          adversaireName = match.nomAdversaireManuel;
        }
        
        return [localeName, adversaireName];

      case 'ANNIVERSAIRE':
        return ['Équipe Fêtés', 'Équipe Adverses'];

      default:
        return ['Équipe 1', 'Équipe 2'];
    }
  }

  needsTeamSelection(): boolean {
    if (this.isAmicalWithPlatformGroup) {
      return true;
    }
    return this.match?.typeMatch !== 'AMICAL';
  }

  getDefaultTeamForNewPlayer(membre?: Membre, fromAdverseGroup: boolean = false): string {
    if (!this.match || !this.match.typeMatch) return this.equipeNames[0];

    switch (this.match.typeMatch) {
      case 'INTERNE':
      case 'DUEL':
        if (membre?.equipe) {
          if (this.match.equipe1?.id === membre.equipe.id) {
            return this.equipeNames[0];
          }
          if (this.match.equipe2?.id === membre.equipe.id) {
            return this.equipeNames[1];
          }
        }
        return this.equipeNames[0];

      case 'AMICAL':
        if (fromAdverseGroup) {
          return this.equipeNames[1];
        }
        return this.equipeNames[0];

      case 'ANNIVERSAIRE':
        if (membre && this.match.membresAnniversaire?.some(m => m.id === membre.id)) {
          return this.equipeNames[0];
        }
        return this.equipeNames[1];

      default:
        return this.equipeNames[0];
    }
  }

  // ===== FILTRAGE =====

  filteredMembres(): Membre[] {
    const searchLower = (this.membreSearch || '').toLowerCase();
    return this.membresNonPresents
      .filter(m =>
        m.nom.toLowerCase().includes(searchLower) ||
        m.prenom.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }

  filteredMembresAdverse(): Membre[] {
    const searchLower = (this.membreAdverseSearch || '').toLowerCase();
    return this.membresAdverseNonPresents
      .filter(m =>
        m.nom.toLowerCase().includes(searchLower) ||
        m.prenom.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }

  // ===== AJOUT DE MEMBRES =====

  addMembreToPresenceList(): void {
    if (!this.selectedMembreIdToAdd) return;

    const membre = this.membres.find(m => m.id === this.selectedMembreIdToAdd);
    if (!membre) return;

    const alreadyExists = this.dataSource.data.some(p => p.membre?.id === membre.id);
    if (alreadyExists) {
      this.showSnackbar('Ce membre est déjà dans la liste', 'error');
      return;
    }


    const newPresence: Presence = {
      id: 0,
      match: this.match!,
      membre: membre,
      present: true,
      aJoue: true,
      estCapitaine: false,
      buts: 0,
      passes: 0,
      penalti: 0,
      butsContreSonCamp: 0,
      estHommeDuMatch: false,
      estHommeDuMatchEq: false,
      equipeMatch: this.getDefaultTeamForNewPlayer(membre, false),
      cartonsJaunes: 0,
      cartonsRouges: 0,
      nomOccasionnel: '',
      estGardien: false,
      points: 0,
      paniers2pts: 0,
      paniers3pts: 0,
      lancersFrancs: 0,
      rebonds: 0,
      interceptions: 0,
      contres: 0,
      fautes: 0,
      jets7m: 0,
      deuxMinutes: 0,
      equipePosition: 0
    };

    this.dataSource.data = [...this.dataSource.data, newPresence];
    this.membresNonPresents = this.membresNonPresents.filter(m => m.id !== this.selectedMembreIdToAdd);
    
    this.selectedMembreIdToAdd = null;
    this.membreSearch = '';
    this.refreshView();

    this.showSnackbar(`${membre.nom} ${membre.prenom} ajouté à ${newPresence.equipeMatch}`, 'success');
  }

  addMembreAdverseToPresenceList(): void {
    if (!this.selectedMembreAdverseIdToAdd) return;

    const membre = this.membresAdverse.find(m => m.id === this.selectedMembreAdverseIdToAdd);
    if (!membre) return;

    const alreadyExists = this.dataSource.data.some(p => p.membre?.id === membre.id);
    if (alreadyExists) {
      this.showSnackbar('Ce membre est déjà dans la liste', 'error');
      return;
    }

    const newPresence: Presence = {
      id: 0,
      match: this.match!,
      membre: membre,
      present: true,
      aJoue: true,
      estCapitaine: false,
      buts: 0,
      passes: 0,
      penalti: 0,
      butsContreSonCamp: 0,
      estHommeDuMatch: false,
      estHommeDuMatchEq: false,
      equipeMatch: this.getDefaultTeamForNewPlayer(membre, true),
      cartonsJaunes: 0,
      cartonsRouges: 0,
      nomOccasionnel: '',
      estGardien: false,
      points: 0,
      paniers2pts: 0,
      paniers3pts: 0,
      lancersFrancs: 0,
      rebonds: 0,
      interceptions: 0,
      contres: 0,
      fautes: 0,
      jets7m: 0,
      deuxMinutes: 0,
      equipePosition: 0
    };

    this.dataSource.data = [...this.dataSource.data, newPresence];
    this.membresAdverseNonPresents = this.membresAdverseNonPresents.filter(m => m.id !== this.selectedMembreAdverseIdToAdd);
    
    this.selectedMembreAdverseIdToAdd = null;
    this.membreAdverseSearch = '';
    this.refreshView();

    this.showSnackbar(`${membre.nom} ${membre.prenom} ajouté à ${newPresence.equipeMatch}`, 'success');
  }

  addOccasionalPlayer(): void {
    if (!this.occasionalPlayerName.trim()) {
      this.showSnackbar('Veuillez entrer un nom', 'error');
      return;
    }

    let equipe = this.getDefaultTeamForNewPlayer();
    if (this.isAmicalWithPlatformGroup && this.occasionalPlayerTeam) {
      equipe = this.occasionalPlayerTeam;
    }

    const newPresence: Presence = {
      id: 0,
      match: this.match!,
      membre: null as any,
      nomOccasionnel: this.occasionalPlayerName.trim(),
      present: true,
      aJoue: false,
      estCapitaine: false,
      buts: 0,
      passes: 0,
      penalti: 0,
      butsContreSonCamp: 0,
      estHommeDuMatch: false,
      estHommeDuMatchEq: false,
      equipeMatch: equipe,
      cartonsJaunes: 0,
      cartonsRouges: 0,
      estGardien: false,
      points: 0,
      paniers2pts: 0,
      paniers3pts: 0,
      lancersFrancs: 0,
      rebonds: 0,
      interceptions: 0,
      contres: 0,
      fautes: 0,
      jets7m: 0,
      deuxMinutes: 0,
      equipePosition: 0
    };

    this.dataSource.data = [...this.dataSource.data, newPresence];
    
    const addedName = this.occasionalPlayerName;
    this.occasionalPlayerName = '';
    this.occasionalPlayerTeam = '';
    this.refreshView();

    this.showSnackbar(`${addedName} ajouté à ${newPresence.equipeMatch}`, 'success');
  }

  // onEquipeChange(): void {
  //   this.refreshView();
  // }

  onEquipeChange(presence: Presence): void {
  if (presence.equipeMatch === this.equipeNames[0]) {
    presence.equipePosition = 1;
  } else if (presence.equipeMatch === this.equipeNames[1]) {
    presence.equipePosition = 2;
  }
  
  // Forcer le rafraîchissement des getters

  this.refreshView();
}

  // ===== VALIDATION =====

  isPresenceValid(): boolean {
    const presentPlayers = this.dataSource.data.filter(p => p.present && p.aJoue);

    if (presentPlayers.length === 0) return false;

    if (this.match?.typeMatch === 'AMICAL') {
      return true;
    }

    const hasCapitaine1 = presentPlayers.some(p => 
      p.equipeMatch === this.equipeNames[0] && p.estCapitaine
    );
    const hasCapitaine2 = presentPlayers.some(p => 
      p.equipeMatch === this.equipeNames[1] && p.estCapitaine
    );

     const hasGardien1 = presentPlayers.some(p => 
      p.equipeMatch === this.equipeNames[0] && p.estGardien
    );
    const hasGardien2 = presentPlayers.some(p => 
      p.equipeMatch === this.equipeNames[1] && p.estGardien
    );

    return hasCapitaine1 && hasCapitaine2;
  }

  // ===== ÉVÉNEMENTS =====

  onPresenceChange(presence: Presence): void {
    if (!presence.present) {
      presence.aJoue = false;
      presence.estCapitaine = false;
      presence.estGardien = false;
      presence.buts = 0;
      presence.passes = 0;
      presence.penalti = 0;
      presence.butsContreSonCamp = 0;
      presence.estHommeDuMatch = false;
      presence.estHommeDuMatchEq = false;
      presence.cartonsJaunes = 0;
      presence.cartonsRouges = 0;
    }
  }

  onAJoueChange(presence: Presence): void {
    if (presence.aJoue) {
      presence.present = true;
      if (!presence.equipeMatch) {
        const isFromAdverseGroup = this.isAmicalWithPlatformGroup && 
          this.membresAdverse.some(m => m.id === presence.membre?.id);
        presence.equipeMatch = this.getDefaultTeamForNewPlayer(presence.membre || undefined, isFromAdverseGroup);
      }
    } else {
      presence.estCapitaine = false;
      presence.estGardien = false;
      presence.buts = 0;
      presence.passes = 0;
      presence.estHommeDuMatch = false;
      presence.estHommeDuMatchEq = false;
      presence.cartonsJaunes = 0;
      presence.cartonsRouges = 0;
    }
  }

  setCapitaine(presence: Presence): void {
    if (presence.estCapitaine) {
      const equipe = presence.equipeMatch;
      this.dataSource.data.forEach(p => {
        if (p.equipeMatch === equipe && p !== presence) {
          p.estCapitaine = false;
        }
      });
    }
  }

   setGardien(presence: Presence): void {
    if (presence.estGardien) {
      const equipe = presence.equipeMatch;
      this.dataSource.data.forEach(p => {
        if (p.equipeMatch === equipe && p !== presence) {
          p.estGardien = false;
        }
      });
    }
  }

  setMvpEquipe(presence: Presence): void {
    if (presence.estHommeDuMatchEq) {
      const equipe = presence.equipeMatch;
      this.dataSource.data.forEach(p => {
        if (p.equipeMatch === equipe && p !== presence) {
          p.estHommeDuMatchEq = false;
        }
      });
    }
  }

  setHommeDuMatch(presence: Presence): void {
    if (presence.estHommeDuMatch) {
      this.dataSource.data.forEach(p => {
        if (p !== presence) {
          p.estHommeDuMatch = false;
        }
      });
    }
  }

  // ===== CALCULS =====

 getMatchScore(position: number): number {
  return this.dataSource.data
    .filter(p => p.equipePosition === position)
    .reduce((total, p) => {
      const points = (p.buts || 0) + (p.penalti || 0) + (p.points || 0);
      return total + points;
    }, 0) + this.getCSCForEquipe(position);
}

// Les CSC marqués par l'équipe ADVERSE comptent pour nous
getCSCForEquipe(position: number): number {
  const adversePosition = position === 1 ? 2 : 1;
  return this.dataSource.data
    .filter(p => p.equipePosition === adversePosition)
    .reduce((total, p) => total + (p.butsContreSonCamp || 0), 0);
}

  getCapitaine(equipe: string): string {
    const capitaine = this.dataSource.data.find(p => 
      p.equipeMatch === equipe && p.estCapitaine
    );
    return capitaine ? this.getMembreName(capitaine) : '_______________________';
  }

   getGardien(equipe: string): string {
    const capitaine = this.dataSource.data.find(p => 
      p.equipeMatch === equipe && p.estGardien
    );
    return capitaine ? this.getMembreName(capitaine) : '_______________________';
  }

  getHommeDuMatch(): string {
    const hdm = this.dataSource.data.find(p => p.present && p.aJoue && p.estHommeDuMatch);
    return hdm ? this.getMembreName(hdm) : 'Aucun';
  }

  getMvpEquipeFor(equipe: string): string {
    const mvp = this.dataSource.data.find(p => 
      p.equipeMatch === equipe && p.estHommeDuMatchEq
    );
    return mvp ? this.getMembreName(mvp) : 'Non désigné';
  }

  getTotalCartons(equipe: string, type: 'JAUNES' | 'ROUGES'): number {
    return this.dataSource.data
      .filter(p => p.equipeMatch === equipe && p.aJoue)
      .reduce((sum, p) => {
        return sum + (type === 'JAUNES' ? (p.cartonsJaunes || 0) : (p.cartonsRouges || 0));
      }, 0);
  }

  getTotalButs(equipe: string): number {
    return this.dataSource.data
      .filter(p => p.equipeMatch === equipe && p.aJoue)
      .reduce((sum, p) => sum + (p.buts || 0), 0);
  }

  getTotalPasses(equipe: string): number {
    return this.dataSource.data
      .filter(p => p.equipeMatch === equipe && p.aJoue)
      .reduce((sum, p) => sum + (p.passes || 0), 0);
  }

  getTotalPenaltis(equipe: string): number {
    return this.dataSource.data
      .filter(p => p.equipeMatch === equipe && p.aJoue)
      .reduce((sum, p) => sum + (p.penalti || 0), 0);
  }

  getTotalCSC(equipe: string): number {
    return this.dataSource.data
      .filter(p => p.equipeMatch === equipe && p.aJoue)
      .reduce((sum, p) => sum + (p.butsContreSonCamp || 0), 0);
  }

  getTotalCartonsJaunes(): number {
    return this.dataSource.data.reduce((sum, p) => sum + (p.cartonsJaunes || 0), 0);
  }

  getTotalCartonsRouges(): number {
    return this.dataSource.data.reduce((sum, p) => sum + (p.cartonsRouges || 0), 0);
  }

  hasSanctions(): boolean {
    return this.getTotalCartonsJaunes() > 0 || this.getTotalCartonsRouges() > 0;
  }

  getCartonsJaunesPlayers(): Presence[] {
    return this.dataSource.data.filter(p => p.cartonsJaunes && p.cartonsJaunes > 0);
  }

  getCartonsRougesPlayers(): Presence[] {
    return this.dataSource.data.filter(p => p.cartonsRouges && p.cartonsRouges > 0);
  }

  getPlayersAJoue(equipeName: string): Presence[] {
    return this.dataSource.data.filter(p => 
      p.equipeMatch === equipeName && p.aJoue === true
    );
  }

  // ===== UTILITAIRES =====

  getMembreName(presence: Presence): string {
    if (presence.membre?.nom) {
      return `${presence.membre.nom} ${presence.membre.prenom}`;
    }
    if (presence.nomOccasionnel) {
      return presence.nomOccasionnel;
    }
    return 'Nom inconnu';
  }

  getMembreNameAbbreviated(presence: Presence): string {
    const maxLength = 22;
    let nom = '';
    let prenom = '';

    if (presence.nomOccasionnel) {
      const parts = presence.nomOccasionnel.trim().split(/\s+/);
      if (parts.length > 1) {
        nom = parts.pop()!.toUpperCase();
        prenom = parts.join(' ');
      } else {
        return parts[0]?.toUpperCase() || 'Inconnu';
      }
    } else if (presence.membre) {
      nom = (presence.membre.nom || '').toUpperCase();
      prenom = presence.membre.prenom || '';
    } else {
      return 'Inconnu';
    }

    let fullName = `${nom} ${prenom}`;
    if (fullName.length <= maxLength) return fullName.trim();

    const prenomParts = prenom.split(/[\s-]/).filter(p => p.length > 0);
    if (prenomParts.length === 0) return nom;

    let abbreviated = prenomParts[0];
    for (let i = 1; i < prenomParts.length; i++) {
      abbreviated += ' ' + prenomParts[i].charAt(0) + '.';
    }

    fullName = `${nom} ${abbreviated}`;
    if (fullName.length > maxLength) {
      fullName = `${nom} ${prenomParts[0].charAt(0)}.`;
    }

    return fullName.trim();
  }

  // ===== OFFICIELS =====

  getArbitrePrincipal(): string {
    if (this.match?.arbitrePrincipal) {
      return `${this.match.arbitrePrincipal.nom} ${this.match.arbitrePrincipal.prenom}`;
    }
    return this.match?.arbitrePrincipalNomOccasionnel || '';
  }

  getArbitreAssistant(): string {
    if (this.match?.arbitreAssistant) {
      return `${this.match.arbitreAssistant.nom} ${this.match.arbitreAssistant.prenom}`;
    }
    return this.match?.arbitreAssistantNomOccasionnel || '';
  }

  getRapporteur(): string {
    if (this.match?.rapporteur) {
      return `${this.match.rapporteur.nom} ${this.match.rapporteur.prenom}`;
    }
    return this.match?.rapporteurNomOccasionnel || '';
  }

  hasOfficiels(): boolean {
    return !!(this.getArbitrePrincipal() || this.getArbitreAssistant() || this.getRapporteur());
  }

  // ===== ASSIGNATION ÉQUIPES =====

private assignDefaultTeams(): void {
  let needsRefresh = false;
  
  this.dataSource.data.forEach(presence => {
    // ÉTAPE 1 : Si le joueur possède déjà un nom d'équipe valide ou une position valide reçue du serveur, on la préserve !
    if (presence.equipeMatch && presence.equipeMatch !== '') {
      // Sécurité : on s'assure que sa position numérique concorde avec le nom de l'équipe
      if (presence.equipeMatch === this.equipeNames[1] && presence.equipePosition !== 2) {
        presence.equipePosition = 2;
        needsRefresh = true;
      } else if (presence.equipeMatch === this.equipeNames[0] && presence.equipePosition !== 1) {
        presence.equipePosition = 1;
        needsRefresh = true;
      }
      return; // On passe au joueur suivant, pas besoin d'exécuter la logique d'attribution par défaut
    }

    // ÉTAPE 2 : Si equipeMatch est vide (Cas des nouveaux joueurs ajoutés à la volée avant sauvegarde)
    if (!presence.equipeMatch || presence.equipeMatch === '') {
      needsRefresh = true;

      // Vérification si le joueur a une position numérique explicitement définie (1 ou 2)
      if (presence.equipePosition === 2) {
        presence.equipeMatch = this.equipeNames[1];
      } else if (presence.equipePosition === 1) {
        presence.equipeMatch = this.equipeNames[0];
      } 
      // Sinon, on applique la logique d'analyse des membres de la plateforme
      else {
        const isFromAdverseGroup = this.isAmicalWithPlatformGroup && 
          presence.membre?.id && 
          this.membresAdverse.some(m => m.id === presence.membre?.id);
        
        if (isFromAdverseGroup) {
          presence.equipeMatch = this.equipeNames[1];
          presence.equipePosition = 2;
        } else if (presence.membre?.equipe?.nom && this.equipeNames.includes(presence.membre.equipe.nom)) {
          presence.equipeMatch = presence.membre.equipe.nom;
          presence.equipePosition = this.equipeNames.indexOf(presence.membre.equipe.nom) + 1;
        } else {
          // Si c'est un joueur occasionnel sans aucune info, on le met par défaut côté hôte
          presence.equipeMatch = this.equipeNames[0];
          presence.equipePosition = 1;
        }
      }
    }
  });
  
  if (needsRefresh) {
    this._refreshCounter++;
    this.cdr.detectChanges();
  }
}

  // ===== SAUVEGARDE =====

  savePresences(): void {
    if (!this.isPresenceValid()) {
      this.showSnackbar('Veuillez compléter les informations requises', 'error');
      return;
    }

    this.isLoading = true;
    const matchId = this.match!.id;
    const presencesToSave = this.dataSource.data.filter(p => p.present);

    this.presenceService.savePresences(matchId, presencesToSave).subscribe({
      next: () => {
        this.isLoading = false;
        this.showSnackbar('Présences enregistrées !', 'success');
      },
      error: (err) => {
        console.error('Erreur sauvegarde:', err);
        this.isLoading = false;
        this.showSnackbar('Erreur lors de l\'enregistrement', 'error');
      }
    });
  }

  // ===== IMPRESSION =====

  printMatchSheet(): void {
    this.printContent('print-section');
  }

  printPresenceSheet(): void {
    this.printContent('print-presence-section');
  }

  private printContent(contentId: string): void {
    const printContent = document.getElementById(contentId);
    if (!printContent) {
      this.showSnackbar('Section d\'impression non trouvée', 'error');
      return;
    }

    const printWindow = window.open('', '_blank', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Feuille de Match</title>
          <meta charset="UTF-8">
        </head>
        <body>${printContent.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
    }
  }

async downloadMatchSheetAsPdf(): Promise<void> {
  const element = document.getElementById('print-section');
  if (!element) return;

  this.isLoading = true; 
  
  try {
    // 1. Préparation de l'élément (identique à ton code)
    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.width = '210mm';

    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Capture de l'élément
    const canvas = await html2canvas(element, {
      scale: 2, 
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.7);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true 
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
    
    const fileName = `Match_${Date.now()}.pdf`;

    // 3. DISTINCTION MOBILE VS WEB
    if (Capacitor.isNativePlatform()) {
      // --- LOGIQUE MOBILE (Android/APK) ---
      
      // On récupère le PDF en base64 (on enlève le préfixe data:application/pdf;base64,)
      const pdfBase64 = pdf.output('datauristring').split(',')[1];

      try {
        // Enregistrement dans le dossier Documents
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true
        });

        // Ouverture immédiate pour que l'utilisateur voie son fichier
        await FileOpener.open({
          filePath: savedFile.uri,
          contentType: 'application/pdf'
        });

        this.showSnackbar('PDF enregistré dans vos documents', 'success');
      } catch (err) {
        console.error('Erreur stockage Android:', err);
        this.showSnackbar('Erreur lors de l\'enregistrement sur le téléphone', 'error');
      }

    } else {
      // --- LOGIQUE WEB CLASSIQUE ---
      pdf.save(fileName);
      this.showSnackbar('Téléchargement lancé', 'success');
    }

    // 4. NETTOYAGE (Crucial)
    element.style.display = 'none';
    canvas.width = 0;
    canvas.height = 0;

  } catch (error) {
    console.error('Erreur PDF:', error);
    this.showSnackbar('Erreur lors de la génération du PDF', 'error');
  } finally {
    this.isLoading = false;
  }
}

// ===== HELPER: Générer tableau d'équipe =====
// private generateTeamTablePdf(
//   doc: jsPDF, 
//   equipeName: string, 
//   x: number, 
//   y: number, 
//   width: number, 
//   color: number[],
//   isTeam1: boolean
// ): void {
//   const players = this.getPlayersAJoue(equipeName);

//   // Header coloré
//   doc.setFillColor(color[0], color[1], color[2]);
//   doc.roundedRect(x, y, width, 9, 2, 2, 'F');
  
//   doc.setTextColor(255, 255, 255);
//   doc.setFontSize(9);
//   doc.setFont('helvetica', 'bold');
//   doc.text(this.truncateText(equipeName, 15), x + 5, y + 6);
//   doc.setFontSize(8);
//   doc.text(`${players.length}`, x + width - 10, y + 6);

//   // Capitaine
//   y += 10;
//   doc.setFillColor(250, 250, 250);
//   doc.rect(x, y, width, 6, 'F');
//   doc.setTextColor(100, 100, 100);
//   doc.setFontSize(7);
//   doc.setFont('helvetica', 'normal');
//   doc.text('Cap: ' + this.truncateText(this.getCapitaine(equipeName), 22), x + 2, y + 4);

//   // En-têtes colonnes
//   y += 7;
//   doc.setFillColor(245, 245, 245);
//   doc.rect(x, y, width, 5, 'F');
//   doc.setFontSize(6);
//   doc.setFont('helvetica', 'bold');
//   doc.setTextColor(80, 80, 80);
  
//   const cols = [
//     { label: '#', width: 6 },
//     { label: 'Joueur', width: width - 48 },
//     { label: 'B', width: 7 },
//     { label: 'P', width: 7 },
//     { label: 'PD', width: 7 },
//     { label: 'CSC', width: 7 },
//     { label: 'CJ', width: 7 },
//     { label: 'CR', width: 7 }
//   ];
  
//   let colX = x;
//   cols.forEach(col => {
//     doc.text(col.label, colX + col.width / 2, y + 3.5, { align: 'center' });
//     colX += col.width;
//   });

//   // Lignes des joueurs
//   y += 5;
//   doc.setFont('helvetica', 'normal');
//   doc.setFontSize(7);

//   players.forEach((p, index) => {
//     const rowY = y + (index * 6);
    
//     // Fond alterné ou spécial
//     if (p.estCapitaine) {
//       doc.setFillColor(isTeam1 ? 227 : 255, isTeam1 ? 242 : 235, isTeam1 ? 253 : 238);
//     } else if (p.estHommeDuMatch) {
//       doc.setFillColor(255, 248, 225);
//     } else if (index % 2 === 0) {
//       doc.setFillColor(252, 252, 252);
//     } else {
//       doc.setFillColor(255, 255, 255);
//     }
//     doc.rect(x, rowY, width, 6, 'F');

//     colX = x;
    
//     // #
//     doc.setTextColor(150, 150, 150);
//     doc.text(`${index + 1}`, colX + 3, rowY + 4, { align: 'center' });
//     colX += cols[0].width;
    
//     // Nom
//     doc.setTextColor(51, 51, 51);
//     let name = this.truncateText(this.getMembreNameAbbreviated(p), 16);
//     if (p.estCapitaine) name += ' (C)';
//     if (p.estHommeDuMatchEq) name += ' ★';
//     if (p.estHommeDuMatch) name += ' ♛';
//     doc.text(name, colX + 1, rowY + 4);
//     colX += cols[1].width;

//     // Stats
//     const stats = [
//       { value: p.buts || 0, color: color },
//       { value: p.penalti || 0, color: color },
//       { value: p.passes || 0, color: [67, 160, 71] },
//       { value: p.butsContreSonCamp || 0, color: [198, 40, 40] },
//       { value: p.cartonsJaunes || 0, color: [249, 168, 37] },
//       { value: p.cartonsRouges || 0, color: [198, 40, 40] }
//     ];

//     stats.forEach((stat, i) => {
//       if (stat.value > 0) {
//         doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
//         doc.setFont('helvetica', 'bold');
//       } else {
//         doc.setTextColor(200, 200, 200);
//         doc.setFont('helvetica', 'normal');
//       }
//       doc.text(stat.value > 0 ? `${stat.value}` : '-', colX + cols[i + 2].width / 2, rowY + 4, { align: 'center' });
//       colX += cols[i + 2].width;
//     });
//   });

//   // Total
//   const totalY = y + (players.length * 6);
//   doc.setFillColor(isTeam1 ? 227 : 255, isTeam1 ? 242 : 235, isTeam1 ? 253 : 238);
//   doc.rect(x, totalY, width, 6, 'F');
  
//   // Ligne de séparation colorée
//   doc.setDrawColor(color[0], color[1], color[2]);
//   doc.setLineWidth(0.5);
//   doc.line(x, totalY, x + width, totalY);
  
//   doc.setFont('helvetica', 'bold');
//   doc.setTextColor(color[0], color[1], color[2]);
//   doc.text('TOTAL', x + cols[0].width + 10, totalY + 4);

//   colX = x + cols[0].width + cols[1].width;
//   const totals = [
//     this.getTotalButs(equipeName),
//     this.getTotalPenaltis(equipeName),
//     this.getTotalPasses(equipeName),
//     this.getTotalCSC(equipeName),
//     this.getTotalCartons(equipeName, 'JAUNES'),
//     this.getTotalCartons(equipeName, 'ROUGES')
//   ];
//   const totalColors = [color, color, [67, 160, 71], [198, 40, 40], [249, 168, 37], [198, 40, 40]];
  
//   totals.forEach((t, i) => {
//     doc.setTextColor(totalColors[i][0], totalColors[i][1], totalColors[i][2]);
//     doc.text(`${t}`, colX + cols[i + 2].width / 2, totalY + 4, { align: 'center' });
//     colX += cols[i + 2].width;
//   });
// }


private generateTeamTablePdf(
  doc: jsPDF, 
  equipeName: string, 
  x: number, 
  y: number, 
  width: number, 
  color: number[],  // ✅ Couleur dynamique passée en paramètre
  isTeam1: boolean
): void {
  const players = this.getPlayersAJoue(equipeName);
  
  // Couleur light pour les fonds
  const colorLight = this.lightenColor(color, 0.85);

  // Header coloré avec la couleur de l'équipe
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, width, 9, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(this.truncateText(equipeName, 15), x + 5, y + 6);
  doc.setFontSize(8);
  doc.text(`${players.length}`, x + width - 10, y + 6);

  // Capitaine
  y += 10;
  doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
  doc.rect(x, y, width, 6, 'F');
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Cap: ' + this.truncateText(this.getCapitaine(equipeName), 22), x + 2, y + 4);

  // En-têtes colonnes
  y += 7;
  doc.setFillColor(245, 245, 245);
  doc.rect(x, y, width, 5, 'F');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  
  const cols = [
    { label: '#', width: 6 },
    { label: 'Joueur', width: width - 48 },
    { label: 'B', width: 7 },
    { label: 'P', width: 7 },
    { label: 'PD', width: 7 },
    { label: 'CSC', width: 7 },
    { label: 'CJ', width: 7 },
    { label: 'CR', width: 7 }
  ];
  
  let colX = x;
  cols.forEach(col => {
    doc.text(col.label, colX + col.width / 2, y + 3.5, { align: 'center' });
    colX += col.width;
  });

  // Lignes des joueurs
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  players.forEach((p, index) => {
    const rowY = y + (index * 6);
    
    // Fond alterné avec couleur de l'équipe
    if (p.estCapitaine) {
      doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
    } else if (p.estHommeDuMatch) {
      doc.setFillColor(255, 248, 225); // Doré pour HDM
    } else if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(x, rowY, width, 6, 'F');

    colX = x;
    
    // #
    doc.setTextColor(150, 150, 150);
    doc.text(`${index + 1}`, colX + 3, rowY + 4, { align: 'center' });
    colX += cols[0].width;
    
    // Nom
    doc.setTextColor(51, 51, 51);
    let name = this.truncateText(this.getMembreNameAbbreviated(p), 16);
    if (p.estCapitaine) name += ' (C)';
    if (p.estHommeDuMatchEq) name += ' ★';
    if (p.estHommeDuMatch) name += ' ♛';
    doc.text(name, colX + 1, rowY + 4);
    colX += cols[1].width;

    // Stats avec couleur de l'équipe pour les buts
    const stats = [
      { value: p.buts || 0, color: color },           // ✅ Couleur équipe
      { value: p.penalti || 0, color: color },        // ✅ Couleur équipe
      { value: p.passes || 0, color: [67, 160, 71] }, // Vert
      { value: p.butsContreSonCamp || 0, color: [198, 40, 40] },
      { value: p.cartonsJaunes || 0, color: [249, 168, 37] },
      { value: p.cartonsRouges || 0, color: [198, 40, 40] }
    ];

    stats.forEach((stat, i) => {
      if (stat.value > 0) {
        doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(stat.value > 0 ? `${stat.value}` : '-', colX + cols[i + 2].width / 2, rowY + 4, { align: 'center' });
      colX += cols[i + 2].width;
    });
  });

  // Total avec couleur de l'équipe
  const totalY = y + (players.length * 6);
  doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
  doc.rect(x, totalY, width, 6, 'F');
  
  // Ligne de séparation colorée
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.5);
  doc.line(x, totalY, x + width, totalY);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text('TOTAL', x + cols[0].width + 10, totalY + 4);

  colX = x + cols[0].width + cols[1].width;
  const totals = [
    this.getTotalButs(equipeName),
    this.getTotalPenaltis(equipeName),
    this.getTotalPasses(equipeName),
    this.getTotalCSC(equipeName),
    this.getTotalCartons(equipeName, 'JAUNES'),
    this.getTotalCartons(equipeName, 'ROUGES')
  ];
  const totalColors = [color, color, [67, 160, 71], [198, 40, 40], [249, 168, 37], [198, 40, 40]];
  
  totals.forEach((t, i) => {
    doc.setTextColor(totalColors[i][0], totalColors[i][1], totalColors[i][2]);
    doc.text(`${t}`, colX + cols[i + 2].width / 2, totalY + 4, { align: 'center' });
    colX += cols[i + 2].width;
  });
}

// ===== FICHE DE PRÉSENCE =====
// async downloadPresenceSheetAsPdf(): Promise<void> {
//   if (this.isGeneratingPdf) return;
  
//   this.isGeneratingPdf = true;
//   this.showSnackbar('Génération du PDF...', 'success');

//   setTimeout(() => {
//     try {
//       const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
//       const pageWidth = doc.internal.pageSize.getWidth();
//       const pageHeight = doc.internal.pageSize.getHeight();
//       const margin = 10;
//       let y = margin;

//       // ===== HEADER VERT =====
//       doc.setFillColor(67, 160, 71);
//       doc.rect(0, 0, pageWidth, 28, 'F');
      
//       doc.setTextColor(255, 255, 255);
//       doc.setFontSize(16);
//       doc.setFont('helvetica', 'bold');
//       doc.text('FICHE DE PRÉSENCE', pageWidth / 2, 12, { align: 'center' });
      
//       doc.setFontSize(10);
//       doc.setFont('helvetica', 'normal');
//       doc.text(this.groupeActif?.nom || '', pageWidth / 2, 19, { align: 'center' });
      
//       const matchDate = this.match?.dateMatch 
//         ? new Date(this.match.dateMatch).toLocaleDateString('fr-FR', { 
//             weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
//           })
//         : '';
//       doc.setFontSize(8);
//       doc.text(`${this.match?.typeMatch || ''} - ${matchDate}`, pageWidth / 2, 25, { align: 'center' });

//       y = 35;

//       // ===== OFFICIELS =====
//       doc.setFontSize(8);
//       doc.setTextColor(100, 100, 100);
//       const arbitre = this.getArbitrePrincipal() || '____________';
//       const assistant = this.getArbitreAssistant() || '____________';
//       const rapporteur = this.getRapporteur() || '____________';
//       doc.text(`Arbitre: ${arbitre}   |   Assistant: ${assistant}   |   Rapporteur: ${rapporteur}`, pageWidth / 2, y, { align: 'center' });

//       y += 8;

//       // ===== TABLEAU DE PRÉSENCE avec autoTable =====
//       const tableData: any[][] = [];
      
//       this.dataSource.data.forEach((p, i) => {
//         tableData.push([
//           (i + 1).toString(),
//           this.getMembreName(p),
//           p.equipeMatch || '',
//           '' // Signature vide
//         ]);
//       });

//       // Ajouter des lignes vides
//       for (let i = 0; i < 5; i++) {
//         tableData.push(['', '', '', '']);
//       }

//       (doc as any).autoTable({
//         startY: y,
//         head: [['N°', 'Nom et Prénom', 'Équipe', 'Signature']],
//         body: tableData,
//         theme: 'grid',
//         headStyles: {
//           fillColor: [67, 160, 71],
//           textColor: 255,
//           fontStyle: 'bold',
//           fontSize: 9,
//           halign: 'center',
//           cellPadding: 3
//         },
//         columnStyles: {
//           0: { cellWidth: 12, halign: 'center', fontSize: 9 },
//           1: { cellWidth: 75, fontSize: 9 },
//           2: { cellWidth: 40, halign: 'center', fontSize: 8 },
//           3: { cellWidth: 50 }
//         },
//         bodyStyles: {
//           fontSize: 9,
//           cellPadding: 2,
//           minCellHeight: 8
//         },
//         alternateRowStyles: {
//           fillColor: [245, 245, 245]
//         },
//         didParseCell: (data: any) => {
//           // Colorer les badges équipe
//           if (data.column.index === 2 && data.cell.section === 'body' && data.cell.raw) {
//             if (data.cell.raw === this.equipeNames[0]) {
//               data.cell.styles.textColor = [25, 118, 210];
//               data.cell.styles.fontStyle = 'bold';
//             } else if (data.cell.raw === this.equipeNames[1]) {
//               data.cell.styles.textColor = [211, 47, 47];
//               data.cell.styles.fontStyle = 'bold';
//             }
//           }
//         },
//         margin: { left: margin, right: margin }
//       });

//       // ===== FOOTER =====
//       const finalY = (doc as any).lastAutoTable.finalY + 10;
      
//       doc.setFontSize(9);
//       doc.setTextColor(51, 51, 51);
//       doc.text(`Total: `, margin, finalY);
//       doc.setTextColor(67, 160, 71);
//       doc.setFont('helvetica', 'bold');
//       doc.text(`${this.dataSource.data.length}`, margin + 12, finalY);
//       doc.setFont('helvetica', 'normal');
//       doc.setTextColor(51, 51, 51);
//       doc.text(' inscrits', margin + 18, finalY);
      
//       // Compteurs par équipe
//       doc.setTextColor(25, 118, 210);
//       doc.text(`${this.equipeNames[0]}: ${this.equipe1Count}`, pageWidth / 2 - 25, finalY);
      
//       doc.setTextColor(211, 47, 47);
//       doc.text(`${this.equipeNames[1]}: ${this.equipe2Count}`, pageWidth / 2 + 25, finalY);
      
//       doc.setTextColor(67, 160, 71);
//       doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - margin, finalY, { align: 'right' });

//       // ===== TÉLÉCHARGEMENT =====
//       const dateFile = this.match?.dateMatch 
//         ? new Date(this.match.dateMatch).toISOString().split('T')[0] 
//         : 'match';
//       doc.save(`fiche-presence-${this.groupeActif?.nom}-${dateFile}.pdf`);
      
//       this.isGeneratingPdf = false;
//       this.showSnackbar('PDF téléchargé avec succès !', 'success');

//     } catch (error) {
//       console.error('Erreur génération PDF:', error);
//       this.isGeneratingPdf = false;
//       this.showSnackbar('Erreur lors de la génération du PDF', 'error');
//     }
//   }, 50);
// }

async downloadPresenceSheetAsPdf(): Promise<void> {
  if (this.isGeneratingPdf) return;
  
  this.isGeneratingPdf = true;
  this.showSnackbar('Génération du PDF...', 'success');

  // Petit délai pour laisser l'UI respirer
  setTimeout(async () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      let y = margin;

      // ===== HEADER (Dégradé couleurs équipes) =====
      doc.setFillColor(this.team1Color[0], this.team1Color[1], this.team1Color[2]);
      doc.rect(0, 0, pageWidth / 2, 28, 'F');
      
      doc.setFillColor(this.team2Color[0], this.team2Color[1], this.team2Color[2]);
      doc.rect(pageWidth / 2, 0, pageWidth / 2, 28, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FICHE DE PRÉSENCE', pageWidth / 2, 12, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(this.groupeActif?.nom || '', pageWidth / 2, 19, { align: 'center' });
      
      const matchDate = this.match?.dateMatch 
        ? new Date(this.match.dateMatch).toLocaleDateString('fr-FR', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })
        : '';
      doc.setFontSize(8);
      doc.text(`${this.match?.typeMatch || ''} - ${matchDate}`, pageWidth / 2, 25, { align: 'center' });

      y = 35;

      // ===== OFFICIELS =====
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const arbitre = this.getArbitrePrincipal() || '____________';
      const assistant = this.getArbitreAssistant() || '____________';
      const rapporteur = this.getRapporteur() || '____________';
      doc.text(`Arbitre: ${arbitre}   |   Assistant: ${assistant}   |   Rapporteur: ${rapporteur}`, pageWidth / 2, y, { align: 'center' });

      y += 8;

      // ===== TABLEAU =====
      const tableData: any[][] = [];
      this.dataSource.data.forEach((p, i) => {
        tableData.push([
          (i + 1).toString(),
          this.getMembreName(p),
          p.equipeMatch || '',
          ''
        ]);
      });

      for (let i = 0; i < 5; i++) { tableData.push(['', '', '', '']); }

      const headerColor = [
        Math.round((this.team1Color[0] + this.team2Color[0]) / 2),
        Math.round((this.team1Color[1] + this.team2Color[1]) / 2),
        Math.round((this.team1Color[2] + this.team2Color[2]) / 2)
      ];

      (doc as any).autoTable({
        startY: y,
        head: [['N°', 'Nom et Prénom', 'Équipe', 'Signature']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: headerColor, textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'center' },
        columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 75 }, 2: { cellWidth: 40, halign: 'center' }, 3: { cellWidth: 50 } },
        didParseCell: (data: any) => {
          if (data.column.index === 2 && data.cell.section === 'body' && data.cell.raw) {
            if (data.cell.raw === this.equipeNames[0]) {
              data.cell.styles.textColor = this.team1Color;
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === this.equipeNames[1]) {
              data.cell.styles.textColor = this.team2Color;
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      // ===== FOOTER =====
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(9);
      doc.setTextColor(51, 51, 51);
      doc.text(`Total: `, margin, finalY);
      doc.setTextColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`${this.dataSource.data.length}`, margin + 12, finalY);
      
      const dateFile = this.match?.dateMatch ? new Date(this.match.dateMatch).toISOString().split('T')[0] : 'match';
      const fileName = `fiche-presence-${this.groupeActif?.nom}-${dateFile}.pdf`;

      // ===== GESTION MOBILE VS WEB =====
      if (Capacitor.isNativePlatform()) {
        try {
          // Extraire le Base64 du PDF
          const pdfBase64 = doc.output('datauristring').split(',')[1];

          // Enregistrer le fichier
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: pdfBase64,
            directory: Directory.Documents,
            recursive: true
          });

          // Ouvrir le PDF
          await FileOpener.open({
            filePath: savedFile.uri,
            contentType: 'application/pdf'
          });

          this.showSnackbar('PDF enregistré et ouvert', 'success');
        } catch (err) {
          console.error('Erreur stockage mobile:', err);
          this.showSnackbar('Erreur lors de l\'enregistrement sur mobile', 'error');
        }
      } else {
        // Logique Web classique
        doc.save(fileName);
        this.showSnackbar('PDF téléchargé !', 'success');
      }
      
      this.isGeneratingPdf = false;

    } catch (error) {
      console.error('Erreur PDF:', error);
      this.isGeneratingPdf = false;
      this.showSnackbar('Erreur lors de la génération', 'error');
    }
  }, 100);
}

// ===== HELPER: Tronquer texte =====
private truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 2) + '..' : text;
}

private showSnackbar(message: string, type: 'success' | 'error'): void {
  this.snackBar.open(message, '✕', {
    duration: 3000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
    panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
  });
}

get cscPlayers(): Presence[] {
  return this.dataSource.data.filter(p => p.butsContreSonCamp && p.butsContreSonCamp > 0);
}

getTotalCSCForAll(): number {
  return this.dataSource.data.reduce((sum, p) => sum + (p.butsContreSonCamp || 0), 0);
}

// ============================================================
// 1. TÉLÉCHARGER AVEC CHOIX DU FORMAT
// ============================================================

// async downloadMatchSheetAsImage(format: 'full' | 'story' = 'full'): Promise<void> {
//   if (this.isGeneratingImage) return;
  
//   this.isGeneratingImage = true;
//   this.showSnackbar('Génération de l\'image...', 'success');

//   try {
//     // Sélectionner le bon template selon le format
//     const elementId = format === 'story' ? 'print-match-story' : 'print-match-image';
//     const element = document.getElementById(elementId);
    
//     if (!element) {
//       // Fallback sur l'ancien template
//       const fallback = document.getElementById('print-match-section');
//       if (!fallback) throw new Error('Élément non trouvé');
//       await this.captureAndDownload(fallback, format);
//       return;
//     }

//     await this.captureAndDownload(element, format);

//   } catch (error) {
//     console.error('Erreur génération image:', error);
//     this.isGeneratingImage = false;
//     this.showSnackbar('Erreur lors de la génération', 'error');
//   }
// }

private async captureAndDownload(element: HTMLElement, format: string): Promise<void> {
  // Rendre visible temporairement
  const originalDisplay = element.style.display;
  element.style.display = 'block';
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.top = '0';

  // Attendre le rendu
  await new Promise(resolve => setTimeout(resolve, 150));

  try {
    // Capturer avec html2canvas
    const canvas = await html2canvas(element, {
      scale: 3, // Haute résolution pour les réseaux sociaux
      useCORS: true,
      allowTaint: true,
      backgroundColor: null, // Transparent pour garder le gradient
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight
    });

    // Télécharger
    const link = document.createElement('a');
    link.download = this.getImageFileName(`match-${format}`);
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();

    this.isGeneratingImage = false;
    this.showSnackbar('Image téléchargée !', 'success');

  } finally {
    // Restaurer l'état
    element.style.display = originalDisplay;
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
  }
}

// ============================================================
// 2. PARTAGER DIRECTEMENT (Mobile)
// ============================================================

async shareMatchImage(format: 'full' | 'story' = 'full'): Promise<void> {
  if (this.isGeneratingImage) return;

  // Vérifier support
  if (!navigator.share) {
    this.showSnackbar('Partage non disponible, téléchargement...', 'success');
    await this.downloadMatchSheetAsImage(format);
    return;
  }

  this.isGeneratingImage = true;
  this.showSnackbar('Préparation...', 'success');

  try {
    const elementId = format === 'story' ? 'print-match-story' : 'print-match-image';
    const element = document.getElementById(elementId) || document.getElementById('print-match-section');
    
    if (!element) throw new Error('Élément non trouvé');

    // Rendre visible
    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.left = '-9999px';

    await new Promise(resolve => setTimeout(resolve, 150));

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false
    });

    element.style.display = 'none';

    // Convertir en blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Erreur blob')), 'image/png', 1.0);
    });

    const file = new File([blob], this.getImageFileName(`match-${format}`), { type: 'image/png' });

    // Texte de partage
    const score1 = this.getMatchScore(1);
    const score2 = this.getMatchScore(2);
    const shareText = `⚽ ${this.equipeNames[0]} ${score1} - ${score2} ${this.equipeNames[1]}\n📅 ${this.formatDateForShare()}\n\n#${this.groupeActif?.nom?.replace(/\s+/g, '')} #My20`;

    const shareData: ShareData = {
      title: `Match ${this.groupeActif?.nom}`,
      text: shareText,
      files: [file]
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      this.showSnackbar('Partagé !', 'success');
    } else {
      // Partage texte seul + téléchargement image
      await navigator.share({ title: shareData.title, text: shareData.text });
      const link = document.createElement('a');
      link.download = this.getImageFileName(`match-${format}`);
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }

    this.isGeneratingImage = false;

  } catch (error: any) {
    this.isGeneratingImage = false;
    if (error.name !== 'AbortError') {
      this.showSnackbar('Erreur lors du partage', 'error');
    }
  }
}

// ============================================================
// 3. COPIER DANS LE PRESSE-PAPIER
// ============================================================

async copyMatchImageToClipboard(format: 'full' | 'story' = 'full'): Promise<void> {
  if (this.isGeneratingImage) return;

  if (!navigator.clipboard?.write) {
    this.showSnackbar('Copie non supportée sur ce navigateur', 'error');
    return;
  }

  this.isGeneratingImage = true;
  this.showSnackbar('Copie en cours...', 'success');

  try {
    const elementId = format === 'story' ? 'print-match-story' : 'print-match-image';
    const element = document.getElementById(elementId) || document.getElementById('print-match-section');
    
    if (!element) throw new Error('Élément non trouvé');

    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.left = '-9999px';

    await new Promise(resolve => setTimeout(resolve, 150));

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false
    });

    element.style.display = 'none';

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Erreur')), 'image/png', 1.0);
    });

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);

    this.isGeneratingImage = false;
    this.showSnackbar('Image copiée ! Collez avec Ctrl+V', 'success');

  } catch (error) {
    console.error('Erreur copie:', error);
    this.isGeneratingImage = false;
    this.showSnackbar('Erreur lors de la copie', 'error');
  }
}

// ============================================================
// HELPERS
// ============================================================

private getImageFileName(prefix: string): string {
  const groupeName = this.groupeActif?.nom?.replace(/[^a-zA-Z0-9]/g, '-') || 'groupe';
  const score = `${this.getMatchScore(1)}-${this.getMatchScore(2)}`;
  const dateFile = this.match?.dateMatch 
    ? new Date(this.match.dateMatch).toISOString().split('T')[0] 
    : new Date().toISOString().split('T')[0];
  
  return `${prefix}-${groupeName}-${score}-${dateFile}.png`;
}

private formatDateForShare(): string {
  if (!this.match?.dateMatch) return '';
  return new Date(this.match.dateMatch).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
downloadMatchSheetAsImage(format: 'full' | 'story' = 'full'): void {
  if (!this.match?.id) return;
  this.matchImageService.downloadMatchImage(this.match.id, format);
}

shareMatchSheetAsImage(format: 'full' | 'story' = 'full'): void {
  if (!this.match?.id) return;
  this.matchImageService.shareMatchImage(this.match.id, format);
}
//   if (this.isGeneratingPdf) return;
  
//   this.isGeneratingPdf = true;
//   this.showSnackbar('Génération de l\'image...', 'success');

//   try {
//     // Récupérer l'élément à capturer
//     const element = document.getElementById('print-match-section');
    
//     if (!element) {
//       throw new Error('Élément non trouvé');
//     }

//     // Rendre visible temporairement
//     element.style.display = 'block';
//     element.style.position = 'absolute';
//     element.style.left = '-9999px';
//     element.style.top = '0';

//     // Attendre le rendu
//     await new Promise(resolve => setTimeout(resolve, 100));

//     // Capturer avec html2canvas
//     const canvas = await html2canvas(element, {
//       scale: 2, // Haute résolution
//       useCORS: true,
//       allowTaint: true,
//       backgroundColor: '#ffffff',
//       logging: false,
//       width: element.scrollWidth,
//       height: element.scrollHeight
//     });

//     // Cacher l'élément
//     element.style.display = 'none';

//     // Convertir en image et télécharger
//     const link = document.createElement('a');
//     link.download = this.getImageFileName('feuille-match');
//     link.href = canvas.toDataURL('image/png', 1.0);
//     link.click();

//     this.isGeneratingPdf = false;
//     this.showSnackbar('Image téléchargée avec succès !', 'success');

//   } catch (error) {
//     console.error('Erreur génération image:', error);
//     this.isGeneratingPdf = false;
//     this.showSnackbar('Erreur lors de la génération de l\'image', 'error');
//   }
// }

// ============================================================
// 2. TÉLÉCHARGER LA FICHE DE PRÉSENCE EN IMAGE
// ============================================================

async downloadPresenceSheetAsImage(): Promise<void> {
  if (this.isGeneratingPdf) return;
  
  this.isGeneratingPdf = true;
  this.showSnackbar('Génération de l\'image...', 'success');

  try {
    const element = document.getElementById('print-presence-section');
    
    if (!element) {
      throw new Error('Élément non trouvé');
    }

    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    element.style.display = 'none';

    const link = document.createElement('a');
    link.download = this.getImageFileName('fiche-presence');
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();

    this.isGeneratingPdf = false;
    this.showSnackbar('Image téléchargée avec succès !', 'success');

  } catch (error) {
    console.error('Erreur génération image:', error);
    this.isGeneratingPdf = false;
    this.showSnackbar('Erreur lors de la génération de l\'image', 'error');
  }
}

// ============================================================
// 3. PARTAGER L'IMAGE (Web Share API)
// ============================================================

// async shareMatchSheetAsImage(): Promise<void> {
//   if (this.isGeneratingPdf) return;

//   // Vérifier si le partage est supporté
//   if (!navigator.share || !navigator.canShare) {
//     this.showSnackbar('Le partage n\'est pas disponible sur ce navigateur', 'error');
//     // Fallback: télécharger
//     await this.downloadMatchSheetAsImage();
//     return;
//   }

//   this.isGeneratingPdf = true;
//   this.showSnackbar('Préparation du partage...', 'success');

//   try {
//     const element = document.getElementById('print-match-section');
    
//     if (!element) {
//       throw new Error('Élément non trouvé');
//     }

//     element.style.display = 'block';
//     element.style.position = 'absolute';
//     element.style.left = '-9999px';
//     element.style.top = '0';

//     await new Promise(resolve => setTimeout(resolve, 100));

//     const canvas = await html2canvas(element, {
//       scale: 2,
//       useCORS: true,
//       allowTaint: true,
//       backgroundColor: '#ffffff',
//       logging: false
//     });

//     element.style.display = 'none';

//     // Convertir canvas en blob
//     const blob = await new Promise<Blob>((resolve, reject) => {
//       canvas.toBlob(blob => {
//         if (blob) resolve(blob);
//         else reject(new Error('Erreur conversion blob'));
//       }, 'image/png', 1.0);
//     });

//     // Créer le fichier
//     const file = new File([blob], this.getImageFileName('feuille-match'), { 
//       type: 'image/png' 
//     });

//     // Vérifier si on peut partager ce type de fichier
//     const shareData = {
//       title: `Feuille de match - ${this.groupeActif?.nom}`,
//       text: `${this.equipeNames[0]} ${this.getMatchScore(this.equipeNames[0])} - ${this.getMatchScore(this.equipeNames[1])} ${this.equipeNames[1]}`,
//       files: [file]
//     };

//     if (navigator.canShare(shareData)) {
//       await navigator.share(shareData);
//       this.showSnackbar('Partagé avec succès !', 'success');
//     } else {
//       // Fallback si les fichiers ne sont pas supportés
//       await navigator.share({
//         title: shareData.title,
//         text: shareData.text
//       });
//       // Télécharger aussi l'image
//       const link = document.createElement('a');
//       link.download = this.getImageFileName('feuille-match');
//       link.href = canvas.toDataURL('image/png', 1.0);
//       link.click();
//     }

//     this.isGeneratingPdf = false;

//   } catch (error: any) {
//     console.error('Erreur partage:', error);
//     this.isGeneratingPdf = false;
    
//     if (error.name !== 'AbortError') {
//       this.showSnackbar('Erreur lors du partage', 'error');
//     }
//   }
// }

// ============================================================
// 4. COPIER L'IMAGE DANS LE PRESSE-PAPIER
// ============================================================

async copyMatchSheetToClipboard(): Promise<void> {
  if (this.isGeneratingPdf) return;

  // Vérifier si le clipboard est supporté
  if (!navigator.clipboard || !navigator.clipboard.write) {
    this.showSnackbar('La copie n\'est pas disponible sur ce navigateur', 'error');
    return;
  }

  this.isGeneratingPdf = true;
  this.showSnackbar('Copie en cours...', 'success');

  try {
    const element = document.getElementById('print-match-section');
    
    if (!element) {
      throw new Error('Élément non trouvé');
    }

    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    element.style.display = 'none';

    // Convertir en blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Erreur conversion blob'));
      }, 'image/png', 1.0);
    });

    // Copier dans le presse-papier
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob
      })
    ]);

    this.isGeneratingPdf = false;
    this.showSnackbar('Image copiée ! Collez-la dans WhatsApp, Facebook, etc.', 'success');

  } catch (error) {
    console.error('Erreur copie:', error);
    this.isGeneratingPdf = false;
    this.showSnackbar('Erreur lors de la copie', 'error');
  }
}

// ============================================================
// 5. HELPER: Nom du fichier image
// ============================================================

// private getImageFileName(prefix: string): string {
//   const groupeName = this.groupeActif?.nom?.replace(/\s+/g, '-') || 'groupe';
//   const dateFile = this.match?.dateMatch 
//     ? new Date(this.match.dateMatch).toISOString().split('T')[0] 
//     : new Date().toISOString().split('T')[0];
//   const score = `${this.getMatchScore(this.equipeNames[0])}-${this.getMatchScore(this.equipeNames[1])}`;
  
//   return `${prefix}-${groupeName}-${score}-${dateFile}.png`;
// }


 get team1HexColor(): string {
    return this.rgbToHex(this.team1Color);
  }
  
  get team2HexColor(): string {
    return this.rgbToHex(this.team2Color);
  }
  
  get team1LightHexColor(): string {
    return this.rgbToHex(this.team1ColorLight);
  }
  
  get team2LightHexColor(): string {
    return this.rgbToHex(this.team2ColorLight);
  }
  
  private rgbToHex(rgb: number[]): string {
    return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');
  }
 
  selectAllAdverseMembres(): void {
  const filteredIds = this.filteredMembresAdverse().map(m => m.id);
  this.selectedMembreAdverseIdsToAdd = [...filteredIds];
}

addMembresLocalToPresenceList(): void {
  if (!this.selectedMembreIdsToAdd || this.selectedMembreIdsToAdd.length === 0) return;

  const toAdd = this.membresNonPresents.filter(m => this.selectedMembreIdsToAdd.includes(m.id));
  
  // Alerte si des joueurs sont suspendus
  const suspendus = toAdd.filter(m => m.estSuspendu);
  if (suspendus.length > 0) {
    const noms = suspendus.map(m => m.prenom).join(', ');
    if (!confirm(`Attention : ${noms} est/sont suspendu(s). Ajouter quand même ?`)) return;
  }

  const newPresences = toAdd.map(membre => ({
   id: 0,
      match: this.match!,
      membre: membre,
      present: true,
      aJoue: true,
      estCapitaine: false,
      buts: 0,
      passes: 0,
      penalti: 0,
      butsContreSonCamp: 0,
      estHommeDuMatch: false,
      estHommeDuMatchEq: false,
      equipeMatch: this.equipeNames[0],
      cartonsJaunes: 0,
      cartonsRouges: 0,
      nomOccasionnel: '',
      estGardien: false,
      points: 0,
      paniers2pts: 0,
      paniers3pts: 0,
      lancersFrancs: 0,
      rebonds: 0,
      interceptions: 0,
      contres: 0,
      fautes: 0,
      jets7m: 0,
      deuxMinutes: 0,
      equipePosition:1
  }));

  this.dataSource.data = [...this.dataSource.data, ...newPresences];
  
  // Filtrer la liste locale
  this.membresNonPresents = this.membresNonPresents.filter(m => !this.selectedMembreIdsToAdd.includes(m.id));
  
  this.selectedMembreIdsToAdd = [];
  this.membreSearch = '';
  this.triggerRefresh();
  this.updateCounts();
}
  updateCounts() {
    throw new Error('Method not implemented.');
  }

addMembresAdverseToPresenceList(): void {
  if (!this.selectedMembreAdverseIdsToAdd || this.selectedMembreAdverseIdsToAdd.length === 0) return;

  const toAdd = this.membresAdverseNonPresents.filter(m => this.selectedMembreAdverseIdsToAdd.includes(m.id));

  // Alerte si des joueurs adverses sont suspendus
  const suspendus = toAdd.filter(m => m.estSuspendu);
  if (suspendus.length > 0) {
    const noms = suspendus.map(m => m.prenom).join(', ');
    if (!confirm(`Attention : ${noms} est/sont suspendu(s). Ajouter quand même ?`)) return;
  }

  const newPresences = toAdd.map(membre => ({
    id: 0,
      match: this.match!,
      membre: membre,
      present: true,
      aJoue: true,
      estCapitaine: false,
      buts: 0,
      passes: 0,
      penalti: 0,
      butsContreSonCamp: 0,
      estHommeDuMatch: false,
      estHommeDuMatchEq: false,
      equipeMatch: this.equipeNames[1],
      cartonsJaunes: 0,
      cartonsRouges: 0,
      nomOccasionnel: '',
      estGardien: false,
      points: 0,
      paniers2pts: 0,
      paniers3pts: 0,
      lancersFrancs: 0,
      rebonds: 0,
      interceptions: 0,
      contres: 0,
      fautes: 0,
      jets7m: 0,
      deuxMinutes: 0,
      equipePosition: 2
  }));

  this.dataSource.data = [...this.dataSource.data, ...newPresences];
  
  // Filtrer la liste adverse
  this.membresAdverseNonPresents = this.membresAdverseNonPresents.filter(m => !this.selectedMembreAdverseIdsToAdd.includes(m.id));
  
  this.selectedMembreAdverseIdsToAdd = [];
  this.membreAdverseSearch = '';
  this.triggerRefresh();
  this.updateCounts();
}

triggerRefresh(): void {
  this._refreshCounter++;
  if (this.cdRef) this.cdRef.detectChanges();
}

selectAllLocalMembres(): void {
  const filteredIds = this.filteredMembres().map(m => m.id);
  this.selectedMembreIdsToAdd = [...filteredIds];

}
}
