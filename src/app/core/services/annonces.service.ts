import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Announcement } from "../models/announcement.model";
import { environment } from "../../environment";

@Injectable({ providedIn: 'root' })
export class AnnoncesService {
 
 


  private api = `${environment.apiUrl}/annonces`; 

  constructor(private http: HttpClient) {}

  creer(data: any) {
    return this.http.post<Announcement>(this.api, data);
  }

  envoyerManuelle(dto: any, ciblage: any) {
    return this.http.post<number>(this.api + '/notify', { ...dto, ...ciblage });
  }

   envoyerMaintenant(id: number) {
    return this.http.post<Announcement>(this.api, id);
  }

    getMesAnnonces() {
    return this.http.get<any>(this.api + '/mes-annonces')
  }

   supprimer(id: number) {
     return this.http.post<Announcement>(this.api, id);
  
  }
  sauvegarderBrouillon(payload: any) {
     return this.http.post<Announcement>(this.api, payload);
  }
  modifier(arg0: number, payload: any) {
     return this.http.post<Announcement>(this.api, payload);
  }

}