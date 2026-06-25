import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { QuestionCandidature } from '../models/question-candidature.model';
import { QuestionCreationDTO } from '../models/creation-questiondto.model';
import { DemandeAdhesion } from '../models/groupe-explorer.model';


@Injectable({
  providedIn: 'root'
})
export class QuestionCandidatureService {


  private apiUrl = `${environment.apiUrl}/candidatures`;

  constructor(private http: HttpClient) {}

  // Récupérer toutes les questions d'un groupe
  getQuestionsByGroupe(groupeId: number): Observable<QuestionCandidature[]> {
    return this.http.get<QuestionCandidature[]>(`${this.apiUrl}/groupes/${groupeId}/formulaire`);
  }



// Fonction corrigée dans votre service Angular
createQuestion(groupeId: number, question: QuestionCandidature): Observable<QuestionCandidature> {
    
    // 1. Initialiser le tableau d'options (gestion des nulls et des chaînes vides)
    const rawOptionsString: string | null = question.optionsChoix || null;
    let optionsArray: string[] | null = null;
    
    // Vérification pour s'assurer que nous traitons uniquement les chaînes non vides
    if (rawOptionsString) {
        optionsArray = rawOptionsString
            .split(';')
            .map(option => option.trim())
            .filter(option => option.length > 0);
    }

    // Si le type de champ ne requiert pas d'options (ex: TEXTE_COURT), assurez-vous que optionsArray est null
    // (Une logique front-end 'needsOptions()' est souvent utilisée ici)
    if (question.typeChamp !== 'CHOIX_UNIQUE') {
        optionsArray = null;
    }

    // 2. Création du Payload Mapper (le nouvel objet DTO)
    const payload: QuestionCreationDTO = {
        texteQuestion: question.texteQuestion,
        typeChamp: question.typeChamp,
        ordreAffichage: question.ordreAffichage,
        
        // ATTENTION : C'est ici que le tableau formaté est injecté !
        optionsChoix: optionsArray 
    };

    console.log('Payload envoyé au backend:', payload);

    // 3. Envoi du nouvel objet 'payload'
    return this.http.post<QuestionCandidature>(
        `${environment.apiUrl}/groupes/${groupeId}/questions`, // Utilisation de l'URL admin
        payload
    );
}


  // Mettre à jour une question
  updateQuestion(id: number, question: QuestionCandidature): Observable<QuestionCandidature> {
    return this.http.put<QuestionCandidature>(`${environment.apiUrl}/groupes/question/${id}`, question);
  }

  // Supprimer une question
  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Réorganiser les questions (update l'ordre)
  updateOrdreQuestions(questions: QuestionCandidature[]): Observable<QuestionCandidature[]> {
    return this.http.put<QuestionCandidature[]>(`${this.apiUrl}/reorder`, questions);
  }

  // Dupliquer une question
  duplicateQuestion(id: number): Observable<QuestionCandidature> {
    return this.http.post<QuestionCandidature>(`${this.apiUrl}/${id}/duplicate`, {});
  }

    createDemandeAdhesion(id:number, demande: any): Observable<DemandeAdhesion> {
      return this.http.post<DemandeAdhesion>(`${this.apiUrl}/groupes/${id}/soumettre`, demande);
    }


      // Récupérer toutes les demandes d'un groupe
  getDemandesParGroupe(): Observable<DemandeAdhesion[]> {
    return this.http.get<DemandeAdhesion[]>(`${this.apiUrl}/groupes/en-attente`);
  }

  // traiterDemandeAdhesion(id: number, status: string): Observable<QuestionCandidature[]> {
  //   return this.http.put<QuestionCandidature[]>(`${this.apiUrl}/candidatures/${id}/traiter`, status);
  // }

    /**
   * Récupérer toutes les demandes d'adhésion de l'utilisateur connecté
   * Retourne les demandes avec les infos du groupe associé
   */
  getMesDemandesAdhesion(): Observable<DemandeAdhesion[]> {
    return this.http.get<DemandeAdhesion[]>(`${this.apiUrl}/demandes-adhesion/mes-demandes`);
  }



  /**
   * Traiter une demande d'adhésion (accepter ou refuser)
   * @param demandeId - ID de la demande
   * @param statut - 'ACCEPTEE' ou 'REFUSEE'
   * @param motifRefus - Motif du refus (optionnel)
   */
  traiterDemandeAdhesion(
    demandeId: number, 
    statut: 'ACCEPTEE' | 'REFUSEE',
    motifRefus?: string
  ): Observable<DemandeAdhesion> {
    return this.http.put<DemandeAdhesion>(
      `${this.apiUrl}/${demandeId}/traiter`,
      { 
        statut
      }
    );
  }

  /**
   * Annuler une demande d'adhésion (par l'utilisateur)
   * Seules les demandes avec statut EN_ATTENTE peuvent être annulées
   */
  annulerDemandeAdhesion(demandeId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/demandes-adhesion/${demandeId}`);
  }

  /**
   * Récupérer les détails d'une demande spécifique
   */
  getDemandeDetails(demandeId: number): Observable<DemandeAdhesion> {
    return this.http.get<DemandeAdhesion>(`${this.apiUrl}/demandes-adhesion/${demandeId}`);
  }

  // /**
  //  * Créer une demande d'adhésion
  //  * @param groupeId - ID du groupe
  //  * @param demande - Objet DemandeAdhesion contenant les réponses
  //  */
  // createDemandeAdhesion(groupeId: number, demande: DemandeAdhesion): Observable<DemandeAdhesion> {
  //   return this.http.post<DemandeAdhesion>(
  //     `${this.apiUrl}/groupes/${groupeId}/demandes-adhesion`,
  //     demande
  //   );
  // }

  /**
   * Vérifier si l'utilisateur a déjà fait une demande pour ce groupe
   * Retourne la demande existante si elle existe
   */
  checkDemandeExistante(groupeId: number): Observable<{ 
    existe: boolean; 
    demande?: DemandeAdhesion 
  }> {
    return this.http.get<{ existe: boolean; demande?: DemandeAdhesion }>(
      `${this.apiUrl}/groupes/${groupeId}/ma-demande`
    );
  }

  /**
   * Obtenir les statistiques des demandes pour un groupe
   */
  getStatistiquesDemandesGroupe(groupeId: number): Observable<{
    total: number;
    enAttente: number;
    acceptees: number;
    refusees: number;
  }> {
    return this.http.get<{
      total: number;
      enAttente: number;
      acceptees: number;
      refusees: number;
    }>(`${this.apiUrl}/groupes/${groupeId}/demandes-adhesion/statistiques`);
  }

  /**
   * Obtenir le nombre de demandes en attente pour l'utilisateur connecté
   * Utile pour les badges de notification
   */
  getNombreDemandesEnAttente(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${this.apiUrl}/demandes-adhesion/mes-demandes/count?statut=EN_ATTENTE`
    );
  }

  /**
   * Obtenir le nombre de demandes en attente pour un groupe
   * (pour les responsables)
   */
  getNombreDemandesEnAttenteGroupe(groupeId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${this.apiUrl}/groupes/${groupeId}/demandes-adhesion/count?statut=EN_ATTENTE`
    );
  }

  // * Récupérer le formulaire public d'un groupe (questions de candidature)
//  * @param groupeId - ID du groupe
//  */
getFormulairePublic(groupeId: number): Observable<QuestionCandidature[]> {
  return this.http.get<QuestionCandidature[]>(`${this.apiUrl}/groupes/${groupeId}/formulaire`);
}

/**
 * Récupérer les réponses d'une demande spécifique
 * @param demandeId - ID de la demande
 */
getReponsesByDemandeId(demandeId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/demande/reponse/${demandeId}`);
}

  
}
