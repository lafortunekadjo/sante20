package com.sante20.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class Match extends Auditable<String>{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Boolean forfait;
    private String equipeForfait;

    @ManyToOne
    @JoinColumn(name = "groupe_id")
    @JsonIgnore
    private Groupe groupe;

    @ManyToOne
    @JoinColumn(name = "membre_id")
    @JsonIgnore
    private Membre membre1;

    private LocalDate dateMatch;
    private String adversaire;
    private String lieu;
    private String commentaire;
    private String membre;

    @OneToMany(mappedBy = "match")
    @JsonIgnore
    private List<Presence> presences;

    @OneToMany(mappedBy = "match")
    @JsonIgnore
    private List<Sanction> sanctions;

    @Enumerated(EnumType.STRING)
    private TypeMatch typeMatch;
    @ElementCollection
    private List<String> imageUrls;
    public enum TypeMatch {
        AMICAL, INTERNE, DUEL, ANNIVERSAIRE
    }
    private int scoreAdversaire = 0;

    @ManyToOne
    @JoinColumn(name = "arbitre_principal_id")
    private Membre arbitrePrincipal;

    @Column(name = "arbitre_principal_nom_occasionnel")
    private String arbitrePrincipalNomOccasionnel;

    @ManyToOne
    @JoinColumn(name = "arbitre_assistant_id")
    private Membre arbitreAssistant;

    @Column(name = "arbitre_assistant_nom_occasionnel")
    private String arbitreAssistantNomOccasionnel;

    @ManyToOne
    @JoinColumn(name = "rapporteur_id")
    private Membre rapporteur;

    @Column(name = "rapporteur_nom_occasionnel")
    private String rapporteurNomOccasionnel;

    @ElementCollection
    @CollectionTable(name = "match_media", joinColumns = @JoinColumn(name = "match_id"))
    @Column(name = "media_url")
    private List<String> mediaUrls = new ArrayList<>();

    public Match() {}
    public Match(Groupe groupe, TypeMatch typeMatch, LocalDate dateMatch, String adversaire, String lieu) {
        this.groupe = groupe;
        this.typeMatch = typeMatch;
        this.dateMatch = dateMatch;
        this.adversaire = adversaire;
        this.lieu = lieu;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Groupe getGroupe() { return groupe; }
    public void setGroupe(Groupe groupe) { this.groupe = groupe; }
    public LocalDate getDateMatch() { return dateMatch; }
    public void setDateMatch(LocalDate dateMatch) { this.dateMatch = dateMatch; }
    public String getAdversaire() { return adversaire; }
    public void setAdversaire(String adversaire) { this.adversaire = adversaire; }
    public String getLieu() { return lieu; }
    public void setLieu(String lieu) { this.lieu = lieu; }
    public List<Presence> getPresences() { return presences; }
    public void setPresences(List<Presence> presences) { this.presences = presences; }
    public List<Sanction> getSanctions() { return sanctions; }
    public void setSanctions(List<Sanction> sanctions) { this.sanctions = sanctions; }

    public String getCommentaire() {
        return commentaire;
    }

    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }

    public String getMembre() {
        return membre;
    }

    public void setMembre(String membre) {
        this.membre = membre;
    }

    public TypeMatch getTypeMatch() {
        return typeMatch;
    }

    public void setTypeMatch(TypeMatch typeMatch) {
        this.typeMatch = typeMatch;
    }

    public Membre getMembre1() {
        return membre1;
    }

    public void setMembre1(Membre membre1) {
        this.membre1 = membre1;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }



    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public Boolean getForfait() {
        return forfait;
    }

    public void setForfait(Boolean forfait) {
        this.forfait = forfait;
    }

    public String getEquipeForfait() {
        return equipeForfait;
    }

    public void setEquipeForfait(String equipeForfait) {
        this.equipeForfait = equipeForfait;
    }

    public List<String> getMediaUrls() {
        return mediaUrls;
    }

    public void setMediaUrls(List<String> mediaUrls) {
        this.mediaUrls = mediaUrls;
    }


    public Membre getArbitrePrincipal() {
        return arbitrePrincipal;
    }

    public void setArbitrePrincipal(Membre arbitrePrincipal) {
        this.arbitrePrincipal = arbitrePrincipal;
    }

    public String getArbitrePrincipalNomOccasionnel() {
        return arbitrePrincipalNomOccasionnel;
    }

    public void setArbitrePrincipalNomOccasionnel(String arbitrePrincipalNomOccasionnel) {
        this.arbitrePrincipalNomOccasionnel = arbitrePrincipalNomOccasionnel;
    }

    public Membre getArbitreAssistant() {
        return arbitreAssistant;
    }

    public void setArbitreAssistant(Membre arbitreAssistant) {
        this.arbitreAssistant = arbitreAssistant;
    }

    public String getArbitreAssistantNomOccasionnel() {
        return arbitreAssistantNomOccasionnel;
    }

    public void setArbitreAssistantNomOccasionnel(String arbitreAssistantNomOccasionnel) {
        this.arbitreAssistantNomOccasionnel = arbitreAssistantNomOccasionnel;
    }

    public Membre getRapporteur() {
        return rapporteur;
    }

    public void setRapporteur(Membre rapporteur) {
        this.rapporteur = rapporteur;
    }

    public String getRapporteurNomOccasionnel() {
        return rapporteurNomOccasionnel;
    }

    public void setRapporteurNomOccasionnel(String rapporteurNomOccasionnel) {
        this.rapporteurNomOccasionnel = rapporteurNomOccasionnel;
    }

    public int getScoreAdversaire() {
        return scoreAdversaire;
    }

    public void setScoreAdversaire(int scoreAdversaire) {
        this.scoreAdversaire = scoreAdversaire;
    }
}