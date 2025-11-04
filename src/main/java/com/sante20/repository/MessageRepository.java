package com.sante20.repository;


import com.sante20.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    Page<Message> findByConversationIdAndIsDeletedFalseOrderByCreatedAtDesc(
        Long conversationId, 
        Pageable pageable
    );
    
    @Query("SELECT m FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "AND m.createdAt > :since " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt ASC")
    List<Message> findNewMessagesInConversation(
        @Param("conversationId") Long conversationId,
        @Param("since") LocalDateTime since
    );
    
    Long countByConversationIdAndIsDeletedFalse(Long conversationId);
}