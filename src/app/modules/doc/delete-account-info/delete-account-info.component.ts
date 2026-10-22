import { Component } from '@angular/core';
import { LegalDocComponent } from '../legal-doc/legal-doc.component';

/** Page publique expliquant comment supprimer son compte et ses données (exigée par Google Play, accessible sans connexion). */
@Component({
  selector: 'app-delete-account-info',
  standalone: true,
  imports: [LegalDocComponent],
  template: '<app-legal-doc doc="deletion"></app-legal-doc>'
})
export class DeleteAccountInfoComponent {}
