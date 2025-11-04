package com.sante20.dto;

import java.util.Map;

public class UserStatistics {

    private int groupCount;
    private int userCount;
    private Map<String, Integer> roleDistribution;
    private double totalContributions;
    private int totalCartons;

    // Constructors
    public UserStatistics() {
    }

    public UserStatistics(int groupCount, int userCount, Map<String, Integer> roleDistribution,
                          double totalContributions, int totalCartons) {
        this.groupCount = groupCount;
        this.userCount = userCount;
        this.roleDistribution = roleDistribution;
        this.totalContributions = totalContributions;
        this.totalCartons = totalCartons;
    }

    // Getters and Setters
    public int getGroupCount() {
        return groupCount;
    }

    public void setGroupCount(int groupCount) {
        this.groupCount = groupCount;
    }

    public int getUserCount() {
        return userCount;
    }

    public void setUserCount(int userCount) {
        this.userCount = userCount;
    }

    public Map<String, Integer> getRoleDistribution() {
        return roleDistribution;
    }

    public void setRoleDistribution(Map<String, Integer> roleDistribution) {
        this.roleDistribution = roleDistribution;
    }

    public double getTotalContributions() {
        return totalContributions;
    }

    public void setTotalContributions(double totalContributions) {
        this.totalContributions = totalContributions;
    }

    public int getTotalCartons() {
        return totalCartons;
    }

    public void setTotalCartons(int totalCartons) {
        this.totalCartons = totalCartons;
    }

    @Override
    public String toString() {
        return "UserStatistics{" +
               "groupCount=" + groupCount +
               ", userCount=" + userCount +
               ", roleDistribution=" + roleDistribution +
               ", totalContributions=" + totalContributions +
               ", totalCartons=" + totalCartons +
               '}';
    }
}