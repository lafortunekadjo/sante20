import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environment';
import { Sanction } from '../models/sanction.model';
import { User } from '../models/user';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Groupe } from '../models/groupe.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {


  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<User[]> {
      return this.http.get<User[]>(`${environment.apiUrl}/user/allGroup`);
    }

      getAllUsers2(): Observable<User[]> {
      return this.http.get<User[]>(`${environment.apiUrl}/user/allNotDelete2`);
    }

    createUser(user: any): Observable<User> {
      console.log(user)
    return this.http.post<User>(`${environment.apiUrl}/user/create`, user).pipe(
      catchError(err => {
        console.error('Erreur lors de la création de l’utilisateur:', err);
        return throwError(err);
      })
    );
  }

    createUserOnly(user: any): Observable<User> {
      console.log(user)
    return this.http.post<User>(`${environment.apiUrl}/user/createUser`, user).pipe(
      catchError(err => {
        console.error('Erreur lors de la création de l’utilisateur:', err);
        return throwError(err);
      })
    );
  }

 

    // getuserByGroup(userId: number): Observable<User> {
    //   return this.http.get<User>(`${environment.apiUrl}/user/${userId}`);
    // }

  

  createUser2(user: any): Observable<User> {
      console.log(user)
    return this.http.post<User>(`${environment.apiUrl}/user/create2`, user).pipe(
      catchError(err => {
        console.error('Erreur lors de la création de l’utilisateur:', err);
        return throwError(err);
      })
    );
  }




  updateUser(id: number, user: any): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/user/update/${id}`, user).pipe(
      catchError(err => {
        console.error('Erreur lors de la mise à jour de l’utilisateur:', err);
        return throwError(err);
      })
    );
  }
resetUserPassword(userId: number, newPassword: string): Observable<any> {
    
    // 1. Créez les paramètres de requête (query parameters)
    const params = new HttpParams().set('newPassword', newPassword);

    // 2. Définissez les options pour la requête
    const options = {
      // C'est ici que nous passons les HttpParams
      params: params
    };

    // 3. Appelez http.put. 
    // - Le deuxième argument doit être null car nous n'envoyons rien dans le corps (body).
    // - Le troisième argument sont les options (contenant les paramètres).
    return this.http.put(
      `${environment.apiUrl}/user/${userId}/reset-password`, 
      null, // Corps (body) vide ou null
      options
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
