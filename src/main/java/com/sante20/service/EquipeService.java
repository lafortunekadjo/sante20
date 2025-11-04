package com.sante20.service;


import com.sante20.entity.Equipe;
import com.sante20.entity.Groupe;
import com.sante20.entity.User;
import com.sante20.repository.EquipeRepository;
import com.sante20.repository.GroupeRepository;
import com.sante20.repository.MembreRepository;
import com.sante20.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class EquipeService {

    @Autowired
    private EquipeRepository equipeRepository;

    @Autowired
    private MembreRepository membreRepository;
    @Autowired
    private GroupeRepository groupeRepository;

    @Autowired
    private UserRepository userRepository;

    public Equipe createEquipe(Map<String, Object> request) {
        Equipe equipe = new Equipe();
        equipe.setNom((String) request.get("nom"));
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        Groupe groupe = groupeRepository.findById(user.get().getMembre().getGroupe().getId()).orElseThrow();
        equipe.setGroupe(groupe);

        // Gérer les membres associés

        return equipeRepository.save(equipe);
    }

    public Equipe updateEquipe(Long id, Map<String, Object> request) {
        Equipe equipe = equipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipe non trouvée"));
        equipe.setNom((String) request.get("nom"));

        // Gérer les membres associés

        return equipeRepository.save(equipe);
    }

    public Equipe getEquipeById(Long id) {
        return equipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipe non trouvée"));
    }

    public List<Equipe> getAllEquipes() {
        return equipeRepository.findAll();
    }

    public List<Equipe> getAllEquipesByGroupe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        return equipeRepository.findByGroupe(user.get().getMembre().getGroupe());
    }

    public void deleteEquipe(Long id) {
        if (!equipeRepository.existsById(id)) {
            throw new RuntimeException("Equipe non trouvée");
        }
        equipeRepository.deleteById(id);
    }
}