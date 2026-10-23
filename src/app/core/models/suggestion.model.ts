export interface Suggestion {
  id?: number;
  texte: string;
  dateSoumission?: Date;
}

/** Une suggestion déjà envoyée par l'utilisateur connecté. */
export interface SuggestionEnvoyee {
  id: number;
  texte: string;
  dateSoumission: string;
  groupe: string | null;
}
