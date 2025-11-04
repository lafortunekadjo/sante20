package com.sante20.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sante20.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String photoUrl;
    
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .nom(user.getMembre().getNom())
            .prenom(user.getMembre().getPrenom())
            .email(user.getEmail())
            .photoUrl(user.getProfilePhotoUrl())
            .build();
    }
}