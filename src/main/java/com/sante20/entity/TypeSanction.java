package com.sante20.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "type_sanction")
public class TypeSanction extends Auditable<String>{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private String description;
    private Double montantParDefaut;
    private Integer duree;

    @Enumerated(EnumType.STRING)
    private Type type;

    public enum Type {
        AMENDE, SUSPENSION, DISCIPLINE
    }


    @ManyToOne
    @JoinColumn(name = "groupe_id")
    private Groupe groupe; // Un seul groupe, peut être null

    public TypeSanction() {}
    public TypeSanction(String nom, String description, Double montantParDefaut) {
        this.nom = nom;
        this.description = description;
        this.montantParDefaut = montantParDefaut;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getMontantParDefaut() { return montantParDefaut; }
    public void setMontantParDefaut(Double montantParDefaut) { this.montantParDefaut = montantParDefaut; }

    public Groupe getGroupe() {
        return groupe;
    }

    public void setGroupe(Groupe groupe) {
        this.groupe = groupe;
    }

    public Integer getDuree() {
        return duree;
    }

    public void setDuree(Integer duree) {
        this.duree = duree;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }
}