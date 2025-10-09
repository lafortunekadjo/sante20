// src/app/modules/responsable/models/stats.model.ts
export interface StatMember {
  name: string;
  team: string;
  goals?: number;    // Pour topScorers
  assists?: number;  // Pour topAssists
  appearances?: number; // Pour topAttendance
}

export interface Stats {
  memberCount: number;
  totalContributions: number;
  paidSanctions: { amount: number; count: number };
  unpaidSanctions: { amount: number; count: number };
  sanctionsPercentage: number;
  contributionsByMonth: { month: string; amount: number; date: Date | null }[];
  upcomingMatches: { date: Date; opponent: string }[];
  topScorers: StatMember[];
  topAssists: StatMember[];
  topAttendance: StatMember[];
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
  monthlyStats?: MonthlyStats;
  availableMonths?: Array<{ value: string; label: string }>; // Liste des mois disponibles
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

