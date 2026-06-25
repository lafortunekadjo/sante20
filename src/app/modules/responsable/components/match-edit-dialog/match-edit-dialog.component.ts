import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { Groupe } from '../../../../core/models/groupe.model';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { Match, SourceAdversaire } from '../../../../core/models/match.model';
import { Membre } from '../../../../core/models/membre.model';
;

export interface MatchEditDialogData {
  match: Match;
  membres: Membre[];
  equipes: Equipe[];
  groupes: Groupe[];
  currentGroupe: Groupe | null;
}

@Component({
  selector: 'app-match-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatChipsModule,
    MatRadioModule,
    MatDividerModule
  ],
  templateUrl: './match-edit-dialog.component.html',
  styleUrl: './match-edit-dialog.component.scss'
})
export class MatchEditDialogComponent implements OnInit {
  activeTab = 0;
  editMatch: Partial<Match>;
  
  // IDs sélectionnés pour les relations
  selectedEquipe1Id: number | undefined = undefined;
  selectedEquipe2Id: number | undefined = undefined;
  selectedGroupeAdverseId: number | null = null;
  selectedArbitrePrincipalId?: number | null = null;
  selectedArbitreAssistantId?: number | null = null;
  selectedRapporteurId?: number | null = null;
  selectedSourceAdversaire: SourceAdversaire = 'MANUEL';
  selectedMembresAnniversaire: Membre[] = [];
  
  equipesForForfait: string[] = [];
  
  // Flag pour forcer le statut "joué"
  forceMarkAsPlayed: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<MatchEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MatchEditDialogData
  ) {
    this.editMatch = { ...data.match };
  }

  ngOnInit() {
    console.log('Match reçu:', this.data.match);
    console.log('Équipes disponibles:', this.data.equipes);
    console.log('Membres disponibles:', this.data.membres);
    
    this.initializeSelections();
    this.updateEquipesForForfait();
  }

  initializeSelections() {
    const match = this.data.match;
    console.log(match )
    this.selectedEquipe1Id = this.data.match?.equipe1?.id;
    this.selectedEquipe2Id = this.data.match?.equipe2?.id;
   this.selectedArbitrePrincipalId = this.editMatch?.arbitrePrincipal?.id
    this.selectedRapporteurId = this.editMatch?.rapporteur?.id
    this.selectedArbitreAssistantId =this.editMatch?.arbitreAssistant?.id
    
    console.log('Équipe 1 ID initialisé:', this.editMatch);
    console.log('Équipe 2 ID initialisé:', this.selectedEquipe2Id);
    
    // ===== ADVERSAIRE (AMICAL) =====
    this.selectedSourceAdversaire = match.sourceAdversaire || 'MANUEL';
    
    if (match.groupeAdverse) {
      if (typeof match.groupeAdverse === 'object' && match.groupeAdverse.id) {
        this.selectedGroupeAdverseId = match.groupeAdverse.id;
      } else if (typeof match.groupeAdverse === 'number') {
        this.selectedGroupeAdverseId = match.groupeAdverse;
      }
    } else if ((match as any).groupeAdverseId) {
      this.selectedGroupeAdverseId = (match as any).groupeAdverseId;
    }
   
    // ===== OFFICIELS =====
    // // Arbitre Principal
    // this.selectedArbitrePrincipalId = this.extractMemberId(match.arbitrePrincipal);
    // console.log('Arbitre Principal ID initialisé:', this.selectedArbitrePrincipalId);
    
    // // Arbitre Assistant
    // this.selectedArbitreAssistantId = this.extractMemberId(match.arbitreAssistant);
    // console.log('Arbitre Assistant ID initialisé:', this.selectedArbitreAssistantId);
    
    // // Rapporteur
    // this.selectedRapporteurId = this.extractMemberId(match.rapporteur);
    // console.log('Rapporteur ID initialisé:', this.selectedRapporteurId);
    
    // ===== MEMBRES ANNIVERSAIRE =====
    if (match.membresAnniversaire && Array.isArray(match.membresAnniversaire)) {
      this.selectedMembresAnniversaire = [...match.membresAnniversaire];
    } else {
      this.selectedMembresAnniversaire = [];
    }
  }
  
  /**
   * Extrait l'ID d'un membre depuis différents formats possibles
   */
  private extractMemberId(membre: any): number | null {
    if (!membre) return null;
    
    // Si c'est un objet avec un ID
    if (typeof membre === 'object' && membre.id) {
      return membre.id;
    }
    
    // Si c'est directement un nombre
    if (typeof membre === 'number') {
      return membre;
    }
    
    // Si c'est une chaîne numérique
    if (typeof membre === 'string' && !isNaN(Number(membre))) {
      return Number(membre);
    }
    
    return null;
  }
  
  /**
   * Formate une date pour l'affichage
   */
  formatDate(date: string | undefined): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  }
  
  // ===== GETTERS POUR AFFICHAGE DES VALEURS ACTUELLES =====
  
  getEquipe1Name(): string {
    if (this.selectedEquipe1Id) {
      const equipe = this.data.equipes.find(e => e.id === this.selectedEquipe1Id);
      return equipe?.nom || '';
    }
    if (this.data.match.equipe1) {
      if (typeof this.data.match.equipe1 === 'object') {
        return this.data.match.equipe1.nom || '';
      }
    }
    return (this.data.match as any).equipe1Nom || '';
  }
  
  getEquipe2Name(): string {
    if (this.selectedEquipe2Id) {
      const equipe = this.data.equipes.find(e => e.id === this.selectedEquipe2Id);
      return equipe?.nom || '';
    }
    if (this.data.match.equipe2) {
      if (typeof this.data.match.equipe2 === 'object') {
        return this.data.match.equipe2.nom || '';
      }
    }
    return (this.data.match as any).equipe2Nom || '';
  }
  
  getCurrentAdversaire(): string {
    const match = this.data.match;
    if (match.groupeAdverse) {
      if (typeof match.groupeAdverse === 'object') {
        return match.groupeAdverse.nom || '';
      }
    }
    return match.nomAdversaireManuel ||  '';
  }
  
  getCurrentArbitrePrincipal(): string {
    return this.getOfficialName(
      this.data.match.arbitrePrincipal,
      this.data.match.arbitrePrincipalNomOccasionnel
    );
  }
  
  getCurrentArbitreAssistant(): string {
    return this.getOfficialName(
      this.data.match.arbitreAssistant,
      this.data.match.arbitreAssistantNomOccasionnel
    );
  }
  
  getCurrentRapporteur(): string {
    return this.getOfficialName(
      this.data.match.rapporteur,
      this.data.match.rapporteurNomOccasionnel
    );
  }
  
  private getOfficialName(membre: any, nomOccasionnel: string | null | undefined): string {
    if (nomOccasionnel) return nomOccasionnel;
    
    if (membre) {
      if (typeof membre === 'object' && membre.nom) {
        return `${membre.nom} ${membre.prenom || ''}`.trim();
      }
      if (typeof membre === 'number') {
        const found = this.data.membres.find(m => m.id === membre);
        if (found) return `${found.nom} ${found.prenom}`;
      }
    }
    
    return '';
  }

  // ===== TYPE & ICONS =====
  
  getTypeIcon(): string {
    switch (this.editMatch.typeMatch) {
      case 'INTERNE': return 'groups';
      case 'DUEL': return 'sports';
      case 'AMICAL': return 'handshake';
      case 'ANNIVERSAIRE': return 'cake';
      default: return 'sports_soccer';
    }
  }

  onTypeChange() {
    this.updateEquipesForForfait();
  }

  // ===== ÉQUIPES =====

  randomizeTeams() {
    if (this.data.equipes.length >= 2) {
      const shuffled = [...this.data.equipes].sort(() => Math.random() - 0.5);
      this.selectedEquipe1Id = shuffled[0].id;
      this.selectedEquipe2Id = shuffled[1].id;
      this.updateEquipesForForfait();
    }
  }

  onSourceChange() {
    this.editMatch.sourceAdversaire = this.selectedSourceAdversaire;
    this.updateEquipesForForfait();
  }

  updateEquipesForForfait() {
    const equipes: string[] = [];
    
    if (this.editMatch.typeMatch === 'AMICAL') {
      equipes.push(this.data.currentGroupe?.nom || 'Mon équipe');
      if (this.selectedSourceAdversaire === 'MANUEL' && this.editMatch.nomAdversaireManuel) {
        equipes.push(this.editMatch.nomAdversaireManuel);
      } else if (this.selectedSourceAdversaire === 'GROUPE_EXISTANT' && this.selectedGroupeAdverseId) {
        const groupe = this.data.groupes.find(g => g.id === this.selectedGroupeAdverseId);
        if (groupe) equipes.push(groupe.nom);
      }
    } else {
      if (this.selectedEquipe1Id) {
        const eq1 = this.data.equipes.find(e => e.id === this.selectedEquipe1Id);
        if (eq1) equipes.push(eq1.nom);
      }
      if (this.selectedEquipe2Id) {
        const eq2 = this.data.equipes.find(e => e.id === this.selectedEquipe2Id);
        if (eq2) equipes.push(eq2.nom);
      }
    }
    
    this.equipesForForfait = equipes;
  }

  onForfaitChange() {
    if (!this.editMatch.forfait) {
      this.editMatch.equipeForfait = '';
    }
  }

  // ===== MEMBRES ANNIVERSAIRE =====

  get availableMembres(): Membre[] {
    return this.data.membres.filter(m => 
      !this.selectedMembresAnniversaire.some(s => s.id === m.id)
    );
  }

  addMembreAnniversaire(membre: Membre) {
    if (membre && !this.selectedMembresAnniversaire.some(m => m.id === membre.id)) {
      this.selectedMembresAnniversaire.push(membre);
    }
  }

  removeMembreAnniversaire(membre: Membre) {
    this.selectedMembresAnniversaire = this.selectedMembresAnniversaire.filter(m => m.id !== membre.id);
  }

  // ===== STATUS =====

  isMatchDatePast(): boolean {
    if (!this.editMatch.dateMatch) return false;
    const matchDate = new Date(this.editMatch.dateMatch);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    matchDate.setHours(0, 0, 0, 0);
    return matchDate < today;
  }

  hasRapporteur(): boolean {
    return this.selectedRapporteurId !== null || 
           !!(this.editMatch.rapporteurNomOccasionnel?.trim());
  }

  hasScore(): boolean {
    const score1 = this.editMatch.scoreEquipe1;
    const score2 = this.editMatch.scoreEquipe2 ?? this.editMatch.scoreAdversaire;
    return (score1 !== undefined && score1 !== null) || 
           (score2 !== undefined && score2 !== null);
  }

  getStatusClass(): string {
    if (this.forceMarkAsPlayed) return 'status-played';
    if (!this.isMatchDatePast()) return 'status-future';
    if (this.hasRapporteur() || this.hasScore()) return 'status-played';
    return 'status-missed';
  }

  getStatusIcon(): string {
    const status = this.getStatusClass();
    switch (status) {
      case 'status-played': return 'check_circle';
      case 'status-missed': return 'warning';
      default: return 'schedule';
    }
  }

  getStatusLabel(): string {
    const status = this.getStatusClass();
    switch (status) {
      case 'status-played': return 'Match joué';
      case 'status-missed': return 'Match non validé';
      default: return 'Match à venir';
    }
  }

  getStatusDescription(): string {
    const status = this.getStatusClass();
    switch (status) {
      case 'status-played': return 'Ce match a été joué et validé.';
      case 'status-missed': return 'Ce match est passé mais aucun rapporteur n\'a été assigné.';
      default: return 'Ce match n\'a pas encore eu lieu.';
    }
  }

  markAsPlayed() {
    this.forceMarkAsPlayed = true;
  }

  // ===== VALIDATION =====

  isValid(): boolean {
    if (!this.editMatch.typeMatch || !this.editMatch.dateMatch) return false;

    switch (this.editMatch.typeMatch) {
      case 'INTERNE':
      case 'DUEL':
        return !!this.selectedEquipe1Id && !!this.selectedEquipe2Id &&
               this.selectedEquipe1Id !== this.selectedEquipe2Id;
      
      case 'AMICAL':
        if (this.selectedSourceAdversaire === 'GROUPE_EXISTANT') {
          return !!this.selectedGroupeAdverseId;
        }
        return !!this.editMatch.nomAdversaireManuel?.trim();
      
      case 'ANNIVERSAIRE':
        return this.selectedMembresAnniversaire.length > 0;
      
      default:
        return false;
    }
  }

  // ===== ACTIONS =====

  onCancel() {
    this.dialogRef.close(null);
  }

  onSave() {
    if (!this.isValid()) return;

    const payload: any = {
      id: this.editMatch.id,
      typeMatch: this.editMatch.typeMatch,
      dateMatch: this.editMatch.dateMatch,
      lieu: this.editMatch.lieu || null,
      commentaire: this.editMatch.commentaire || null,
      forfait: this.editMatch.forfait || false,
      equipeForfait: this.editMatch.forfait ? this.editMatch.equipeForfait : null,
      
      // Scores
      scoreEquipe1: this.editMatch.scoreEquipe1,
      scoreEquipe2: this.editMatch.scoreEquipe2,
      scoreAdversaire: this.editMatch.scoreAdversaire,
      
      // Officiels - envoyer les IDs
      arbitrePrincipalId: this.selectedArbitrePrincipalId,
      arbitrePrincipalNom: this.editMatch.arbitrePrincipalNomOccasionnel || null,
      arbitreAssistantId: this.selectedArbitreAssistantId,
      arbitreAssistantNom: this.editMatch.arbitreAssistantNomOccasionnel || null,
      rapporteurId: this.selectedRapporteurId,
      rapporteurNom: this.editMatch.rapporteurNomOccasionnel || null,
      
      // Flag pour forcer le statut
      forceMarkAsPlayed: this.forceMarkAsPlayed
    };

    // Selon le type
    if (this.editMatch.typeMatch === 'INTERNE' || this.editMatch.typeMatch === 'DUEL') {
      payload.equipe1Id = this.selectedEquipe1Id;
      payload.equipe2Id = this.selectedEquipe2Id;
    }

    if (this.editMatch.typeMatch === 'AMICAL') {
      payload.sourceAdversaire = this.selectedSourceAdversaire;
      if (this.selectedSourceAdversaire === 'GROUPE_EXISTANT') {
        payload.groupeAdverseId = this.selectedGroupeAdverseId;
        payload.adversaire = this.editMatch.groupeAdverse?.abreviation;
      } else {
        payload.nomAdversaireManuel = this.editMatch.nomAdversaireManuel;
      }
    }

    if (this.editMatch.typeMatch === 'ANNIVERSAIRE') {
      payload.membresAnniversaireIds = this.selectedMembresAnniversaire.map(m => m.id);
      payload.equipe1Id = this.selectedEquipe1Id;
      payload.equipe2Id = this.selectedEquipe2Id;
    }

    console.log('Payload à envoyer:', payload);
    this.dialogRef.close(payload);
  }
}