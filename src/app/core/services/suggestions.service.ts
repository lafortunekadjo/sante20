import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { SuggestionEnvoyee } from '../models/suggestion.model';

@Injectable({
  providedIn: 'root'
})
export class SuggestionsService {

  constructor(private http: HttpClient) { }

  /** Seul le texte est envoyé : l'auteur est déterminé par le serveur. */
  createSuggestion(texte: string): Observable<SuggestionEnvoyee> {
    return this.http.post<SuggestionEnvoyee>(`${environment.apiUrl}/suggestions`, { texte });
  }

  /** Les suggestions passées de l'utilisateur connecté, de la plus récente à la plus ancienne. */
  mesSuggestions(): Observable<SuggestionEnvoyee[]> {
    return this.http.get<SuggestionEnvoyee[]>(`${environment.apiUrl}/suggestions/mes`);
  }
}
