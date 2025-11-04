package com.sante20.repository;

import com.sante20.entity.DemandeIntegration;
import com.sante20.entity.ReponseCandidature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Repository
public interface ReponseCandidatureRepository extends JpaRepository<ReponseCandidature, Long> {
    List<ReponseCandidature> findByDemande(DemandeIntegration demande);

}