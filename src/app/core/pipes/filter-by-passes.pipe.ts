import { Pipe, PipeTransform } from '@angular/core';
import { Presence } from '../models/presence.model';

@Pipe({
  name: 'filterByPasses'
})
export class FilterByPassesPipe implements PipeTransform {

  transform(items: Presence[]): Presence[] {
    if (!items) {
      return [];
    }
    return items.filter(item => item.passes && item.passes > 0);
  }

}
