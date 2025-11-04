package com.sante20.service;

import com.sante20.entity.Objectif;
import com.sante20.repository.ObjectifRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ObjectifService {
    private final ObjectifRepository objectifRepository;

    public ObjectifService(ObjectifRepository objectifRepository) {
        this.objectifRepository = objectifRepository;
    }

    public List<Objectif> findByMembreId(Long membreId) {
        return objectifRepository.findByMembreId(membreId);
    }

    public Objectif save(Objectif objectif) {
        return objectifRepository.save(objectif);
    }

    public void delete(Long id) {
        objectifRepository.deleteById(id);
    }
}