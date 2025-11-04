package com.sante20.controller;


import com.sante20.dto.ApiResponse;
import com.sante20.dto.EditMessageRequest;
import com.sante20.dto.MessageResponse;
import com.sante20.dto.SendMessageRequest;
import com.sante20.entity.Message;
import com.sante20.entity.User;
import com.sante20.service.CustomUserDetailsService;
import com.sante20.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/conversations/{conversationId}/messages")
@RequiredArgsConstructor
//@Tag(name = "Messages", description = "API de gestion des messages")
@PreAuthorize("isAuthenticated()")
public class MessageController {
    
    private final MessageService messageService;

    @Autowired
    private CustomUserDetailsService userService;
    
    @PostMapping
    //@Operation(summary = "Envoyer un message texte")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        Message message = messageService.sendTextMessage(
            conversationId,
            currentUser.getId(),
            request.getContent()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(MessageResponse.fromEntity(message));
    }
    
    @PostMapping(value = "/with-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    //@Operation(summary = "Envoyer un message avec pièce jointe")
    public ResponseEntity<MessageResponse> sendMessageWithAttachment(
            @PathVariable Long conversationId,
            @RequestParam(required = false) String content,
            @RequestParam("file") MultipartFile file
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        Message message = messageService.sendMessageWithAttachment(
            conversationId,
            currentUser.getId(),
            content != null ? content : "",
            file
        );
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(MessageResponse.fromEntity(message));
    }
    
    @GetMapping
    //@Operation(summary = "Récupérer les messages d'une conversation (paginés)")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        Pageable pageable = PageRequest.of(
            page, 
            size, 
            Sort.by(Sort.Direction.DESC, "createdAt")
        );
        
        Page<Message> messages = messageService.getConversationMessages(
            conversationId,
            currentUser.getId(),
            pageable
        );
        
        Page<MessageResponse> response = messages.map(MessageResponse::fromEntity);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/new")
   // @Operation(summary = "Récupérer les nouveaux messages depuis une date")
    public ResponseEntity<List<MessageResponse>> getNewMessages(
            @PathVariable Long conversationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        List<Message> messages = messageService.getNewMessages(
            conversationId,
            currentUser.getId(),
            since
        );
        
        List<MessageResponse> response = messages.stream()
            .map(MessageResponse::fromEntity)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{messageId}")
    //@Operation(summary = "Modifier un message")
    public ResponseEntity<MessageResponse> editMessage(
            @PathVariable Long conversationId,
            @PathVariable Long messageId,
            @Valid @RequestBody EditMessageRequest request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        Message message = messageService.editMessage(
            messageId,
            currentUser.getId(),
            request.getNewContent()
        );
        
        return ResponseEntity.ok(MessageResponse.fromEntity(message));
    }
    
    @DeleteMapping("/{messageId}")
   // @Operation(summary = "Supprimer un message")
    public ResponseEntity<ApiResponse> deleteMessage(
            @PathVariable Long conversationId,
            @PathVariable Long messageId
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        messageService.deleteMessage(messageId, currentUser.getId());
        
        return ResponseEntity.ok(
            new ApiResponse("Message supprimé")
        );
    }
    
    @PostMapping("/{messageId}/read")
    //@Operation(summary = "Marquer un message comme lu")
    public ResponseEntity<ApiResponse> markMessageAsRead(
            @PathVariable Long conversationId,
            @PathVariable Long messageId
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();
        messageService.markMessageAsRead(messageId, currentUser.getId());
        
        return ResponseEntity.ok(
            new ApiResponse("Message marqué comme lu")
        );
    }
}