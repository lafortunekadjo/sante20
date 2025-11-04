package com.sante20.service;


import com.sante20.dto.MessageNotification;
import com.sante20.dto.MessageResponse;
import com.sante20.entity.Message;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketMessagePublisher {
    
    private final SimpMessageSendingOperations messagingTemplate;
    
    /**
     * Publier un nouveau message
     */
    public void publishNewMessage(Message message) {
        try {
            MessageResponse response = MessageResponse.fromEntity(message);
            MessageNotification notification = new MessageNotification(response, "NEW_MESSAGE");
            
            messagingTemplate.convertAndSend(
                "/topic/conversation/" + message.getConversation().getId(),
                notification
            );
            
            log.debug("Published new message to conversation {}", message.getConversation().getId());
        } catch (Exception e) {
            log.error("Error publishing new message", e);
        }
    }
    
    /**
     * Publier une modification de message
     */
    public void publishMessageEdited(Message message) {
        try {
            MessageResponse response = MessageResponse.fromEntity(message);
            MessageNotification notification = new MessageNotification(response, "MESSAGE_EDITED");
            
            messagingTemplate.convertAndSend(
                "/topic/conversation/" + message.getConversation().getId(),
                notification
            );
            
            log.debug("Published message edit to conversation {}", message.getConversation().getId());
        } catch (Exception e) {
            log.error("Error publishing message edit", e);
        }
    }
    
    /**
     * Publier une suppression de message
     */
    public void publishMessageDeleted(Message message) {
        try {
            MessageResponse response = MessageResponse.fromEntity(message);
            MessageNotification notification = new MessageNotification(response, "MESSAGE_DELETED");
            
            messagingTemplate.convertAndSend(
                "/topic/conversation/" + message.getConversation().getId(),
                notification
            );
            
            log.debug("Published message deletion to conversation {}", message.getConversation().getId());
        } catch (Exception e) {
            log.error("Error publishing message deletion", e);
        }
    }
    
    /**
     * Notifier les participants d'une nouvelle conversation
     */
    public void notifyNewConversation(Long userId, Long conversationId) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/new-conversation",
            conversationId
        );
    }
}