import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ExcelTeamTable {
  title: string;
  columns: string[];
  rows: any[];
  couleurHex?: string; // affichée en texte à côté du titre, ex: "(#DC2626)"
}

export interface ExcelOfficialDocumentOptions {
  officiel?: string;
  lieu?: string;
  directeurTechnique?: string;
  nomGroupe?: string;
}

@Injectable({ providedIn: 'root' })
export class ExcelExportService {

  exportToExcel(data: any[], fileName: string, sheetName = 'Feuille1'): void {
    if (!data?.length) return;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  exportTeamsSideBySide(
    tableA: ExcelTeamTable,
    tableB: ExcelTeamTable,
    fileName: string,
    signataire?: string
  ): void {
    const worksheet: XLSX.WorkSheet = {};
    const colsGapWidth = tableA.columns.length + 1;

    XLSX.utils.sheet_add_aoa(worksheet, [[tableA.title]], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(worksheet, [[tableB.title]], {
      origin: XLSX.utils.encode_cell({ r: 0, c: colsGapWidth })
    });

    XLSX.utils.sheet_add_json(worksheet, tableA.rows, {
      origin: XLSX.utils.encode_cell({ r: 2, c: 0 }),
      header: tableA.columns
    });
    XLSX.utils.sheet_add_json(worksheet, tableB.rows, {
      origin: XLSX.utils.encode_cell({ r: 2, c: colsGapWidth }),
      header: tableB.columns
    });

    const maxRows = Math.max(tableA.rows.length, tableB.rows.length);
    const infoRow = maxRows + 5;

    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`]
    ], { origin: XLSX.utils.encode_cell({ r: infoRow, c: 0 }) });

    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Signature : ${signataire || '_______________________'}`]
    ], { origin: XLSX.utils.encode_cell({ r: infoRow + 2, c: 0 }) });

    worksheet['!cols'] = Array(colsGapWidth * 2).fill({ wch: 16 });
    const totalCols = colsGapWidth * 2 - 1;
    const totalRows = infoRow + 3;
    worksheet['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: totalRows, c: totalCols });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tirage');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Export "document officiel". Le nom du groupe apparaît en haut (letterhead)
   * avant le titre. Note : SheetJS gratuit ne supporte pas la coloration de
   * cellule — la couleur de l'équipe est indiquée en texte à côté du titre.
   */
  exportTeamsOfficialDocument(
    titre: string,
    tableA: ExcelTeamTable,
    tableB: ExcelTeamTable,
    fileName: string,
    options?: ExcelOfficialDocumentOptions
  ): void {
    const worksheet: XLSX.WorkSheet = {};
    const numColsPerTable = tableA.columns.length + 1;
    const gapCols = 1;
    const blockWidth = numColsPerTable + gapCols;

    let row = 0;

    // ── Letterhead : nom du groupe en haut ──
    if (options?.nomGroupe) {
      XLSX.utils.sheet_add_aoa(worksheet, [[options.nomGroupe.toUpperCase()]], {
        origin: XLSX.utils.encode_cell({ r: row, c: 0 })
      });
      row += 2;
    }

    // ── Titre ──
    XLSX.utils.sheet_add_aoa(worksheet, [[titre.toUpperCase()]], {
      origin: XLSX.utils.encode_cell({ r: row, c: 0 })
    });
    row += 1;

    // ── Officiel (optionnel) ──
    if (options?.officiel) {
      XLSX.utils.sheet_add_aoa(worksheet, [[`Officiel : ${options.officiel}`]], {
        origin: XLSX.utils.encode_cell({ r: row, c: 0 })
      });
      row += 1;
    }
    row += 1;

    // ── En-têtes des équipes (avec couleur en texte si connue) ──
    const headerRow = row;
    const titreA = tableA.couleurHex ? `${tableA.title.toUpperCase()} (${tableA.couleurHex})` : tableA.title.toUpperCase();
    const titreB = tableB.couleurHex ? `${tableB.title.toUpperCase()} (${tableB.couleurHex})` : tableB.title.toUpperCase();

    XLSX.utils.sheet_add_aoa(worksheet, [[titreA]], {
      origin: XLSX.utils.encode_cell({ r: headerRow, c: 0 })
    });
    XLSX.utils.sheet_add_aoa(worksheet, [[titreB]], {
      origin: XLSX.utils.encode_cell({ r: headerRow, c: blockWidth })
    });
    const tableStartRow = headerRow + 1;

    const rowsANumbered = tableA.rows.map((r, i) => ({ 'N°': i + 1, ...r }));
    const rowsBNumbered = tableB.rows.map((r, i) => ({ 'N°': i + 1, ...r }));

    XLSX.utils.sheet_add_json(worksheet, rowsANumbered, {
      origin: XLSX.utils.encode_cell({ r: tableStartRow, c: 0 }),
      header: ['N°', ...tableA.columns]
    });
    XLSX.utils.sheet_add_json(worksheet, rowsBNumbered, {
      origin: XLSX.utils.encode_cell({ r: tableStartRow, c: blockWidth }),
      header: ['N°', ...tableB.columns]
    });

    const maxRows = Math.max(tableA.rows.length, tableB.rows.length);
    const footerRow = tableStartRow + maxRows + 4;

    const dateDuJour = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    }).format(new Date());

    const ligneFait = `Fait à ${options?.lieu || '__________'} le ${dateDuJour} par le Directeur Technique (DT) M. ${options?.directeurTechnique || '__________'}`;

    XLSX.utils.sheet_add_aoa(worksheet, [[ligneFait]], {
      origin: XLSX.utils.encode_cell({ r: footerRow, c: 0 })
    });

    worksheet['!cols'] = Array(blockWidth * 2).fill({ wch: 16 });
    const totalCols = blockWidth * 2 - 1;
    const totalRows = footerRow + 4;
    worksheet['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: totalRows, c: totalCols });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipes');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }
}