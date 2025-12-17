// auth.interceptor.ts - Version CORRIGÉE sans dépendance circulaire

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

/**
 * Intercepteur fonctionnel qui ajoute le token JWT aux requêtes.
 * 
 * ⚠️ IMPORTANT: On NE PEUT PAS injecter AuthService ici car cela crée une dépendance circulaire:
 * AuthService → HttpClient → AuthInterceptor → AuthService
 * 
 * Solution: Lire le token directement depuis localStorage
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  
  // URLs qui ne nécessitent PAS de token (endpoints publics)
  const publicUrls = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/public/'
  ];

  // Vérifier si c'est une URL publique
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  
  if (isPublicUrl) {
    return next(req);
  }

  // ✅ Récupérer le token DIRECTEMENT depuis localStorage (pas via AuthService)
  const token = localStorage.getItem('token');

  if (token) {
    // Cloner la requête et ajouter le header Authorization
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  // Pas de token, continuer sans modification
  return next(req);
};