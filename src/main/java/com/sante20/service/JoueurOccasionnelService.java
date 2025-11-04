package com.sante20.service;

import com.sante20.entity.JoueurOccasionnel;
import com.sante20.repository.JoueurOccasionnelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service pour la gestion des joueurs occasionnels.
 * Gère la logique métier pour trouver ou créer des joueurs occasionnels.
 */
@Service
public class JoueurOccasionnelService {

    @Autowired
    private JoueurOccasionnelRepository joueurOccasionnelRepository;

    /**
     * Trouve un joueur occasionnel par son nom. S'il n'existe pas, il est créé.
     * @param nom Le nom du joueur.
     * @return L'entité JoueurOccasionnel persistée.
     */
    public JoueurOccasionnel findOrCreateOccasionalPlayer(String nom) {
        Optional<JoueurOccasionnel> existingPlayer = joueurOccasionnelRepository.findByNom(nom);
        if (existingPlayer.isPresent()) {
            return existingPlayer.get();
        } else {
            JoueurOccasionnel newPlayer = new JoueurOccasionnel();
            newPlayer.setNom(nom);
            return joueurOccasionnelRepository.save(newPlayer);
        }
    }
}