package com.sante20.repository;


import com.sante20.dto.ContributionByGroupDTO;
import com.sante20.entity.Contribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ContributionRepository extends JpaRepository<Contribution, Long> {

    List<Contribution> findByMembreId(Long membreId);
    @Query("SELECT c FROM Contribution c WHERE c.membre.groupe.id = :groupeId")
    List<Contribution> findByMembreGroupeId(Long groupeId);

    @Query("SELECT c FROM Contribution c WHERE c.membre.groupe.id = :groupeId AND c.dateContribution BETWEEN :startDate AND :endDate")
    List<Contribution> findByGroupeIdAndDateContributionBetween(@Param("groupeId") Long groupeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    List<Contribution> findByMembreIdAndDateContributionBetween(Long membreId, LocalDate startDate, LocalDate endDate);
    List<Contribution> findByDateContributionBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT new com.sante20.dto.ContributionByGroupDTO(g.nom, SUM(c.montant), MAX(c.dateContribution)) " +
            "FROM Contribution c JOIN c.membre m JOIN m.groupe g WHERE c.dateContribution BETWEEN :startDate AND :endDate GROUP BY g.nom")
    List<ContributionByGroupDTO> findContributionsByGroup(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

}