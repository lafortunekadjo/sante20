package com.sante20.repository;

import com.sante20.entity.JoueurOccasionnel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour l'entité JoueurOccasionnel.
 * Fournit des méthodes pour la persistance des joueurs occasionnels.
 */
@Repository
public interface JoueurOccasionnelRepository extends JpaRepository<JoueurOccasionnel, Long> {

    /**
     * Recherche un joueur occasionnel par son nom.
     * @param nom Le nom du joueur.
     * @return Un Optional contenant le joueur s'il est trouvé, sinon vide.
     */
    Optional<JoueurOccasionnel> findByNom(String nom);
}