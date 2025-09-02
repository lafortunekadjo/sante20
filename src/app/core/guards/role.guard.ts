import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    console.log('dans le gaurd');
    const requiredRoles = route.data['roles'] as string[];
    const userRoles = this.authService.getRoles();
    console.log('RoleGuard: Rôles requis:', requiredRoles, 'Rôles utilisateur:', userRoles);

    if (this.authService.isAuthenticated() && requiredRoles.some(role => userRoles.includes(role))) {
      console.log('RoleGuard: Accès autorisé');
      return true;
    }

    console.log('RoleGuard: Accès refusé, redirection vers /login');
    this.router.navigate(['/login']);
    return false;
  }
}