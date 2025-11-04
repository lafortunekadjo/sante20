package com.sante20.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class DemandeIntegration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // L'utilisateur (CANDIDAT) qui fait la demande
    @OneToOne
    @JoinColumn(name = "user_id")
    private User candidat; 

    // Le 2-0 ciblé
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_cible_id")
    @JsonIgnore
    private Groupe groupeCible; 

    // Statut (EN_ATTENTE, ACCEPTEE, REFUSEE)
    @Enumerated(EnumType.STRING)
    private StatutDemande statut = StatutDemande.EN_ATTENTE; 

    private LocalDateTime dateDemande = LocalDateTime.now();

    // Getters, Setters, Constructors...


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getCandidat() {
        return candidat;
    }

    public void setCandidat(User candidat) {
        this.candidat = candidat;
    }

    public Groupe getGroupeCible() {
        return groupeCible;
    }

    public void setGroupeCible(Groupe groupeCible) {
        this.groupeCible = groupeCible;
    }

    public StatutDemande getStatut() {
        return statut;
    }

    public void setStatut(StatutDemande statut) {
        this.statut = statut;
    }

    public LocalDateTime getDateDemande() {
        return dateDemande;
    }

    public void setDateDemande(LocalDateTime dateDemande) {
        this.dateDemande = dateDemande;
    }
}

