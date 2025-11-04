package com.sante20.controller;


import com.sante20.dto.QuestionCreationDTO;
import com.sante20.entity.QuestionCandidature;
import com.sante20.service.QuestionAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groupes")
public class QuestionAdminController {

    @Autowired
    private QuestionAdminService questionAdminService;
    //@Autowired private SecurityService securityService; // Service de vérification des droits

    /**
     * Endpoint pour créer une nouvelle question.
     */
    @PostMapping("/{groupeId}/questions")
    // @PreAuthorize("hasRole('ADMIN') and @securityService.isAdminDuGroupe(#groupeId)")
    public ResponseEntity<QuestionCandidature> creerQuestion(
            @PathVariable Long groupeId,
            @RequestBody QuestionCreationDTO questionDTO) {
        
        // La vérification de sécurité doit garantir que l'utilisateur est admin du groupeId
        QuestionCandidature nouvelleQuestion = questionAdminService.creerQuestion(groupeId, questionDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(nouvelleQuestion);
    }

    /**
     * Endpoint pour récupérer la liste des questions (pour l'administration).
     */
    @GetMapping("/questions")
    // @PreAuthorize("hasRole('ADMIN') and @securityService.isAdminDuGroupe(#groupeId)")
    public List<QuestionCandidature> listerQuestions(@PathVariable Long groupeId) {
        return questionAdminService.getQuestionsByGroupe(groupeId);
    }

    /**
     * Endpoint pour mettre à jour une question existante.
     */
    @PutMapping("/question/{questionId}")
    // @PreAuthorize("hasRole('ADMIN') and @securityService.isAdminDuGroupeDeQuestion(#questionId)")
    public QuestionCandidature modifierQuestion(
            @PathVariable Long questionId,
            @RequestBody QuestionCreationDTO questionDTO) {
        
        // Logique de sécurité plus complexe requise ici : vérifier que la questionId appartient bien
        // au groupeId et que l'utilisateur est admin de ce groupe.
        return questionAdminService.modifierQuestion(questionId, questionDTO);
    }

    /**
     * Endpoint pour supprimer une question.
     */
    @DeleteMapping("/{questionId}")
    // @PreAuthorize("hasRole('ADMIN') and @securityService.isAdminDuGroupeDeQuestion(#questionId)")
    public ResponseEntity<Void> supprimerQuestion(@PathVariable Long questionId) {
        questionAdminService.supprimerQuestion(questionId);
        return ResponseEntity.noContent().build();
    }
}