import { Match } from "./match.model";
import { Membre } from "./membre.model";

export interface Presence {
  id: number;
  membre: Membre;
  match: Match;
  aJoue: boolean;
  estCapitaine: boolean;
  buts: number;
  passes: number;
  estHommeDuMatch: boolean;
  equipeMatch: string;
  present: boolean; 
  cartonsJaunes: number;
  cartonsRouges: number;
  estHommeDuMatchEq:boolean;
}