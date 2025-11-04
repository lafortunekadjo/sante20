package com.sante20.dto;

// DTO principal pour les stats mensuelles
public class MonthlyStatsDTO {
    private String month;
    private String monthLabel;
    private MonthlyTeamStatsDTO bestTeam;
    private MonthlyPlayerStatsDTO topScorer;
    private MonthlyPlayerStatsDTO topAssister;
    private MonthlyPlayerStatsDTO mostAppearances;
    private MonthlyPlayerStatsDTO mostManOfTheMatch;

    // Constructeurs
    public MonthlyStatsDTO() {}

    // Getters et Setters
    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }

    public String getMonthLabel() { return monthLabel; }
    public void setMonthLabel(String monthLabel) { this.monthLabel = monthLabel; }

    public MonthlyTeamStatsDTO getBestTeam() { return bestTeam; }
    public void setBestTeam(MonthlyTeamStatsDTO bestTeam) { this.bestTeam = bestTeam; }

    public MonthlyPlayerStatsDTO getTopScorer() { return topScorer; }
    public void setTopScorer(MonthlyPlayerStatsDTO topScorer) { this.topScorer = topScorer; }

    public MonthlyPlayerStatsDTO getTopAssister() { return topAssister; }
    public void setTopAssister(MonthlyPlayerStatsDTO topAssister) { this.topAssister = topAssister; }

    public MonthlyPlayerStatsDTO getMostAppearances() { return mostAppearances; }
    public void setMostAppearances(MonthlyPlayerStatsDTO mostAppearances) { this.mostAppearances = mostAppearances; }

    public MonthlyPlayerStatsDTO getMostManOfTheMatch() { return mostManOfTheMatch; }
    public void setMostManOfTheMatch(MonthlyPlayerStatsDTO mostManOfTheMatch) { this.mostManOfTheMatch = mostManOfTheMatch; }
}