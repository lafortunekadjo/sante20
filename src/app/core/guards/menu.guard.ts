// src/app/core/guards/menu.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { RoleCustomService } from '../services/role-custom.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MenuGuard implements CanActivate {

  constructor(
    private roleCustomService: RoleCustomService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    
    // const groupeId = this.authService.getCurrentGroupeId();
    
    // if (!groupeId) {
    //   this.router.navigate(['/explorer']);
    //   return of(false);
    // }

    // Récupérer les menus de l'utilisateur
    return this.roleCustomService.getUserMenus().pipe(
      map(userMenus => {
        const requestedRoute = state.url;
        
        // Vérifier si l'utilisateur a accès à cette route
        const hasAccess = userMenus.menus.some(menu => 
          requestedRoute.startsWith(menu.route)
        );

        if (!hasAccess) {
          this.router.navigate(['/responsable/dashboard']);
          return false;
        }

        return true;
      }),
      catchError(() => {
        this.router.navigate(['/explorer']);
        return of(false);
      })
    );
  }
}