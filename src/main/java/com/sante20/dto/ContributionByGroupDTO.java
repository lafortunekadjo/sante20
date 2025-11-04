package com.sante20.dto;

import java.time.LocalDate;

public class ContributionByGroupDTO {
    private String groupName;
    private Double amount;
    private LocalDate date;

    public ContributionByGroupDTO(String groupName, Double amount, LocalDate date) {
        this.groupName = groupName;
        this.amount = amount;
        this.date = date;
    }

    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}