import { ApplicationConfig, importProvidersFrom, isDevMode, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideServiceWorker } from '@angular/service-worker';

registerLocaleData(localeFr);

/**
 * Langue des dates, mois et nombres (pipes `date`, `number`, `currency`) : celle choisie dans les paramètres, sinon celle
 * de l'appareil. Sans cela Angular affichait toujours « Sat, Oct 25 » même en français.
 */
export function langueDeLApplication(): string {
  try {
    const choisie = JSON.parse(localStorage.getItem('app-settings') ?? 'null')?.language;
    if (choisie === 'fr' || choisie === 'en') return choisie;
  } catch { /* stockage indisponible */ }
  return (navigator.language || 'fr').toLowerCase().startsWith('en') ? 'en-US' : 'fr';
}

// Classe de loader personnalisée
class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}
  
  getTranslation(lang: string): Observable<any> {
    return this.http.get(`assets/i18n/${lang}.json`);
  }
}

// Fonction factory
export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  return new CustomTranslateLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useFactory: langueDeLApplication },
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAnimations(),
    provideNativeDateAdapter(), 
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'fr',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    ), provideServiceWorker('sw-push.js', {
      enabled: !isDevMode(), // S'active uniquement en Production (Build Prod requis)
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
