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

  /**
   * Vrai si l'adresse demandée est celle du menu ou une page de son module : le menu « /responsable/finances/dashboard »
   * donne aussi accès à « /responsable/finances/entree ». Un menu à deux niveaux (« /responsable/dashboard ») n'ouvre rien de plus.
   */
  private autorise(demandee: string, route?: string | null): boolean {
    if (!route) return false;
    if (demandee.startsWith(route)) return true;
    const segments = route.split('/').filter(Boolean);
    if (segments.length < 3) return false;
    return demandee.startsWith('/' + segments.slice(0, -1).join('/') + '/');
  }

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
        const hasAccess = userMenus.menus.some(menu => this.autorise(requestedRoute, menu.route));

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
