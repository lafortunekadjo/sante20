package com.sante20.service;

import com.sante20.entity.Membre;
import com.sante20.entity.SortieDeCaisse;
import com.sante20.entity.TypeDepense;
import com.sante20.repository.MembreRepository;
import com.sante20.repository.SortieDeCaisseRepository;
import com.sante20.repository.TypeDepenseRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SortieDeCaisseService {

    @Autowired
    private SortieDeCaisseRepository sortieDeCaisseRepository;

    @Autowired
    private MembreRepository membreRepository;

    @Autowired
    private TypeDepenseRepository typeDepenseRepository; // Nouveau repository pour les types de dépenses

    @Transactional
    public SortieDeCaisse createSortieDeCaisse(Map<String, Object> request) throws ParseException {
        // Crée une nouvelle instance de SortieDeCaisse
        SortieDeCaisse sortieDeCaisse = new SortieDeCaisse();

        // Récupération et validation du champ requis (description)
        String description = (String) request.get("description");
        if (description == null || description.isEmpty()) {
            throw new IllegalArgumentException("La description de la sortie est requise.");
        }
        sortieDeCaisse.setDescription(description);

        // Récupération et validation du champ requis (montant)
        Object montantObj = request.get("montant");
        if (montantObj == null) {
            throw new IllegalArgumentException("Le montant de la sortie est requis.");
        }
        Double montant = null;
        if (montantObj instanceof String) {
            montant = Double.parseDouble((String) montantObj);
        } else if (montantObj instanceof Number) {
            montant = ((Number) montantObj).doubleValue();
        } else {
            throw new IllegalArgumentException("Le montant a un format invalide.");
        }
        sortieDeCaisse.setMontant(montant);

        // Récupération et validation du champ requis (utilisateur)
        Object utilisateurIdObj = request.get("utilisateurId");
        if (utilisateurIdObj == null) {
            throw new IllegalArgumentException("L'ID de l'utilisateur est requis.");
        }
        Long utilisateurId = null;
        if (utilisateurIdObj instanceof String) {
            utilisateurId = Long.parseLong((String) utilisateurIdObj);
        } else if (utilisateurIdObj instanceof Integer) {
            utilisateurId = ((Integer) utilisateurIdObj).longValue();
        } else {
            throw new IllegalArgumentException("L'ID de l'utilisateur a un format invalide.");
        }

        Optional<Membre> utilisateurOptional = membreRepository.findById(utilisateurId);
        if (utilisateurOptional.isEmpty()) {
            throw new IllegalArgumentException("Utilisateur non trouvé pour l'ID: " + utilisateurId);
        }
        sortieDeCaisse.setUtilisateur(utilisateurOptional.get());

        if (request.containsKey("dateSortie") && request.get("dateSortie") != null) {
            Object dateObj = request.get("dateSortie");
            if (dateObj instanceof String && !((String) dateObj).isEmpty()) {
                Instant instant = Instant.parse((String) dateObj); // parse directement le format ISO avec Z
                sortieDeCaisse.setDateSortie(instant.atZone(ZoneId.systemDefault()).toLocalDate());
            }
        }

        // Récupération et validation du nouveau champ requis (typeDepense)
        Object typeDepenseIdObj = request.get("typeDepenseId");
        if (typeDepenseIdObj == null) {
            throw new IllegalArgumentException("L'ID du type de dépense est requis.");
        }
        Long typeDepenseId = null;
        if (typeDepenseIdObj instanceof String) {
            typeDepenseId = Long.parseLong((String) typeDepenseIdObj);
        } else if (typeDepenseIdObj instanceof Integer) {
            typeDepenseId = ((Integer) typeDepenseIdObj).longValue();
        } else {
            throw new IllegalArgumentException("L'ID du type de dépense a un format invalide.");
        }

        Optional<TypeDepense> typeDepenseOptional = typeDepenseRepository.findById(typeDepenseId);
        if (typeDepenseOptional.isEmpty()) {
            throw new IllegalArgumentException("Type de dépense non trouvé pour l'ID: " + typeDepenseId);
        }
        sortieDeCaisse.setTypeDepense(typeDepenseOptional.get());


        // Enregistre et retourne la nouvelle sortie
        return sortieDeCaisseRepository.save(sortieDeCaisse);
    }

    public void deleteSortieDeCaisse(Long id) {
    }

    public List<SortieDeCaisse> getAllSortiesDeCaisse() {
        return sortieDeCaisseRepository.findAll();
    }

    public List<SortieDeCaisse> getGroupeSortiesDeCaisse() {
        return sortieDeCaisseRepository.findAll();
    }
}
