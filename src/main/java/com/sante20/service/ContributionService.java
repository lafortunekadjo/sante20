package com.sante20.service;


import com.sante20.entity.*;
import com.sante20.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ContributionService {

    @Autowired
    private ContributionRepository contributionRepository;

    @Autowired
    private ContributionIndividuelleRepository contributionIndividuelleRepository;

    @Autowired
    private MembreRepository membreRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EvenementRepository evenementRepository;

    public Contribution createContribution(Map<String, Object> request) {
        Long membreId = Long.parseLong(request.get("membre").toString());
        Membre membre = membreRepository.findById(membreId)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé"));

        Contribution contribution = new Contribution();
        contribution.setMembre(membre);
        contribution.setMontant(Double.parseDouble(request.get("montant").toString()));
        contribution.setDateContribution(LocalDate.parse(request.get("dateContribution").toString()));
        contribution.setCommentaire((String) request.get("commentaire"));

        return contributionRepository.save(contribution);
    }

    public Contribution fermerContribution(Long id) {

        Contribution contribution = contributionRepository.findById(id).orElseThrow();
        contribution.setOpen(false);

        return contributionRepository.save(contribution);
    }

    public Contribution ouvrirContribution(Long id) {
        Contribution contribution = contributionRepository.findById(id).orElseThrow();
        contribution.setOpen(true);
        return contributionRepository.save(contribution);
    }

    public Contribution updateContribution(Long id, Map<String, Object> request) {
        Contribution contribution = contributionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contribution non trouvée"));

        try {
            // --- Gestion de l'événement ---
            if (request.containsKey("idEvenement")) {
                Object idEvtObj = request.get("idEvenement");
                Long idEvenement = null;

                if (idEvtObj instanceof Number) {
                    idEvenement = ((Number) idEvtObj).longValue();
                } else if (idEvtObj instanceof String && !((String) idEvtObj).isEmpty()) {
                    idEvenement = Long.parseLong((String) idEvtObj);
                } else if (idEvtObj == null) {
                    // Cas où on veut retirer l'événement
                    contribution.setEvenement(null);
                }

                if (idEvenement != null) {
                    evenementRepository.findById(idEvenement).ifPresent(evenement -> {
                        contribution.setEvenement(evenement);
                        evenement.setEstContributionOuverte(true);
                    });
                }
            }

            // --- Ouverture/fermeture ---
            if (request.containsKey("open") && request.get("open") != null) {
                contribution.setOpen(Boolean.parseBoolean(request.get("open").toString()));
            }

            // --- Date limite de contribution ---
            if (request.containsKey("delaiContribution") && request.get("delaiContribution") != null) {
                Object dateObj = request.get("delaiContribution");
                if (dateObj instanceof String) {
                    OffsetDateTime odt = OffsetDateTime.parse((String) dateObj, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
                    contribution.setDelaiContribution(Date.from(odt.toInstant()));
                }
            }

            // --- Montant minimum ---
            if (request.containsKey("montantMin") && request.get("montantMin") != null) {
                Object montantObj = request.get("montantMin");
                if (montantObj instanceof Number) {
                    contribution.setMontantMin(((Number) montantObj).doubleValue());
                } else if (montantObj instanceof String && !((String) montantObj).isEmpty()) {
                    contribution.setMontantMin(Double.parseDouble((String) montantObj));
                }
            }

            // --- Montant cible ---
            if (request.containsKey("montantCible") && request.get("montantCible") != null) {
                Object montantObj = request.get("montantCible");
                if (montantObj instanceof Number) {
                    contribution.setMontantCible(((Number) montantObj).doubleValue());
                } else if (montantObj instanceof String && !((String) montantObj).isEmpty()) {
                    contribution.setMontantCible(Double.parseDouble((String) montantObj));
                }
            }

            // --- Commentaire ---
            if (request.containsKey("commentaire") && request.get("commentaire") !=null ) {
                contribution.setCommentaire((String) request.get("commentaire"));
            }

            if (request.containsKey("description") && request.get("description") !=null) {
                contribution.setCommentaire((String) request.get("description"));
            }

            return contributionRepository.save(contribution);

        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Valeur numérique invalide dans la requête");
        } catch (Exception e) {
            throw new IllegalArgumentException("Erreur lors de la mise à jour : " + e.getMessage());
        }
    }


    public Contribution getContributionById(Long id) {
        return contributionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contribution non trouvée"));
    }

    public List<Contribution> getAllContributions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);

        return contributionRepository.findByMembreGroupeId(user.get().getMembre().getGroupe().getId());
    }

    public List<ContributionIndividuelle> getAllContributionsIndividuelles() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);

        return contributionIndividuelleRepository.findAllByMembreGroupe(user.get().getMembre().getId());
    }


    public List<ContributionIndividuelle> getContributionsIndividuellesByContribution(Long id) {

        Contribution contribution = contributionRepository.findById(id).orElseThrow(() -> new RuntimeException("Contribution non trouve"));

        return contributionIndividuelleRepository.findByContribution(contribution);
    }

    public List<Contribution> getContributionsByMembreId(Long membreId) {
        return contributionRepository.findByMembreId(membreId);
    }

    public void deleteContribution(Long id) {
        if (!contributionRepository.existsById(id)) {
            throw new RuntimeException("Contribution non trouvée");
        }
        contributionRepository.deleteById(id);
    }


    /**
     * Crée une nouvelle collecte de contributions pour un événement.
     *
     * @param contributionData La Map contenant les données de la contribution.
     * @return L'entité Contribution sauvegardée.
     */
    public Contribution createContribution1(Map<String, Object> contributionData) {
        Contribution contribution = new Contribution();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        Optional<User> user = userRepository.findByUsername(username);
        contribution.setMembre(user.get().getMembre());

        try {
            if (contributionData.containsKey("idEvenement")) {
                Long idEvenement = Long.parseLong((String) contributionData.get("idEvenement"));
                Optional<Evenement> evenementOpt = evenementRepository.findById(idEvenement);
                if (evenementOpt.isPresent()) {
                    Evenement evenement = evenementOpt.get();
                    contribution.setEvenement(evenement);
                    evenement.setEstContributionOuverte(true);
                }
            }
            if (contributionData.containsKey("open") && contributionData.get("open")!=null) {
                contribution.setOpen(Boolean.parseBoolean(contributionData.get("open").toString()));
            }

            if (contributionData.containsKey("adhesion") && contributionData.get("adhesion")!=null) {
                contribution.setAhdhesion(Boolean.parseBoolean(contributionData.get("adhesion").toString()));
            }

            if (contributionData.containsKey("delaiContribution")) {
                String dateString = (String) contributionData.get("delaiContribution");
                contribution.setDelaiContribution(new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").parse(dateString));
            }
            if (contributionData.containsKey("montantMin") && contributionData.get("montantMin") != null) {
                try {
                    Object montantObj = contributionData.get("montantMin");
                    if (montantObj instanceof Number) {
                        contribution.setMontantMin(((Number) montantObj).doubleValue());
                    }
                } catch (NumberFormatException e) {
                    // Gérer le cas où la valeur n'est pas un nombre valide
                    System.err.println("Valeur invalide pour montantMin : " + contributionData.get("montantMin"));
                }
            }
            if (contributionData.containsKey("montantCible") && contributionData.get("montantCible") != null) {
                try {
                    Object montantObj = contributionData.get("montantCible");
                    if (montantObj instanceof Number) {
                        contribution.setMontantMin(((Number) montantObj).doubleValue());
                    }

                } catch (NumberFormatException e) {
                    // Gérer le cas où la valeur n'est pas un nombre valide
                    System.err.println("Valeur invalide pour montantCible : " + contributionData.get("montantCible"));
                }
            }

            // --- Commentaire ---
            if (contributionData.containsKey("commentaire") && contributionData.get("commentaire") !=null ) {
                contribution.setCommentaire((String) contributionData.get("commentaire"));
            }

            if (contributionData.containsKey("description") && contributionData.get("description") !=null) {
                contribution.setCommentaire((String) contributionData.get("description"));
            }

            contribution.setMontantCollecteActuel(0.0);
        } catch (ParseException e) {
            throw new IllegalArgumentException("Invalid date format for 'delaiContribution'");
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid data provided in the map: " + e.getMessage());
        }



        return contributionRepository.save(contribution);
    }

    /**
     * Enregistre une contribution individuelle d'un membre.
     *
     * @param contributionData La Map contenant les données du versement.
     * @return L'entité ContributionIndividuelle sauvegardée.
     */
    public ContributionIndividuelle contribute(Map<String, Object> contributionData) {
        ContributionIndividuelle individuelle = new ContributionIndividuelle();

        try {
            Double montant = Double.valueOf((contributionData.get("montant").toString()));
            Long idContribution = Long.parseLong(contributionData.get("idContribution").toString());
            Long idMembre = Long.parseLong(contributionData.get("idMembre").toString());

            Optional<Contribution> contributionOpt = contributionRepository.findById(idContribution);
            Optional<Membre> membreOpt = membreRepository.findById(idMembre);

            if (contributionData.containsKey("dateContribution") && contributionData.get("dateContribution") != null) {
                Object dateObj = contributionData.get("dateContribution");
                if (dateObj instanceof String && !((String) dateObj).isEmpty()) {
                    Instant instant = Instant.parse((String) dateObj); // parse directement le format ISO avec Z
                    individuelle.setDateContribution(instant.atZone(ZoneId.systemDefault()).toLocalDate());
                }
            } else {
                individuelle.setDateContribution(LocalDate.now());
            }

            if (contributionOpt.isPresent() && membreOpt.isPresent()) {
                individuelle.setMontant(montant);

                individuelle.setContribution(contributionOpt.get());
                individuelle.setMembre(membreOpt.get());

                // Mise à jour du montant total de la campagne
                Contribution contribution = contributionOpt.get();
                contribution.setMontantCollecteActuel(
                        contribution.getMontantCollecteActuel() + (montant)
                );
                contributionRepository.save(contribution);

            } else {
                throw new IllegalArgumentException("Contribution or Membre not found.");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid data for contribution: " + e.getMessage());
        }

        return contributionIndividuelleRepository.save(individuelle);
    }

    public ContributionIndividuelle updateContributionIndividuelle(Long id, Map<String, Object> contributionData) {
        ContributionIndividuelle individuelle = contributionIndividuelleRepository.findById(id).orElseThrow();


        try {
            Double montant = Double.valueOf((contributionData.get("montant").toString()));
            Long idContribution = Long.parseLong(contributionData.get("idContribution").toString());

            Optional<Contribution> contributionOpt = contributionRepository.findById(idContribution);


            if (contributionData.containsKey("dateContribution") && contributionData.get("dateContribution") != null && contributionData.get("dateContribution").toString() !=null ) {
                Object dateObj = contributionData.get("dateContribution");
                if (dateObj instanceof String && !((String) dateObj).isEmpty()) {
                    Instant instant = Instant.parse((String) dateObj); // parse directement le format ISO avec Z
                    individuelle.setDateContribution(instant.atZone(ZoneId.systemDefault()).toLocalDate());
                }
            } else {
                individuelle.setDateContribution(LocalDate.now());
            }

            if (contributionOpt.isPresent()) {
                individuelle.setMontant(montant);
                individuelle.setContribution(contributionOpt.get());


                // Mise à jour du montant total de la campagne
                Contribution contribution = contributionOpt.get();
                contribution.setMontantCollecteActuel(
                        contribution.getMontantCollecteActuel() + (montant)
                );
                contributionRepository.save(contribution);

            } else {
                throw new IllegalArgumentException("Contribution or Membre not found.");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid data for contribution: " + e.getMessage());
        }

        return contributionIndividuelleRepository.save(individuelle);
    }
}