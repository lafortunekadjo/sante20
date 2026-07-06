import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Suggestion } from '../models/suggestion.model';

@Injectable({
  providedIn: 'root'
})
export class SuggestionsService {

  constructor(private http: HttpClient) { }

  createSuggestion(suggestion: Suggestion): Observable<Suggestion> {
    return this.http.post<Suggestion>(`${environment.apiUrl}/suggestions`, suggestion);
  }
}
