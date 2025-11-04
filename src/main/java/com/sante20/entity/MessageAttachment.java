package com.sante20.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "message_attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageAttachment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentType type;
    
    @Column(nullable = false, length = 500)
    private String url;
    
    @Column(nullable = false)
    private String filename;
    
    @Column(nullable = false)
    private Long fileSize; // en bytes
    
    @Column(length = 100)
    private String mimeType;
}