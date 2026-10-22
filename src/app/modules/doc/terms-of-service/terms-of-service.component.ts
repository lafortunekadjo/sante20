import { Component } from '@angular/core';
import { LegalDocComponent } from '../legal-doc/legal-doc.component';

/** Page « terms » : le contenu bilingue vient de assets/i18n (clé legal.terms), voir LegalDocComponent. */
@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [LegalDocComponent],
  template: '<app-legal-doc doc="terms"></app-legal-doc>'
})
export class TermsOfServiceComponent {}
