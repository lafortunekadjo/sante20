import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByEquipeAndNotPlayed'
})
export class FilterByEquipeAndNotPlayedPipe implements PipeTransform {

  transform(presences: any[] | null, equipe: string): any[] {
    if (!presences || presences.length === 0 || !equipe) {
      return [];
    }

    // Filtre les membres qui sont présents, appartiennent à l'équipe spécifiée, et n'ont PAS joué
    return presences.filter(presence => 
      presence.present && 
      !presence.aJoue && 
      presence.equipeMatch === equipe
    );
  }
}
