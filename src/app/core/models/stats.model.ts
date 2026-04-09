// src/app/modules/responsable/models/stats.model.ts
export interface StatMember {
  name: string;
  team: string;
  goals?: number;    // Pour topScorers
  assists?: number;  // Pour topAssists
  appearances?: number; // Pour topAttendance
}
// src/app/core/models/stats.model.ts - Mise à jour pour totalGoals
export interface Stats {
  // 👥 Membres
  memberCount: number;

  // 💰 Finances
  totalContributions: number;
  totalDues?: number;
  totalFines?: number;
  
  // 🔨 Sanctions détaillées
  paidSanctions: {
    amount: number;
    count: number;
  };
  unpaidSanctions: {
    amount: number;
    count: number;
  };
  sanctionsPercentage: number;

  // 📈 Données pour graphiques
  contributionsByMonth: Array<{
    month: string;
    amount: number;
    date?: Date;
  }>;

  // 🏆 Nouvelles métriques sportives
  totalMatches?: number;
  avgGoalsPerMatch?: number;          // Moyenne globale conservée
  activePlayers?: number;
  participationRate?: number;
  bestPerformingTeam?: string;
  bestTeamTotalGoals?: number;        // 🔧 CHANGÉ: totalGoals au lieu de avgGoals
  contributionCount?:number;
  
  // 🏅 Comparaison des équipes
  teamComparison?: Array<{
    teamName: string;
    totalGoals: number;               // 🔧 CHANGÉ: totalGoals au lieu de avgGoals
    playersCount: number;
    played: number;
  }>;

  // 🏆 Classements individuels
  topScorers: Array<{
    name: string;
    team: string;
    goals: number;
  }>;
  
  topAssists: Array<{
    name: string;
    team: string;
    assists: number;
  }>;
  
  topAttendance: Array<{
    name: string;
    team: string;
    appearances: number;
  }>;

  // 🏈 Matchs à venir
  upcomingMatches: Array<{
    date: Date;
    opponent: string;
    location?: string;
  }>;

  // Autres propriétés existantes
  totalSanction?: any;
  totalGoal?:number;
}
export interface Sanctions {
  paid: { amount: number; count: number };
  unpaid: { amount: number; count: number };
  yellowCards: number;
  redCards: number;
}

export interface RecentMatch {
  date: string;
  opponent: string;
}

export interface PassesByMatch {
  date: string;
  passes: number;
  match: string;
}

export interface MemberStats {
  matchesPlayed: number;
  topScorers: StatMember[];
  topAttendance: StatMember[];
  successfulPasses: number;
  recentMatches: RecentMatch[];
  topAssists: StatMember[];
  passesByMatch: PassesByMatch[];
  totalPasses: number;
  goalsScored: number;
  sanctions: Sanctions;
  totalPlayingTime: number;

    // Nouvelles propriétés pour les stats mensuelles
  monthlyStats: MonthlyStats | null;
  availableMonths: Array<{ value: string; label: string }>; // Liste des mois disponibles
}

// Interface pour les statistiques mensuelles d'une équipe
export interface MonthlyTeamStats {
  teamName: string;
  wins: number;
  losses: number;
  draws: number;
  goalsScored: number;
  goalsConceded: number;
  matchesPlayed: number;
  winRate: number;
}

// Interface pour le meilleur joueur du mois
export interface MonthlyPlayerStats {
  playerName: string;
  teamName: string;
  goals: number;
  assists: number;
  appearances: number;
  manOfTheMatchCount: number;
}

// Interface pour les stats mensuelles globales
export interface MonthlyStats {
  month: string; // Format: "YYYY-MM"
  monthLabel: string; // Format: "Janvier 2025"
  bestTeam: MonthlyTeamStats;
  topScorer: MonthlyPlayerStats;
  topAssister: MonthlyPlayerStats;
  mostAppearances: MonthlyPlayerStats;
  mostManOfTheMatch: MonthlyPlayerStats;
}

