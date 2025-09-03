import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const excludedUrls = ['/api/auth/login'];
  const isExcluded = excludedUrls.some(url => req.url.includes(url));

  const cloned = req.clone({
    setHeaders: token && !isExcluded ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true // ✅ Ajout correct ici
  });

  return next(cloned);
};
