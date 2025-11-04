package com.sante20.dto;

import lombok.Data;

@Data
public class ApiResponse {
    private String message;

    public ApiResponse(String response) {
        this.message = response;
    }
}