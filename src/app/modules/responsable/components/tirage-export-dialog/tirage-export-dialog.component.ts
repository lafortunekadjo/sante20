// tirage-export-dialog/tirage-export-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Membre } from '../../../../core/models/membre.model';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { MembreService } from '../../../../core/services/membre.service';
import { ExcelImportService } from '../../../../core/services/excel-import.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


export interface TirageDialogData {
  membres: Membre[];
  equipes: Equipe[];
}

@Component({
  selector: 'app-tirage-export-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatCheckboxModule,
    DragDropModule, TranslateModule, MatProgressSpinnerModule
  ],
  templateUrl: './tirage-export-dialog.component.html',
  styleUrls: ['./tirage-export-dialog.component.scss']
})
export class TirageExportDialogComponent {
  step: 'setup' | 'adjust' = 'setup';

  equipeAId: number | null = null;
  equipeBId: number | null = null;
  nomEquipeA = '';
  nomEquipeB = '';
  includeInactive = false;

  poolA: Membre[] = [];
  poolB: Membre[] = [];
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<TirageExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TirageDialogData,
    private membreService: MembreService,
    private exportService: ExcelImportService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  get equipeAName(): string {
    return this.data.equipes.find(e => e.id === this.equipeAId)?.nom || this.nomEquipeA || 'Équipe A';
  }
  get equipeBName(): string {
    return this.data.equipes.find(e => e.id === this.equipeBId)?.nom || this.nomEquipeB || 'Équipe B';
  }

  canLaunchTirage(): boolean {
    const aOk = !!this.equipeAId || !!this.nomEquipeA.trim();
    const bOk = !!this.equipeBId || !!this.nomEquipeB.trim();
    return aOk && bOk && (this.equipeAId === null || this.equipeAId !== this.equipeBId);
  }

  lancerTirage(): void {
    const eligibles = this.data.membres.filter(m => this.includeInactive || m.active);
    const shuffled = [...eligibles].sort(() => Math.random() - 0.5);
    const half = Math.ceil(shuffled.length / 2);
    this.poolA = shuffled.slice(0, half);
    this.poolB = shuffled.slice(half);
    this.step = 'adjust';
  }

  drop(event: CdkDragDrop<Membre[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data, event.container.data,
        event.previousIndex, event.currentIndex
      );
    }
  }

  retourSetup(): void {
    this.step = 'setup';
  }

  annuler(): void {
    this.dialogRef.close();
  }

confirmerEtExporter(format: 'excel' | 'pdf'): void {
  if (!this.poolA.length && !this.poolB.length) return;
  this.isSaving = true;

  const assignments = [
    ...this.poolA.map(m => ({ membreId: m.id, equipeId: this.equipeAId, equipeNom: this.equipeAName })),
    ...this.poolB.map(m => ({ membreId: m.id, equipeId: this.equipeBId, equipeNom: this.equipeBName }))
  ];

  this.membreService.assignEquipesBulk(assignments).subscribe({
    next: () => {
      format === 'excel' ? this.exportExcel() : this.exportPdf();
      this.isSaving = false;
      this.snackBar.open(this.translate.instant('membres.tirageSuccess'), '✕', { duration: 4000 });
      this.dialogRef.close(true);
    },
    error: (err) => {
      this.isSaving = false;
      console.error('Erreur assignation équipes:', err);
      this.snackBar.open(this.translate.instant('membres.tirageError'), '✕', { duration: 5000 });
    }
  });
}
 private exportExcel(): void {
  const rows = [
    ...this.poolA.map(m => ({ Nom: m.nom, Prénom: m.prenom, Équipe: this.equipeAName })),
    ...this.poolB.map(m => ({ Nom: m.nom, Prénom: m.prenom, Équipe: this.equipeBName }))
  ];
  this.exportService.exportToExcel(rows, `tirage_equipes_${new Date().toISOString().slice(0, 10)}`);
}

private exportPdf(): void {
  const rows = [
    ...this.poolA.map(m => ({ Nom: m.nom, Prénom: m.prenom, Équipe: this.equipeAName })),
    ...this.poolB.map(m => ({ Nom: m.nom, Prénom: m.prenom, Équipe: this.equipeBName }))
  ];
  this.exportService.exportToPdf({
    title: 'Tirage au sort — Composition des équipes',
    subtitle: `${this.equipeAName} vs ${this.equipeBName}`,
    columns: [
      { header: 'Nom', dataKey: 'Nom' },
      { header: 'Prénom', dataKey: 'Prénom' },
      { header: 'Équipe', dataKey: 'Équipe' },
    ],
    rows,
    fileName: `tirage_equipes_${new Date().toISOString().slice(0, 10)}`
  });
}
}