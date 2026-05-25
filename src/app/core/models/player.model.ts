export interface PlayerProfile {
  id: number;
  username: string;
  email: string;
  profilePhotoUrl: string | null;
  poste: string;
  piedFort: string;
  quartier: string;
  sexe: string;
  totalButsGlobal: number;
  totalPenaltysGlobal: number;
  totalPassesGlobal: number;
  totalCartonsGlobal: number;
  totalMatchsJoues: number;
  butsEncaisses: number;
  cleanSheets: number;
}