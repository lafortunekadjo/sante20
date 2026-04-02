// src/app/core/guards/role.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, take } from 'rxjs'; // 👈 Importer map et take

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

// Ajoute RouterStateSnapshot dans les imports et la signature de canActivate
canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    
    return this.authService.isUserReady$.pipe(
      take(1),
      map(() => {
        if (!this.authService.isLoggedIn()) {
          // On capture l'URL actuelle (ex: /membre2/stats) pour y revenir plus tard
          return this.router.createUrlTree(['/login'], { 
            queryParams: { returnUrl: state.url } 
          }); 
        }

        const requiredRoles = route.data['roles'] as string[];
        const userRoles = this.authService.getRoles();
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

        if (hasRequiredRole) return true;

        return this.router.createUrlTree(['/explorer']);
      })
    );
}
}
