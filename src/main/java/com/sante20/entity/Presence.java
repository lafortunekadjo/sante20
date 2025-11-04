package com.sante20.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "presence")
public class Presence extends Auditable<String>{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "membre_id")
    private Membre membre;

    @ManyToOne
    @JoinColumn(name = "match_id")
    private Match match;

    @Column(name = "nom_occasionnel")
    private String nomOccasionnel;

    private boolean aJoue;
    private boolean estCapitaine;
    private int buts;
    private int passes;
    private boolean estHommeDuMatch;
    private boolean estHommeDuMatchEq;
    private String equipeMatch;
    private int cartonsJaunes;
    private int cartonsRouges;

    private LocalDateTime timestamp;
    private boolean locationValid;

    // Ajout du champ pour les buts contre son camp (CSC)
    private int butsContreSonCamp ;
    private int penalti ;

    public Presence() {}
    public Presence(Membre membre, Match match, boolean aJoue, boolean estCapitaine, int buts, int passes, boolean estHommeDuMatch , boolean estHommeDuMatchEq) {
        this.membre = membre;
        this.match = match;
        this.aJoue = aJoue;
        this.estCapitaine = estCapitaine;
        this.buts = buts;
        this.passes = passes;
        this.estHommeDuMatch = estHommeDuMatch;
        this.estHommeDuMatchEq = estHommeDuMatchEq;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Membre getMembre() { return membre; }
    public void setMembre(Membre membre) { this.membre = membre; }
    public Match getMatch() { return match; }
    public void setMatch(Match match) { this.match = match; }
    public boolean isAJoue() { return aJoue; }
    public void setAJoue(boolean aJoue) { this.aJoue = aJoue; }
    public boolean isEstCapitaine() { return estCapitaine; }
    public void setEstCapitaine(boolean estCapitaine) { this.estCapitaine = estCapitaine; }
    public int getButs() { return buts; }
    public void setButs(int buts) { this.buts = buts; }
    public int getPasses() { return passes; }
    public void setPasses(int passes) { this.passes = passes; }
    public boolean isEstHommeDuMatch() { return estHommeDuMatch; }
    public void setEstHommeDuMatch(boolean estHommeDuMatch) { this.estHommeDuMatch = estHommeDuMatch; }

    public boolean isaJoue() {
        return aJoue;
    }

    public void setaJoue(boolean aJoue) {
        this.aJoue = aJoue;
    }

    public String getEquipeMatch() {
        return equipeMatch;
    }

    public void setEquipeMatch(String equipeMatch) {
        this.equipeMatch = equipeMatch;
    }

    public int getCartonsJaunes() {
        return cartonsJaunes;
    }

    public void setCartonsJaunes(int cartonsJaunes) {
        this.cartonsJaunes = cartonsJaunes;
    }

    public int getCartonsRouges() {
        return cartonsRouges;
    }

    public void setCartonsRouges(int cartonsRouges) {
        this.cartonsRouges = cartonsRouges;
    }

    public boolean isEstHommeDuMatchEq() {
        return estHommeDuMatchEq;
    }

    public void setEstHommeDuMatchEq(boolean estHommeDuMatchEq) {
        this.estHommeDuMatchEq = estHommeDuMatchEq;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public boolean isLocationValid() {
        return locationValid;
    }

    public void setLocationValid(boolean locationValid) {
        this.locationValid = locationValid;
    }

    public String getNomOccasionnel() {
        return nomOccasionnel;
    }

    public void setNomOccasionnel(String nomOccasionnel) {
        this.nomOccasionnel = nomOccasionnel;
    }

    public int getButsContreSonCamp() {
        return butsContreSonCamp;
    }

    public void setButsContreSonCamp(int butsContreSonCamp) {
        this.butsContreSonCamp = butsContreSonCamp;
    }

    public int getPenalti() {
        return penalti;
    }

    public void setPenalti(int penalti) {
        this.penalti = penalti;
    }
}