package com.sante20.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "types_depenses")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TypeDepense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom; // Le nom du type de dépense (ex: Eau, Frais d'arbitrage)

    @Column(nullable = false)
    private boolean isGenerique; // Vrai si le type peut être utilisé par tous les groupes

    // La relation vers le groupe est optionnelle.
    // Elle est null pour les types de dépenses génériques.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id")
    @JsonIgnore
    private Groupe groupe;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public boolean isGenerique() {
        return isGenerique;
    }

    public void setGenerique(boolean generique) {
        isGenerique = generique;
    }

    public Groupe getGroupe() {
        return groupe;
    }

    public void setGroupe(Groupe groupe) {
        this.groupe = groupe;
    }
}