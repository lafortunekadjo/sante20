package com.sante20.service;


import com.sante20.entity.Stade;
import com.sante20.repository.StadeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class StadeService {

    @Autowired
    private StadeRepository stadeRepository;

    public Stade createStade(Map<String, Object> request) {
        Stade stade = new Stade();
        stade.setNom((String) request.get("nom"));
        return stadeRepository.save(stade);
    }

    public Stade updateStade(Long id, Map<String, Object> request) {
        Stade stade = stadeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stade non trouvé"));
        stade.setNom((String) request.get("nom"));
        return stadeRepository.save(stade);
    }

    public Stade getStadeById(Long id) {
        return stadeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stade non trouvé"));
    }

    public List<Stade> getAllStades() {
        return stadeRepository.findAll();
    }

    public void deleteStade(Long id) {
        if (!stadeRepository.existsById(id)) {
            throw new RuntimeException("Stade non trouvé");
        }
        stadeRepository.deleteById(id);
    }
}