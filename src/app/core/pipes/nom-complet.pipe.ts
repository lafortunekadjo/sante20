import { Pipe, PipeTransform } from '@angular/core';
import { nomComplet } from '../utils/nom';

/** `{{ membre | nomComplet }}` ou `{{ membre | nomComplet:true }}` (nom d'abord) : jamais de « null ». */
@Pipe({ name: 'nomComplet', standalone: true })
export class NomCompletPipe implements PipeTransform {
  transform(p: { prenom?: string | null; nom?: string | null } | null | undefined, nomEnPremier = false): string {
    return nomComplet(p, nomEnPremier);
  }
}
