package com.sante20.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ERole name; // Utilisation d'une énumération pour les rôles

    public Role() {
    }

    public Role(ERole name) {
        this.name = name;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ERole getName() {
        return name;
    }

    public void setName(ERole name) {
        this.name = name;
    }

    // Énumération pour les rôles
    public enum ERole {
        ROLE_ADMIN,
        ROLE_RESPONSABLE,
        ROLE_MEMBRE,
        ROLE_CANDIDAT,
    }

}

