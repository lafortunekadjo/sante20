package com.sante20.controller;

import com.sante20.dto.MessageNotification;
import com.sante20.dto.SendMessageRequest;
import com.sante20.dto.MessageResponse;
import com.sante20.dto.TypingIndicator;
import com.sante20.entity.Message;
import com.sante20.entity.User;
import com.sante20.service.MessageService;
import com.sante20.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final MessageService messageService;
    private final SimpMessageSendingOperations messagingTemplate;
    private final CustomUserDetailsService userService;

    /**
     * Envoyer un message via WebSocket
     */
    @MessageMapping("/chat/{conversationId}/send")
    public void sendMessage(
            @DestinationVariable Long conversationId,
            @Payload SendMessageRequest request,
            Principal principal
    ) {
        log.info("========================================");
        log.info("📤 Received WebSocket Message");
        log.info("Conversation ID: {}", conversationId);
        log.info("Content: {}", request.getContent());
        log.info("Principal: {}", principal);
        log.info("========================================");

        try {
            if (principal == null) {
                log.error("❌ ERROR: Principal is null!");
                return;
            }

            String username = principal.getName();
            log.info("Username from Principal: {}", username);

            User currentUser = userService.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found: " + username));

            log.info("Found user: {} (ID: {})", currentUser.getEmail(), currentUser.getId());

            Message message = messageService.sendTextMessage(
                    conversationId,
                    currentUser.getId(),
                    request.getContent()
            );

            MessageResponse response = MessageResponse.fromEntity(message);
            MessageNotification notification = new MessageNotification(response, "NEW_MESSAGE");

            // Envoyer le message à tous les participants de la conversation
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId,
                    notification
            );

            log.info("✅ Message sent successfully via WebSocket to conversation {}", conversationId);
        } catch (Exception e) {
            log.error("❌ Error sending message via WebSocket", e);

            // Optionnel : Envoyer une erreur au client
            if (principal != null) {
                messagingTemplate.convertAndSendToUser(
                        principal.getName(),
                        "/queue/errors",
                        "Erreur lors de l'envoi du message: " + e.getMessage()
                );
            }
        }
    }

    /**
     * Indicateur de frappe (typing indicator)
     */
    @MessageMapping("/chat/{conversationId}/typing")
    public void sendTypingIndicator(
            @DestinationVariable Long conversationId,
            @Payload TypingIndicator indicator,
            Principal principal
    ) {
        try {
            if (principal == null) {
                log.warn("Principal is null for typing indicator");
                return;
            }

            log.info("Typing indicator from: {} for conversation: {}",
                    principal.getName(), conversationId);

            User currentUser = userService.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // S'assurer que l'indicateur vient bien de l'utilisateur authentifié
            indicator.setUserId(currentUser.getId());
            indicator.setUserName(currentUser.getMembre().getNom() + " " + currentUser.getMembre().getPrenom());

            // Diffuser l'indicateur de frappe aux autres participants
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId + "/typing",
                    indicator
            );
        } catch (Exception e) {
            log.error("Error sending typing indicator", e);
        }
    }

    /**
     * Marquer les messages comme lus
     */
    @MessageMapping("/chat/{conversationId}/mark-read")
    public void markAsRead(
            @DestinationVariable Long conversationId,
            Principal principal
    ) {
        try {
            if (principal == null) {
                log.warn("Principal is null for mark-read");
                return;
            }

            User currentUser = userService.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            messageService.markConversationAsRead(conversationId, currentUser.getId());

            // Notifier les autres participants
            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId + "/read",
                    currentUser.getId()
            );

            log.info("✅ Messages marked as read for conversation {}", conversationId);
        } catch (Exception e) {
            log.error("Error marking messages as read", e);
        }
    }
}