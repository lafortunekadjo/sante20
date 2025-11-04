package com.sante20.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusMessage {
    private String username;
    private String status; // ONLINE, OFFLINE, TYPING
}