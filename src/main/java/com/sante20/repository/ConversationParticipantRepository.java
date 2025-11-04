package com.sante20.repository;


import com.sante20.entity.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, Long> {
    
    Optional<ConversationParticipant> findByConversationIdAndUserId(Long conversationId, Long userId);
    
    List<ConversationParticipant> findByConversationIdAndLeftAtIsNull(Long conversationId);
    
    @Query("SELECT p FROM ConversationParticipant p " +
           "WHERE p.user.id = :userId " +
           "AND p.leftAt IS NULL " +
           "ORDER BY p.conversation.updatedAt DESC")
    List<ConversationParticipant> findActiveParticipationsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT SUM(p.unreadCount) FROM ConversationParticipant p " +
           "WHERE p.user.id = :userId AND p.leftAt IS NULL")
    Integer getTotalUnreadCountForUser(@Param("userId") Long userId);
}