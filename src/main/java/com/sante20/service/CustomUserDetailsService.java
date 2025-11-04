package com.sante20.service;


import com.sante20.entity.*;
import com.sante20.repository.GroupeRepository;
import com.sante20.repository.MembreRepository;
import com.sante20.repository.RoleRepository;
import com.sante20.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private GroupeRepository groupeRepository;
    @Autowired
    private MembreRepository membreRepository;


    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Utilise la nouvelle méthode du repository pour charger les rôles immédiatement
        User user = userRepository.findByUsernameWithRoles(username)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé avec le nom d'utilisateur : " + username));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.getRoles().stream()
                        // Les rôles sont déjà chargés, cette ligne fonctionnera sans erreur
                        .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                        .collect(Collectors.toList())
        );
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public List<User> findAllNotDelete() {
        return userRepository.findByIsDeleteFalse();
    }

    public List<User> findAllActive() {
        return userRepository.findByIsActiveTrue();
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User createUser(Map<String, Object> request) {

        User user = new User();
        user.setEmail((String) request.get("email"));
        user.setPassword((String) request.get("motDePasse"));// À hasher en production
        user.setUsername((String) request.get("username"));
        user.setRole((String) request.get("roles"));
        // Récupérer la chaîne de rôles depuis la requête
        String rolesString = (String) request.get("roles");
        // Gérer la relation avec Groupe
        if (request.get("groupe") != null && (Integer) request.get("groupe") != 0) {
            Long groupeId = request.get("groupe") != null ? Long.parseLong(request.get("groupe").toString()) : null;
            if (groupeId != null) {
                Groupe groupe = groupeRepository.findById(groupeId)
                        .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
                user.setGroupe(groupe);

            } else {
                user.setGroupe(null);
            }
        }


        // Créer un ensemble pour stocker les objets Role
        Set<Role> userRoles = new HashSet<>();

        if (rolesString != null && !rolesString.isEmpty()) {
            // 1. Découper la chaîne des rôles en noms individuels
            String[] rolesArray = rolesString.split(",");

            // 2. Parcourir les noms de rôles pour les convertir en objets Role
            for (String roleName : rolesArray) {
                String cleanRoleName = roleName.trim();

                // 3. Chercher l'objet Role correspondant en base de données
                // Le nom de l'enum doit correspondre (ex: "ADMIN" -> ROLE_ADMIN)
                Role.ERole eRole = Role.ERole.valueOf("ROLE_" + cleanRoleName.toUpperCase());

                // Utiliser le RoleRepository pour trouver l'entité Role
                Role role = roleRepository.findByName(eRole)
                        .orElseThrow(() -> new RuntimeException("Erreur: Le rôle n'a pas été trouvé."));

                userRoles.add(role);
            }
        }

        user.setRoles(userRoles);
        // ⭐ NOUVELLE LOGIQUE POUR CRÉER UN MEMBRE ⭐
        // Vérifier si l'utilisateur a le rôle RESPONSABLE ou MEMBRE

        User savedUser = userRepository.save(user);

        if (request.get("groupe") != null && (Integer) request.get("groupe") != 0) {
            boolean hasMemberOrResponsableRole = userRoles.stream()
                    .anyMatch(role -> role.getName() == Role.ERole.ROLE_MEMBRE || role.getName() == Role.ERole.ROLE_RESPONSABLE);
            System.out.print(hasMemberOrResponsableRole);

            if (hasMemberOrResponsableRole) {
                // Un membre a besoin d'un groupe, donc si le groupe n'existe pas, on lève une exception
                if (user.getGroupe() == null) {
                    throw new IllegalArgumentException("Un membre ou un responsable doit être associé à un groupe.");
                }

                Membre membre = new Membre();
                membre.setNom(user.getUsername());
                membre.setUser(user);
                membre.setGroupe(user.getGroupe());


                membreRepository.save(membre); // Sauvegarder le membre

                // Lier le membre au user si nécessaire
                // user.setMembre(membre);
                // user.setMembre(membre); // Si l'entité User a une référence à l'entité Membre
            }
        }
        return savedUser;
    }

    public User enableUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User non trouvé"));
        user.setActive(true);
        return userRepository.save(user);
    }

    public User disableUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User non trouvé"));
        user.setActive(false);
        return userRepository.save(user);
    }

    public User deleteUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User non trouvé"));
        user.setActive(false);
        user.setDelete(true);
        return userRepository.save(user);
    }

    public User updateUser(Long userId, Map<String, Object> request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User non trouvé"));
        user.setEmail((String) request.get("email"));
        user.setUsername((String) request.get("username"));
        user.setRole((String) request.get("role"));
        return userRepository.save(user);
    }


    // Dans votre UserService.java (exemple de méthode)
    public void updatePassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));

        // Vérifier l'ancien mot de passe.
        // **IMPORTANT** : Utilisez un HASH pour comparer les mots de passe.
        // L'exemple ci-dessous est simplifié. Utilisez BCryptPasswordEncoder


        // Mettre à jour le mot de passe avec le nouveau hash
        user.setPassword(newPassword);
        user.setPasswordResetRequired(false); // Réinitialiser le drapeau
        userRepository.save(user);
    }




    //roles

    @Transactional
    public User addRole(Long userId, String roleName) {
        // 1. Trouver l'utilisateur ou lancer une exception si non trouvé.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé avec l'ID: " + userId));

        // 2. Vérifier et trouver le rôle dans la base de données.
        // Convertir la chaîne en ERole (par exemple, "ADMIN" -> ROLE_ADMIN)
        Role.ERole eRole;
        try {
            eRole = Role.ERole.valueOf("ROLE_" + roleName.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Rôle invalide: " + roleName);
        }

        // Récupérer l'entité Role ou lancer une exception si non trouvée
        Role role = roleRepository.findByName(eRole)
                .orElseThrow(() -> new IllegalArgumentException("Le rôle n'a pas été trouvé dans la base de données: " + roleName));

        // 3. Ajouter le rôle à l'utilisateur si ce n'est pas déjà fait.
//        user.getRoles().add(role);

        // 4. Sauvegarder l'utilisateur mis à jour.
        userRepository.save(user);

        System.out.println("Rôle ajouté: " + roleName + " pour l'utilisateur: " + user.getUsername());
        return user;
    }

    @Transactional
    public User removeRole(Long userId, String roleName) {
        // 1. Trouver l'utilisateur ou lancer une exception.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé avec l'ID: " + userId));

        // 2. Trouver l'entité Role à retirer en base de données.
        Role.ERole eRole;
        try {
            // Convertir la chaîne en ERole (par exemple, "ADMIN" -> ROLE_ADMIN)
            eRole = Role.ERole.valueOf("ROLE_" + roleName.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Rôle invalide: " + roleName);
        }

        // Récupérer l'entité Role de la base de données
        Role roleToRemove = roleRepository.findByName(eRole)
                .orElseThrow(() -> new IllegalArgumentException("Le rôle n'a pas été trouvé dans la base de données: " + roleName));

        // 3. Vérifier et retirer le rôle de l'utilisateur.
        // La méthode 'remove' de Set renvoie 'true' si l'élément a été retiré, 'false' sinon.
        boolean wasRemoved = user.getRoles().remove(roleToRemove);

        if (!wasRemoved) {
            throw new IllegalArgumentException("L'utilisateur " + user.getUsername() + " n'a pas le rôle: " + roleName);
        }

        // 4. Sauvegarder l'utilisateur mis à jour.
        userRepository.save(user);

        System.out.println("Rôle retiré: " + roleName + " pour l'utilisateur: " + user.getUsername());
        return user;
    }

}