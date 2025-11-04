package com.sante20.repository;


import com.sante20.entity.Conversation;
import com.sante20.entity.ConversationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    
    // Trouver toutes les conversations d'un utilisateur
    @Query("SELECT DISTINCT c FROM Conversation c " +
           "JOIN c.participants p " +
           "WHERE p.user.id = :userId " +
           "AND p.leftAt IS NULL " +
           "AND c.isArchived = false " +
           "ORDER BY c.updatedAt DESC")
    List<Conversation> findActiveConversationsByUserId(@Param("userId") Long userId);
    
    // Trouver une conversation par type et metadata
    @Query("SELECT c FROM Conversation c WHERE c.type = :type AND c.metadata LIKE %:matchRequestId%")
    Optional<Conversation> findByTypeAndMatchRequestId(
        @Param("type") ConversationType type,
        @Param("matchRequestId") String matchRequestId
    );
    
    // Vérifier si une conversation privée existe déjà entre 2 users
    @Query("SELECT c FROM Conversation c " +
           "WHERE c.type = 'PRIVATE' " +
           "AND c.id IN (" +
           "    SELECT p1.conversation.id FROM ConversationParticipant p1 " +
           "    WHERE p1.user.id = :userId1 AND p1.leftAt IS NULL" +
           ") " +
           "AND c.id IN (" +
           "    SELECT p2.conversation.id FROM ConversationParticipant p2 " +
           "    WHERE p2.user.id = :userId2 AND p2.leftAt IS NULL" +
           ") " +
           "AND (SELECT COUNT(p) FROM ConversationParticipant p WHERE p.conversation = c AND p.leftAt IS NULL) = 2")
    Optional<Conversation> findPrivateConversationBetweenUsers(
        @Param("userId1") Long userId1, 
        @Param("userId2") Long userId2
    );
}