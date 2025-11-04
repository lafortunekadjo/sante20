package com.sante20.entity;

import jakarta.persistence.*;

@Entity
public class QuestionCandidature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id")
    private Groupe groupe; // Le 2-0 auquel la question est rattachée

    private String texteQuestion;

    // Utilisation d'une énumération pour la clarté
    @Enumerated(EnumType.STRING)
    private TypeChamp typeChamp; 
    
    // Pour les questions à choix multiple (ex: "Attaquant;Milieu;Défenseur")
    private String optionsChoix; 

    private Integer ordreAffichage;
    
    // Getters, Setters, Constructors...


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

    public String getTexteQuestion() {
        return texteQuestion;
    }

    public void setTexteQuestion(String texteQuestion) {
        this.texteQuestion = texteQuestion;
    }

    public TypeChamp getTypeChamp() {
        return typeChamp;
    }

    public void setTypeChamp(TypeChamp typeChamp) {
        this.typeChamp = typeChamp;
    }

    public String getOptionsChoix() {
        return optionsChoix;
    }

    public void setOptionsChoix(String optionsChoix) {
        this.optionsChoix = optionsChoix;
    }

    public Integer getOrdreAffichage() {
        return ordreAffichage;
    }

    public void setOrdreAffichage(Integer ordreAffichage) {
        this.ordreAffichage = ordreAffichage;
    }
}

// Énumération pour définir le type de champ
