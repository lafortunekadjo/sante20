import { signal } from '@angular/core';

/** Une devise proposée aux groupes : code ISO 4217 et symbole écrit après le montant. */
export interface Devise {
  code: string;
  symbole: string;
  nom: string;
}

/** Devises proposées (une par groupe) ; la même liste que le serveur (`Devises.java`). Les deux francs CFA s'écrivent « FCFA ». */
export const DEVISES: Devise[] = [
  { code: 'XAF', symbole: 'FCFA', nom: 'Franc CFA (Afrique centrale)' },
  { code: 'XOF', symbole: 'FCFA', nom: 'Franc CFA (Afrique de l\'Ouest)' },
  { code: 'EUR', symbole: '€', nom: 'Euro' },
  { code: 'USD', symbole: '$', nom: 'Dollar américain' },
  { code: 'CAD', symbole: '$ CA', nom: 'Dollar canadien' },
  { code: 'GBP', symbole: '£', nom: 'Livre sterling' },
  { code: 'CHF', symbole: 'CHF', nom: 'Franc suisse' },
  { code: 'MAD', symbole: 'MAD', nom: 'Dirham marocain' },
  { code: 'DZD', symbole: 'DZD', nom: 'Dinar algérien' },
  { code: 'TND', symbole: 'TND', nom: 'Dinar tunisien' },
  { code: 'CDF', symbole: 'FC', nom: 'Franc congolais' },
  { code: 'GNF', symbole: 'GNF', nom: 'Franc guinéen' },
  { code: 'RWF', symbole: 'RWF', nom: 'Franc rwandais' },
  { code: 'BIF', symbole: 'BIF', nom: 'Franc burundais' },
  { code: 'MGA', symbole: 'Ar', nom: 'Ariary malgache' },
  { code: 'NGN', symbole: '₦', nom: 'Naira nigérian' },
  { code: 'GHS', symbole: 'GH₵', nom: 'Cedi ghanéen' },
  { code: 'KES', symbole: 'KSh', nom: 'Shilling kényan' }
];

export const DEVISE_PAR_DEFAUT = 'XAF';

/** Devise du groupe actif (mise à jour par `DeviseService` à la connexion et au changement de groupe). */
export const deviseCourante = signal<string>(DEVISE_PAR_DEFAUT);

/** Symbole d'une devise (« FCFA », « € »…) ; sans code, celui de la devise du groupe actif. */
export function symboleDevise(code?: string | null): string {
  const c = (code ?? deviseCourante() ?? DEVISE_PAR_DEFAUT).toUpperCase();
  return DEVISES.find(d => d.code === c)?.symbole ?? 'FCFA';
}

/** « 5 000 FCFA » : le montant en notation française suivi du symbole (devise du groupe actif par défaut). */
export function formaterMontant(montant: number | null | undefined, code?: string | null): string {
  return `${new Intl.NumberFormat('fr-FR').format(montant ?? 0)} ${symboleDevise(code)}`;
}
