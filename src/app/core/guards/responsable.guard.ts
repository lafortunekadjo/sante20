import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour les routes responsable (gestion, finances, etc.)
 *
 * Vérifie à CHAQUE navigation (pas seulement au switch de groupe)
 * que l'user a bien le droit estResponsableGroupe sur le groupe actif,
 * et — si un roleCustom existe — que la route demandée fait partie
 * de ses menus autorisés.
 *
 * AVANTAGE vs vérification dans layout.component :
 * - Se déclenche AVANT que la page ne s'affiche (pas après coup)
 * - Couvre aussi la navigation directe par URL (deep link, refresh)
 * - Centralisé : un seul endroit à maintenir
 *
 * USAGE dans les routes :
 *   {
 *     path: 'gestion-finances',
 *     component: GestionFinancesComponent,
 *     canActivate: [responsableGuard]
 *   }
 */
export const responsableGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Pas responsable du tout sur le groupe actif → bloqué
  if (!authService.isResponsable()) {
    router.navigate(['/membre']);
    return false;
  }

  // 2. Si un roleCustom restreint les menus, vérifier que CETTE route
  //    fait partie des menus autorisés
  const roleCustom = authService.getRoleCustomActif();
  if (roleCustom) {
    const routesAutorisees = roleCustom.menus
      .map(m => m.route)
      .filter((r): r is string => !!r);

    const routeActuelle = state.url.split('?')[0];
    const estAutorisee = routesAutorisees.some(r => routeActuelle.startsWith(r));

    if (!estAutorisee) {
      router.navigate(['/membre']);
      return false;
    }
  }

  return true;
};