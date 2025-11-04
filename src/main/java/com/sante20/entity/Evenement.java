package com.sante20.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Entity
public class Evenement extends Auditable<String>{

    @Id
    @GeneratedValue
    private Long id;

    private String nomEvenement;
    private String description;

    private String typeEvenement; // "Heureux", "Malheureux", "Autre"

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateCreation;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateEvenement;


    private boolean estContributionOuverte;

    // Un événement est rattaché à un groupe
    @ManyToOne
    @JoinColumn(name = "id_groupe")
    private Groupe groupe;

    // Un événement peut être lié à un membre (ex: un anniversaire, un deuil)
    @ManyToOne
    @JoinColumn(name = "id_membre_lie") // nullable = true car ce n'est pas obligatoire
    private Membre membreLie;

    // Un événement peut avoir une contributions
    @OneToOne(mappedBy = "evenement", cascade = CascadeType.ALL)
    @JsonIgnore
    private Contribution contribution;

    // Getters and Setters
    // ...


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNomEvenement() {
        return nomEvenement;
    }

    public void setNomEvenement(String nomEvenement) {
        this.nomEvenement = nomEvenement;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTypeEvenement() {
        return typeEvenement;
    }

    public void setTypeEvenement(String typeEvenement) {
        this.typeEvenement = typeEvenement;
    }

    public Date getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(Date dateCreation) {
        this.dateCreation = dateCreation;
    }

    public boolean isEstContributionOuverte() {
        return estContributionOuverte;
    }

    public void setEstContributionOuverte(boolean estContributionOuverte) {
        this.estContributionOuverte = estContributionOuverte;
    }

    public Groupe getGroupe() {
        return groupe;
    }

    public void setGroupe(Groupe groupe) {
        this.groupe = groupe;
    }

    public Membre getMembreLie() {
        return membreLie;
    }

    public void setMembreLie(Membre membreLie) {
        this.membreLie = membreLie;
    }

    public Contribution getContribution() {
        return contribution;
    }

    public void setContribution(Contribution contribution) {
        this.contribution = contribution;
    }

    public LocalDate getDateEvenement() {
        return dateEvenement;
    }

    public void setDateEvenement(LocalDate dateEvenement) {
        this.dateEvenement = dateEvenement;
    }
}