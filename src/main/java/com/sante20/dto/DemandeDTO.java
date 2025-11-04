package com.sante20.dto;

import java.util.List;

public class DemandeDTO {
    
    // Liste des ReponsesDTO (chaque élément représente une réponse à une question)
    private List<ReponseDTO> reponses;
    
    // Constructeur, Getters et Setters

    public DemandeDTO() {}

    public DemandeDTO(List<ReponseDTO> reponses) {
        this.reponses = reponses;
    }

    // Getter
    public List<ReponseDTO> getReponses() {
        return reponses;
    }

    // Setter
    public void setReponses(List<ReponseDTO> reponses) {
        this.reponses = reponses;
    }
}