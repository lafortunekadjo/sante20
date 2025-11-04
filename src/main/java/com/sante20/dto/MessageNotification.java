package com.sante20.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageNotification {
    private MessageResponse message;
    private String type; // NEW_MESSAGE, MESSAGE_EDITED, MESSAGE_DELETED
}