package com.sante20.dto;

import lombok.Data;

@Data
public class ConversationSettings {
    private Boolean canLeave = true;
    private Boolean canAddMembers = false;
    private Boolean onlyAdminsCanWrite = false;
}