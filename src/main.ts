(window as any).global = window;

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { TranslateService } from '@ngx-translate/core';
import { enregistrerTraducteur } from './app/core/i18n/traduire';

registerLocaleData(localeFr, 'fr');
bootstrapApplication(AppComponent, appConfig)
  .then(ref => enregistrerTraducteur(ref.injector.get(TranslateService)))
  .catch((err) => console.error(err));
