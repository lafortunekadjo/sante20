// components/qr-dashboard/qr-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { QRCode } from 'qrcode';
import { QRCodeModel, QRScan } from '../../core/models/qr-code.model';
import { QrCodeService } from '../../core/services/qr-code.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { BaseChartDirective  } from 'ng2-charts';

@Component({
  selector: 'app-qr-dashboard',
  templateUrl: './qr-dashboard.component.html',
  styleUrls: ['./qr-dashboard.component.scss'],
   standalone: true,
    imports: [
      CommonModule,
      MatIconModule,
      FormsModule,
       MatCardModule,
       MatFormFieldModule,
       MatTableModule,
      MatListModule,
      MatTooltipModule,
      ClipboardModule,
    BaseChartDirective ,
    ],
})
export class QrDashboardComponent implements OnInit {
  qrCodes: QRCodeModel[] = [];
  selectedQRCode: QRCodeModel | null = null;
  scans: QRScan[] = [];
  
  // Configuration Chart.js
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Scans par jour',
      fill: false,
      tension: 0.1,
      borderColor: '#3f51b5',
      backgroundColor: '#3f51b5'
    }]
  };

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      }
    }
  };

  displayedColumns: string[] = ['label', 'content', 'createdAt', 'scanCount', 'actions'];

  constructor(private qrService: QrCodeService) {}

  ngOnInit() {
    this.loadQRCodes();
  }

  loadQRCodes() {
    this.qrService.getQRCodes().subscribe({
      next: (qrCodes) => this.qrCodes = qrCodes,
      error: (error) => console.error('Erreur chargement QR codes:', error)
    });
  }

  viewStats(qrCode: QRCodeModel) {
    this.selectedQRCode = qrCode;
    this.qrService.getQRCodeStats(qrCode.id!).subscribe({
      next: (scans) => {
        this.scans = scans;
        this.updateChart(scans);
      },
      error: (error) => console.error('Erreur chargement stats:', error)
    });
  }

  updateChart(scans: QRScan[]) {
    // Grouper les scans par jour
    const scansByDay = new Map<string, number>();
    
    scans.forEach(scan => {
      const day = new Date(scan.scannedAt).toLocaleDateString();
      scansByDay.set(day, (scansByDay.get(day) || 0) + 1);
    });

    // Mettre à jour le graphique
    this.lineChartData.labels = Array.from(scansByDay.keys());
    this.lineChartData.datasets[0].data = Array.from(scansByDay.values());
  }

  getDeviceIcon(userAgent?: string): string {
  if (!userAgent) return 'devices';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android')) return 'smartphone';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) return 'computer';
  
  return 'devices_other';
}
}