import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environment';
import { Sanction } from '../models/sanction.model';
import { User } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { Groupe } from '../models/groupe.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<User[]> {
      return this.http.get<User[]>(`${environment.apiUrl}/user/allNotDelete`);
    }

    createUser(user: User): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/user/create`, user).pipe(
      catchError(err => {
        console.error('Erreur lors de la création de l’utilisateur:', err);
        return throwError(err);
      })
    );
  }



  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/user/update/${id}`, user).pipe(
      catchError(err => {
        console.error('Erreur lors de la mise à jour de l’utilisateur:', err);
        return throwError(err);
      })
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/user/delete/${id}`, {}).pipe(
      catchError(err => {
        console.error('Erreur lors de la suppression de l’utilisateur:', err);
        return throwError(err);
      })
    );
  }

  activateUser(id: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/user/enable/${id}`, {}).pipe(
      catchError(err => {
        console.error('Erreur lors de l’activation de l’utilisateur:', err);
        return throwError(err);
      })
    );
  }

  deactivateUser(id: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/user/disable/${id}`, {}).pipe(
      catchError(err => {
        console.error('Erreur lors de la désactivation de l’utilisateur:', err);
        return throwError(err);
      })
    );
  }

}
