package com.sante20.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.List;

@Entity
public class Groupe extends Auditable<String>{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private String abreviation;
    private boolean isActive = true;
    private boolean isDelete = false;// Pour suppression logique
    private boolean isPublic = true;
    private String discipline; // Foot, Handball, etc.

    @ManyToOne
    @JoinColumn(name = "ville_id")
    private Ville ville;

    @ManyToOne
    @JoinColumn(name = "stade_id")
    private Stade stade;


    private String jourMatch; // Lundi, Mardi, etc.

    private String heureMatch;
    private String typeEquipe; // STATIQUE, DYNAMIQUE
    private Double fraisAdhesion;
    @ElementCollection
    private List<String> sanctionsTypes;
    @ElementCollection
    private List<Double> sanctionsMontants;


    @OneToMany(mappedBy = "groupe")
    @JsonIgnore
    private List<Membre> membres;

    @Enumerated(EnumType.STRING)
    private ModeEquipes modeEquipes;


    @OneToMany(mappedBy = "groupe", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Match> matchs;

    @OneToMany
    private List<Equipe> equipe;

    public Groupe(Long id, String nom, String profilePhotoUrl, String discipline, Ville ville) {
        super();
    }

    public Groupe() {
        super();
    }


    public enum ModeEquipes {
        STATIQUE, DYNAMIQUE
    }

    @ManyToMany
    @JsonIgnore
    @JoinTable(
            name = "groupe_type_sanction",
            joinColumns = @JoinColumn(name = "groupe_id"),
            inverseJoinColumns = @JoinColumn(name = "type_sanction_id")
    )
    private List<TypeSanction> typesSanctions;

    @OneToMany(mappedBy = "groupe", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Announcement> announcements;
    private String profilePhotoUrl;

    public boolean isIsActive() { return isActive; }
    public void setIsActive(boolean isActive) { this.isActive = isActive; }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public String getDiscipline() {
        return discipline;
    }

    public void setDiscipline(String discipline) {
        this.discipline = discipline;
    }

    public Ville getVille() {
        return ville;
    }

    public void setVille(Ville ville) {
        this.ville = ville;
    }

    public Stade getStade() {
        return stade;
    }

    public void setStade(Stade stade) {
        this.stade = stade;
    }

    public String getJourMatch() {
        return jourMatch;
    }

    public void setJourMatch(String jourMatch) {
        this.jourMatch = jourMatch;
    }

    public String getTypeEquipe() {
        return typeEquipe;
    }

    public void setTypeEquipe(String typeEquipe) {
        this.typeEquipe = typeEquipe;
    }

    public Double getFraisAdhesion() {
        return fraisAdhesion;
    }

    public void setFraisAdhesion(Double fraisAdhesion) {
        this.fraisAdhesion = fraisAdhesion;
    }

    public List<String> getSanctionsTypes() {
        return sanctionsTypes;
    }

    public void setSanctionsTypes(List<String> sanctionsTypes) {
        this.sanctionsTypes = sanctionsTypes;
    }

    public List<Double> getSanctionsMontants() {
        return sanctionsMontants;
    }

    public void setSanctionsMontants(List<Double> sanctionsMontants) {
        this.sanctionsMontants = sanctionsMontants;
    }

    public List<Membre> getMembres() {
        return membres;
    }

    public void setMembres(List<Membre> membres) {
        this.membres = membres;
    }

    public ModeEquipes getModeEquipes() {
        return modeEquipes;
    }

    public void setModeEquipes(ModeEquipes modeEquipes) {
        this.modeEquipes = modeEquipes;
    }

    public List<Match> getMatchs() {
        return matchs;
    }

    public void setMatchs(List<Match> matchs) {
        this.matchs = matchs;
    }

    public List<TypeSanction> getTypesSanctions() {
        return typesSanctions;
    }

    public void setTypesSanctions(List<TypeSanction> typesSanctions) {
        this.typesSanctions = typesSanctions;
    }

    public boolean isDelete() {
        return isDelete;
    }

    public void setDelete(boolean delete) {
        isDelete = delete;
    }

    public List<Equipe> getEquipe() {
        return equipe;
    }

    public void setEquipe(List<Equipe> equipe) {
        this.equipe = equipe;
    }

    public List<Announcement> getAnnouncements() {
        return announcements;
    }

    public void setAnnouncements(List<Announcement> announcements) {
        this.announcements = announcements;
    }

    public boolean isPublic() {
        return isPublic;
    }

    public void setPublic(boolean aPublic) {
        isPublic = aPublic;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public String getHeureMatch() {
        return heureMatch;
    }

    public void setHeureMatch(String heureMatch) {
        this.heureMatch = heureMatch;
    }

    public String getAbreviation() {
        return abreviation;
    }

    public void setAbreviation(String abreviation) {
        this.abreviation = abreviation;
    }
}