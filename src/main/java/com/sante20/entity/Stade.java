package com.sante20.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "stade")
public class Stade extends Auditable<String>{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;

    private double stadiumLat;
    private double stadiumLon ;
    private double radius ;

    @OneToMany(mappedBy = "stade")
    @JsonIgnore
    private List<Groupe> groupes;

    // Getters, Setters, Constructors


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

    public List<Groupe> getGroupes() {
        return groupes;
    }

    public void setGroupes(List<Groupe> groupes) {
        this.groupes = groupes;
    }

    public double getStadiumLat() {
        return stadiumLat;
    }

    public void setStadiumLat(double stadiumLat) {
        this.stadiumLat = stadiumLat;
    }

    public double getStadiumLon() {
        return stadiumLon;
    }

    public void setStadiumLon(double stadiumLon) {
        this.stadiumLon = stadiumLon;
    }

    public double getRadius() {
        return radius;
    }

    public void setRadius(double radius) {
        this.radius = radius;
    }
}