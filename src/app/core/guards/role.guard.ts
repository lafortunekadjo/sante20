// src/app/core/guards/role.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, take } from 'rxjs'; // 👈 Importer map et take

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    
    // 1. Attendre que l'état de l'utilisateur soit prêt (chargement terminé)
    return this.authService.isUserReady$.pipe(
      take(1), // 👈 Ne prend qu'une seule valeur puis se complète (nécessaire pour un Guard)
      map(() => {
        // 2. L'état est stable. Vérifier l'authentification.
        if (!this.authService.isLoggedIn()) {
          console.log('RoleGuard: Utilisateur non authentifié, redirection vers /login');
          return this.router.createUrlTree(['/login']); // Redirection via UrlTree
        }

        // 3. L'utilisateur est connecté. Vérifier les rôles.
        const requiredRoles = route.data['roles'] as string[];
        const userRoles = this.authService.getRoles();
        
        console.log('RoleGuard: Rôles requis:', requiredRoles);
        console.log('RoleGuard: Rôles utilisateur:', userRoles);

        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

        if (hasRequiredRole) {
          console.log('RoleGuard: Accès autorisé');
          return true;
        }

        console.log('RoleGuard: Accès refusé, redirection vers /explorer');
        return this.router.createUrlTree(['/explorer']); // Redirection via UrlTree
      })
    );
  }
}