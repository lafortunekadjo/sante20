package com.sante20.config;

import com.sante20.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    // Stocker l'authentification par session WebSocket
    private final Map<String, UsernamePasswordAuthenticationToken> sessionAuthMap = new ConcurrentHashMap<>();

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/api/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

                if (accessor == null) {
                    return message;
                }

                String sessionId = accessor.getSessionId();
                StompCommand command = accessor.getCommand();

                log.info("========================================");
                log.info("WebSocket Message Intercepted");
                log.info("Command: {}", command);
                log.info("Session ID: {}", sessionId);
                log.info("Destination: {}", accessor.getDestination());
                log.info("========================================");

                // Lors de la CONNEXION - Extraire et stocker l'authentification
                if (StompCommand.CONNECT.equals(command)) {
                    log.info("=== CONNECT Command ===");

                    String token = accessor.getFirstNativeHeader("Authorization");

                    if (token != null && token.startsWith("Bearer ")) {
                        token = token.substring(7);
                        log.info("Token extracted, length: {}", token.length());

                        try {
                            String username = jwtUtil.extractUsername(token);
                            log.info("Username from token: {}", username);

                            if (username != null && jwtUtil.validateToken(token, username)) {
                                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                                UsernamePasswordAuthenticationToken authentication =
                                        new UsernamePasswordAuthenticationToken(
                                                userDetails,
                                                null,
                                                userDetails.getAuthorities()
                                        );

                                // IMPORTANT : Stocker l'authentification par session
                                sessionAuthMap.put(sessionId, authentication);

                                // Définir l'utilisateur dans l'accessor
                                accessor.setUser(authentication);

                                log.info("✅ Authentication successful for user: {}", username);
                                log.info("Session {} authenticated", sessionId);
                            } else {
                                log.error("❌ Token validation failed");
                            }
                        } catch (Exception e) {
                            log.error("❌ Exception during authentication", e);
                        }
                    } else {
                        log.error("❌ NO AUTHORIZATION HEADER or invalid format");
                    }
                }
                // Pour les AUTRES messages - Récupérer l'authentification de la session
                else if (sessionId != null) {
                    if (sessionAuthMap.containsKey(sessionId)) {
                        UsernamePasswordAuthenticationToken authentication = sessionAuthMap.get(sessionId);
                        accessor.setUser(authentication);
                        log.info("✅ Restored authentication for session: {} - User: {}",
                                sessionId, authentication.getName());
                    } else {
                        log.warn("⚠️ No authentication found for session: {}", sessionId);
                    }
                }
                // Lors de la DÉCONNEXION - Nettoyer
                else if (StompCommand.DISCONNECT.equals(command)) {
                    if (sessionId != null) {
                        sessionAuthMap.remove(sessionId);
                        log.info("🔌 Session {} disconnected and cleaned", sessionId);
                    }
                }

                log.info("Final user in accessor: {}", accessor.getUser() != null ?
                        accessor.getUser().getName() : "NULL");
                log.info("========================================");

                return message;
            }
        });
    }
}