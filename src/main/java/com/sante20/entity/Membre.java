package com.sante20.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.List;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
public class Membre extends Auditable<String>{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    private String poste; // Attaquant, Gardien, etc.
    private String email;
    private boolean cotisationPayee;
    private int buts;
    private int passes;
    private int cartons;
    private boolean isDelete = false;

    private boolean isActive = true;
    @Transient
    private Double totalContributions;
    @Transient
    private Double soldeRestant;

    @ManyToOne
    @JoinColumn(name = "groupe_id")
    @JsonIgnore
    private Groupe groupe;

    private String roleCO;

    private String sexe;
    private String tel;
    private String cni;
    private String profession;
    private String adresse;
    private Boolean assurance;

    @ManyToOne
    @JoinColumn(name = "equipe_id")
    private Equipe equipe; // Null si mode dynamique

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    // ✅ NOUVEAU : Rôle personnalisé dans le groupe
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_custom_id")
    private RoleCustom roleCustom;

    @Transient
    private Double soldeSanctionsRestant;

    // Un membre peut être la personne "liée" à plusieurs événements (ex: un deuil)
    @OneToMany(mappedBy = "membreLie")
    @JsonIgnore
    private List<Evenement> evenementsLies;

    // Un membre peut faire plusieurs contributions
    @OneToMany(mappedBy = "membre")
    @JsonIgnore
    private List<ContributionIndividuelle> contributionsIndividuelles;


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

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public LocalDate getDateNaissance() {
        return dateNaissance;
    }

    public void setDateNaissance(LocalDate dateNaissance) {
        this.dateNaissance = dateNaissance;
    }

    public String getPoste() {
        return poste;
    }

    public void setPoste(String poste) {
        this.poste = poste;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isCotisationPayee() {
        return cotisationPayee;
    }

    public void setCotisationPayee(boolean cotisationPayee) {
        this.cotisationPayee = cotisationPayee;
    }

    public int getButs() {
        return buts;
    }

    public void setButs(int buts) {
        this.buts = buts;
    }

    public int getPasses() {
        return passes;
    }

    public void setPasses(int passes) {
        this.passes = passes;
    }

    public int getCartons() {
        return cartons;
    }

    public void setCartons(int cartons) {
        this.cartons = cartons;
    }


    public void setTotalContributions(Double totalContributions) {
        this.totalContributions = totalContributions;
    }

    public Double getSoldeRestant() {
        return soldeRestant;
    }

    public void setSoldeRestant(Double soldeRestant) {
        this.soldeRestant = soldeRestant;
    }

    public Groupe getGroupe() {
        return groupe;
    }

    public void setGroupe(Groupe groupe) {
        this.groupe = groupe;
    }

    public String getRoleCO() {
        return roleCO;
    }

    public void setRoleCO(String roleCO) {
        this.roleCO = roleCO;
    }

    public Equipe getEquipe() {
        return equipe;
    }

    public void setEquipe(Equipe equipe) {
        this.equipe = equipe;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Double getSoldeSanctionsRestant() {
        return soldeSanctionsRestant;
    }

    public void setSoldeSanctionsRestant(Double soldeSanctionsRestant) {
        this.soldeSanctionsRestant = soldeSanctionsRestant;
    }

    public boolean isDelete() {
        return !isDelete;
    }

    public void setDelete(boolean delete) {
        isDelete = delete;
    }

    public String getSexe() {
        return sexe;
    }

    public void setSexe(String sexe) {
        this.sexe = sexe;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public Double getTotalContributions() {
        return totalContributions;
    }

    public String getTel() {
        return tel;
    }

    public List<Evenement> getEvenementsLies() {
        return evenementsLies;
    }

    public void setEvenementsLies(List<Evenement> evenementsLies) {
        this.evenementsLies = evenementsLies;
    }

    public List<ContributionIndividuelle> getContributionsIndividuelles() {
        return contributionsIndividuelles;
    }

    public void setContributionsIndividuelles(List<ContributionIndividuelle> contributionsIndividuelles) {
        this.contributionsIndividuelles = contributionsIndividuelles;
    }

    public void setTel(String tel) {
        this.tel = tel;
    }

    public String getCni() {
        return cni;
    }

    public void setCni(String cni) {
        this.cni = cni;
    }

    public String getProfession() {
        return profession;
    }

    public void setProfession(String profession) {
        this.profession = profession;
    }

    public String getAdresse() {
        return adresse;
    }

    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }

    public Boolean getAssurance() {
        return assurance;
    }

    public void setAssurance(Boolean assurance) {
        this.assurance = assurance;
    }

    public RoleCustom getRoleCustom() {
        return roleCustom;
    }

    public void setRoleCustom(RoleCustom roleCustom) {
        this.roleCustom = roleCustom;
    }
}