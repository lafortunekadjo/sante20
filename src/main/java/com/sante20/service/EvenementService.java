package com.sante20.service;

import com.sante20.entity.*;
import com.sante20.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class EvenementService {

    @Autowired
    private EvenementRepository evenementRepository;
    @Autowired
    private GroupeRepository groupeRepository;
    @Autowired
    private MembreRepository membreRepository;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContributionRepository contributionRepository;

    /**
     * Crée un nouvel événement à partir d'une Map de données.
     *
     * @param evenementData La Map contenant les données de l'événement.
     * @return L'entité Evenement sauvegardée.
     */
    @Transactional // Assure que les deux sauvegardes (Evenement et Contribution) sont atomiques
    public Evenement createEvenement(Map<String, Object> evenementData) {
        Evenement evenement = new Evenement();

        // --- 1. Conversion des données de la Map en entité Evenement ---

        if (evenementData.containsKey("nomEvenement")) {
            evenement.setNomEvenement((String) evenementData.get("nomEvenement"));
        }
        if (evenementData.containsKey("description")) {
            evenement.setDescription((String) evenementData.get("description"));
        }
        if (evenementData.containsKey("typeEvenement")) {
            evenement.setTypeEvenement((String) evenementData.get("typeEvenement"));
        }

        // Gestion de la date
        if (evenementData.containsKey("dateEvenement") && evenementData.get("dateEvenement") != null && !evenementData.get("dateEvenement").toString().isEmpty()) {
            try {
                // Utilisation de la méthode recommandée pour des chaînes de date ISO
                OffsetDateTime odt = OffsetDateTime.parse(evenementData.get("dateEvenement").toString());
                LocalDate dateEvenement = odt.toLocalDate();
                evenement.setDateEvenement(dateEvenement);
            } catch (DateTimeParseException e) {
                System.err.println("Erreur de format de date : " + e.getMessage());
                // Considérer de lever une exception ici pour empêcher la création si la date est cruciale
                throw new IllegalArgumentException("Format de date Evenement invalide.");
            }
        }

        // Récupération du Membre Lié
        Membre membreLie = null;
        if (evenementData.containsKey("idMembreLie") && evenementData.get("idMembreLie") != null && !evenementData.get("idMembreLie").toString().isEmpty() && !evenementData.get("idMembreLie").toString().equals("0")) {
            Long membreId = Long.valueOf(evenementData.get("idMembreLie").toString());
            membreLie = membreRepository.findById(membreId)
                    .orElseThrow(() -> new IllegalArgumentException("Membre lié non trouvé avec l'ID: " + membreId));
            evenement.setMembreLie(membreLie);
        }

        // Définition si la contribution est ouverte (important pour la logique suivante)
        boolean estContributionOuverte = false;
        if (evenementData.containsKey("estContributionOuverte") && evenementData.get("estContributionOuverte") != null) {
            estContributionOuverte = Boolean.parseBoolean(evenementData.get("estContributionOuverte").toString());
            evenement.setEstContributionOuverte(estContributionOuverte);
        }

        // Définition des champs de contexte (Groupe et Date de Création)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);

        evenement.setGroupe(user.orElseThrow(() -> new IllegalStateException("Utilisateur non trouvé ou non authentifié")).getGroupe());
        evenement.setDateCreation(new Date());

        // --- 2. Sauvegarde de l'événement ---
        Evenement savedEvenement = evenementRepository.save(evenement);

        // --- 3. Création de la Contribution si elle est ouverte ---
        if (savedEvenement.isEstContributionOuverte()) {

            // Assurez-vous qu'un membre est bien lié si une contribution est ouverte.
            if (membreLie == null) {
                System.err.println("Avertissement: Contribution ouverte sans membre lié.");
                // Vous pourriez choisir de lever une exception ici si c'est obligatoire.
            }

            Contribution contribution = new Contribution();

            // L'événement est l'entité rattachée, essentielle pour la relation OneToOne
            contribution.setEvenement(savedEvenement);

            // Membre lié (réutilisé de l'événement, peut être null si non fourni)
            contribution.setMembre(membreLie);

            // Initialisation des statuts
            contribution.setOpen(true);
            contribution.setAhdhesion(false);
            contribution.setCommentaire(evenement.getNomEvenement());


            // Initialisation du montant collecté actuel (nouvelle collecte)
            contribution.setMontantCollecteActuel(0.0);

            // Gestion des champs optionnels (si non présents dans la Map, ils restent null par défaut)
            // Si vous souhaitez les lire de evenementData, ajoutez la logique ici.

            // Sauvegarde de la Contribution
            contributionRepository.save(contribution);
        }

        return savedEvenement;
    }
    public Evenement updateEvenement(Long id, Map<String, Object> evenementData) {

            Evenement evenement = evenementRepository.findById(id).orElseThrow();

        try {
            if (evenementData.containsKey("nomEvenement")) {
                evenement.setNomEvenement((String) evenementData.get("nomEvenement"));
            }
            if (evenementData.containsKey("description")) {
                evenement.setDescription((String) evenementData.get("description"));
            }
            if (evenementData.containsKey("typeEvenement")) {
                evenement.setTypeEvenement((String) evenementData.get("typeEvenement"));
            }

            if (evenementData.containsKey("dateEvenement") && evenementData.get("dateEvenement") != null && !evenementData.get("dateEvenement").toString().isEmpty()) {
                try {
                    OffsetDateTime odt = OffsetDateTime.parse(evenementData.get("dateEvenement").toString());
                    LocalDate dateEvenement = odt.toLocalDate();
                    evenement.setDateEvenement(dateEvenement);


                    evenement.setDateEvenement(dateEvenement);
                } catch (DateTimeParseException e) {

                    System.err.println("Erreur de format de date : " + e.getMessage());

                }
            }
            if (evenementData.containsKey("idMembreLie") && evenementData.get("idMembreLie")!=null) {
                Membre membre = membreRepository.findById(Long.valueOf(evenementData.get("idMembreLie").toString())).orElseThrow();
                evenement.setMembreLie(membre);
            }
            if (evenementData.containsKey("estContributionOuverte") && evenementData.get("estContributionOuverte")!=null) {
                evenement.setEstContributionOuverte(Boolean.parseBoolean(evenementData.get("estContributionOuverte").toString()));
            }
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            System.out.println(authentication);
            String username = authentication.getName();
            Optional<User> user = userRepository.findByUsername(username);

            evenement.setGroupe(user.get().getGroupe());
            evenement.setDateCreation(new Date());

            // Liaison facultative à un membre
        } catch (Exception e) {
            // Gérer les exceptions de casting ou de format
            throw new IllegalArgumentException("Invalid data provided in the map: " + e.getMessage());
        }

        return evenementRepository.save(evenement);
    }

    public Evenement fermerContribution(Long id) {
        Evenement evenement = evenementRepository.findById(id).orElseThrow(() -> new RuntimeException("evenement non trouve"));
        evenement.setEstContributionOuverte(false);
        Contribution contribution = evenement.getContribution();
        contribution.setOpen(false);
        contributionRepository.save(contribution);
        return evenementRepository.save(evenement);
    }

    public Evenement ouvrirContribution(Long id) {
        Evenement evenement = evenementRepository.findById(id).orElseThrow(() -> new RuntimeException("evenement non trouve"));
        evenement.setEstContributionOuverte(true);
        Contribution contribution = evenement.getContribution();
        contribution.setOpen(true);
        contributionRepository.save(contribution);
        return evenementRepository.save(evenement);
    }


    public List<Evenement> getAllEvenements() {
        return evenementRepository.findAll();
    }

    public List<Evenement> getAllEvenementsGroupe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        return evenementRepository.findByGroupe(user.get().getGroupe());
    }
}