// components/qr-generator/qr-generator.component.ts
import { Component } from '@angular/core';
import { QRCodeModel } from '../../core/models/qr-code.model';
import { QrCodeService } from '../../core/services/qr-code.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';


@Component({
  selector: 'app-qr-generator',
  templateUrl: './qr-generator.component.html',
  styleUrls: ['./qr-generator.component.scss'],
  standalone: true,
    imports: [
      CommonModule,
      MatIconModule,
      FormsModule,
       MatCardModule,
       MatFormFieldModule
    ],
})
export class QrGeneratorComponent {
  content: string = '';
  label: string = '';
  qrCodeImage: string = '';
  generatedQRCode: QRCodeModel | null = null;
  loading: boolean = false;

  constructor(private qrService: QrCodeService) {}

  async generateQR() {
    if (!this.content || !this.label) {
      return;
    }

    this.loading = true;
    try {
      // Générer l'image QR
      this.qrCodeImage = await this.qrService.generateQRCodeImage(this.content);
      
      // Enregistrer dans la base de données
      this.qrService.generateQRCode(this.content, this.label).subscribe({
        next: (qrCode) => {
          this.generatedQRCode = qrCode;
          // Remplacer le contenu par l'URL de tracking
          if (qrCode.shortUrl) {
            this.regenerateWithTrackingUrl(qrCode.shortUrl);
          }
        },
        error: (error) => console.error('Erreur:', error),
        complete: () => this.loading = false
      });
    } catch (error) {
      console.error('Erreur génération QR:', error);
      this.loading = false;
    }
  }

  async regenerateWithTrackingUrl(trackingUrl: string) {
    this.qrCodeImage = await this.qrService.generateQRCodeImage(trackingUrl);
  }

  downloadQRCode() {
    const link = document.createElement('a');
    link.download = `${this.label}.png`;
    link.href = this.qrCodeImage;
    link.click();
  }

  reset() {
    this.content = '';
    this.label = '';
    this.qrCodeImage = '';
    this.generatedQRCode = null;
  }
}