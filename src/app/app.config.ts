import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideServiceWorker } from '@angular/service-worker';

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
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(), // S'active uniquement en mode production (nécessaire sur mobile)
      registrationStrategy: 'registerWhenStable:30000' // S'enregistre dès que l'app est stable
    }),
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
