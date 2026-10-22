import { Component } from '@angular/core';
import { LegalDocComponent } from '../legal-doc/legal-doc.component';

/** Page « security » : le contenu bilingue vient de assets/i18n (clé legal.security), voir LegalDocComponent. */
@Component({
  selector: 'app-security-policy',
  standalone: true,
  imports: [LegalDocComponent],
  template: '<app-legal-doc doc="security"></app-legal-doc>'
})
export class SecurityPolicyComponent {}
