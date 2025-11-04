package com.sante20.entity;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component // Déclare cette classe comme un bean Spring
public class AuditorAwareImpl implements AuditorAware<String> { // Utilisez String si createdBy/updatedBy sont de type String

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            // Si pas d'authentification ou si c'est une authentification anonyme
            return Optional.of("SYSTEM"); // Ou Optional.empty() si vous ne voulez rien pour les non-authentifiés
        }

        // Si l'utilisateur est authentifié, retourne son nom d'utilisateur
        // Assurez-vous que getPrincipal() retourne un objet dont le toString() est le nom d'utilisateur
        // Ou cast-le en UserDetails si vous utilisez Spring Security
        return Optional.of(authentication.getName()); // Retourne le nom de l'utilisateur (Principal)
    }
}