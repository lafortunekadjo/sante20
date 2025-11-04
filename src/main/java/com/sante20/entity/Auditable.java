package com.sante20.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@MappedSuperclass // Indique que les champs de cette classe doivent être mappés dans les tables des classes qui l'étendent.
@EntityListeners(AuditingEntityListener.class) // Active l'écoute des événements d'entité pour l'audit.
public abstract class Auditable<U> { // <U> est le type de l'utilisateur (ex: String ou Long pour l'ID de l'utilisateur)

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private U createdBy; // Peut être String pour le nom d'utilisateur, ou Long/Integer pour l'ID

    @CreatedDate
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedBy
    @Column(name = "updated_by") // updatable = true par défaut, mais explicite pour clarté
    private U updatedBy;

    @LastModifiedDate
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- Getters et Setters ---
    // Vous pouvez les générer avec votre IDE ou les écrire manuellement.

    public U getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(U createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public U getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(U updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}