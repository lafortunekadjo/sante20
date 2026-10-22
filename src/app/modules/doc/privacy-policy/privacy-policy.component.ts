import { Component } from '@angular/core';
import { LegalDocComponent } from '../legal-doc/legal-doc.component';

/** Page « privacy » : le contenu bilingue vient de assets/i18n (clé legal.privacy), voir LegalDocComponent. */
@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [LegalDocComponent],
  template: '<app-legal-doc doc="privacy"></app-legal-doc>'
})
export class PrivacyPolicyComponent {}
