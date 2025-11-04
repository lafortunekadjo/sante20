package com.sante20.controller;

import com.sante20.entity.Suggestion;
import com.sante20.service.MembreService;
import com.sante20.service.SuggestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/suggestions")
@CrossOrigin("*")
public class SuggestionController {
    private final SuggestionService suggestionService;
    private final MembreService membreService;

    public SuggestionController(SuggestionService suggestionService, MembreService membreService) {
        this.suggestionService = suggestionService;
        this.membreService = membreService;
    }

    @PostMapping
    public ResponseEntity<Suggestion> createSuggestion(@RequestBody Suggestion suggestion) {
        // Assurez-vous d'avoir un service Membre pour trouver le membre par ID
        suggestion.setMembre(membreService.getMembreById(suggestion.getMembre().getId()));
        Suggestion savedSuggestion = suggestionService.save(suggestion);
        return ResponseEntity.ok(savedSuggestion);
    }
}