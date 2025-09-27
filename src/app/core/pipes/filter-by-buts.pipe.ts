import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByButs'
})
export class FilterByButsPipe implements PipeTransform {

  transform(presences: any[] | null): any[] {
    if (!presences || presences.length === 0) {
      return [];
    }

     // Filtre les présences qui ont marqué au moins un but, penalti ou bcsc
    return presences.filter(presence => presence.buts > 0 || presence.penalti > 0 || presence.butsContreSonCamp > 0);
  }
}
