package com.sante20.repository;

import com.sante20.entity.TypeSanction;
import org.springframework.data.jpa.repository.JpaRepository;


public interface SanctionTypeRepository extends JpaRepository<TypeSanction, Long> {
}