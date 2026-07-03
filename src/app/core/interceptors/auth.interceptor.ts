import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

/**
 * Intercepteur fonctionnel — lit token ET groupeId depuis localStorage
 * (pas d'injection AuthService → pas de dépendance circulaire)
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {

  // URLs publiques — pas de token nécessaire
  const publicUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/public/'
  ];

  if (publicUrls.some(url => req.url.includes(url))) {
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

  if (Object.keys(headersToAdd).length === 0) {
    return next(req);
  }

  return next(req.clone({ setHeaders: headersToAdd }));
};