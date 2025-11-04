package com.sante20.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypingIndicator {
    private Long conversationId;
    private Long userId;
    private String userName;
    private Boolean isTyping;
}