import { Pipe, PipeTransform } from '@angular/core';
import { Presence } from '../models/presence.model';

@Pipe({
  name: 'filterByCartonsRouges'
})
export class FilterByCartonsRougesPipe implements PipeTransform {
transform(presences: Presence[]): Presence[] {
    return presences.filter(p => p.present && p.aJoue && p.cartonsRouges > 0);
  }

}
