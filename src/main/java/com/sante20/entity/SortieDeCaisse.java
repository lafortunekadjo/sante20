package com.sante20.entity;


import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "sorties_de_caisse")
public class SortieDeCaisse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Double montant;

    @Column(nullable = false)
    private LocalDate dateSortie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Membre utilisateur;
    
    // Nouvelle relation vers le type de dépense
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_depense_id", nullable = false)
    private TypeDepense typeDepense;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getMontant() {
        return montant;
    }

    public void setMontant(Double montant) {
        this.montant = montant;
    }

    public LocalDate getDateSortie() {
        return dateSortie;
    }

    public void setDateSortie(LocalDate dateSortie) {
        this.dateSortie = dateSortie;
    }

    public Membre getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(Membre utilisateur) {
        this.utilisateur = utilisateur;
    }

    public TypeDepense getTypeDepense() {
        return typeDepense;
    }

    public void setTypeDepense(TypeDepense typeDepense) {
        this.typeDepense = typeDepense;
    }
}
