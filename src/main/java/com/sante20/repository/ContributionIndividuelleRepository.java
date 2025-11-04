package com.sante20.repository;

import com.sante20.entity.Contribution;
import com.sante20.entity.ContributionIndividuelle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ContributionIndividuelleRepository extends JpaRepository<ContributionIndividuelle, Long> {

    @Query("""
        SELECT ci
        FROM ContributionIndividuelle ci
        WHERE ci.contribution.membre.groupe.id = (
            SELECT m.groupe.id
            FROM Membre m
            WHERE m.id = :idMembre
        )
    """)
    List<ContributionIndividuelle> findAllByMembreGroupe(@Param("idMembre") Long idMembre);

//    List<ContributionIndividuelle> findByContributionGroupe(Long groupeId);

    @Query("SELECT c FROM ContributionIndividuelle c WHERE c.membre.groupe.id = :groupeId AND c.dateContribution BETWEEN :startDate AND :endDate")
    List<ContributionIndividuelle> findByGroupeIdAndDateContributionBetween(@Param("groupeId") Long groupeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<ContributionIndividuelle> findByMembreId(Long membreId);

    List<ContributionIndividuelle> findByContribution(Contribution contribution);

    List<ContributionIndividuelle> findByDateContributionBetween(LocalDate startDate, LocalDate endDate);
}