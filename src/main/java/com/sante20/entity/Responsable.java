package com.sante20.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Responsable extends Auditable<String>{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;

    @Enumerated(EnumType.STRING)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "groupe_id")
    private Groupe groupe;

    public enum Role {
        PRESIDENT, SECRETAIRE, TRESORIER
    }
}