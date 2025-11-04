package com.sante20.service;


import com.sante20.entity.*;
import com.sante20.exceptions.ResourceNotFoundException;
import com.sante20.exceptions.UnauthorizedException;
import com.sante20.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageAttachmentRepository attachmentRepository;
    private final MessageReadStatusRepository readStatusRepository;
    private final UserRepository userRepository;
    // private final FileStorageService fileStorageService; // À implémenter
    
    /**
     * Envoyer un message texte
     */
    public Message sendTextMessage(Long conversationId, Long senderId, String content) {

        Conversation conversation = getConversationOrThrow(conversationId);
        User sender = getUserOrThrow(senderId);
        
        // Vérifier que l'utilisateur est participant
        ConversationParticipant participant = getParticipantOrThrow(conversationId, senderId);
        
        // Vérifier les permissions d'écriture
        // ConversationSettings settings = getSettings(conversation);
        // if (settings.getOnlyAdminsCanWrite() && !participant.isAdmin()) {
        //     throw new UnauthorizedException("Seuls les admins peuvent écrire");
        // }
        
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setType(MessageType.TEXT);
        message.setContent(content);
        message.setIsSystemMessage(false);
        message.setIsEdited(false);
        message.setIsDeleted(false);
        
        message = messageRepository.save(message);
        
        // Mettre à jour la conversation
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        
        // Incrémenter le compteur de non-lus pour les autres participants
        incrementUnreadCountForOthers(conversationId, senderId);
        
        // Réinitialiser le compteur pour l'expéditeur
        participant.setUnreadCount(0);
        participant.setLastReadAt(LocalDateTime.now());
        participantRepository.save(participant);
        
        return message;
    }
    
    /**
     * Envoyer un message avec pièce jointe
     */
    public Message sendMessageWithAttachment(
            Long conversationId,
            Long senderId,
            String content,
            MultipartFile file
    ) {
        Message message = sendTextMessage(conversationId, senderId, content);
        
        // Upload du fichier (à implémenter avec votre service de stockage)
        // String fileUrl = fileStorageService.uploadFile(file);
        String fileUrl = "https://example.com/files/" + file.getOriginalFilename(); // Mock
        
        MessageAttachment attachment = new MessageAttachment();
        attachment.setMessage(message);
        attachment.setType(determineAttachmentType(file));
        attachment.setUrl(fileUrl);
        attachment.setFilename(file.getOriginalFilename());
        attachment.setFileSize(file.getSize());
        attachment.setMimeType(file.getContentType());
        
        attachmentRepository.save(attachment);
        
        return message;
    }
    
    /**
     * Créer un message système
     */
    public Message createSystemMessage(
            Long conversationId,
            SystemMessageType type,
            String content
    ) {
        Conversation conversation = getConversationOrThrow(conversationId);
        
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(null); // Pas d'expéditeur pour les messages système
        message.setType(MessageType.SYSTEM);
        message.setContent(content);
        message.setIsSystemMessage(true);
        message.setSystemMessageType(type);
        message.setIsEdited(false);
        message.setIsDeleted(false);
        
        message = messageRepository.save(message);
        
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        
        return message;
    }
    
    /**
     * Récupérer les messages d'une conversation (paginés)
     */
    @Transactional(readOnly = true)
    public Page<Message> getConversationMessages(
            Long conversationId,
            Long userId,
            Pageable pageable
    ) {
        // Vérifier que l'utilisateur est participant
        getParticipantOrThrow(conversationId, userId);
        
        return messageRepository.findByConversationIdAndIsDeletedFalseOrderByCreatedAtDesc(
            conversationId,
            pageable
        );
    }
    
    /**
     * Récupérer les nouveaux messages depuis une date
     */
    @Transactional(readOnly = true)
    public List<Message> getNewMessages(
            Long conversationId,
            Long userId,
            LocalDateTime since
    ) {
        getParticipantOrThrow(conversationId, userId);
        
        return messageRepository.findNewMessagesInConversation(conversationId, since);
    }
    
    /**
     * Modifier un message
     */
    public Message editMessage(Long messageId, Long userId, String newContent) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Message non trouvé"));
        
        // Vérifier que c'est l'auteur du message
        if (!message.getSender().getId().equals(userId)) {
            throw new UnauthorizedException("Vous ne pouvez modifier que vos propres messages");
        }
        
        // Ne pas modifier les messages système
        if (message.getIsSystemMessage()) {
            throw new UnauthorizedException("Impossible de modifier un message système");
        }
        
        message.setContent(newContent);
        message.setIsEdited(true);
        message.setEditedAt(LocalDateTime.now());
        
        return messageRepository.save(message);
    }
    
    /**
     * Supprimer un message
     */
    public void deleteMessage(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Message non trouvé"));
        
        // Vérifier que c'est l'auteur du message ou un admin
        ConversationParticipant participant = getParticipantOrThrow(
            message.getConversation().getId(),
            userId
        );
        
        if (!message.getSender().getId().equals(userId) && !participant.isAdmin()) {
            throw new UnauthorizedException("Vous ne pouvez supprimer que vos propres messages");
        }
        
        message.setIsDeleted(true);
        message.setContent("[Message supprimé]");
        messageRepository.save(message);
    }
    
    /**
     * Marquer un message comme lu
     */
    public void markMessageAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Message non trouvé"));
        
        User user = getUserOrThrow(userId);
        
        // Vérifier si déjà lu
        boolean alreadyRead = readStatusRepository
            .findByMessageIdAndUserId(messageId, userId)
            .isPresent();
        
        if (!alreadyRead) {
            MessageReadStatus readStatus = new MessageReadStatus();
            readStatus.setMessage(message);
            readStatus.setUser(user);
            readStatus.setReadAt(LocalDateTime.now());
            
            readStatusRepository.save(readStatus);
        }
    }
    
    // ==================== Méthodes utilitaires ====================
    
    private void incrementUnreadCountForOthers(Long conversationId, Long senderId) {
        List<ConversationParticipant> participants = participantRepository
            .findByConversationIdAndLeftAtIsNull(conversationId);
        
        for (ConversationParticipant participant : participants) {
            if (!participant.getUser().getId().equals(senderId)) {
                participant.setUnreadCount(participant.getUnreadCount() + 1);
                participantRepository.save(participant);
            }
        }
    }
    
    private AttachmentType determineAttachmentType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null) {
            if (contentType.startsWith("image/")) {
                return AttachmentType.IMAGE;
            } else if (contentType.startsWith("video/")) {
                return AttachmentType.VIDEO;
            }
        }
        return AttachmentType.FILE;
    }
    
    private Conversation getConversationOrThrow(Long conversationId) {
        return conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResourceNotFoundException("Conversation non trouvée"));
    }
    
    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }
    
    private ConversationParticipant getParticipantOrThrow(Long conversationId, Long userId) {
        return participantRepository.findByConversationIdAndUserId(conversationId, userId)
            .filter(ConversationParticipant::isActive)
            .orElseThrow(() -> new UnauthorizedException("Vous n'êtes pas participant de cette conversation"));
    }

    /**
     * Marquer toute la conversation comme lue
     */
    public void markConversationAsRead(Long conversationId, Long userId) {
        ConversationParticipant participant = getParticipantOrThrow(conversationId, userId);

        participant.setLastReadAt(LocalDateTime.now());
        participant.setUnreadCount(0);

        participantRepository.save(participant);
    }
}