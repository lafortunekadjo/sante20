package com.sante20.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "contribution")
public class Contribution extends Auditable<String>{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "membre_id")
    private Membre membre;

    private Double montant;
    private LocalDate dateContribution;
    private String commentaire;

    private Boolean isOpen = true;
    private Boolean isAdhesion = false;

    @Temporal(TemporalType.TIMESTAMP)
    private Date delaiContribution;

    private Double montantMin; // peut être null
    private Double montantCible; // peut être null
    private Double montantCollecteActuel;

    // Une contribution est rattachée à un événement
    @OneToOne
    @JoinColumn(name = "id_evenement") // C'est ici que se trouve la colonne de clé étrangère
    private Evenement evenement;

    // Une contribution a plusieurs contributions individuelles
    @OneToMany(mappedBy = "contribution", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<ContributionIndividuelle> contributionsIndividuelles;

    public Contribution() {}
    public Contribution(Membre membre, Double montant, LocalDate dateContribution, String commentaire) {
        this.membre = membre;
        this.montant = montant;
        this.dateContribution = dateContribution;
        this.commentaire = commentaire;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Membre getMembre() { return membre; }
    public void setMembre(Membre membre) { this.membre = membre; }
    public Double getMontant() { return montant; }
    public void setMontant(Double montant) { this.montant = montant; }
    public LocalDate getDateContribution() { return dateContribution; }
    public void setDateContribution(LocalDate dateContribution) { this.dateContribution = dateContribution; }
    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }

    public Date getDelaiContribution() {
        return delaiContribution;
    }

    public void setDelaiContribution(Date delaiContribution) {
        this.delaiContribution = delaiContribution;
    }

    public Double getMontantMin() {
        return montantMin;
    }

    public void setMontantMin(Double montantMin) {
        this.montantMin = montantMin;
    }

    public Double getMontantCible() {
        return montantCible;
    }

    public void setMontantCible(Double montantCible) {
        this.montantCible = montantCible;
    }

    public Double getMontantCollecteActuel() {
        return montantCollecteActuel;
    }

    public void setMontantCollecteActuel(Double montantCollecteActuel) {
        this.montantCollecteActuel = montantCollecteActuel;
    }

    public Evenement getEvenement() {
        return evenement;
    }

    public void setEvenement(Evenement evenement) {
        this.evenement = evenement;
    }

    public List<ContributionIndividuelle> getContributionsIndividuelles() {
        return contributionsIndividuelles;
    }

    public void setContributionsIndividuelles(List<ContributionIndividuelle> contributionsIndividuelles) {
        this.contributionsIndividuelles = contributionsIndividuelles;
    }

    public Boolean getOpen() {
        return isOpen;
    }

    public void setOpen(Boolean open) {
        isOpen = open;
    }

    public Boolean getAhdhesion() {
        return isAdhesion;
    }

    public void setAhdhesion(Boolean ahdhesion) {
        isAdhesion = ahdhesion;
    }
}