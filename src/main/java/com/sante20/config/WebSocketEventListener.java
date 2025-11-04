package com.sante20.config;


import com.sante20.dto.UserStatusMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {
    
    private final SimpMessageSendingOperations messagingTemplate;
    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = headerAccessor.getUser();
        
        if (user != null) {
            log.info("User connected: {}", user.getName());
            
            // Notifier les autres utilisateurs que cet utilisateur est en ligne
            UserStatusMessage statusMessage = new UserStatusMessage(
                user.getName(),
                "ONLINE"
            );
            
            messagingTemplate.convertAndSend("/topic/user-status", statusMessage);
        }
    }
    
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = headerAccessor.getUser();
        
        if (user != null) {
            log.info("User disconnected: {}", user.getName());
            
            // Notifier les autres utilisateurs que cet utilisateur est hors ligne
            UserStatusMessage statusMessage = new UserStatusMessage(
                user.getName(),
                "OFFLINE"
            );
            
            messagingTemplate.convertAndSend("/topic/user-status", statusMessage);
        }
    }
}