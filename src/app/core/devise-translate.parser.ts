import { Injectable } from '@angular/core';
import { TranslateDefaultParser } from '@ngx-translate/core';
import { symboleDevise } from './devise';

/**
 * Les textes traduits sont écrits avec « FCFA » : pour un groupe qui a choisi une autre devise,
 * on met son symbole à la place (« Montant (€) »). Sans effet pour un groupe en franc CFA.
 */
@Injectable()
export class DeviseTranslateParser extends TranslateDefaultParser {
  override interpolate(expr: any, params?: any): string | undefined {
    const texte = super.interpolate(expr, params);
    if (typeof texte !== 'string' || !texte.includes('FCFA')) return texte;
    const symbole = symboleDevise();
    return symbole === 'FCFA' ? texte : texte.split('FCFA').join(symbole);
  }
}
