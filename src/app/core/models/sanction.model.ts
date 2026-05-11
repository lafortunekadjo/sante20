import { Membre } from './membre.model';
import { Match } from './match.model';

export interface TypeSanction {
  id: number;
  nom: string;
  description?: string;
  montantParDefaut: number;
  duree?: number;
  type: 'AMENDE' | 'SUSPENSION' | 'DISCIPLINE' | 'MATERIEL';
  materiel: string;
  quantite:number;
  groupe?: any;
  // Nouveaux champs pour liaison financière
  caisseId?: number;
  caisse?: any;
  typeContributionId?: number;
  genererMouvementAuto: boolean;
  icone: string;
  couleur: string;
  actif: boolean;
  createdDate?: string;
}

export interface Sanction {
  id: number;
  membre: number | Membre;
  typeSanction: number | TypeSanction;
  dateSanction: string | Date;
  montant: number;
  commentaire?: string;
  match?: number | Match;
  
  // États de paiement
  etat: 'PAYEE' | 'NON_PAYEE' | 'PARTIELLE';
  montantPaye: number;
  
  // Exercice
  exerciceId?: number;
  exercice?: any;
  
  // Dates
  dateDernierPaiement?: string;
  dateEcheance?: string;
  
  // Report
  reportable?: boolean;
  reportee?: boolean;
  exerciceOrigineId?: number;
  
  // Paiements
  paiements?: PaiementSanction[];
  
  // Audit
  createdDate?: string;
  lastModifiedDate?: string;
}

export interface PaiementSanction {
  id?: number;
  sanctionId: number;
  sanction?: Sanction;
  mouvementCaisseId?: number;
  mouvementCaisse?: any;
  montant: number;
  datePaiement: string;
  dateEnregistrement?: string;
  modePaiement: 'ESPECES' | 'MOBILE_MONEY' | 'VIREMENT' | 'CHEQUE' | 'AUTRE';
  reference?: string;
  commentaire?: string;
  enregistreParId?: number;
  enregistrePar?: Membre;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'ANNULE';
}

// Interface pour les statistiques de sanctions
export interface SanctionStats {
  total: number;
  payees: number;
  partielles: number;
  nonPayees: number;
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  tauxRecouvrement: number;
  parType: { type: string; count: number; montant: number }[];
  parMembre: { 
    membre: Membre; 
    count: number; 
    montant: number; 
    paye: number;
    restant: number;
  }[];
}

// Interface pour les sanctions groupées par membre
export interface GroupedSanction {
  membre: Membre;
  sanctions: Sanction[];
  totalMontant: number;
  totalPaye: number;
  totalRestant: number;
  countPayees: number;
  countPartielles: number;
  countNonPayees: number;
  expanded: boolean;
}

// Helpers pour les sanctions
export class SanctionHelpers {
  
  static calculerResteAPayer(sanction: Sanction): number {
    const montant = sanction.montant || 0;
    const paye = sanction.montantPaye || 0;
    return Math.max(0, montant - paye);
  }

  static calculerPourcentagePaye(sanction: Sanction): number {
    if (!sanction.montant || sanction.montant <= 0) return 100;
    const paye = sanction.montantPaye || 0;
    return Math.min(100, (paye / sanction.montant) * 100);
  }

  static isEntierementPayee(sanction: Sanction): boolean {
    return SanctionHelpers.calculerResteAPayer(sanction) <= 0;
  }

  static isPartielle(sanction: Sanction): boolean {
    const paye = sanction.montantPaye || 0;
    const montant = sanction.montant || 0;
    return paye > 0 && paye < montant;
  }

  static getEtatCalcule(sanction: Sanction): 'PAYEE' | 'PARTIELLE' | 'NON_PAYEE' {
    if (SanctionHelpers.isEntierementPayee(sanction)) return 'PAYEE';
    if (SanctionHelpers.isPartielle(sanction)) return 'PARTIELLE';
    return 'NON_PAYEE';
  }

  static getEtatClass(sanction: Sanction): string {
    const etat = sanction.etat || SanctionHelpers.getEtatCalcule(sanction);
    switch (etat) {
      case 'PAYEE': return 'status-paid';
      case 'PARTIELLE': return 'status-partial';
      default: return 'status-unpaid';
    }
  }

  static getEtatLabel(sanction: Sanction): string {
    const etat = sanction.etat || SanctionHelpers.getEtatCalcule(sanction);
    switch (etat) {
      case 'PAYEE': return 'Payée';
      case 'PARTIELLE': 
        const pct = Math.round(SanctionHelpers.calculerPourcentagePaye(sanction));
        return `Partielle (${pct}%)`;
      default: return 'Non payée';
    }
  }

  static getEtatIcon(sanction: Sanction): string {
    const etat = sanction.etat || SanctionHelpers.getEtatCalcule(sanction);
    switch (etat) {
      case 'PAYEE': return 'check_circle';
      case 'PARTIELLE': return 'timelapse';
      default: return 'schedule';
    }
  }

  static isEnRetard(sanction: Sanction): boolean {
    if (!sanction.dateEcheance) return false;
    if (sanction.etat === 'PAYEE') return false;
    const echeance = new Date(sanction.dateEcheance);
    return new Date() > echeance;
  }

  static formatMontant(montant: number | undefined): string {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  // Grouper les sanctions par membre
  static groupByMembre(sanctions: Sanction[], membres: Membre[]): GroupedSanction[] {
    const grouped = new Map<number, GroupedSanction>();

    sanctions.forEach(sanction => {
      const membreId = typeof sanction.membre === 'object' 
        ? sanction.membre.id 
        : sanction.membre;
      
      if (!membreId) return;

      if (!grouped.has(membreId)) {
        const membre = typeof sanction.membre === 'object'
          ? sanction.membre
          : membres.find(m => m.id === membreId);

        if (!membre) return;

        grouped.set(membreId, {
          membre: membre as Membre,
          sanctions: [],
          totalMontant: 0,
          totalPaye: 0,
          totalRestant: 0,
          countPayees: 0,
          countPartielles: 0,
          countNonPayees: 0,
          expanded: false
        });
      }

      const group = grouped.get(membreId)!;
      group.sanctions.push(sanction);
      group.totalMontant += sanction.montant || 0;
      group.totalPaye += sanction.montantPaye || 0;
      group.totalRestant += SanctionHelpers.calculerResteAPayer(sanction);

      const etat = sanction.etat || SanctionHelpers.getEtatCalcule(sanction);
      if (etat === 'PAYEE') group.countPayees++;
      else if (etat === 'PARTIELLE') group.countPartielles++;
      else group.countNonPayees++;
    });

    return Array.from(grouped.values())
      .sort((a, b) => b.totalRestant - a.totalRestant);
  }

  // Calculer les statistiques globales
  static calculerStats(sanctions: Sanction[], membres: Membre[]): SanctionStats {
    const stats: SanctionStats = {
      total: sanctions.length,
      payees: 0,
      partielles: 0,
      nonPayees: 0,
      montantTotal: 0,
      montantPaye: 0,
      montantRestant: 0,
      tauxRecouvrement: 0,
      parType: [],
      parMembre: []
    };

    const typeMap = new Map<string, { count: number; montant: number }>();

    sanctions.forEach(sanction => {
      stats.montantTotal += sanction.montant || 0;
      stats.montantPaye += sanction.montantPaye || 0;

      const etat = sanction.etat || SanctionHelpers.getEtatCalcule(sanction);
      if (etat === 'PAYEE') stats.payees++;
      else if (etat === 'PARTIELLE') stats.partielles++;
      else stats.nonPayees++;

      // Par type
      const typeName = typeof sanction.typeSanction === 'object'
        ? sanction.typeSanction.nom
        : 'Inconnu';
      
      if (!typeMap.has(typeName)) {
        typeMap.set(typeName, { count: 0, montant: 0 });
      }
      const typeStats = typeMap.get(typeName)!;
      typeStats.count++;
      typeStats.montant += sanction.montant || 0;
    });

    stats.montantRestant = stats.montantTotal - stats.montantPaye;
    stats.tauxRecouvrement = stats.montantTotal > 0 
      ? (stats.montantPaye / stats.montantTotal) * 100 
      : 0;

    stats.parType = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      montant: data.montant
    }));

    // Par membre
    const grouped = SanctionHelpers.groupByMembre(sanctions, membres);
    stats.parMembre = grouped.map(g => ({
      membre: g.membre,
      count: g.sanctions.length,
      montant: g.totalMontant,
      paye: g.totalPaye,
      restant: g.totalRestant
    }));

    return stats;
  }
}