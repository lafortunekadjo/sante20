package com.sante20.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class DefiMatchAmical {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Le 2-0 qui lance le défi
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_demandeur_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // ✅ Ajout
    private Groupe groupeDemandeur; 

    // Le 2-0 ciblé par le défi
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_cible_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // ✅ Ajout
    private Groupe groupeCible; 

    // Détails de la proposition
    private LocalDateTime dateProposee;
    private String lieuPropose;
    private String descriptionMessage; // Ex: "Match de 90 min, frais d'arbitrage partagés."

    // Statut du défi (EN_ATTENTE, ACCEPTE, REFUSE, REPORTE)
    @Enumerated(EnumType.STRING)
    private StatutDefi statut = StatutDefi.EN_ATTENTE; 

    private LocalDateTime dateLancement = LocalDateTime.now();
    
    // Getters, Setters, Constructors...


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Groupe getGroupeDemandeur() {
        return groupeDemandeur;
    }

    public void setGroupeDemandeur(Groupe groupeDemandeur) {
        this.groupeDemandeur = groupeDemandeur;
    }

    public Groupe getGroupeCible() {
        return groupeCible;
    }

    public void setGroupeCible(Groupe groupeCible) {
        this.groupeCible = groupeCible;
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

    public StatutDefi getStatut() {
        return statut;
    }

    public void setStatut(StatutDefi statut) {
        this.statut = statut;
    }

    public LocalDateTime getDateLancement() {
        return dateLancement;
    }

    public void setDateLancement(LocalDateTime dateLancement) {
        this.dateLancement = dateLancement;
    }
}

