import { TranslateService } from '@ngx-translate/core';

/**
 * Traduction utilisable partout (services, composants, fonctions) sans injecter TranslateService :
 *   snackBar.open(t('ui.erreur_lors_de_la_suppression_ab12'), 'OK')
 * Le traducteur est enregistré au démarrage de l'application (main.ts). La langue suit le choix de l'utilisateur.
 * À appeler au moment de l'affichage (dans une méthode) : une constante évaluée avant le chargement de la langue
 * renverrait la clé brute.
 */
let traducteur: TranslateService | null = null;

export function enregistrerTraducteur(service: TranslateService): void {
  traducteur = service;
}

export function t(cle: string, parametres?: object): string {
  return traducteur ? traducteur.instant(cle, parametres) : cle;
}
