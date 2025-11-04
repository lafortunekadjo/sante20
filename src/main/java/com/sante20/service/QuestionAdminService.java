package com.sante20.service;

import com.sante20.dto.QuestionCreationDTO;
import com.sante20.entity.*;
import com.sante20.repository.GroupeRepository;
import com.sante20.repository.QuestionCandidatureRepository;
import com.sante20.repository.ReponseCandidatureRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionAdminService {

    @Autowired
    private QuestionCandidatureRepository questionRepo;
    @Autowired private GroupeRepository groupeService; // Pour récupérer l'entité Groupe

    @Autowired private ReponseCandidatureRepository reponseCandidatureRepository;

    /**
     * Crée une nouvelle question pour un groupe donné.
     * @param groupeId L'ID du 2-0.
     * @param questionDTO Le DTO contenant les détails de la question.
     * @return La question sauvegardée.
     */
    @Transactional
    public QuestionCandidature creerQuestion(Long groupeId, QuestionCreationDTO questionDTO) {
        Groupe groupe = groupeService.findById(groupeId).orElseThrow();
        
        QuestionCandidature question = new QuestionCandidature();
        question.setGroupe(groupe);
        question.setTexteQuestion(questionDTO.getTexteQuestion());
        question.setTypeChamp(questionDTO.getTypeChamp());
        
        // Gérer les options pour les choix multiples
        if (questionDTO.getTypeChamp() == TypeChamp.CHOIX_UNIQUE) {
            question.setOptionsChoix(String.join(";", questionDTO.getOptionsChoix()));
        } else {
            question.setOptionsChoix(null);
        }
        
        question.setOrdreAffichage(questionDTO.getOrdreAffichage());
        
        return questionRepo.save(question);
    }

    /**
     * Met à jour une question existante.
     * @param questionId L'ID de la question à modifier.
     * @param questionDTO Le DTO contenant les nouvelles valeurs.
     * @return La question mise à jour.
     */
    @Transactional
    public QuestionCandidature modifierQuestion(Long questionId, QuestionCreationDTO questionDTO) {
        QuestionCandidature question = questionRepo.findById(questionId)
            .orElseThrow(() -> new EntityNotFoundException("Question non trouvée avec ID: " + questionId));
        
        // Mise à jour des champs
        question.setTexteQuestion(questionDTO.getTexteQuestion());
        question.setTypeChamp(questionDTO.getTypeChamp());
        
        if (questionDTO.getTypeChamp() == TypeChamp.CHOIX_UNIQUE) {
            question.setOptionsChoix(String.join(";", questionDTO.getOptionsChoix()));
        } else {
            question.setOptionsChoix(null);
        }
        
        question.setOrdreAffichage(questionDTO.getOrdreAffichage());
        
        return questionRepo.save(question);
    }

    /**
     * Supprime une question du formulaire.
     * @param questionId L'ID de la question à supprimer.
     */
    public void supprimerQuestion(Long questionId) {
        // Important: Gérer les dépendances ! 
        // Si vous supprimez une question, vous devez décider si vous supprimez
        // les ReponseCandidature associées (cascade ou suppression manuelle).
        
        if (!questionRepo.existsById(questionId)) {
            throw new EntityNotFoundException("Question non trouvée avec ID: " + questionId);
        }
        
        // Supprimer toutes les réponses associées pour éviter les contraintes de clé étrangère
        // (Logique à implémenter dans ReponseCandidatureRepository et Service)
        
        questionRepo.deleteById(questionId);
    }
    
    /**
     * Récupère toutes les questions pour un groupe (pour affichage dans l'interface d'administration).
     * @param groupeId L'ID du 2-0.
     * @return Liste ordonnée des questions.
     */
    public List<QuestionCandidature> getQuestionsByGroupe(Long groupeId) {
        Groupe groupe = groupeService.findById(groupeId).orElseThrow();
        return questionRepo.findByGroupeOrderByOrdreAffichageAsc(groupe);
    }


}