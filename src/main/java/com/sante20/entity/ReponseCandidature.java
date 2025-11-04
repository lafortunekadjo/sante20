package com.sante20.entity;

import jakarta.persistence.*;

@Entity
public class ReponseCandidature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id")
    private DemandeIntegration demande; 

    // La question à laquelle l'utilisateur a répondu
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private QuestionCandidature question; 

    private String valeurReponse;
    
    // Getters, Setters, Constructors...


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public DemandeIntegration getDemande() {
        return demande;
    }

    public void setDemande(DemandeIntegration demande) {
        this.demande = demande;
    }

    public QuestionCandidature getQuestion() {
        return question;
    }

    public void setQuestion(QuestionCandidature question) {
        this.question = question;
    }

    public String getValeurReponse() {
        return valeurReponse;
    }

    public void setValeurReponse(String valeurReponse) {
        this.valeurReponse = valeurReponse;
    }

//    public ReponseCandidature(Long id, DemandeIntegration demande, QuestionCandidature question, String valeurReponse) {
//        this.id = id;
//        this.demande = demande;
//        this.question = question;
//        this.valeurReponse = valeurReponse;
//    }
//
//    public ReponseCandidature() {
//
//    }
}