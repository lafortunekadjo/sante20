import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface CampagneDTO {
  id: number;
  nom: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  statut: 'BROUILLON' | 'ACTIVE' | 'TERMINEE';
  typeClassement: 'GROUPE' | 'INDIVIDU' | 'LES_DEUX';
  slug: string;
  recompenses: RecompenseDTO[];
}

export interface ReglePublicDTO {
  codeAction:      string;
  label:           string;
  pointsIndividu:  number;
  pointsGroupe:    number;
  limiteParJour:   number;
  limiteParSemaine: number;
  limiteTotal:     number;
}

export interface RecompensePublicDTO {
  rang:        number;
  description: string;
  valeur:      string;
  partenaire:  string;
}

export interface RecompenseDTO {
  rang: number;
  typeRecompense: 'GROUPE' | 'INDIVIDU';
  description: string;
  valeur: string;
  partenaire: string;
  logoUrl?: string;
}

export interface ClassementGroupeDTO {
  groupeId: number;
  groupeNom: string;
  photoUrl?: string;
  totalPoints: number;
  nbActionsDistinctes: number;
}

export interface ClassementIndividuDTO {
  membreId: number;
  nom: string;
  prenom: string;
  groupeNom: string;
  totalPoints: number;
}

export interface ClassementPublicDTO {
  campagne: {
    nom: string;
    description: string;
    dateFin: string;
    statut: string;
    type:string;
  };
  topGroupes:   ClassementGroupeDTO[];
  topIndividus: ClassementIndividuDTO[];
  regles:       ReglePublicDTO[];
  recompenses:  RecompensePublicDTO[];
}

@Injectable({ providedIn: 'root' })
export class CampagneService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ── Public (sans connexion) ──────────────────────────────
  getClassementPublic(slug: string): Observable<ClassementPublicDTO> {
    return this.http.get<ClassementPublicDTO>(
      `${this.base}/public/campagnes/${slug}/classement`
    );
  }

  // ── Connectés ────────────────────────────────────────────
  getCampagnesActives(): Observable<CampagneDTO[]> {
    return this.http.get<CampagneDTO[]>(`${this.base}/campagnes/actives`);
  }

  getClassementComplet(campagneId: number): Observable<{
    groupes:   ClassementGroupeDTO[];
    individus: ClassementIndividuDTO[];
  }> {
    return this.http.get<any>(`${this.base}/campagnes/${campagneId}/classement`);
  }
}