package com.sante20.controller;

import com.sante20.dto.ApiResponse;
import com.sante20.entity.Groupe;
import com.sante20.entity.PasswordUpdateRequest;
import com.sante20.entity.User;
import com.sante20.security.JwtUtil;
import com.sante20.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private CustomUserDetailsService userService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;
    @GetMapping("/dashboard")
    public String userDashboard() {
        return "Welcome to User Dashboard";
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        String username = authentication.getName();
        Optional<User> user = userService.findByUsername(username);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/users : " + request);
        String rawPassword = (String) request.get("motDePasse");
        request.put("motDePasse", passwordEncoder.encode(rawPassword));
        User user = userService.createUser(request);
        return ResponseEntity.status(201).body(user);
    }

    @PutMapping("/update/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable Long userId, @RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/users : " + request);

        User user = userService.updateUser(userId, request);
        return ResponseEntity.status(201).body(user);
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser2(@RequestBody Map<String, Object> request) {
        System.out.println("Requête POST /api/users : " + request);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String username = authentication.getName();
        Optional<User> user = userService.findByUsername(username);

        User user2 = userService.updateUser(user.get().getId(), request);
        return ResponseEntity.status(201).body(user2);
    }

    @PutMapping("/delete/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> deleteUser(@PathVariable Long userId) {
        System.out.println("Requête POST /api/users : ");

        User user = userService.deleteUser(userId);
        return ResponseEntity.status(201).body(user);
    }


    @PutMapping("/enable/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> enableUser(@PathVariable Long userId) {
        System.out.println("Requête POST /api/users : ");

        User user = userService.enableUser(userId);
        return ResponseEntity.status(201).body(user);
    }

    @PutMapping("/disable/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> disableUser(@PathVariable Long userId) {
        System.out.println("Requête POST /api/users : ");

        User user = userService.disableUser(userId);
        return ResponseEntity.status(201).body(user);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> allUser() {

       return userService.findAll();
    }

    @GetMapping("/groupe/current")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Groupe> getGroupeUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println(authentication);
        String username = authentication.getName();
        User currentUser = userService.findByUsername(username).orElseThrow();

        return ResponseEntity.ok(currentUser.getGroupe());
    }

    @GetMapping("/allNotDelete")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> allNotDelete() {

        return userService.findAllNotDelete();
    }

    @PostMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> addRole(@PathVariable Long userId, @RequestBody String role) {
        try {
            User updatedUser = userService.addRole(userId, role);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> removeRole(@PathVariable Long userId, @RequestBody String role) {
        try {
            User updatedUser = userService.removeRole(userId, role);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PatchMapping("/{userId}/password")
    public ResponseEntity<?> updatePassword(@PathVariable Long userId, @RequestBody PasswordUpdateRequest request) {
        System.out.print("je recois");
        User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));
        // Validation des champs
        if (request.getOldPassword() == null || request.getNewPassword() == null || request.getNewPassword().isEmpty()) {
            return ResponseEntity.badRequest().body("L'ancien et le nouveau mot de passe sont requis.");
        }

        try {
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Ancien mot de passe incorrect.");
            }
            userService.updatePassword(userId, passwordEncoder.encode(request.getNewPassword()));
            return ResponseEntity.ok().body(new ApiResponse("Mot de passe mis à jour avec succès."));
        } catch (IllegalArgumentException e) {
            // L'ancien mot de passe est incorrect
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (RuntimeException e) {
            // Utilisateur non trouvé ou autre erreur
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}