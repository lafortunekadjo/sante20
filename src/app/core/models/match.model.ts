// match.model.ts - Modèle amélioré

import { Groupe } from "./groupe.model";
import { Equipe } from "./groupe.model copy";
import { Membre } from "./membre.model";

export type TypeMatch = 'INTERNE' | 'DUEL' | 'AMICAL' | 'ANNIVERSAIRE';

export type SourceAdversaire = 'GROUPE_EXISTANT' | 'INVITATION' | 'MANUEL';

export interface Match {
  id: number;
  groupe: Groupe;
  typeMatch: TypeMatch;
  dateMatch: string;
  lieu?: string;
  commentaire?: string;
  
  // ===== ÉQUIPES INTERNES (INTERNE, DUEL, ANNIVERSAIRE) =====
  equipe1?: Equipe;           // Première équipe interne
  equipe2?: Equipe;           // Deuxième équipe interne
  
  // ===== ADVERSAIRE EXTERNE (AMICAL) =====
  sourceAdversaire?: SourceAdversaire;
  groupeAdverse?: Groupe;           // Si adversaire = groupe existant
  nomAdversaireManuel?: string;     // Si adversaire saisi manuellement
  invitationId?: number;            // Si adversaire via invitation
  
  // ===== ANNIVERSAIRE =====
  membresAnniversaire?: Membre[];   // Liste des membres fêtés (peut être multiple)
  
  // ===== SCORES =====
  scoreEquipe1?: number;
  scoreEquipe2?: number;
  scoreAdversaire?: number;         // Pour match amical
  
  // ===== FORFAIT =====
  forfait: boolean;
  equipeForfait?: string;
  
  // ===== OFFICIELS =====
  arbitrePrincipal?: Membre | null;
  arbitrePrincipalNomOccasionnel?: string | null;
  arbitreAssistant?: Membre | null;
  arbitreAssistantNomOccasionnel?: string | null;
  rapporteur?: Membre | null;
  rapporteurNomOccasionnel?: string | null;
  
  // ===== MÉDIAS =====
  mediaUrls?: string[];
}

// ===== DTOs pour la création/mise à jour =====

export interface CreateMatchDTO {
  typeMatch: TypeMatch;
  dateMatch: string;
  lieu?: string;
  commentaire?: string;
  
  // Pour INTERNE et DUEL
  equipe1Id?: number;
  equipe2Id?: number;
  
  // Pour AMICAL
  sourceAdversaire?: SourceAdversaire;
  groupeAdverseId?: number;
  nomAdversaireManuel?: string;
  
  // Pour ANNIVERSAIRE
  membresAnniversaireIds?: number[];
  
  // Officiels
  arbitrePrincipalId?: number;
  arbitrePrincipalNom?: string;
  arbitreAssistantId?: number;
  arbitreAssistantNom?: string;
  rapporteurId?: number;
  rapporteurNom?: string;
}

export interface UpdateMatchDTO extends CreateMatchDTO {
  scoreEquipe1?: number;
  scoreEquipe2?: number;
  scoreAdversaire?: number;
  forfait?: boolean;
  equipeForfait?: string;
}

// ===== Interface pour l'affichage =====

export interface MatchDisplay extends Match {
  // Computed properties
  titreMatch: string;           // Ex: "Jaune vs Rouge" ou "FC Lions vs AS Yaoundé"
  statutMatch: 'JOUE' | 'MANQUE' | 'A_VENIR';
  canEdit: boolean;
  canAccessPresences: boolean;
}

// ===== Helper functions =====

export function getMatchTitle(match: Match): string {
  switch (match.typeMatch) {
    case 'INTERNE':
    case 'DUEL':
      return `${match.equipe1?.nom || 'Équipe 1'} vs ${match.equipe2?.nom || 'Équipe 2'}`;
    
    case 'AMICAL':
      if (match.groupeAdverse) {
        return `${match.groupe.nom} vs ${match.groupeAdverse.nom}`;
      }
      return `${match.groupe.nom} vs ${match.nomAdversaireManuel || 'Adversaire'}`;
    
    case 'ANNIVERSAIRE':
      const fetes = match.membresAnniversaire?.map(m => m.prenom).join(', ') || '';
      return `Anniversaire de ${fetes}`;
    
    default:
      return 'Match';
  }
}

export function getEquipeNames(match: Match): [string, string] {
  switch (match.typeMatch) {
    case 'INTERNE':
    case 'DUEL':
      return [
        match.equipe1?.nom || 'Équipe 1',
        match.equipe2?.nom || 'Équipe 2'
      ];
    
    case 'AMICAL':
      return [
        match.groupe.abreviation || match.groupe.nom || 'Locale',
        match.groupeAdverse?.abreviation || match.nomAdversaireManuel || 'Adverse'
      ];
    
    case 'ANNIVERSAIRE':
      return ['Équipe Fêtés', 'Équipe Adverses'];
    
    default:
      return ['Équipe 1', 'Équipe 2'];
  }
}