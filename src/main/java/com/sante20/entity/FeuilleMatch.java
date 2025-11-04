package com.sante20.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
public class FeuilleMatch extends Auditable<String>{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToMany
    private List<Membre> presents;

    @OneToMany(cascade = CascadeType.ALL)
    private List<Equipe> equipes;

    @ElementCollection
    private List<String> buteurs; // Simplifié, peut être une entité si besoin

    @ElementCollection
    private List<String> cartons; // Ex. "Membre1:jaune"
}