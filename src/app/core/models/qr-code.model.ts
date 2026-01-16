// models/qr-code.model.ts
export interface QRCodeModel {  // Renommé pour éviter le conflit
  id?: string;
  content: string;
  label: string;
  createdAt?: Date;
  shortUrl?: string;
  shortCode?: string;
  scanCount: number;
}

export interface QRScan {
  id?: string;
  qrCodeId: string;
  scannedAt: Date;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
}