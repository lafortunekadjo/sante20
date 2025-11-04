package com.sante20.dto;

// DTO pour les stats mensuelles d'un joueur
public class MonthlyPlayerStatsDTO {
    private String playerName;
    private String teamName;
    private int goals;
    private int assists;
    private int appearances;
    private int manOfTheMatchCount;

    // Constructeurs
    public MonthlyPlayerStatsDTO() {}

    // Getters et Setters
    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public int getGoals() { return goals; }
    public void setGoals(int goals) { this.goals = goals; }

    public int getAssists() { return assists; }
    public void setAssists(int assists) { this.assists = assists; }

    public int getAppearances() { return appearances; }
    public void setAppearances(int appearances) { this.appearances = appearances; }

    public int getManOfTheMatchCount() { return manOfTheMatchCount; }
    public void setManOfTheMatchCount(int manOfTheMatchCount) { this.manOfTheMatchCount = manOfTheMatchCount; }
}