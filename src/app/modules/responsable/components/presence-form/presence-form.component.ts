// presence-form.component.ts - Version avec support matchs amicaux inter-groupes

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
import html2canvas from 'html2canvas';

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
    RouterModule
  ],
  templateUrl: './presence-form.component.html',
  styleUrls: ['./presence-form.component.scss']
})
export class PresenceFormComponent implements OnInit {

  dataSource = new MatTableDataSource<Presence>([]);
  isLoading = true;
  
  match: Match | null = null;
  groupeActif: Groupe | null = null;
  groupeAdverse: Groupe | null = null;
  
  // Membres des deux groupes
  membres: Membre[] = [];
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

  private _refreshCounter = 0;

  constructor(
    private matchService: MatchService,
    private presenceService: PresenceService,
    private groupeService: GroupeService,
    private membreService: MembreService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const matchId = Number(this.route.snapshot.paramMap.get('matchId'));
    this.loadData(matchId);
  }

  // ===== GETTERS =====

  get equipe1Players(): Presence[] {
    const _ = this._refreshCounter;
    return this.dataSource.data.filter(p => p.equipeMatch === this.equipeNames[0]);
  }

  get equipe2Players(): Presence[] {
    const _ = this._refreshCounter;
    return this.dataSource.data.filter(p => p.equipeMatch === this.equipeNames[1]);
  }

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
        
        this.assignDefaultTeams();
        
        const presentMemberIds = presences
          .filter(p => p.membre?.id)
          .map(p => p.membre!.id);
        
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
      aJoue: false,
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
      nomOccasionnel: ''
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
      aJoue: false,
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
      nomOccasionnel: ''
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
      cartonsRouges: 0
    };

    this.dataSource.data = [...this.dataSource.data, newPresence];
    
    const addedName = this.occasionalPlayerName;
    this.occasionalPlayerName = '';
    this.occasionalPlayerTeam = '';
    this.refreshView();

    this.showSnackbar(`${addedName} ajouté à ${newPresence.equipeMatch}`, 'success');
  }

  onEquipeChange(): void {
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

    return hasCapitaine1 && hasCapitaine2;
  }

  // ===== ÉVÉNEMENTS =====

  onPresenceChange(presence: Presence): void {
    if (!presence.present) {
      presence.aJoue = false;
      presence.estCapitaine = false;
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

  getMatchScore(equipe: string): number {
    let score = 0;
    const equipeAdverse = this.equipeNames.find(name => name !== equipe);

    score += this.dataSource.data
      .filter(p => p.present && p.aJoue && p.equipeMatch === equipe)
      .reduce((sum, p) => sum + (p.buts || 0) + (p.penalti || 0), 0);

    if (equipeAdverse) {
      score += this.dataSource.data
        .filter(p => p.present && p.aJoue && p.equipeMatch === equipeAdverse)
        .reduce((sum, p) => sum + (p.butsContreSonCamp || 0), 0);
    }

    return score;
  }

  getCapitaine(equipe: string): string {
    const capitaine = this.dataSource.data.find(p => 
      p.equipeMatch === equipe && p.estCapitaine
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
      if (!presence.equipeMatch || presence.equipeMatch === '') {
        needsRefresh = true;
        
        const isFromAdverseGroup = this.isAmicalWithPlatformGroup && 
          presence.membre?.id && 
          this.membresAdverse.some(m => m.id === presence.membre?.id);
        
        if (isFromAdverseGroup) {
          presence.equipeMatch = this.equipeNames[1];
        } else if (presence.membre?.equipe?.nom && this.equipeNames.includes(presence.membre.equipe.nom)) {
          presence.equipeMatch = presence.membre.equipe.nom;
        } else {
          presence.equipeMatch = this.equipeNames[0];
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
    if (!element) {
      this.showSnackbar('Section non trouvée', 'error');
      return;
    }

    try {
      element.style.display = 'block';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.width = '210mm';
      
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      element.style.display = 'none';
      element.style.position = '';
      element.style.left = '';
      element.style.width = '';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * ratio, canvas.height * ratio);

      const dateMatch = this.match?.dateMatch 
        ? new Date(this.match.dateMatch).toISOString().split('T')[0] 
        : 'match';
      pdf.save(`feuille-match-${dateMatch}.pdf`);
      this.showSnackbar('PDF téléchargé !', 'success');

    } catch (error) {
      console.error('Erreur PDF:', error);
      this.showSnackbar('Erreur lors de la génération du PDF', 'error');
      element.style.display = 'none';
    }
  }

  async downloadPresenceSheetAsPdf(): Promise<void> {
    const element = document.getElementById('print-presence-section');
    if (!element) {
      this.showSnackbar('Section non trouvée', 'error');
      return;
    }

    try {
      element.style.display = 'block';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.width = '210mm';
      
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      element.style.display = 'none';
      element.style.position = '';
      element.style.left = '';
      element.style.width = '';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * ratio, canvas.height * ratio);

      const dateMatch = this.match?.dateMatch 
        ? new Date(this.match.dateMatch).toISOString().split('T')[0] 
        : 'match';
      pdf.save(`fiche-presence-${dateMatch}.pdf`);
      this.showSnackbar('PDF téléchargé !', 'success');

    } catch (error) {
      console.error('Erreur PDF:', error);
      this.showSnackbar('Erreur lors de la génération du PDF', 'error');
      element.style.display = 'none';
    }
  }

  private showSnackbar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
    });
  }
}