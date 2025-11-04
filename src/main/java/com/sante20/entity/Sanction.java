package com.sante20.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "sanction")
public class Sanction extends Auditable<String>{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "membre_id")
    private Membre membre;

    @ManyToOne
    @JoinColumn(name = "type_sanction_id")
    private TypeSanction typeSanction;

    private LocalDate dateSanction;
    private Double montant;
    private String commentaire;

    @ManyToOne
    @JoinColumn(name = "match_id")
    private Match match;

    @Transient
    private Double totalPaiements;
    @Enumerated(EnumType.STRING)
    private EtatSanction etat;

    public enum EtatSanction {
        PAYEE, NON_PAYEE
    }

    public Sanction() {
        this.etat = EtatSanction.NON_PAYEE; // Par défaut, non payée
    }

    public Sanction(Membre membre, TypeSanction typeSanction, LocalDate dateSanction, Double montant, String commentaire, EtatSanction etat) {
        this.membre = membre;
        this.typeSanction = typeSanction;
        this.dateSanction = dateSanction;
        this.montant = montant;
        this.commentaire = commentaire;
        this.etat = EtatSanction.NON_PAYEE;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Membre getMembre() { return membre; }
    public void setMembre(Membre membre) { this.membre = membre; }
    public TypeSanction getTypeSanction() { return typeSanction; }
    public void setTypeSanction(TypeSanction typeSanction) { this.typeSanction = typeSanction; }
    public LocalDate getDateSanction() { return dateSanction; }
    public void setDateSanction(LocalDate dateSanction) { this.dateSanction = dateSanction; }
    public Double getMontant() { return montant; }
    public void setMontant(Double montant) { this.montant = montant; }
    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }

    public Match getMatch() {
        return match;
    }

    public void setMatch(Match match) {
        this.match = match;
    }

    public Double getTotalPaiements() {
        return totalPaiements;
    }

    public void setTotalPaiements(Double totalPaiements) {
        this.totalPaiements = totalPaiements;
    }

    public EtatSanction getEtat() {
        return etat;
    }

    public void setEtat(EtatSanction etat) {
        this.etat = etat;
    }
}