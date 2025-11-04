package com.sante20.repository;

import com.sante20.entity.DemandeIntegration;
import com.sante20.entity.Groupe;
import com.sante20.entity.StatutDemande;
import com.sante20.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DemandeIntegrationRepository extends JpaRepository<DemandeIntegration, Long> {
    List<DemandeIntegration> findByGroupeCibleAndStatut(Groupe groupe, StatutDemande statut);

    Boolean existsByCandidatAndGroupeCible(User user, Groupe groupe);

    List<DemandeIntegration> findByCandidat(User candidat);
   // Optional<DemandeIntegration> findByCandidat(User candidat); // Pour vérifier si un user a déjà une demande
}