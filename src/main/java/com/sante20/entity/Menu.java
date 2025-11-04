// src/main/java/com/sante20/entity/Menu.java

package com.sante20.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "menus")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Menu {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // Ex: DASHBOARD, MEMBRES, FINANCES, MATCHS, EQUIPEMENTS

    @Column(nullable = false)
    private String label; // Label affiché (ex: "Tableau de bord")

    @Column(nullable = false)
    private String icone; // Icône Material (ex: "dashboard")

    @Column(nullable = false)
    private String route; // Route Angular (ex: "/responsable/dashboard")

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Integer ordre = 0; // Ordre d'affichage

    @Column(nullable = false)
    private Boolean actif = true;

    @Column(nullable = false)
    private String categorie; // GESTION, SPORT, FINANCES, COMMUNICATION

    // Les rôles qui peuvent accéder à ce menu
    @ManyToMany(mappedBy = "menus")
    @JsonIgnore
    private Set<RoleCustom> rolesCustom = new HashSet<>();
}