import { Pipe, PipeTransform } from '@angular/core';
import { symboleDevise } from '../devise';

/**
 * Symbole de la devise : `{{ montant | number }} {{ '' | devise }}` pour le groupe actif,
 * ou `{{ g.devise | devise }}` pour la devise d'un autre groupe (liste des groupes, profil public).
 * Impur : suit le changement de groupe sans rechargement.
 */
@Pipe({ name: 'devise', standalone: true, pure: false })
export class DevisePipe implements PipeTransform {
  transform(code?: string | null): string {
    return symboleDevise(code || null);
  }
}
