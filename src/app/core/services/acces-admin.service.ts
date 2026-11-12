import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export type StatutAcces = 'DEMANDE' | 'ACCORDE' | 'REFUSE' | 'REVOQUE';

export interface AccesAdmin {
  id: number;
  groupeId: number;
  groupeNom: string;
  adminId: number;
  adminNom: string;
  statut: StatutAcces;
  message: string | null;
  demandeLe: string;
  decideLe: string | null;
  expireLe: string | null;
  /** Accordé et pas encore échu : l'administrateur peut configurer le groupe. */
  actif: boolean;
}

/** Un compte créé (ou relié) lors de l'import. Le mot de passe temporaire n'est présent qu'ici, une seule fois. */
export interface CompteCree {
  role: 'MEMBRE' | 'RESPONSABLE';
  nom: string;
  prenom: string;
  tel: string;
  email: string;
  username: string;
  /** Mot de passe temporaire (à changer à la première connexion) ; null pour un compte existant ou en simulation. */
  motDePasse: string | null;
  compteExistant: boolean;
}

export interface OptionsImport {
  creerComptes: boolean;
  creerResponsable: boolean;
}

/** Compte rendu d'un chargement de configuration. */
export interface RapportImport {
  simulation: boolean;
  presentation: string;
  logo: string;
  responsable: string;
  comptes: CompteCree[];
  membres: { crees: number; dejaPresents: number; ignores: number };
  saison: string;
  cotisations: { creees: number; ignorees: number };
  sanctions: { creees: number; ignorees: number };
  avertissements: string[];
}

/** Accès d'un administrateur à la configuration d'un groupe, validé par le responsable. */
@Injectable({ providedIn: 'root' })
export class AccesAdminService {
  private baseUrl = `${environment.apiUrl}/acces-admin`;

  constructor(private http: HttpClient) {}

  // ── Responsable ──
  pourMonGroupe(): Observable<AccesAdmin[]> {
    return this.http.get<AccesAdmin[]>(`${this.baseUrl}/groupe`);
  }

  accorder(id: number, jours: number): Observable<AccesAdmin> {
    return this.http.post<AccesAdmin>(`${this.baseUrl}/${id}/accorder`, { jours });
  }

  refuser(id: number): Observable<AccesAdmin> {
    return this.http.post<AccesAdmin>(`${this.baseUrl}/${id}/refuser`, {});
  }

  revoquer(id: number): Observable<AccesAdmin> {
    return this.http.post<AccesAdmin>(`${this.baseUrl}/${id}/revoquer`, {});
  }

  // ── Administrateur ──
  mesAcces(): Observable<AccesAdmin[]> {
    return this.http.get<AccesAdmin[]>(`${this.baseUrl}/mes-acces`);
  }

  demander(groupeId: number, message: string): Observable<AccesAdmin> {
    return this.http.post<AccesAdmin>(`${this.baseUrl}/groupes/${groupeId}/demander`, { message: message || null });
  }

  /** `fichier` : le contenu du fichier du formulaire ({ resume, donnees } ou directement les données). */
  importer(groupeId: number, fichier: unknown, simuler: boolean, options: OptionsImport): Observable<RapportImport> {
    const params = new HttpParams()
      .set('simuler', simuler)
      .set('creerComptes', options.creerComptes)
      .set('creerResponsable', options.creerResponsable);
    return this.http.post<RapportImport>(`${this.baseUrl}/groupes/${groupeId}/importer`, fichier, { params });
  }
}
