package com.sante20.service;

import com.sante20.entity.Groupe;
import com.sante20.entity.TypeDepense;
import com.sante20.repository.GroupeRepository;
import com.sante20.repository.TypeDepenseRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class TypeDepenseService {

    @Autowired
    private TypeDepenseRepository typeDepenseRepository;

    @Autowired
    private GroupeRepository groupeRepository;

    @Transactional
    public TypeDepense createTypeDepense(Map<String, Object> request) {
        TypeDepense typeDepense = new TypeDepense();

        String nom = (String) request.get("nom");
        if (nom == null || nom.isEmpty()) {
            throw new IllegalArgumentException("Le nom du type de dépense est requis.");
        }
        typeDepense.setNom(nom);
        
        // Récupération et validation du champ isGenerique
        Object isGeneriqueObj = request.get("isGenerique");
        if (isGeneriqueObj == null) {
            throw new IllegalArgumentException("Le champ isGenerique est requis.");
        }
        boolean isGenerique = (Boolean) isGeneriqueObj;
        typeDepense.setGenerique(isGenerique);
        
        // Gérer le cas où le type de dépense est spécifique à un groupe
        if (!isGenerique) {
            Object groupeIdObj = request.get("groupeId");
            if (groupeIdObj == null) {
                throw new IllegalArgumentException("L'ID du groupe est requis pour un type de dépense non générique.");
            }
            Long groupeId = null;
            if (groupeIdObj instanceof String) {
                groupeId = Long.parseLong((String) groupeIdObj);
            } else if (groupeIdObj instanceof Integer) {
                groupeId = ((Integer) groupeIdObj).longValue();
            } else {
                throw new IllegalArgumentException("L'ID du groupe a un format invalide.");
            }

            Optional<Groupe> groupeOptional = groupeRepository.findById(groupeId);
            if (groupeOptional.isEmpty()) {
                throw new IllegalArgumentException("Groupe non trouvé pour l'ID: " + groupeId);
            }
            typeDepense.setGroupe(groupeOptional.get());
        }

        return typeDepenseRepository.save(typeDepense);
    }

    public List<TypeDepense> getAllTypesDepenses() {
        return typeDepenseRepository.findAll();
    }

    public void deleteTypeDepense(Long id) {
        if (!typeDepenseRepository.existsById(id)) {
            throw new IllegalArgumentException("Type de dépense non trouvé pour l'ID: " + id);
        }
        typeDepenseRepository.deleteById(id);
    }
}
