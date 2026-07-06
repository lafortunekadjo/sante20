import { Pipe, PipeTransform } from '@angular/core';
import { Presence } from '../models/presence.model';

@Pipe({
  name: 'filterByEquipe'
})
export class FilterByEquipePipe implements PipeTransform {

   transform(presences: Presence[], equipe: string): Presence[] {
    return presences.filter(p => p.present && p.aJoue && p.equipeMatch === equipe);
  }

}
