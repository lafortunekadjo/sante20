package com.sante20.service;

import com.sante20.entity.*;
import com.sante20.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GroupeService {

    @Autowired
    private GroupeRepository groupeRepository;
    @Autowired
    private VilleRepository villeRepository;
    @Autowired
    private StadeRepository stadeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembreRepository membreRepository;

    @Autowired
    private TypeSanctionRepository typeSanctionRepository;
    @Autowired
    private SanctionRepository sanctionRepository;

    @Autowired
    private MatchRepository matchRepository;
    @Autowired
    private PresenceRepository presenceRepository;
    @Autowired
    private ContributionRepository contributionRepository;

    @Autowired
    private ContributionIndividuelleRepository contributionIndividuelleRepository;

    @Autowired
    private PaiementSanctionRepository paiementSanctionRepository;

    public Groupe createGroupe(Map<String, Object> request) {
        Long villeId = Long.parseLong(request.get("ville").toString());
        Long stadeId = Long.parseLong(request.get("stade").toString());
        Ville ville = villeRepository.findById(villeId).orElseThrow(() -> new RuntimeException("Ville non trouvée"));
        Stade stade = stadeRepository.findById(stadeId).orElseThrow(() -> new RuntimeException("Stade non trouvé"));

        Groupe groupe = new Groupe();
        groupe.setNom((String) request.get("nom"));
        groupe.setAbreviation((String) request.get("abreviation"));
        groupe.setDiscipline((String) request.get("discipline"));
        groupe.setVille(ville);
        groupe.setStade(stade);
        groupe.setIsActive(true);
        return groupeRepository.save(groupe);
    }

    public Groupe updateGroupe(Long groupeId, Map<String, Object> request) {
        Groupe groupe = groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        if (request.containsKey("nom")) groupe.setNom((String) request.get("nom"));
        if (request.containsKey("abreviation")) groupe.setAbreviation((String) request.get("abreviation"));
        if (request.containsKey("jourMatch")) groupe.setJourMatch((String) request.get("jourMatch"));
        if (request.containsKey("fraisAdhesion")) groupe.setFraisAdhesion(Double.valueOf(request.get("fraisAdhesion").toString()));
        if (request.containsKey("modeEquipe")){
            if((String) request.get("modeEquipe") == "STATIQUE") groupe.setModeEquipes(Groupe.ModeEquipes.STATIQUE);
            else groupe.setModeEquipes(Groupe.ModeEquipes.DYNAMIQUE);
        }
        if (request.containsKey("typeEquipe")) groupe.setTypeEquipe((String) request.get("typeEquipe"));
        if (request.containsKey("discipline")) groupe.setDiscipline((String) request.get("discipline"));
        if (request.containsKey("villeId")) {
            Long villeId = Long.parseLong(request.get("villeId").toString());
            Ville ville = villeRepository.findById(villeId).orElseThrow(() -> new RuntimeException("Ville non trouvée"));
            groupe.setVille(ville);
        }
        if (request.containsKey("stadeId")) {
            Long stadeId = Long.parseLong(request.get("stadeId").toString());
            Stade stade = stadeRepository.findById(stadeId).orElseThrow(() -> new RuntimeException("Stade non trouvé"));
            groupe.setStade(stade);
        }
        if (request.containsKey("isPublic")) {
            groupe.setPublic(Boolean.parseBoolean(request.get("isPublic").toString()));
        }
        if (request.containsKey("heureMatch")) groupe.setHeureMatch((String) request.get("heureMatch"));
        return groupeRepository.save(groupe);
    }

    public void deleteGroupe(Long groupeId) {
        Groupe groupe = groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        groupe.setIsActive(false);
        groupe.setDelete(true);
        groupeRepository.save(groupe);
    }

    public void disableGroupe(Long groupeId) {
        Groupe groupe = groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        groupe.setIsActive(false);
        groupeRepository.save(groupe);// Pour l'instant, même logique que suppression logique
    }

    public void enableGroupe(Long groupeId) {
        Groupe groupe = groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        groupe.setIsActive(true); // Pour l'instant, même logique que suppression logique
        groupeRepository.save(groupe);
    }

    public List<Groupe> findAllActive() {
        return groupeRepository.findByIsActiveTrue();
    }

    public List<Groupe> findAllPublic() {
        return groupeRepository.findByIsPublicTrue();
    }

    public List<Groupe> findAll() {
        return groupeRepository.findByIsDeleteFalse();
    }



    public Groupe findByUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User non trouvé"));
        return groupeRepository.findById(user.getMembre().getGroupe().getId()).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
    }

    public Groupe findById(Long groupeId) {
        Groupe groupe = groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("gROUPE non trouvé"));
        return groupe;
    }

    public void configureGroupe(Long groupeId, Map<String, Object> config) {
        Groupe groupe = groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        if (config.containsKey("jourMatch")) groupe.setJourMatch((String) config.get("jourMatch"));
        if (config.containsKey("typeEquipe")) groupe.setTypeEquipe((String) config.get("typeEquipe"));
        if (config.containsKey("modeEquipe")) groupe.setTypeEquipe((String) config.get("modeEquipe"));
        if (config.containsKey("fraisAdhesion"))
            groupe.setFraisAdhesion(Double.parseDouble(config.get("fraisAdhesion").toString()));
        if (config.containsKey("typeSanctionIds")) {
            List<Long> typeSanctionIds = ((List<?>) config.get("typeSanctionIds")).stream()
                    .map(id -> Long.parseLong(id.toString()))
                    .collect(Collectors.toList());
            List<TypeSanction> typesSanctions = typeSanctionRepository.findAllById(typeSanctionIds);
            groupe.setTypesSanctions(typesSanctions);
        }
        if (config.containsKey("sanctionsMontants"))
            groupe.setSanctionsMontants((List<Double>) config.get("sanctionsMontants"));
        groupeRepository.save(groupe);
    }

    public void addMembre(Map<String, Object> request) {
        // Convertir groupe en Long
        long groupeId;
        Object groupeObj = request.get("groupe");
        if (groupeObj instanceof Integer) {
            groupeId = ((Integer) groupeObj).longValue();
        } else if (groupeObj instanceof Long) {
            groupeId = (Long) groupeObj;
        } else {
            throw new IllegalArgumentException("Le champ 'groupe' doit être un entier.");
        }
        Groupe groupe = groupeRepository.findById(groupeId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        // Convertir user en Long
        long userId;
        Object userObj = request.get("user");
        if (userObj instanceof Integer) {
            userId = ((Integer) userObj).longValue();
        } else if (userObj instanceof Long) {
            userId = (Long) userObj;
        } else {
            throw new IllegalArgumentException("Le champ 'user' doit être un entier.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Gérer email (peut être null)
        String email = request.get("email") != null ? (String) request.get("email") : null;

        Membre membre = new Membre();
        membre.setNom((String) request.get("nom"));
        membre.setPrenom((String) request.get("prenom"));
        membre.setDateNaissance(LocalDate.parse((String) request.get("dateNaissance")));
        membre.setPoste(request.get("poste") != null ? (String) request.get("poste") : null);
        membre.setEmail(email);
        membre.setGroupe(groupe);
        membre.setRoleCO(request.get("roleCO") != null ? (String) request.get("roleCO") : null);
        membre.setCotisationPayee(request.containsKey("cotisationPayee") ? (Boolean) request.get("cotisationPayee") : false);
        membre.setUser(user);
//        membre.set(request.containsKey("active") ? (Boolean) request.get("active") : true);

        membreRepository.save(membre);

        // Mettre à jour le rôle de l'utilisateur en fonction de roleCO
        if (request.containsKey("roleCO") && request.get("roleCO") != null && !((String) request.get("roleCO")).isEmpty()) {
            user.setRole("RESPONSABLE");
        } else {
            user.setRole("MEMBRE");
        }
        user.setMembre(membre);
        userRepository.save(user);
    }

    public void removeMembre(Long groupeId, String email) {
        Membre membre = membreRepository.findByGroupeIdOrderByNomAsc(groupeId).stream()
                .filter(m -> m.getEmail().equals(email))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("user non trouvé"));
        if (user != null) {
            user.setMembre(null);
            user.setRole("MEMBRE");
            userRepository.save(user);
        }
        membreRepository.delete(membre);
    }

    public TypeSanction createTypeSanction(Map<String, Object> request) {
        TypeSanction typeSanction = new TypeSanction();
        typeSanction.setNom((String) request.get("nom"));
        typeSanction.setDescription((String) request.get("description"));
        typeSanction.setMontantParDefaut(Double.parseDouble(request.get("montantParDefaut").toString()));
        return typeSanctionRepository.save(typeSanction);
    }

    @Transactional
    public Sanction applySanction(Map<String, Object> request) {
        // Récupérer et valider membre
        Long membreId = Long.parseLong(request.getOrDefault("membre", "0").toString());
        Membre membre = membreRepository.findById(membreId)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé avec ID: " + membreId));

        // Récupérer et valider type de sanction
        Long typeSanctionId = Long.parseLong(request.getOrDefault("typeSanction", "0").toString());
        TypeSanction typeSanction = typeSanctionRepository.findById(typeSanctionId)
                .orElseThrow(() -> new RuntimeException("Type de sanction non trouvé avec ID: " + typeSanctionId));



        // Créer la sanction
        Sanction sanction = new Sanction();
        sanction.setMembre(membre);
        sanction.setTypeSanction(typeSanction);


        // Gérer la dateSanction
        String dateSanctionStr = (String) request.get("dateSanction");
        if (dateSanctionStr != null && !dateSanctionStr.isEmpty()) {
            try {
                // Essayer de parser comme LocalDateTime (ISO 8601)
                LocalDateTime dateTime = LocalDateTime.parse(dateSanctionStr, DateTimeFormatter.ISO_DATE_TIME);
                sanction.setDateSanction(dateTime.toLocalDate());
            } catch (DateTimeParseException e) {
                // Essayer de parser comme LocalDate (yyyy-MM-dd)
                try {
                    sanction.setDateSanction(LocalDate.parse(dateSanctionStr, DateTimeFormatter.ISO_LOCAL_DATE));
                } catch (DateTimeParseException ex) {
                    throw new RuntimeException("Format de date invalide pour dateSanction: " + dateSanctionStr);
                }
            }
        } else {
            throw new RuntimeException("dateSanction est requis");
        }

        // Gérer le montant
        if (request.get("montant") != null) {
            try {
                sanction.setMontant(Double.parseDouble(request.get("montant").toString()));
            } catch (NumberFormatException e) {
                throw new RuntimeException("Format de montant invalide: " + request.get("montant"));
            }
        } else {
            // Utiliser le montant par défaut du type de sanction si disponible
            sanction.setMontant(typeSanction.getMontantParDefaut() != null ? typeSanction.getMontantParDefaut() : 0.0);
        }

        // Gérer le commentaire
        sanction.setCommentaire((String) request.getOrDefault("commentaire", ""));

        // Définir l'état par défaut si non spécifié
        String etat = (String) request.getOrDefault("etat", Sanction.EtatSanction.NON_PAYEE.toString());
        try {
            sanction.setEtat(Sanction.EtatSanction.valueOf(etat));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("État de sanction invalide: " + etat);
        }

        // Enregistrer et retourner la sanction
        return sanctionRepository.save(sanction);
    }

    public List<Sanction> listeSanction(Long membreId) {

        return sanctionRepository.findByMembreId(membreId);
    }


    public Match createMatch(Long groupeId, Map<String, Object> request) {
        Groupe groupe = groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        Match match = new Match();
        match.setGroupe(groupe);
        match.setDateMatch(LocalDate.parse((String) request.get("dateMatch")));
        match.setAdversaire((String) request.get("adversaire"));
        match.setLieu((String) request.get("lieu"));
        return matchRepository.save(match);
    }

    public Presence addPresence(Long groupeId, Long matchId, Map<String, Object> request) {
        Groupe groupe = groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match non trouvé"));
        Membre membre = membreRepository.findById(Long.parseLong(request.get("membreId").toString()))
                .orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        if (!membre.getGroupe().getId().equals(groupe.getId())) {
            throw new RuntimeException("Le membre n'appartient pas à ce groupe");
        }

        Presence presence = new Presence();
        presence.setMembre(membre);
        presence.setMatch(match);
        presence.setAJoue(Boolean.parseBoolean(request.get("aJoue").toString()));
        presence.setEstCapitaine(Boolean.parseBoolean(request.get("estCapitaine").toString()));
        presence.setButs(Integer.parseInt(request.get("buts").toString()));
        presence.setPasses(Integer.parseInt(request.get("passes").toString()));
        presence.setEstHommeDuMatch(Boolean.parseBoolean(request.get("estHommeDuMatch").toString()));
        return presenceRepository.save(presence);
    }

    public List<Presence> getPresencesByMatch(Long matchId) {
        return presenceRepository.findByMatchId(matchId);
    }

    public Membre getMembreWithStats(Long membreId) {
        User user = userRepository.findById(membreId).orElseThrow(() -> new RuntimeException("User non trouvé"));
        Membre membre = membreRepository.findById(user.getMembre().getId()).orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        System.out.println("id que jappelle"+membre);
        List<Presence> presences = presenceRepository.findByMembreId(membre.getId());
        List<Sanction> sanctions = sanctionRepository.findByMembreId(membre.getId());
        List<Contribution> contributions = contributionRepository.findByMembreId(membre.getId());
        List<PaiementSanction> paiementsSanctions = paiementSanctionRepository.findBySanctionMembreId(membre.getId());

        membre.setButs(presences.stream().mapToInt(Presence::getButs).sum());
        membre.setPasses(presences.stream().mapToInt(Presence::getPasses).sum());
        membre.setCartons(sanctions.stream()
                .filter(s -> s.getTypeSanction().getNom().toLowerCase().contains("carton"))
                .mapToInt(s -> 1).sum());
        Double totalContributions = contributions.stream().mapToDouble(Contribution::getMontant).sum();
        membre.setTotalContributions(totalContributions);
        membre.setSoldeRestant(membre.getGroupe().getFraisAdhesion() != null ? membre.getGroupe().getFraisAdhesion() - totalContributions : 0.0);
        membre.setCotisationPayee(totalContributions >= (membre.getGroupe().getFraisAdhesion() != null ? membre.getGroupe().getFraisAdhesion() : 0.0));

        Double totalSanctions = sanctions.stream().mapToDouble(s -> s.getMontant() != null ? s.getMontant() : 0.0).sum();
        Double totalPaiementsSanctions = paiementsSanctions.stream().mapToDouble(PaiementSanction::getMontant).sum();
        membre.setSoldeSanctionsRestant(totalSanctions - totalPaiementsSanctions);

        // Mettre à jour l'état des sanctions
        for (Sanction sanction : sanctions) {
            double totalPaiements = paiementSanctionRepository.findBySanctionId(sanction.getId())
                    .stream().mapToDouble(PaiementSanction::getMontant).sum();
            sanction.setTotalPaiements(totalPaiements);
            sanction.setEtat(totalPaiements >= (sanction.getMontant() != null ? sanction.getMontant() : 0.0)
                    ? Sanction.EtatSanction.PAYEE : Sanction.EtatSanction.NON_PAYEE);
            sanctionRepository.save(sanction);
        }

        return membre;
    }


        //contribution

    public Contribution addContribution(Long groupeId, Long membreId, Map<String, Object> request) {
        Groupe groupe = groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        Membre membre = membreRepository.findById(membreId).orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        if (!membre.getGroupe().getId().equals(groupe.getId())) {
            throw new RuntimeException("Le membre n'appartient pas à ce groupe");
        }

        double montant = Double.parseDouble(request.get("montant").toString());
        if (montant <= 0) {
            throw new RuntimeException("Le montant de la contribution doit être positif");
        }

        Contribution contribution = new Contribution();
        contribution.setMembre(membre);
        contribution.setMontant(montant);
        contribution.setDateContribution(LocalDate.parse((String) request.get("dateContribution")));
        contribution.setCommentaire((String) request.get("commentaire"));
        contributionRepository.save(contribution);

        // Mettre à jour les champs du membre
        List<Contribution> contributions = contributionRepository.findByMembreId(membreId);
        Double totalContributions = contributions.stream().mapToDouble(Contribution::getMontant).sum();
        membre.setTotalContributions(totalContributions);
        Double fraisAdhesion = groupe.getFraisAdhesion() != null ? groupe.getFraisAdhesion() : 0.0;
        membre.setSoldeRestant(fraisAdhesion - totalContributions);
        membre.setCotisationPayee(totalContributions >= fraisAdhesion);
        membreRepository.save(membre); // Persister les changements dans la base

        return contribution;
    }

    public List<Contribution> getContributionsByMembre(Long groupeId, Long membreId) {
        Membre membre = membreRepository.findById(membreId).orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        if (!membre.getGroupe().getId().equals(groupeId)) {
            throw new RuntimeException("Le membre n'appartient pas à ce groupe");
        }
        return contributionRepository.findByMembreId(membreId);
    }

    public List<Contribution> getContributionsByGroupe(Long groupeId) {
        groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        return contributionRepository.findByMembreGroupeId(groupeId);
    }


    //sanctions

    public PaiementSanction addPaiementSanction(Long groupeId, Long membreId, Long sanctionId, Map<String, Object> request) {
        Groupe groupe = groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        Membre membre = membreRepository.findById(membreId).orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        Sanction sanction = sanctionRepository.findById(sanctionId).orElseThrow(() -> new RuntimeException("Sanction non trouvée"));
        if (!membre.getGroupe().getId().equals(groupe.getId()) || !sanction.getMembre().getId().equals(membreId)) {
            throw new RuntimeException("La sanction ou le membre n'appartient pas à ce groupe");
        }

        double montant = Double.parseDouble(request.get("montant").toString());
        if (montant <= 0) {
            throw new RuntimeException("Le montant du paiement doit être positif");
        }

        PaiementSanction paiement = new PaiementSanction();
        paiement.setSanction(sanction);
        paiement.setMontant(montant);
        paiement.setDatePaiement(LocalDate.parse((String) request.get("datePaiement")));
        paiement.setCommentaire((String) request.get("commentaire"));
        paiementSanctionRepository.save(paiement);

        // Mettre à jour l'état de la sanction
        List<PaiementSanction> paiements = paiementSanctionRepository.findBySanctionId(sanctionId);
        double totalPaiements = paiements.stream().mapToDouble(PaiementSanction::getMontant).sum();
        sanction.setTotalPaiements(totalPaiements);
        sanction.setEtat(totalPaiements >= (sanction.getMontant() != null ? sanction.getMontant() : 0.0)
                ? Sanction.EtatSanction.PAYEE : Sanction.EtatSanction.NON_PAYEE);
        sanctionRepository.save(sanction);

        return paiement;
    }

    public List<PaiementSanction> getPaiementsBySanction(Long groupeId, Long membreId, Long sanctionId) {
        Membre membre = membreRepository.findById(membreId).orElseThrow(() -> new RuntimeException("Membre non trouvé"));
        Sanction sanction = sanctionRepository.findById(sanctionId).orElseThrow(() -> new RuntimeException("Sanction non trouvée"));
        if (!membre.getGroupe().getId().equals(groupeId) || !sanction.getMembre().getId().equals(membreId)) {
            throw new RuntimeException("La sanction ou le membre n'appartient pas à ce groupe");
        }
        return paiementSanctionRepository.findBySanctionId(sanctionId);
    }

    public List<PaiementSanction> getPaiementsByGroupe(Long groupeId) {
        groupeRepository.findById(groupeId).orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        return paiementSanctionRepository.findBySanctionMembreGroupeId(groupeId);
    }

    public List<Membre> getMembreAll() {
        return membreRepository.findAll();
    }


    //Ville

    public List<Ville> getVilleAll() {
        return villeRepository.findAll();
    }

    //Stade

    public List<Stade> getStadeAll() {
        return stadeRepository.findAll();
    }

    public Groupe findByMembre() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        return user.get().getMembre().getGroupe();

    }

    public List<Membre> findMembreByGroupe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        List<Membre> membres = membreRepository.findByGroupeIdOrderByNomAsc(user.get().getMembre().getGroupe().getId());
        for (Membre membre : membres) {
            membre.setTotalContributions(calculateTotalContributions(membre.getId()));
            membre.setSoldeRestant(calculateSoldeRestant(membre.getId()));
            membre.setSoldeSanctionsRestant(calculateSoldeSanctionsRestant(membre.getId()));
            membre.setButs(calculateTotalBut(membre.getId()));
            membre.setPasses(calculateTotalPasse(membre.getId()));
            membre.setCartons(calculateTotalCarton(membre.getId()));
        }
        return membres;

    }

    private Double calculateTotalContributions(Long membreId) {
        if (membreId == null) {
            return 0.0;
        }

        // Utilisez Optional.ofNullable pour envelopper la liste, puis retournez
        // une liste vide si l'objet ContributionIndividuelle est null.
        List<ContributionIndividuelle> contributions = Optional.ofNullable(
                contributionIndividuelleRepository.findByMembreId(membreId)
        ).orElse(Collections.emptyList());

        return contributions.stream()
                .mapToDouble(ContributionIndividuelle::getMontant)
                .sum();
    }

    private int calculateTotalBut(Long membreId) {
        if (membreId == null) return 0;
        List<Presence> presence = presenceRepository.findByMembreId(membreId);
        int b = presence.stream()
                .mapToInt(Presence::getButs)
                .sum();
        int p = presence.stream()
                .mapToInt(Presence::getPenalti)
                .sum();
        return b + p;
    }

    private int calculateTotalPasse(Long membreId) {
        if (membreId == null) return 0;
        List<Presence> presence = presenceRepository.findByMembreId(membreId);
        System.out.print(presence);
        return presence.stream()
                .mapToInt(Presence::getPasses)
                .sum();
    }

    private int calculateTotalCarton(Long membreId) {
        if (membreId == null) return 0;
        List<Presence> presence = presenceRepository.findByMembreId(membreId);
        System.out.print(presence);
        int cj = presence.stream()
                .mapToInt(Presence::getCartonsJaunes)
                .sum();
        int cr=presence.stream()
                .mapToInt(Presence::getCartonsRouges)
                .sum();
        return cj + cr;
    }

    private Double calculateSoldeRestant(Long membreId) {
        if (membreId == null) return 0.0;
        // Hypothèse : un montant attendu fixe (par exemple, 100.0 par an)
        double montantAttendu = groupeRepository.findById(membreRepository.findById(membreId).get().getGroupe().getId()).get().getFraisAdhesion(); // À ajuster selon la logique métier
        double totalContributions = calculateTotalContributions(membreId);
        return montantAttendu - totalContributions;
    }

    private Double calculateSoldeSanctionsRestant(Long membreId) {
        if (membreId == null) return 0.0;
        List<Sanction> sanctions = sanctionRepository.findByMembreIdAndEtat(membreId, Sanction.EtatSanction.NON_PAYEE);
        return sanctions.stream()
                .mapToDouble(Sanction::getMontant)
                .sum();
    }


    @Transactional
    public Sanction updateSanction(Long id, Map<String, Object> request) {
        // Récupérer la sanction existante
        Sanction sanction = sanctionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sanction non trouvée avec l'ID: " + id));

        // Extraire et valider les champs de la requête

        Double montant = Double.parseDouble(request.getOrDefault("montant", sanction.getMontant()).toString());
        String commentaire = request.getOrDefault("commentaire", sanction.getCommentaire()).toString();
        String etatStr = request.getOrDefault("etat", sanction.getEtat().name()).toString();
        Sanction.EtatSanction etat = Sanction.EtatSanction.valueOf(etatStr);
        String dateSanctionStr = request.getOrDefault("dateSanction", sanction.getDateSanction().toString()).toString();

        // Valider les références
        if (request.containsKey("membre")) {
            Long membreId = Long.parseLong(request.getOrDefault("membre", sanction.getMembre().getId()).toString());
            Membre membre = membreRepository.findById(membreId)
                    .orElseThrow(() -> new IllegalArgumentException("Membre non trouvé avec l'ID: " + membreId));
            sanction.setMembre(membre);
        }

        if (request.containsKey("typeSanction")) {
            Long typeSanctionId = Long.parseLong(request.getOrDefault("typeSanction", sanction.getTypeSanction().getId()).toString());
            TypeSanction typeSanction = typeSanctionRepository.findById(typeSanctionId)
                    .orElseThrow(() -> new IllegalArgumentException("Type de sanction non trouvé avec l'ID: " + typeSanctionId));
            sanction.setTypeSanction(typeSanction);
        }

        if (request.containsKey("match")) {
            Long matchId = request.containsKey("match") && request.get("match") != null
                    ? Long.valueOf(Long.parseLong(request.get("match").toString()))
                    : (sanction.getMatch() != null ? sanction.getMatch().getId() : null);
            Match match = matchRepository.findById(matchId)
                                .orElseThrow(() -> new IllegalArgumentException("Match non trouvé avec l'ID: " + matchId));
            sanction.setMatch(match);
        }

        // Mettre à jour les champs de la sanction
        sanction.setDateSanction(LocalDate.parse(dateSanctionStr, DateTimeFormatter.ISO_LOCAL_DATE));
        sanction.setMontant(montant);
        sanction.setCommentaire(commentaire);
        sanction.setEtat(etat);
        // Enregistrer les modifications
        return sanctionRepository.save(sanction);
    }

    public Sanction payerSanction(Long id) {
        Sanction sanction = sanctionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sanction non trouvée avec l'ID: " + id));
        sanction.setEtat(Sanction.EtatSanction.PAYEE);
        return sanctionRepository.save(sanction);
    }

}