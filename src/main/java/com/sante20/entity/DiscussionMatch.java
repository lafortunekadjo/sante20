// src/main/java/com/sante20/entity/DiscussionMatch.java

package com.sante20.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "discussions_match")
@Data
public class DiscussionMatch {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "defi_match_id", nullable = false, unique = true)
    private DefiMatchAmical defiMatch;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    @Column(nullable = false)
    private Boolean active = true;

    @OneToMany(mappedBy = "discussion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageDiscussionMatch> messages = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }


}