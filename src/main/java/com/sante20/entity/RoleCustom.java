// src/main/java/com/sante20/entity/RoleCustom.java

package com.sante20.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles_custom")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RoleCustom {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id", nullable = false)
    @JsonIgnore
    private Groupe groupe;

    @Column(nullable = false)
    private String nom; // Ex: Président, Trésorier, Secrétaire, Capitaine

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String couleur = "#1976d2"; // Couleur pour l'UI

    @Column(nullable = false)
    private String icone = "badge"; // Icône Material

    @Column(nullable = false)
    private Boolean actif = true;

    @Column(nullable = false)
    private Boolean systeme = false; // true si c'est un rôle système (non modifiable)

    @Column(nullable = false)
    private Integer niveau = 0; // Niveau hiérarchique (0 = plus élevé)

    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;

    // Menus accessibles par ce rôle
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "role_custom_menus",
        joinColumns = @JoinColumn(name = "role_custom_id"),
        inverseJoinColumns = @JoinColumn(name = "menu_id")
    )
    private Set<Menu> menus = new HashSet<>();

    // Membres ayant ce rôle
    @OneToMany(mappedBy = "roleCustom")
    @JsonIgnore
    private Set<Membre> membres = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        dateModification = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Groupe getGroupe() {
        return groupe;
    }

    public void setGroupe(Groupe groupe) {
        this.groupe = groupe;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCouleur() {
        return couleur;
    }

    public void setCouleur(String couleur) {
        this.couleur = couleur;
    }

    public String getIcone() {
        return icone;
    }

    public void setIcone(String icone) {
        this.icone = icone;
    }

    public Boolean getActif() {
        return actif;
    }

    public void setActif(Boolean actif) {
        this.actif = actif;
    }

    public Boolean getSysteme() {
        return systeme;
    }

    public void setSysteme(Boolean systeme) {
        this.systeme = systeme;
    }

    public Integer getNiveau() {
        return niveau;
    }

    public void setNiveau(Integer niveau) {
        this.niveau = niveau;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public LocalDateTime getDateModification() {
        return dateModification;
    }

    public void setDateModification(LocalDateTime dateModification) {
        this.dateModification = dateModification;
    }

    public Set<Menu> getMenus() {
        return menus;
    }

    public void setMenus(Set<Menu> menus) {
        this.menus = menus;
    }

    public Set<Membre> getMembres() {
        return membres;
    }

    public void setMembres(Set<Membre> membres) {
        this.membres = membres;
    }
}