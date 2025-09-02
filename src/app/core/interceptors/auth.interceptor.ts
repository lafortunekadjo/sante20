import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService); // Injection du service
  const token = authService.getToken();
  const excludedUrls = ['/api/auth/login']; // Adaptez à vos URLs réelles
  const isExcluded = excludedUrls.some(url => req.url.includes(url));

  if (token && !isExcluded) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  return next(req);
};