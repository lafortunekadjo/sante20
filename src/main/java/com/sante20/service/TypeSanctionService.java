package com.sante20.service;


import com.sante20.entity.*;
import com.sante20.repository.GroupeRepository;
import com.sante20.repository.TypeSanctionRepository;
import com.sante20.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TypeSanctionService {

    @Autowired
    private TypeSanctionRepository typeSanctionRepository;

    @Autowired
    private GroupeRepository groupeRepository;

    @Autowired
    private UserRepository userRepository;
    public TypeSanction createTypeSanction(Map<String, Object> request) {
        TypeSanction typeSanction = new TypeSanction();

        // Valider et définir le nom (requis)
        String nom = (String) request.get("nom");
        if (nom == null || nom.trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom est requis et ne peut pas être vide.");
        }
        typeSanction.setNom(nom.trim());

        // Définir la description (optionnelle)
        String description = (String) request.get("description");
        typeSanction.setDescription(description != null ? description.trim() : null);

        // Définir le montant par défaut (optionnel)
        Object montantParDefautObj = request.get("montantParDefaut");
        if (montantParDefautObj != null) {
            try {
                double montantParDefaut = Double.parseDouble(montantParDefautObj.toString());
                if (montantParDefaut < 0) {
                    throw new IllegalArgumentException("Le montant par défaut ne peut pas être négatif.");
                }
                typeSanction.setMontantParDefaut(montantParDefaut);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Le montant par défaut doit être un nombre valide.");
            }
        } else {
            typeSanction.setMontantParDefaut(null);
        }

        // Valider et définir le type (requis)
        String typeStr = (String) request.get("type");
        if (typeStr == null || typeStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Le type est requis.");
        }
        try {
            TypeSanction.Type type = TypeSanction.Type.valueOf(typeStr.toUpperCase());
            typeSanction.setType(type);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Type invalide. Valeurs possibles : AMENDE, SUSPENSION, DISCIPLINE.");
        }

        // Définir la durée (optionnelle, mais validée pour SUSPENSION)
        Object dureeObj = request.get("duree");
        if (dureeObj != null) {
            try {
                int duree = Integer.parseInt(dureeObj.toString());
                if (duree <= 0) {
                    throw new IllegalArgumentException("La durée doit être supérieure à 0.");
                }
                typeSanction.setDuree(duree);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("La durée doit être un entier valide.");
            }
        } else if (typeSanction.getType() == TypeSanction.Type.SUSPENSION) {
            typeSanction.setDuree(null); // Durée optionnelle même pour SUSPENSION
        } else {
            typeSanction.setDuree(null);
        }

        // Gérer le groupe associé (optionnel, 0 ou 1 groupe)

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User utilisateur = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé : " + auth.getName()));


        typeSanction.setGroupe(utilisateur.getGroupe());


        // Sauvegarder l'entité

        return typeSanctionRepository.save(typeSanction);
    }

    public TypeSanction updateTypeSanction(Long id, Map<String, Object> request) {
        TypeSanction typeSanction = typeSanctionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Type de sanction non trouvé : " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User utilisateur = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé : " + auth.getName()));

        if (!utilisateur.getRole().equals("ADMIN") && typeSanction.getGroupe() != null &&
                (utilisateur.getGroupe() == null || !typeSanction.getGroupe().getId().equals(utilisateur.getGroupe().getId()))) {
            throw new IllegalArgumentException("Vous n'êtes pas autorisé à modifier ce type de sanction.");
        }

        // Valider et définir le nom (requis)
        String nom = (String) request.get("nom");
        if (nom == null || nom.trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom est requis et ne peut pas être vide.");
        }
        typeSanction.setNom(nom.trim());

        // Définir la description (optionnelle)
        String description = (String) request.get("description");
        typeSanction.setDescription(description != null ? description.trim() : null);

        // Définir le montant par défaut (optionnel)
        Object montantParDefautObj = request.get("montantParDefaut");
        if (montantParDefautObj != null) {
            try {
                double montantParDefaut = Double.parseDouble(montantParDefautObj.toString());
                if (montantParDefaut < 0) {
                    throw new IllegalArgumentException("Le montant par défaut ne peut pas être négatif.");
                }
                typeSanction.setMontantParDefaut(montantParDefaut);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Le montant par défaut doit être un nombre valide.");
            }
        } else {
            typeSanction.setMontantParDefaut(null);
        }

        // Valider et définir le type (requis)
        String typeStr = (String) request.get("type");
        if (typeStr == null || typeStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Le type est requis.");
        }
        try {
            TypeSanction.Type type = TypeSanction.Type.valueOf(typeStr.toUpperCase());
            typeSanction.setType(type);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Type invalide. Valeurs possibles : AMENDE, SUSPENSION, DISCIPLINE.");
        }

        // Définir la durée (optionnelle)
        Object dureeObj = request.get("duree");
        if (dureeObj != null) {
            try {
                int duree = Integer.parseInt(dureeObj.toString());
                if (duree <= 0) {
                    throw new IllegalArgumentException("La durée doit être supérieure à 0.");
                }
                typeSanction.setDuree(duree);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("La durée doit être un entier valide.");
            }
        } else {
            typeSanction.setDuree(null);
        }

        // Gérer le groupe associé (optionnel)
        Long groupeId = (Long) request.get("groupeId");
        Groupe groupe = null;
        if (groupeId != null) {
            groupe = groupeRepository.findById(groupeId)
                    .orElseThrow(() -> new IllegalArgumentException("Groupe non trouvé : " + groupeId));
            if (!utilisateur.getRole().equals("ADMIN") && utilisateur.getGroupe() != null &&
                    !utilisateur.getGroupe().getId().equals(groupeId)) {
                throw new IllegalArgumentException("Vous n'êtes pas autorisé à associer ce groupe.");
            }
        } else if (utilisateur.getRole().equals("RESPONSABLE") && utilisateur.getGroupe() != null) {
            groupe = utilisateur.getGroupe();
        }
        typeSanction.setGroupe(groupe);

        // Sauvegarder l'entité
        TypeSanction updatedTypeSanction = typeSanctionRepository.save(typeSanction);



        return typeSanctionRepository.save(typeSanction);
    }

    public TypeSanction getTypeSanctionById(Long id) {
        return typeSanctionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TypeSanction non trouvé"));
    }

    public List<TypeSanction> getAllTypeSanctions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User utilisateur = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé : " + auth.getName()));

        List<TypeSanction> allTypeSanctions = typeSanctionRepository.findByGroupe(utilisateur.getGroupe());
    return  allTypeSanctions;


    }

    public void deleteTypeSanction(Long id) {
        TypeSanction typeSanction = typeSanctionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Type de sanction non trouvé : " + id));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User utilisateur = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé : " + auth.getName()));

        if (!utilisateur.getRole().equals("ADMIN") && typeSanction.getGroupe() != null &&
                (utilisateur.getGroupe() == null || !typeSanction.getGroupe().getId().equals(utilisateur.getGroupe().getId()))) {
            throw new IllegalArgumentException("Vous n'êtes pas autorisé à supprimer ce type de sanction.");
        }

        typeSanctionRepository.deleteById(id);
    }


//    public List<TypeSanction> getGroupeTypeSanctions() {
//    }
}