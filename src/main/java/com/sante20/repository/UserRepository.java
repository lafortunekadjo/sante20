package com.sante20.repository;

import com.sante20.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);

    long countByIsActive(boolean active); // Compte les utilisateurs actifs

//    List<User> findByActive(boolean active); //

    List<User> findByIsDeleteFalse();

    List<User> findByIsActiveTrue();
    // Utilisation d'une requête personnalisée pour charger les rôles en même temps que l'utilisateur
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.username = :username")
    Optional<User> findByUsernameWithRoles(@Param("username") String username);
}