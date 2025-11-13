// src/app/core/guards/role.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Vérifier si l'utilisateur est authentifié
    if (!this.authService.isAuthenticated()) {
      console.log('RoleGuard: Utilisateur non authentifié, redirection vers /login');
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRoles = route.data['roles'] as string[];
    const userRoles = this.authService.getRoles();
    
    console.log('RoleGuard: Rôles requis:', requiredRoles);
    console.log('RoleGuard: Rôles utilisateur:', userRoles);

    // Vérifier si l'utilisateur a au moins un des rôles requis
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (hasRequiredRole) {
      console.log('RoleGuard: Accès autorisé');
      return true;
    }

    console.log('RoleGuard: Accès refusé, redirection vers /explorer');
    this.router.navigate(['/explorer']);
    return false;
  }
}