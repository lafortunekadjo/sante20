package com.sante20.service;

import com.sante20.entity.Suggestion;
import com.sante20.repository.SuggestionRepository;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class SuggestionService {
    private final SuggestionRepository suggestionRepository;

    public SuggestionService(SuggestionRepository suggestionRepository) {
        this.suggestionRepository = suggestionRepository;
    }

    public Suggestion save(Suggestion suggestion) {
        suggestion.setDateSoumission(new Date());
        return suggestionRepository.save(suggestion);
    }

    public List<Suggestion> getAllSuggestions() {
        return suggestionRepository.findAll();
    }
}