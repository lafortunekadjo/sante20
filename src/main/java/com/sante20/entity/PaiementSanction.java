package com.sante20.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "paiement_sanction")
public class PaiementSanction extends Auditable<String>{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sanction_id")
    private Sanction sanction;

    private Double montant;
    private LocalDate datePaiement;
    private String commentaire;

    public PaiementSanction() {}
    public PaiementSanction(Sanction sanction, Double montant, LocalDate datePaiement, String commentaire) {
        this.sanction = sanction;
        this.montant = montant;
        this.datePaiement = datePaiement;
        this.commentaire = commentaire;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Sanction getSanction() { return sanction; }
    public void setSanction(Sanction sanction) { this.sanction = sanction; }
    public Double getMontant() { return montant; }
    public void setMontant(Double montant) { this.montant = montant; }
    public LocalDate getDatePaiement() { return datePaiement; }
    public void setDatePaiement(LocalDate datePaiement) { this.datePaiement = datePaiement; }
    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }
}