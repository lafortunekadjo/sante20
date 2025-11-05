import { Pipe, PipeTransform } from '@angular/core';
import { Presence } from '../models/presence.model';

@Pipe({ name: 'equipeFilter', standalone: true })

export class EquipeFilterPipe implements PipeTransform {

    transform(presences: Presence[], equipe: 'LOCALE' | 'ADVERSE', typeMatch: string): Presence[] {
    const equipeType = typeMatch === 'INTERNE' ? (equipe === 'LOCALE' ? 'JAUNE' : 'ROUGE') : equipe;
    return presences.filter(p => p.equipeMatch === equipeType && p.aJoue);
  }

}
