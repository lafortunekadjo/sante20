package com.sante20.service;


import com.sante20.dto.MonthlyPlayerStatsDTO;
import com.sante20.dto.MonthlyStatsDTO;
import com.sante20.dto.MonthlyTeamStatsDTO;
import com.sante20.entity.Match;
import com.sante20.entity.Membre;
import com.sante20.entity.Presence;
import com.sante20.repository.MatchRepository;
import com.sante20.repository.MembreRepository;
import com.sante20.repository.PresenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatsService {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private PresenceRepository presenceRepository;

    @Autowired
    private MembreRepository membreRepository;

    /**
     * Calculer les stats mensuelles
     */
    public MonthlyStatsDTO getMonthlyStats(String monthStr) {
        YearMonth yearMonth = YearMonth.parse(monthStr);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // Récupérer tous les matchs du mois
        List<Match> matches = matchRepository.findByDateMatchBetween(startDate, endDate);

        if (matches.isEmpty()) {
            return createEmptyMonthlyStats(monthStr);
        }

        // Calculer les stats par équipe
        Map<String, TeamMonthlyData> teamStats = calculateTeamStats(matches);

        // Trouver la meilleure équipe
        MonthlyTeamStatsDTO bestTeam = findBestTeam(teamStats, monthStr);

        // Calculer les stats des joueurs
        List<Presence> allPresences = presenceRepository.findByMatchIn(matches);

        MonthlyPlayerStatsDTO topScorer = findTopScorer(allPresences);
        MonthlyPlayerStatsDTO topAssister = findTopAssister(allPresences);
        MonthlyPlayerStatsDTO mostAppearances = findMostAppearances(allPresences);
        MonthlyPlayerStatsDTO mostManOfTheMatch = findMostManOfTheMatch(allPresences);

        MonthlyStatsDTO stats = new MonthlyStatsDTO();
        stats.setMonth(monthStr);
        stats.setMonthLabel(formatMonthLabel(yearMonth));
        stats.setBestTeam(bestTeam);
        stats.setTopScorer(topScorer);
        stats.setTopAssister(topAssister);
        stats.setMostAppearances(mostAppearances);
        stats.setMostManOfTheMatch(mostManOfTheMatch);

        return stats;
    }

    /**
     * Calculer les statistiques par équipe
     */
    private Map<String, TeamMonthlyData> calculateTeamStats(List<Match> matches) {
        Map<String, TeamMonthlyData> teamStats = new HashMap<>();

        for (Match match : matches) {
            // Récupérer les présences du match
            List<Presence> presences = presenceRepository.findByMatch(match);

            // Grouper par équipe (selon le nom d'équipe dans Presence)
            Map<String, List<Presence>> byTeam = presences.stream()
                    .filter(p -> p.getEquipeMatch() != null && !p.getEquipeMatch().isEmpty())
                    .collect(Collectors.groupingBy(Presence::getEquipeMatch));

            // 1. Parser les deux équipes participant au match à partir du champ 'adversaire'
            List<String> matchTeams = parseTeamsFromAdversaire(match.getAdversaire());

            // 2. Déterminer si un forfait a eu lieu et quelle est l'équipe gagnante par défaut
            String forfeitingTeamName = null;
            String winningTeamName = null;

            if (Boolean.TRUE.equals(match.getForfait()) && match.getEquipeForfait() != null) {
                forfeitingTeamName = match.getEquipeForfait().trim();

                // Déterminer l'équipe gagnante par forfait (l'adversaire)
                if (matchTeams.size() == 2) {
                    for (String team : matchTeams) {
                        if (!team.equalsIgnoreCase(forfeitingTeamName) && byTeam.containsKey(team)) {
                            winningTeamName = team;
                            break;
                        }
                    }
                }
            }


            for (Map.Entry<String, List<Presence>> entry : byTeam.entrySet()) {
                String teamName = entry.getKey();
                List<Presence> teamPresences = entry.getValue();

                TeamMonthlyData data = teamStats.computeIfAbsent(teamName, k -> new TeamMonthlyData(teamName));

                // 1. Calculer les buts réels de l'équipe (utilisés pour l'accumulation G-F/G-A et les stats joueur)
                int teamGoals = teamPresences.stream()
                        .mapToInt(p -> p.getButs() != 0 ? p.getButs() : 0)
                        .sum();

                // 2. Calculer les buts adverses réels
                int opposingGoals = calculateOpposingGoals(match, teamName, byTeam);

                // --- DÉTERMINATION DU RÉSULTAT POUR LE CLASSEMENT (WINS/LOSSES) ---
                int goalsForWL = teamGoals;
                int goalsAgainstWL = opposingGoals;

                if (forfeitingTeamName != null) {
                    if (teamName.equalsIgnoreCase(forfeitingTeamName)) {
                        // L'équipe a déclaré forfait : défaite garantie (0-1)
                        goalsForWL = 0;
                        goalsAgainstWL = 1;
                    } else if (teamName.equalsIgnoreCase(winningTeamName)) {
                        // L'équipe est gagnante par forfait : victoire garantie (1-0)
                        goalsForWL = 1;
                        goalsAgainstWL = 0;
                    }
                    // Si le match a été joué malgré le forfait, les buts réels sont déjà calculés.
                    // Si l'équipe n'est ni la perdante ni la gagnante par forfait, on utilise le score réel.
                    // Si winningTeamName est null, c'est que l'adversaire n'était pas une de nos équipes (match externe) ou problème de parsing, on laisse le score réel.
                }

                // 3. Ajouter le match :
                //    - Les buts réels (teamGoals, opposingGoals) sont utilisés pour l'accumulation G-F/G-A.
                //    - Les buts pour le classement (goalsForWL, goalsAgainstWL) sont utilisés pour le W/L/D.
                data.addMatch(teamGoals, opposingGoals, goalsForWL, goalsAgainstWL);
            }
        }

        return teamStats;
    }

    /**
     * Méthode utilitaire pour parser les deux équipes d'un match interne/amical
     * depuis la chaîne 'equipe1 vs equipe2'.
     */
    private List<String> parseTeamsFromAdversaire(String adversaire) {
        if (adversaire == null || adversaire.isEmpty()) {
            return Collections.emptyList();
        }
        // Utiliser " vs " comme séparateur
        String[] teams = adversaire.split(" vs ", 2);
        return Arrays.stream(teams)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * Calculer les buts adverses
     */
    private int calculateOpposingGoals(Match match, String teamName, Map<String, List<Presence>> byTeam) {
        int opposingGoals = 0;

        // Buts des autres équipes (pour les matchs internes/duels)
        for (Map.Entry<String, List<Presence>> entry : byTeam.entrySet()) {
            if (!entry.getKey().equals(teamName)) {
                opposingGoals += entry.getValue().stream()
                        .mapToInt(p -> p.getButs() != 0 ? p.getButs() : 0)
                        .sum();
            }
        }

        // Si match externe (pas INTERNE), ajouter le score adversaire
        if (match.getScoreAdversaire() != 0 && match.getTypeMatch() != Match.TypeMatch.INTERNE) {
            opposingGoals += match.getScoreAdversaire();
        }

        return opposingGoals;
    }

    /**
     * Trouver la meilleure équipe
     */
    private MonthlyTeamStatsDTO findBestTeam(Map<String, TeamMonthlyData> teamStats, String month) {
        if (teamStats.isEmpty()) {
            return createEmptyTeamStats(month);
        }

        TeamMonthlyData best = teamStats.values().stream()
                .max(Comparator.comparingInt(TeamMonthlyData::getWins)
                        .thenComparingDouble(TeamMonthlyData::getWinRate)
                        .thenComparingInt(TeamMonthlyData::getGoalsScored))
                .orElse(null);

        if (best == null) {
            return createEmptyTeamStats(month);
        }

        MonthlyTeamStatsDTO dto = new MonthlyTeamStatsDTO();
        dto.setTeamName(best.getTeamName());
        dto.setWins(best.getWins());
        dto.setLosses(best.getLosses());
        dto.setDraws(best.getDraws());
        dto.setGoalsScored(best.getGoalsScored());
        dto.setGoalsConceded(best.getGoalsConceded());
        dto.setMatchesPlayed(best.getMatchesPlayed());
        dto.setWinRate(best.getWinRate());

        return dto;
    }

    /**
     * Trouver le meilleur buteur
     */
    private MonthlyPlayerStatsDTO findTopScorer(List<Presence> presences) {
        Map<Membre, PlayerMonthlyData> playerStats = aggregatePlayerData(presences);

        return playerStats.entrySet().stream()
                .max(Comparator.comparingInt(e -> e.getValue().getGoals()))
                .map(e -> createPlayerStatsDTO(e.getKey(), e.getValue()))
                .orElse(createEmptyPlayerStats());
    }

    /**
     * Trouver le meilleur passeur
     */
    private MonthlyPlayerStatsDTO findTopAssister(List<Presence> presences) {
        Map<Membre, PlayerMonthlyData> playerStats = aggregatePlayerData(presences);

        return playerStats.entrySet().stream()
                .max(Comparator.comparingInt(e -> e.getValue().getAssists()))
                .map(e -> createPlayerStatsDTO(e.getKey(), e.getValue()))
                .orElse(createEmptyPlayerStats());
    }

    /**
     * Trouver le joueur avec le plus de présences
     */
    private MonthlyPlayerStatsDTO findMostAppearances(List<Presence> presences) {
        Map<Membre, PlayerMonthlyData> playerStats = aggregatePlayerData(presences);

        return playerStats.entrySet().stream()
                .max(Comparator.comparingInt(e -> e.getValue().getAppearances()))
                .map(e -> createPlayerStatsDTO(e.getKey(), e.getValue()))
                .orElse(createEmptyPlayerStats());
    }

    /**
     * Trouver le joueur avec le plus de titres d'homme du match
     */
    private MonthlyPlayerStatsDTO findMostManOfTheMatch(List<Presence> presences) {
        Map<Membre, PlayerMonthlyData> playerStats = aggregatePlayerData(presences);

        return playerStats.entrySet().stream()
                .max(Comparator.comparingInt(e -> e.getValue().getManOfTheMatchCount()))
                .map(e -> createPlayerStatsDTO(e.getKey(), e.getValue()))
                .orElse(createEmptyPlayerStats());
    }

    /**
     * Agréger les données des joueurs
     */
    private Map<Membre, PlayerMonthlyData> aggregatePlayerData(List<Presence> presences) {
        Map<Membre, PlayerMonthlyData> playerStats = new HashMap<>();

        for (Presence presence : presences) {
            if (presence.getMembre() == null || !presence.isAJoue()) {
                continue;
            }

            Membre membre = presence.getMembre();
            PlayerMonthlyData data = playerStats.computeIfAbsent(membre, k -> new PlayerMonthlyData());

            data.addGoals(presence.getButs() != 0 ? presence.getButs() : 0);
            data.addAssists(presence.getPasses() != 0 ? presence.getPasses() : 0);
            data.incrementAppearances();
            data.setTeamName(presence.getEquipeMatch());

            if (presence.isEstHommeDuMatch() || presence.isEstHommeDuMatchEq()) {
                data.incrementManOfTheMatch();
            }
        }

        return playerStats;
    }

    /**
     * Créer un DTO de stats joueur
     */
    private MonthlyPlayerStatsDTO createPlayerStatsDTO(Membre membre, PlayerMonthlyData data) {
        MonthlyPlayerStatsDTO dto = new MonthlyPlayerStatsDTO();
        dto.setPlayerName(membre.getNom() + " " + membre.getPrenom());
        dto.setTeamName(data.getTeamName());
        dto.setGoals(data.getGoals());
        dto.setAssists(data.getAssists());
        dto.setAppearances(data.getAppearances());
        dto.setManOfTheMatchCount(data.getManOfTheMatchCount());
        return dto;
    }

    /**
     * Récupérer les mois disponibles
     */
    public List<Map<String, String>> getAvailableMonths() {
        List<Match> allMatches = matchRepository.findAll();

        Set<YearMonth> months = allMatches.stream()
                .map(m -> YearMonth.from(m.getDateMatch()))
                .collect(Collectors.toSet());

        return months.stream()
                .sorted(Comparator.reverseOrder())
                .limit(12) // Derniers 12 mois
                .map(ym -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("value", ym.toString());
                    map.put("label", formatMonthLabel(ym));
                    return map;
                })
                .collect(Collectors.toList());
    }

    /**
     * Formater le label du mois
     */
    private String formatMonthLabel(YearMonth yearMonth) {
        String monthName = yearMonth.getMonth()
                .getDisplayName(TextStyle.FULL, Locale.FRENCH);
        return monthName.substring(0, 1).toUpperCase() + monthName.substring(1) + " " + yearMonth.getYear();
    }

    // Classes internes pour agréger les données
    private static class TeamMonthlyData {
        private String teamName;
        private int wins = 0;
        private int losses = 0;
        private int draws = 0;
        private int goalsScored = 0;
        private int goalsConceded = 0;
        private int matchesPlayed = 0;

        public TeamMonthlyData(String teamName) {
            this.teamName = teamName;
        }

        /**
         * Enregistre le résultat d'un match.
         * @param actualGoalsFor Buts réels (utilisés pour l'accumulation G-F/G-A).
         * @param actualGoalsAgainst Buts adverses réels (utilisés pour l'accumulation G-F/G-A).
         * @param resultGoalsFor Buts utilisés pour déterminer la victoire/défaite (peut être surchargé par forfait).
         * @param resultGoalsAgainst Buts adverses utilisés pour déterminer la victoire/défaite (peut être surchargé par forfait).
         */
        public void addMatch(int actualGoalsFor, int actualGoalsAgainst,
                             int resultGoalsFor, int resultGoalsAgainst) {
            matchesPlayed++;

            // 1. Accumulation des buts (utilise les buts réels du match joué)
            goalsScored += actualGoalsFor;
            goalsConceded += actualGoalsAgainst;

            // 2. Détermination du résultat (utilise les buts potentiellement surchargés par le forfait)
            if (resultGoalsFor > resultGoalsAgainst) {
                wins++;
            } else if (resultGoalsFor < resultGoalsAgainst) {
                losses++;
            } else {
                draws++;
            }
        }

        public double getWinRate() {
            return matchesPlayed > 0 ? (wins * 100.0) / matchesPlayed : 0;
        }

        // Getters
        public String getTeamName() { return teamName; }
        public int getWins() { return wins; }
        public int getLosses() { return losses; }
        public int getDraws() { return draws; }
        public int getGoalsScored() { return goalsScored; }
        public int getGoalsConceded() { return goalsConceded; }
        public int getMatchesPlayed() { return matchesPlayed; }
    }

    private static class PlayerMonthlyData {
        private int goals = 0;
        private int assists = 0;
        private int appearances = 0;
        private int manOfTheMatchCount = 0;
        private String teamName;

        public void addGoals(int goals) { this.goals += goals; }
        public void addAssists(int assists) { this.assists += assists; }
        public void incrementAppearances() { this.appearances++; }
        public void incrementManOfTheMatch() { this.manOfTheMatchCount++; }
        public void setTeamName(String teamName) { this.teamName = teamName; }

        public int getGoals() { return goals; }
        public int getAssists() { return assists; }
        public int getAppearances() { return appearances; }
        public int getManOfTheMatchCount() { return manOfTheMatchCount; }
        public String getTeamName() { return teamName; }
    }

    // Méthodes pour créer des stats vides
    private MonthlyStatsDTO createEmptyMonthlyStats(String month) {
        MonthlyStatsDTO stats = new MonthlyStatsDTO();
        stats.setMonth(month);
        stats.setMonthLabel(formatMonthLabel(YearMonth.parse(month)));
        stats.setBestTeam(createEmptyTeamStats(month));
        stats.setTopScorer(createEmptyPlayerStats());
        stats.setTopAssister(createEmptyPlayerStats());
        stats.setMostAppearances(createEmptyPlayerStats());
        stats.setMostManOfTheMatch(createEmptyPlayerStats());
        return stats;
    }

    private MonthlyTeamStatsDTO createEmptyTeamStats(String month) {
        MonthlyTeamStatsDTO dto = new MonthlyTeamStatsDTO();
        dto.setTeamName("Aucune équipe");
        dto.setWins(0);
        dto.setLosses(0);
        dto.setDraws(0);
        dto.setGoalsScored(0);
        dto.setGoalsConceded(0);
        dto.setMatchesPlayed(0);
        dto.setWinRate(0);
        return dto;
    }

    private MonthlyPlayerStatsDTO createEmptyPlayerStats() {
        MonthlyPlayerStatsDTO dto = new MonthlyPlayerStatsDTO();
        dto.setPlayerName("Aucun joueur");
        dto.setTeamName("-");
        dto.setGoals(0);
        dto.setAssists(0);
        dto.setAppearances(0);
        dto.setManOfTheMatchCount(0);
        return dto;
    }


}
