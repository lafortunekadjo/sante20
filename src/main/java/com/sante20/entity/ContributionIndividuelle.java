package com.sante20.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
public class ContributionIndividuelle extends Auditable<String>{

    @Id
    @GeneratedValue
    private Long id;

    private Double montant;

    private LocalDate dateContribution;

    // Une contribution individuelle est liée à une contribution (la campagne)
    @ManyToOne
    @JoinColumn(name = "id_contribution")
    private Contribution contribution;

    // Une contribution individuelle est faite par un membre
    @ManyToOne
    @JoinColumn(name = "id_membre")
    private Membre membre;

    // Getters and Setters
    // ...


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getMontant() {
        return montant;
    }

    public void setMontant(Double montant) {
        this.montant = montant;
    }

    public LocalDate getDateContribution() {
        return dateContribution;
    }

    public void setDateContribution(LocalDate dateContribution) {
        this.dateContribution = dateContribution;
    }

    public Contribution getContribution() {
        return contribution;
    }

    public void setContribution(Contribution contribution) {
        this.contribution = contribution;
    }

    public Membre getMembre() {
        return membre;
    }

    public void setMembre(Membre membre) {
        this.membre = membre;
    }
}