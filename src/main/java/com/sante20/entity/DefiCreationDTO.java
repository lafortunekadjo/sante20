package com.sante20.entity;

import java.time.LocalDateTime;

public class DefiCreationDTO {
    
    private Long groupeCibleId;
    private LocalDateTime dateProposee;
    private String lieuPropose;
    private String descriptionMessage;
    
    // Getters, Setters, Constructors...


    public Long getGroupeCibleId() {
        return groupeCibleId;
    }

    public void setGroupeCibleId(Long groupeCibleId) {
        this.groupeCibleId = groupeCibleId;
    }

    public LocalDateTime getDateProposee() {
        return dateProposee;
    }

    public void setDateProposee(LocalDateTime dateProposee) {
        this.dateProposee = dateProposee;
    }

    public String getLieuPropose() {
        return lieuPropose;
    }

    public void setLieuPropose(String lieuPropose) {
        this.lieuPropose = lieuPropose;
    }

    public String getDescriptionMessage() {
        return descriptionMessage;
    }

    public void setDescriptionMessage(String descriptionMessage) {
        this.descriptionMessage = descriptionMessage;
    }
}