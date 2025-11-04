package com.sante20.service;

import com.sante20.entity.*;
import com.sante20.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class MembreService {
    @Autowired
    private MembreRepository membreRepository;


    @Autowired
    private GroupeRepository groupeRepository;

    @Autowired
    private EquipeRepository equipeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContributionRepository contributionRepository;

    @Autowired
    private ContributionIndividuelleRepository contributionIndiciduelleRepository;

    @Autowired
    private SanctionRepository sanctionRepository;
    @Autowired
    private RoleRepository roleRepository;


    public Membre addMembre(Membre membre) {
        return membreRepository.save(membre);
    }

    public List<Membre> getMembresByGroupe(Long groupeId) {
        return membreRepository.findByGroupeIdOrderByNomAsc(groupeId);
    }

    public Membre updateCotisation(Long id, boolean payee) {
        Membre membre = membreRepository.findById(id).orElseThrow(() -> new RuntimeException("Membre not found"));
        membre.setCotisationPayee(payee);
        return membreRepository.save(membre);
    }



    public Membre createMembre(Map<String, Object> request) {
        Membre membre = new Membre();
        setMembreFields(membre, request);
        return membreRepository.save(membre);
    }

    public Membre updateMembre(Long id, Map<String, Object> request) {
        Membre membre = membreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        setMembreFields(membre, request);
        return membreRepository.save(membre);
    }

    public Membre updateMembre2(Map<String, Object> request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        Membre membre = membreRepository.findById(user.get().getMembre().getId())
                .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        setMembreFields(membre, request);
        return membreRepository.save(membre);
    }

    private void setMembreFields(Membre membre, Map<String, Object> request) {
        if (request.containsKey("nom")) {
            membre.setNom((String) request.get("nom"));
        }

        if (request.containsKey("sexe")) {
            membre.setSexe((String) request.get("sexe"));
        }
        if (request.containsKey("assurance")) {
            membre.setAssurance((Boolean) request.get("assurance"));
        }
        if (request.containsKey("prenom")) {
            membre.setPrenom((String) request.get("prenom"));
        }
        if (request.containsKey("adresse")) {
            membre.setAdresse((String) request.get("adresse"));
        }
        if (request.containsKey("tel")) {
            membre.setTel((String) request.get("tel"));
        }
        if (request.containsKey("cni")) {
            membre.setCni((String) request.get("cni"));
        }
        if (request.containsKey("dateNaissance") && request.get("dateNaissance") != null && !request.get("dateNaissance").toString().isEmpty()) {
            try {
                // Définir un formateur qui correspond au format ISO 8601 complet.
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

                // Convertir la chaîne en un objet LocalDate en utilisant le formateur.
                // La méthode parse() ignore la partie T00:00:00.000Z et ne conserve que la date.
                LocalDate dateNaissance = LocalDate.parse(request.get("dateNaissance").toString(), formatter);

                // Mettre à jour l'objet Membre
                membre.setDateNaissance(dateNaissance);
            } catch (DateTimeParseException e) {
                // Gérer le cas où la chaîne n'est pas au bon format.
                System.err.println("Erreur de format de date : " + e.getMessage());
                // Vous pouvez lever une exception personnalisée ici ou logger l'erreur.
            }
        }
        if (request.containsKey("poste")) {
            membre.setPoste((String) request.get("poste"));
        }
        if (request.containsKey("email")) {
            membre.setEmail((String) request.get("email"));
        }
        if (request.containsKey("cotisationPayee")) {
            membre.setCotisationPayee(Boolean.parseBoolean(request.get("cotisationPayee").toString()));
        }
        if (request.containsKey("buts")) {
            membre.setButs(Integer.parseInt(request.get("buts").toString()));
        }
        if (request.containsKey("passes")) {
            membre.setPasses(Integer.parseInt(request.get("passes").toString()));
        }
        if (request.containsKey("cartons")) {
            membre.setCartons(Integer.parseInt(request.get("cartons").toString()));
        }
        if (request.containsKey("roleCO") && request.get("roleCO")!=null && !request.get("roleCO").toString().isEmpty() ) {
            membre.setRoleCO((String) request.get("roleCO"));
        }

        if (request.containsKey("groupe")) {
            System.out.print("groupe present");
            Long groupeId = request.get("groupe") != null ? Long.parseLong(request.get("groupe").toString()) : null;
            if (groupeId != null) {
                Groupe groupe = groupeRepository.findById(groupeId)
                        .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
                membre.setGroupe(groupe);
            } else {
                membre.setGroupe(null);
            }
        }

        if (request.containsKey("equipe")) {
            // Gérer la relation avec Equipe
            Long equipeId = request.get("equipe") != null ? Long.parseLong(request.get("equipe").toString()) : null;
            if (equipeId != null) {
                Equipe equipe = equipeRepository.findById(equipeId)
                        .orElseThrow(() -> new RuntimeException("Equipe non trouvée"));
                membre.setEquipe(equipe);
            } else {
                membre.setEquipe(null);
            }
        }

        if (request.containsKey("user")) {
            Long userId = request.get("user") != null ? Long.parseLong(request.get("user").toString()) : null;
            if (userId != null) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
                membre.setUser(user);
            } else {
                membre.setUser(null);
            }
        }

        // Calculer les champs transitoires
        membre.setTotalContributions(calculateTotalContributions(membre.getId()));
        membre.setSoldeRestant(calculateSoldeRestant(membre.getId()));
        membre.setSoldeSanctionsRestant(calculateSoldeSanctionsRestant(membre.getId()));
    }

    public Membre getMembreById(Long id) {
        Membre membre = membreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        // Calculer les champs transitoires
        membre.setTotalContributions(calculateTotalContributions(id));
        membre.setSoldeRestant(calculateSoldeRestant(id));
        membre.setSoldeSanctionsRestant(calculateSoldeSanctionsRestant(id));
        return membre;
    }

    public List<Membre> getAllMembres() {
        List<Membre> membres = membreRepository.findAll();
//         Calculer les champs transitoires pour chaque membre
        for (Membre membre : membres) {
            membre.setTotalContributions(calculateTotalContributions(membre.getId()));
            membre.setSoldeRestant(calculateSoldeRestant(membre.getId()));
            membre.setSoldeSanctionsRestant(calculateSoldeSanctionsRestant(membre.getId()));
        }
        return membres;
    }

    public List<Membre> getMembresByGroupeId(Long groupeId) {
        List<Membre> membres = membreRepository.findByGroupeIdOrderByNomAsc(groupeId);
        // Calculer les champs transitoires
        for (Membre membre : membres) {
            membre.setTotalContributions(calculateTotalContributions(membre.getId()));
            membre.setSoldeRestant(calculateSoldeRestant(membre.getId()));
            membre.setSoldeSanctionsRestant(calculateSoldeSanctionsRestant(membre.getId()));
        }
        return membres;
    }

    public List<Membre> getMembresByEquipeId(Long equipeId) {
        List<Membre> membres = membreRepository.findByEquipeIdOrderByNomDesc(equipeId);
        // Calculer les champs transitoires
        for (Membre membre : membres) {
            membre.setTotalContributions(calculateTotalContributions(membre.getId()));
            membre.setSoldeRestant(calculateSoldeRestant(membre.getId()));
            membre.setSoldeSanctionsRestant(calculateSoldeSanctionsRestant(membre.getId()));
        }
        return membres;
    }

    public Membre getMembreByUserId(Long userId) {
        Membre membre = membreRepository.findByUserId(userId);
        if (membre == null) {
            throw new RuntimeException("Membre non trouvé pour l'utilisateur");
        }
        // Calculer les champs transitoires
        membre.setTotalContributions(calculateTotalContributions(membre.getId()));
        membre.setSoldeRestant(calculateSoldeRestant(membre.getId()));
        membre.setSoldeSanctionsRestant(calculateSoldeSanctionsRestant(membre.getId()));
        return membre;
    }

    public void deleteMembre(Long id) {
        Membre user = membreRepository.findById(id).orElseThrow(() -> new RuntimeException("User non trouvé"));
        user.setDelete(true);

        membreRepository.save(user);
    }

    private Double calculateTotalContributions(Long membreId) {
        if (membreId == null) return 0.0;
        List<ContributionIndividuelle> contributions = contributionIndiciduelleRepository.findByMembreId(membreId);
        return contributions.stream()
                .mapToDouble(ContributionIndividuelle::getMontant)
                .sum();
    }

    private Double calculateSoldeRestant(Long membreId) {
        if (membreId == null) return 0.0;
        // Hypothèse : un montant attendu fixe (par exemple, 100.0 par an)
        double montantAttendu = 100.0; // À ajuster selon la logique métier
        double totalContributions = calculateTotalContributions(membreId);
        return montantAttendu - totalContributions;
    }

    private Double calculateSoldeSanctionsRestant(Long membreId) {
        if (membreId == null) return 0.0;
        List<Sanction> sanctions = sanctionRepository.findByMembreId(membreId);
        return sanctions.stream()
                .mapToDouble(Sanction::getMontant)
                .sum();
    }

    public Membre enableUser(Long userId) {
        Membre user = membreRepository.findById(userId).orElseThrow(() -> new RuntimeException("User non trouvé"));
        user.setActive(true);
        return membreRepository.save(user);
    }

    public Membre disableUser(Long userId) {
        Membre user = membreRepository.findById(userId).orElseThrow(() -> new RuntimeException("User non trouvé"));
        user.setActive(false);
        return membreRepository.save(user);
    }


}