package com.sante20.repository;

import com.sante20.entity.Sanction;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface SanctionRepository extends JpaRepository<Sanction, Long> {

    List<Sanction> findByMembreId(Long membreId);

    List<Sanction> findByMembreIdAndEtat(Long membreId, Sanction.EtatSanction etat);
    List<Sanction> findByMatchId(Long matchId);
//    List<Sanction> findByGroupeId(Long groupeId);

    List<Sanction> findByMembreIdIn(List<Long> membreIds);
//    List<Sanction> findByGroupeIdAndDateSanctionBetween(Long groupeId, LocalDate startDate, LocalDate endDate);


    @Query("SELECT s FROM Sanction s WHERE s.membre.groupe.id = :groupeId AND s.dateSanction BETWEEN :startDate AND :endDate")
    List<Sanction> findByGroupeIdAndDateSanctionBetween(@Param("groupeId") Long groupeId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<Sanction> findByMembreIdAndDateSanctionBetween(Long membreId, LocalDate startDate, LocalDate endDate);

    List<Sanction> findByDateSanctionBetween(LocalDate startDate, LocalDate endDate);
    @Modifying
    @Transactional
    @Query("DELETE FROM Sanction p WHERE p.match.id = :matchId")
    void deleteByMatchId(Long matchId);
}