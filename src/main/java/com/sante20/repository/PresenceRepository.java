package com.sante20.repository;


import com.sante20.entity.Match;
import com.sante20.entity.Membre;
import com.sante20.entity.Presence;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PresenceRepository extends JpaRepository<Presence, Long> {
    List<Presence> findByMatchId(Long matchId);
    List<Presence> findByMembreId(Long membreId);
    boolean existsByMembreAndMatch(Membre membre, Match match);

    @Modifying
    @Transactional
    @Query("DELETE FROM Presence p WHERE p.match.id = :matchId")
    void deleteByMatchId(Long matchId);

    // Récupérer toutes les présences pour un groupe donné où aJoue est true
    @Query("SELECT p FROM Presence p JOIN p.membre m JOIN m.groupe g WHERE g.id = :groupeId AND p.aJoue = true")
    List<Presence> findByMatchGroupeIdAndAJoueTrue(Long groupeId);
    @Query("SELECT p FROM Presence p JOIN p.membre m JOIN m.groupe g WHERE g.id = :groupeId")
    List<Presence> findByMembreAndAJoueTrue(Long groupeId);

    // Récupérer toutes les présences pour un groupe donné (sans filtre sur aJoue)
    @Query("SELECT p FROM Presence p JOIN p.membre m JOIN m.groupe g WHERE g.id = :groupeId")
    List<Presence> findByMatchGroupeId(Long groupeId);


    //List<Presence> findByMembreIdAndMatchDateMatchBetween(Long membreId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT p FROM Presence p WHERE p.membre.id = :membreId AND p.aJoue = true AND p.match.dateMatch BETWEEN :startDate AND :endDate")
    List<Presence> findByMembreIdAndAJoueTrueAndMatchDateMatchBetween(@Param("membreId") Long membreId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);


    List<Presence> findByMatch(Match match);
    /**
     * Trouver toutes les présences pour une liste de matches
     */
    @Query("SELECT p FROM Presence p WHERE p.match IN :matches")
    List<Presence> findByMatchIn(@Param("matches") List<Match> matches);

    /**
     * Compter le nombre de buts par membre
     */
    @Query("SELECT SUM(p.buts) FROM Presence p WHERE p.membre = :membre AND p.aJoue = true")
    Integer sumButsByMembre(@Param("membre") Membre membre);

    /**
     * Compter le nombre de passes par membre
     */
    @Query("SELECT SUM(p.passes) FROM Presence p WHERE p.membre = :membre AND p.aJoue = true")
    Integer sumPassesByMembre(@Param("membre") Membre membre);

    /**
     * Compter les hommes du match par membre
     */
    @Query("SELECT COUNT(p) FROM Presence p WHERE p.membre = :membre AND (p.estHommeDuMatch = true OR p.estHommeDuMatchEq = true)")
    Long countManOfTheMatchByMembre(@Param("membre") Membre membre);
//    // This method is used to find presences by member ID and dates for the frontend calculation
//    @Query("SELECT p FROM Presence p WHERE p.membre.id = :membreId AND p.dateMatch BETWEEN :dateDebut AND :dateFin")
//    List<Presence> findByMembreIdAndDates(@Param("membreId") Long membreId, @Param("dateDebut") LocalDate dateDebut, @Param("dateFin") LocalDate dateFin);
//
//    // This method is used to get the count of attended matches
//    long countByMembre_IdAndPresentIsTrue(Long membreId);
//
//    // This method is used to find presences for objectives tracking
//    List<Presence> findByMembre_IdAndAJoueTrueAndMatch_DateMatchBetween(Long membreId, LocalDate startDate, LocalDate endDate);
//
//    // This method is used to get the number of goals scored by a member
//    @Query("SELECT SUM(p.buts) FROM Presence p WHERE p.membre.id = :membreId")
//    Integer countTotalButsByMembreId(@Param("membreId") Long membreId);
//
//    // This method is used to get the number of passes made by a member
//    @Query("SELECT SUM(p.passes) FROM Presence p WHERE p.membre.id = :membreId")
//    Integer countTotalPassesByMembreId(@Param("membreId") Long membreId);
//
//    // This method is used to get the number of MVP awards for a member
//    @Query("SELECT COUNT(p) FROM Presence p WHERE p.membre.id = :membreId AND p.estHommeDuMatch = true")
//    Integer countTotalMvpByMembreId(@Param("membreId") Long membreId);
//

}