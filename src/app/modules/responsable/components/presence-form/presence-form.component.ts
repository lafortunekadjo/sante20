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
import html2canvas from 'html2canvas'

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
  isGeneratingPdf = false;
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
      deuxMinutes: 0
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
      deuxMinutes: 0
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
      deuxMinutes: 0
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

     const hasGardien1 = presentPlayers.some(p => 
      p.equipeMatch === this.equipeNames[0] && p.estGardien
    );
    const hasGardien2 = presentPlayers.some(p => 
      p.equipeMatch === this.equipeNames[1] && p.estGardien
    );

    return hasCapitaine1 && hasCapitaine2 && hasGardien1 && hasGardien2;
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
  if (!element) return;

  this.isLoading = true; // Activer un spinner pour bloquer les clics multiples
  
  try {
    // 1. On prépare l'élément
    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.width = '210mm';

    // On attend un peu pour laisser le processeur respirer avant le gros calcul
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(element, {
      scale: 2, // 2 est le compromis idéal. 3 est trop lourd pour les mobiles.
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.7); // JPEG à 70% est BEAUCOUP plus léger que PNG

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true // Active la compression interne du PDF
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
    
    pdf.save(`Match_${Date.now()}.pdf`);

    // 2. NETTOYAGE CRUCIAL POUR LA MÉMOIRE
    element.style.display = 'none';
    canvas.width = 0;
    canvas.height = 0; // Libère la mémoire du canvas immédiatement

  } catch (error) {
    console.error('Erreur PDF:', error);
  } finally {
    this.isLoading = false;
  }
}

// ===== HELPER: Générer tableau d'équipe =====
private generateTeamTablePdf(
  doc: jsPDF, 
  equipeName: string, 
  x: number, 
  y: number, 
  width: number, 
  color: number[],
  isTeam1: boolean
): void {
  const players = this.getPlayersAJoue(equipeName);

  // Header coloré
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
  doc.setFillColor(250, 250, 250);
  doc.rect(x, y, width, 6, 'F');
  doc.setTextColor(100, 100, 100);
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
    
    // Fond alterné ou spécial
    if (p.estCapitaine) {
      doc.setFillColor(isTeam1 ? 227 : 255, isTeam1 ? 242 : 235, isTeam1 ? 253 : 238);
    } else if (p.estHommeDuMatch) {
      doc.setFillColor(255, 248, 225);
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

    // Stats
    const stats = [
      { value: p.buts || 0, color: color },
      { value: p.penalti || 0, color: color },
      { value: p.passes || 0, color: [67, 160, 71] },
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

  // Total
  const totalY = y + (players.length * 6);
  doc.setFillColor(isTeam1 ? 227 : 255, isTeam1 ? 242 : 235, isTeam1 ? 253 : 238);
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
async downloadPresenceSheetAsPdf(): Promise<void> {
  if (this.isGeneratingPdf) return;
  
  this.isGeneratingPdf = true;
  this.showSnackbar('Génération du PDF...', 'success');

  setTimeout(() => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let y = margin;

      // ===== HEADER VERT =====
      doc.setFillColor(67, 160, 71);
      doc.rect(0, 0, pageWidth, 28, 'F');
      
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

      // ===== TABLEAU DE PRÉSENCE avec autoTable =====
      const tableData: any[][] = [];
      
      this.dataSource.data.forEach((p, i) => {
        tableData.push([
          (i + 1).toString(),
          this.getMembreName(p),
          p.equipeMatch || '',
          '' // Signature vide
        ]);
      });

      // Ajouter des lignes vides
      for (let i = 0; i < 5; i++) {
        tableData.push(['', '', '', '']);
      }

      (doc as any).autoTable({
        startY: y,
        head: [['N°', 'Nom et Prénom', 'Équipe', 'Signature']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [67, 160, 71],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontSize: 9 },
          1: { cellWidth: 75, fontSize: 9 },
          2: { cellWidth: 40, halign: 'center', fontSize: 8 },
          3: { cellWidth: 50 }
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 2,
          minCellHeight: 8
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        didParseCell: (data: any) => {
          // Colorer les badges équipe
          if (data.column.index === 2 && data.cell.section === 'body' && data.cell.raw) {
            if (data.cell.raw === this.equipeNames[0]) {
              data.cell.styles.textColor = [25, 118, 210];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === this.equipeNames[1]) {
              data.cell.styles.textColor = [211, 47, 47];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        margin: { left: margin, right: margin }
      });

      // ===== FOOTER =====
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(9);
      doc.setTextColor(51, 51, 51);
      doc.text(`Total: `, margin, finalY);
      doc.setTextColor(67, 160, 71);
      doc.setFont('helvetica', 'bold');
      doc.text(`${this.dataSource.data.length}`, margin + 12, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      doc.text(' inscrits', margin + 18, finalY);
      
      // Compteurs par équipe
      doc.setTextColor(25, 118, 210);
      doc.text(`${this.equipeNames[0]}: ${this.equipe1Count}`, pageWidth / 2 - 25, finalY);
      
      doc.setTextColor(211, 47, 47);
      doc.text(`${this.equipeNames[1]}: ${this.equipe2Count}`, pageWidth / 2 + 25, finalY);
      
      doc.setTextColor(67, 160, 71);
      doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - margin, finalY, { align: 'right' });

      // ===== TÉLÉCHARGEMENT =====
      const dateFile = this.match?.dateMatch 
        ? new Date(this.match.dateMatch).toISOString().split('T')[0] 
        : 'match';
      doc.save(`fiche-presence-${this.groupeActif?.nom}-${dateFile}.pdf`);
      
      this.isGeneratingPdf = false;
      this.showSnackbar('PDF téléchargé avec succès !', 'success');

    } catch (error) {
      console.error('Erreur génération PDF:', error);
      this.isGeneratingPdf = false;
      this.showSnackbar('Erreur lors de la génération du PDF', 'error');
    }
  }, 50);
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

 
}