package com.sante20.dto;

import com.sante20.entity.TypeChamp;

import java.util.List;

public class QuestionCreationDTO {
    
    private String texteQuestion;

    // Utilise l'énumération TypeChamp de votre modèle d'entité
    private TypeChamp typeChamp;
    
    // Utilisé uniquement si typeChamp est CHOIX_UNIQUE
    private List<String> optionsChoix; 

    private Integer ordreAffichage;
    
    // Getters, Setters, Constructors...


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

    public List<String> getOptionsChoix() {
        return optionsChoix;
    }

    public void setOptionsChoix(List<String> optionsChoix) {
        this.optionsChoix = optionsChoix;
    }

    public Integer getOrdreAffichage() {
        return ordreAffichage;
    }

    public void setOrdreAffichage(Integer ordreAffichage) {
        this.ordreAffichage = ordreAffichage;
    }
}