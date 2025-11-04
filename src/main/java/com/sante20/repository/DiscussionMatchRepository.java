// src/main/java/com/sante20/repository/DiscussionMatchRepository.java

package com.sante20.repository;

import com.sante20.entity.DefiMatchAmical;
import com.sante20.entity.DiscussionMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiscussionMatchRepository extends JpaRepository<DiscussionMatch, Long> {
    
    Optional<DiscussionMatch> findByDefiMatch(DefiMatchAmical defiMatch);
    
    @Query("SELECT d FROM DiscussionMatch d WHERE " +
           "(d.defiMatch.groupeDemandeur.id = :groupeId OR d.defiMatch.groupeCible.id = :groupeId) " +
           "AND d.active = true " +
           "ORDER BY d.dateCreation DESC")
    List<DiscussionMatch> findByGroupeId(@Param("groupeId") Long groupeId);
}