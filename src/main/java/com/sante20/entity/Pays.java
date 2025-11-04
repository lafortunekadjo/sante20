package com.sante20.entity;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "pays")
public class Pays extends Auditable<String>{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;

    @OneToMany(mappedBy = "pays")
    private List<Ville> villes;

    // Getters, Setters, Constructors
}