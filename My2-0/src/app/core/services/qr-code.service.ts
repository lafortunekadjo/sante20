// services/qr-code.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as QRCodeLib from 'qrcode';  // Renommé l'import
import { QRCodeModel, QRScan } from '../models/qr-code.model';

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {
  private apiUrl = 'http://localhost:8082/api/qrcodes';

  constructor(private http: HttpClient) {}

  generateQRCode(content: string, label: string): Observable<QRCodeModel> {
    return this.http.post<QRCodeModel>(this.apiUrl, { content, label });
  }

  getQRCodes(): Observable<QRCodeModel[]> {
    return this.http.get<QRCodeModel[]>(this.apiUrl);
  }

  getQRCodeStats(id: string): Observable<QRScan[]> {
    return this.http.get<QRScan[]>(`${this.apiUrl}/${id}/scans`);
  }

  async generateQRCodeImage(content: string): Promise<string> {
    try {
      return await QRCodeLib.toDataURL(content, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}