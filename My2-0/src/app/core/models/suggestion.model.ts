export interface Suggestion {
  id?: number;
  texte: string;
  membre: {
    id: number;
  };
  dateSoumission?: Date;
}
