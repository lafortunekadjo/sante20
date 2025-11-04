package com.sante20.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversation_participants", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"conversation_id", "user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationParticipant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantRole role = ParticipantRole.MEMBER;
    
    @Column(nullable = false)
    private Boolean isMuted = false;
    
    @Column
    private LocalDateTime mutedUntil;
    
    @Column(nullable = false)
    private LocalDateTime lastReadAt;
    
    @Column(nullable = false)
    private Integer unreadCount = 0;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;
    
    @Column
    private LocalDateTime leftAt;
    
    // Méthodes utilitaires
    public boolean isActive() {
        return leftAt == null;
    }
    
    public boolean isAdmin() {
        return role == ParticipantRole.ADMIN;
    }
}