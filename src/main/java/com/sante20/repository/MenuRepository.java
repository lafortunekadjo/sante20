// src/main/java/com/sante20/repository/MenuRepository.java

package com.sante20.repository;

import com.sante20.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {
    
    Optional<Menu> findByCode(String code);
    
    List<Menu> findByActifTrueOrderByOrdreAsc();
    
    List<Menu> findByCategorieOrderByOrdreAsc(String categorie);
}