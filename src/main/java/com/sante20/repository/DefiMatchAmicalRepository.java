package com.sante20.repository;

import com.sante20.entity.DefiMatchAmical;
import com.sante20.entity.Groupe;
import com.sante20.entity.StatutDefi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DefiMatchAmicalRepository extends JpaRepository<DefiMatchAmical, Long> {
    // Lister les défis envoyés
    List<DefiMatchAmical> findByGroupeDemandeur(Groupe groupe);
    // Lister les défis reçus pour traitement
    List<DefiMatchAmical> findByGroupeCibleAndStatut(Groupe groupe, StatutDefi statut);

    List<DefiMatchAmical> findByGroupeCible(Groupe groupeCible);
}