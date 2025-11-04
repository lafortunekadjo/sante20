// src/main/java/com/sante20/repository/MessageDiscussionMatchRepository.java

package com.sante20.repository;


import com.sante20.entity.DiscussionMatch;
import com.sante20.entity.MessageDiscussionMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageDiscussionMatchRepository extends JpaRepository<MessageDiscussionMatch, Long> {
    
    List<MessageDiscussionMatch> findByDiscussionOrderByDateEnvoiAsc(DiscussionMatch discussion);
    
    @Query("SELECT COUNT(m) FROM MessageDiscussionMatch m WHERE " +
           "m.discussion.id = :discussionId AND " +
           "m.groupeAuteur.id != :groupeId AND " +
           "m.lu = false")
    Integer countMessagesNonLus(
        @Param("discussionId") Long discussionId, 
        @Param("groupeId") Long groupeId
    );
    
    @Query("SELECT m FROM MessageDiscussionMatch m WHERE " +
           "m.discussion.id = :discussionId " +
           "ORDER BY m.dateEnvoi DESC")
    List<MessageDiscussionMatch> findDernierMessage(@Param("discussionId") Long discussionId);
}