// src/app/core/services/role-custom.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { RoleCustom, CreateRoleCustomDTO, UserMenusDTO } from '../models/role-custom.model';
import { Menu } from '../models/menu.model';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class RoleCustomService {
  private apiUrl = `${environment.apiUrl}/roles-custom`;
  
  // BehaviorSubject pour stocker les menus de l'utilisateur
  private userMenusSubject = new BehaviorSubject<Menu[]>([]);
  public userMenus$ = this.userMenusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupérer tous les menus disponibles
   */
  getAllMenus(): Observable<Menu[]> {
    return this.http.get<Menu[]>(`${this.apiUrl}/menus`);
  }

  /**
   * Récupérer les rôles d'un groupe
   */
  getRolesByGroupe(): Observable<RoleCustom[]> {
    return this.http.get<RoleCustom[]>(`${this.apiUrl}/groupe`);
  }

  /**
   * Récupérer un rôle par son ID
   */
  getRoleById(roleId: number): Observable<RoleCustom> {
    return this.http.get<RoleCustom>(`${this.apiUrl}/${roleId}`);
  }

  /**
   * Créer un nouveau rôle
   */
  createRole(dto: CreateRoleCustomDTO): Observable<RoleCustom> {
    return this.http.post<RoleCustom>(`${this.apiUrl}/groupe`, dto);
  }

  /**
   * Mettre à jour un rôle
   */
  updateRole(roleId: number, dto: CreateRoleCustomDTO): Observable<RoleCustom> {
    return this.http.put<RoleCustom>(`${this.apiUrl}/${roleId}`, dto);
  }

  /**
   * Supprimer un rôle
   */
  deleteRole(roleId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${roleId}`);
  }

  /**
   * Activer/Désactiver un rôle
   */
  toggleRoleStatus(roleId: number): Observable<RoleCustom> {
    return this.http.patch<RoleCustom>(`${this.apiUrl}/${roleId}/toggle`, {});
  }

  /**
   * Récupérer les menus de l'utilisateur pour un groupe
   */
  getUserMenus(groupeId: number): Observable<UserMenusDTO> {
   
    return this.http.get<UserMenusDTO>(`${this.apiUrl}/user-menus`).pipe(
      tap(result => {
        // Mettre à jour le BehaviorSubject avec les menus
        this.userMenusSubject.next(result.menus);
      })
    );
  }

  /**
   * Assigner un rôle à un membre
   */
  assignRoleToMembre(membreId: number, roleId: number | null): Observable<void> {
    let params = new HttpParams().set('membreId', membreId.toString());
    if (roleId !== null) {
      params = params.set('roleId', roleId.toString());
    }
    return this.http.patch<void>(`${this.apiUrl}/assign`, null, { params });
  }

  /**
   * Créer les rôles par défaut pour un groupe
   */
  createDefaultRoles(groupeId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/default/${groupeId}`, {});
  }

  /**
   * Nettoyer les menus lors de la déconnexion
   */
  clearUserMenus(): void {
    this.userMenusSubject.next([]);
  }
}