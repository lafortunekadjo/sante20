import { TypeChamp } from "./question-candidature.model";

// Assurez-vous d'avoir une interface ou classe pour QuestionCreationDTO
export interface QuestionCreationDTO {
  texteQuestion: string;
  typeChamp: TypeChamp;
  optionsChoix: string[] | null; // <-- Le type attendu par le backend
  ordreAffichage: number;
  // ... autres champs
}