import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AssetLoaderService } from './asset-loader.service';

export interface PdfColumn {
  header: string;
  dataKey: string;
}

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  rows: any[];
  fileName: string;
  orientation?: 'portrait' | 'landscape';
  logoPath?: string;
  signataire?: string;
}

export interface PdfTeamTable {
  title: string;
  columns: PdfColumn[];
  rows: any[];
  color?: [number, number, number]; // couleur RGB de l'équipe, ex: [220, 38, 38]
}

export interface PdfSideBySideOptions {
  title: string;
  subtitle?: string;
  tableA: PdfTeamTable;
  tableB: PdfTeamTable;
  fileName: string;
  logoPath?: string;
  signataire?: string;
}

export interface PdfOfficialDocumentOptions {
  titre: string;
  officiel?: string;
  tableA: PdfTeamTable;
  tableB: PdfTeamTable;
  lieu?: string;
  directeurTechnique?: string;
  nomGroupe?: string;
  fileName: string;
  logoPath?: string;
}

@Injectable({ providedIn: 'root' })
export class PdfExportService {

  private readonly primaryColor: [number, number, number] = [26, 62, 181];
  private readonly secondaryColor: [number, number, number] = [16, 129, 85];
  private readonly defaultColorA: [number, number, number] = [185, 28, 28];  // rouge
  private readonly defaultColorB: [number, number, number] = [55, 65, 81];  // gris

  constructor(private assetLoader: AssetLoaderService) {}

  async exportToPdf(options: PdfExportOptions): Promise<void> {
    const {
      title, subtitle, columns, rows, fileName,
      orientation = 'portrait', logoPath, signataire
    } = options;

    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let titleX = 14;

    if (logoPath) {
      const logoBase64 = await this.assetLoader.loadImageAsBase64(logoPath);
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, 10, 16, 16);
        titleX = 14 + 16 + 6;
      }
    }

    doc.setFontSize(16);
    doc.setTextColor(...this.primaryColor);
    doc.text(title, titleX, 18);

    if (subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(subtitle, titleX, 24);
    }

    doc.setFontSize(8);
    doc.setTextColor(150);
    const dateGeneration = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
    doc.text(dateGeneration, pageWidth - 14, 12, { align: 'right' });

    autoTable(doc, {
      startY: subtitle ? 30 : 26,
      head: [columns.map(c => c.header)],
      body: rows.map(row => columns.map(c => this.formatCell(row[c.dataKey]))),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: this.primaryColor, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 24 }
    });

    this.addFooterAndSignature(doc, signataire);
    doc.save(`${fileName}.pdf`);
  }

  async exportTeamsSideBySide(options: PdfSideBySideOptions): Promise<void> {
    const { title, subtitle, tableA, tableB, fileName, logoPath, signataire } = options;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let titleX = margin;

    if (logoPath) {
      const logoBase64 = await this.assetLoader.loadImageAsBase64(logoPath);
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin, 10, 16, 16);
        titleX = margin + 16 + 6;
      }
    }

    doc.setFontSize(16);
    doc.setTextColor(...this.primaryColor);
    doc.text(title, titleX, 18);

    if (subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(subtitle, titleX, 24);
    }

    doc.setFontSize(8);
    doc.setTextColor(150);
    const dateGeneration = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
    doc.text(dateGeneration, pageWidth - margin, 12, { align: 'right' });

    const startY = 32;
    const gap = 8;
    const tableWidth = (pageWidth - margin * 2 - gap) / 2;

    doc.setFontSize(11);
    doc.setTextColor(...this.primaryColor);
    doc.text(tableA.title, margin, startY - 3);

    autoTable(doc, {
      startY,
      margin: { left: margin },
      tableWidth,
      head: [tableA.columns.map(c => c.header)],
      body: tableA.rows.map(row => tableA.columns.map(c => this.formatCell(row[c.dataKey]))),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: this.primaryColor, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    const xTableB = margin + tableWidth + gap;
    doc.setFontSize(11);
    doc.setTextColor(...this.primaryColor);
    doc.text(tableB.title, xTableB, startY - 3);

    autoTable(doc, {
      startY,
      margin: { left: xTableB },
      tableWidth,
      head: [tableB.columns.map(c => c.header)],
      body: tableB.rows.map(row => tableB.columns.map(c => this.formatCell(row[c.dataKey]))),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: this.secondaryColor, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    this.addFooterAndSignature(doc, signataire);
    doc.save(`${fileName}.pdf`);
  }

  /**
   * Export PDF "document officiel" — format feuille de match / liste de tournoi.
   * En-tête : logo + nom du groupe (letterhead) + titre + officiel.
   * Corps : deux tableaux numérotés côte à côte, en-tête colorée selon la
   * couleur réelle de chaque équipe (tableA.color / tableB.color), avec
   * repli sur rouge/gris si l'équipe n'a pas de couleur définie.
   * Pied de page : ligne de signature "Fait à ... le ... par le DT M. ...".
   */
 async exportTeamsOfficialDocument(options: PdfOfficialDocumentOptions): Promise<void> {
  const {
    titre, officiel, tableA, tableB, lieu, directeurTechnique,
    nomGroupe, fileName, logoPath
  } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const colorA = tableA.color || this.defaultColorA;
  const colorB = tableB.color || this.defaultColorB;

  const logoBase64 = logoPath ? await this.assetLoader.loadImageAsBase64(logoPath) : null;

  const gap = 10;
  const usableWidth = pageWidth - margin * 2;
  const tableWidth = (usableWidth - gap) / 2;
  const xTableA = margin;
  const xTableB = margin + tableWidth + gap;

  const rowHeight = 6;      // hauteur d'une ligne de données (mm)
  const headerBlockHeight = 8; // hauteur de l'en-tête du tableau (mm)
  const bottomMargin = 26;  // réserve pour le pied de page / numéro de page

  const maxRows = Math.max(tableA.rows.length, tableB.rows.length);

  let currentRow = 0;
  let pageIndex = 0;

  // ── Dessine l'en-tête complet d'une page (letterhead + titre + officiel, uniquement page 1) ──
  const drawPageHeader = (isFirstPage: boolean): number => {
    let cursorY = 14;

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 8, 16, 16);
    }

    if (isFirstPage) {
      if (nomGroupe && nomGroupe.trim().length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(20, 20, 20);
        doc.text(nomGroupe.toUpperCase(), pageWidth / 2, cursorY + 4, { align: 'center' });
        cursorY += 8;
        doc.setDrawColor(210);
        doc.setLineWidth(0.3);
        doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
        cursorY += 8;
      } else {
        cursorY += 8;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(20, 20, 20);
      doc.text(titre.toUpperCase(), pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 7;

      if (officiel) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`Officiel : ${officiel}`, pageWidth / 2, cursorY, { align: 'center' });
        cursorY += 8;
      } else {
        cursorY += 4;
      }
    } else {
      cursorY += 12; // en-tête plus léger sur les pages suivantes
    }

    return cursorY;
  };

  // ── Dessine les en-têtes colorées des deux équipes + l'en-tête de colonnes ──
  const drawTeamHeaders = (cursorY: number): number => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...colorA);
    doc.text(tableA.title.toUpperCase(), xTableA + tableWidth / 2, cursorY + 4, { align: 'center' });
    doc.setTextColor(...colorB);
    doc.text(tableB.title.toUpperCase(), xTableB + tableWidth / 2, cursorY + 4, { align: 'center' });

    const yTableHeaderRow = cursorY + 9;

    // En-tête colonnes équipe A
    doc.setFillColor(...colorA);
    doc.rect(xTableA, yTableHeaderRow, tableWidth, headerBlockHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('N°', xTableA + 6, yTableHeaderRow + 5.5, { align: 'center' });
    doc.text('Nom', xTableA + tableWidth * 0.35, yTableHeaderRow + 5.5);
    doc.text('Prénom', xTableA + tableWidth * 0.68, yTableHeaderRow + 5.5);

    // En-tête colonnes équipe B
    doc.setFillColor(...colorB);
    doc.rect(xTableB, yTableHeaderRow, tableWidth, headerBlockHeight, 'F');
    doc.text('N°', xTableB + 6, yTableHeaderRow + 5.5, { align: 'center' });
    doc.text('Nom', xTableB + tableWidth * 0.35, yTableHeaderRow + 5.5);
    doc.text('Prénom', xTableB + tableWidth * 0.68, yTableHeaderRow + 5.5);

    return yTableHeaderRow + headerBlockHeight;
  };

  // ── Boucle de pagination : on remplit chaque page jusqu'à saturation ──
  let cursorY = drawPageHeader(true);
  let bodyStartY = drawTeamHeaders(cursorY);
  let y = bodyStartY;

  while (currentRow < maxRows) {
    // Vérifie s'il reste de la place pour une ligne de plus sur cette page
    if (y + rowHeight > pageHeight - bottomMargin) {
      doc.addPage();
      pageIndex++;
      cursorY = drawPageHeader(false);
      bodyStartY = drawTeamHeaders(cursorY);
      y = bodyStartY;
    }

    const isAlternate = currentRow % 2 === 1;
    if (isAlternate) {
      doc.setFillColor(248, 248, 248);
      doc.rect(xTableA, y, tableWidth, rowHeight, 'F');
      doc.rect(xTableB, y, tableWidth, rowHeight, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);

    const memberA = tableA.rows[currentRow];
    if (memberA) {
      doc.text(String(currentRow + 1), xTableA + 6, y + 4.2, { align: 'center' });
      doc.text(this.formatCell(memberA['Nom']), xTableA + tableWidth * 0.20, y + 4.2);
      doc.text(this.formatCell(memberA['Prénom']), xTableA + tableWidth * 0.58, y + 4.2);
    }

    const memberB = tableB.rows[currentRow];
    if (memberB) {
      doc.text(String(currentRow + 1), xTableB + 6, y + 4.2, { align: 'center' });
      doc.text(this.formatCell(memberB['Nom']), xTableB + tableWidth * 0.20, y + 4.2);
      doc.text(this.formatCell(memberB['Prénom']), xTableB + tableWidth * 0.58, y + 4.2);
    }

    // Bordure légère de séparation de ligne
    doc.setDrawColor(230);
    doc.setLineWidth(0.1);
    doc.line(xTableA, y + rowHeight, xTableA + tableWidth, y + rowHeight);
    doc.line(xTableB, y + rowHeight, xTableB + tableWidth, y + rowHeight);

    y += rowHeight;
    currentRow++;
  }

  // ── Pied de page signature (sur la dernière page utilisée, ou nouvelle page si pas de place) ──
  let footerY = y + 14;
  if (footerY > pageHeight - 20) {
    doc.addPage();
    footerY = 24;
  }

  const dateDuJour = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  }).format(new Date());

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40);
  const ligneFait = `Fait à ${lieu || '__________'} le ${dateDuJour} par le Directeur Technique (DT) M. ${directeurTechnique || '__________'}`;
  doc.text(ligneFait, pageWidth / 2, footerY, { align: 'center' });

  // ── Numérotation des pages ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  doc.save(`${fileName}.pdf`);
}

  private addFooterAndSignature(doc: jsPDF, signataire?: string): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      if (i === pageCount) {
        const ySignature = pageHeight - 28;
        doc.setDrawColor(200);
        doc.line(pageWidth - margin - 70, ySignature, pageWidth - margin, ySignature);
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(
          signataire || 'Signature du responsable',
          pageWidth - margin,
          ySignature + 5,
          { align: 'right' }
        );
      }

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }
  }

  private formatCell(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    return String(value);
  }
}