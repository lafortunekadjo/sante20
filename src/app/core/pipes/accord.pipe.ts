import { Pipe, PipeTransform } from '@angular/core';

/**
 * Accord au singulier d'un libellé pluriel déjà traduit : « votes » → « vote » quand il y en a 0 ou 1.
 * Usage : {{ n }} {{ 'mvpVote.votes' | translate | accord:n }}
 */
@Pipe({ name: 'accord', standalone: true })
export class AccordPipe implements PipeTransform {
  transform(libelle: string | null | undefined, nombre: number | null | undefined): string {
    const texte = libelle ?? '';
    return Math.abs(nombre ?? 0) < 2 ? texte.replace(/s(?=\W*$)/i, '') : texte;
  }
}
