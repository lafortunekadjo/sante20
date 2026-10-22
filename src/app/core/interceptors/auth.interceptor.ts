import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environment';
import { AuthService } from '../services/auth.service';

/** Pages consultables sans compte : une session expirée n'y renvoie pas vers la connexion. */
const PAGES_PUBLIQUES = ['/home', '/login', '/signup', '/privacy', '/terms', '/security', '/delete-account-info', '/p/', '/ligue', '/explorer', '/concours'];

/**
 * Intercepteur fonctionnel — lit token ET groupeId depuis localStorage
 * (AuthService n'est demandé qu'à la demande : pas de dépendance circulaire)
 *
 * Sécurité :
 *  • le jeton de connexion n'est envoyé QU'au serveur de l'application (jamais à un site tiers : images, CDN, API externes) ;
 *  • si le serveur répond 401 (jeton expiré ou invalide), la session est fermée proprement et l'utilisateur est renvoyé
 *    à l'accueil, au lieu de voir chaque écran échouer en silence. Les jetons durent 7 jours.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const injector = inject(Injector);

  // URLs publiques — pas de token nécessaire
  const publicUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    // Accès par lien (équipe / fiche joueur) : le jeton du lien suffit, un ancien jeton de session ne doit pas gêner
    '/public/equipe/',
    '/public/fiche/'
  ];

  // Inscription publique sans compte : un ancien jeton de session expiré ne doit pas la faire échouer
  const inscriptionPublique = /\/public\/competitions\/\d+\/inscription$/.test(req.url);

  if (inscriptionPublique || publicUrls.some(url => req.url.includes(url))) {
    return next(req);
  }

  // Seules les requêtes vers NOTRE serveur portent le jeton
  const versNotreServeur = req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api') || req.url.startsWith('api/');
  if (!versNotreServeur) {
    return next(req);
  }

  const token    = localStorage.getItem('token');
  const groupeId = localStorage.getItem('currentGroupeId');

  // Construire les headers à ajouter
  const headersToAdd: Record<string, string> = {};

  if (token) {
    headersToAdd['Authorization'] = `Bearer ${token}`;
  }

  if (groupeId) {
    headersToAdd['X-Groupe-Id'] = groupeId;
  }

  const requete = Object.keys(headersToAdd).length === 0 ? req : req.clone({ setHeaders: headersToAdd });

  return next(requete).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && token) {
        const chemin = window.location.pathname;
        const publique = chemin === '/' || PAGES_PUBLIQUES.some(p => chemin.startsWith(p));
        try {
          injector.get(AuthService).logout(!publique);   // ferme la session ; renvoie à l'accueil sauf sur une page publique
        } catch { /* service pas encore prêt : le prochain démarrage repartira d'une session propre */ }
      }
      return throwError(() => err);
    })
  );
};
