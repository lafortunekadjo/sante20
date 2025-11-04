package com.sante20.dto;

public class ReponseDTO {
    
    // L'ID de la QuestionCandidature à laquelle l'utilisateur répond
    private Long questionId;
    private QuestionCreationDTO question;
    
    // La valeur de la réponse fournie (le texte, le nombre, l'option sélectionnée, etc.)
    private String valeur;
    
    // Constructeurs, Getters et Setters
    
    public ReponseDTO() {}

    public ReponseDTO(Long questionId, String valeur) {
        this.questionId = questionId;
        this.valeur = valeur;
    }

    // Getters
    public Long getQuestionId() {
        return questionId;
    }

    public String getValeur() {
        return valeur;
    }

    // Setters
    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public void setValeur(String valeur) {
        this.valeur = valeur;
    }

    public QuestionCreationDTO getQuestion() {
        return question;
    }

    public void setQuestion(QuestionCreationDTO question) {
        this.question = question;
    }
}