import { Pipe, PipeTransform } from '@angular/core';
import { Presence } from '../models/presence.model';

@Pipe({
  name: 'filterNonPlayers'
})
export class FilterNonPlayersPipe implements PipeTransform {

  transform(presences: Presence[]): Presence[] {
    return presences.filter(p => p.present && !p.aJoue);
  }

}
