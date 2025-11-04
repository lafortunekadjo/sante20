package com.sante20.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class ConversationDefi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Lien bidirectionnel avec le Défi, si vous voulez pouvoir retrouver la conversation depuis le Défi
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "defi_id")
    private DefiMatchAmical defi;

    // Pour l'affichage, vous pourriez stocker le dernier message
    private LocalDateTime dateDernierMessage;

    // Getters, Setters, Constructors...


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public DefiMatchAmical getDefi() {
        return defi;
    }

    public void setDefi(DefiMatchAmical defi) {
        this.defi = defi;
    }

    public LocalDateTime getDateDernierMessage() {
        return dateDernierMessage;
    }

    public void setDateDernierMessage(LocalDateTime dateDernierMessage) {
        this.dateDernierMessage = dateDernierMessage;
    }
}