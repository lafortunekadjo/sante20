import { Pipe, PipeTransform } from '@angular/core';
import { Presence } from '../models/presence.model';

@Pipe({
  name: 'filterByCartonsJaunes'
})
export class FilterByCartonsJaunesPipe implements PipeTransform {

  transform(presences: Presence[]): Presence[] {
    return presences.filter(p => p.present && p.aJoue && p.cartonsJaunes > 0);
  }

}
