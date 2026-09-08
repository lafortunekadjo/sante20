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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Membre } from '../../../../core/models/membre.model';
import { Equipe } from '../../../../core/models/groupe.model copy';
import { MembreService } from '../../../../core/services/membre.service';

import { AuthService } from '../../../../core/services/auth.service';
import { ExcelImportService } from '../../../../core/services/excel-import.service';

export interface TirageDialogData {
  membres: Membre[];
  equipes: Equipe[];
}

@Component({
  selector: 'app-tirage-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DragDropModule,
    TranslateModule
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
  excluded: Membre[] = [];
  isSaving = false;

  private readonly logoPath = 'assets/images/Logo2.png';

  constructor(
    private dialogRef: MatDialogRef<TirageExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TirageDialogData,
    private membreService: MembreService,
    private exportService: ExcelImportService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private authService: AuthService
  ) {}

  get equipeAName(): string {
    return this.data.equipes.find(e => e.id === this.equipeAId)?.nom || this.nomEquipeA || 'Équipe A';
  }

  get equipeBName(): string {
    return this.data.equipes.find(e => e.id === this.equipeBId)?.nom || this.nomEquipeB || 'Équipe B';
  }

  get totalInclus(): number {
    return this.poolA.length + this.poolB.length;
  }

  get currentUserName(): string {
    return (this.authService as any).getCurrentUsername?.() || 'Responsable';
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
    this.excluded = [];
    this.step = 'adjust';
  }

  drop(event: CdkDragDrop<Membre[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  retirerMembre(membre: Membre, pool: Membre[]): void {
    const index = pool.findIndex(m => m.id === membre.id);
    if (index !== -1) {
      pool.splice(index, 1);
      this.excluded.push(membre);
    }
  }

  reintegrerMembre(membre: Membre, cible: 'A' | 'B'): void {
    const index = this.excluded.findIndex(m => m.id === membre.id);
    if (index !== -1) {
      this.excluded.splice(index, 1);
      (cible === 'A' ? this.poolA : this.poolB).push(membre);
    }
  }

  retourSetup(): void {
    this.step = 'setup';
  }

  annuler(): void {
    this.dialogRef.close();
  }

  confirmerEtExporter(format: 'excel' | 'pdf'): void {
    if (this.totalInclus === 0) return;
    this.isSaving = true;

    const assignments = [
      ...this.poolA.map(m => ({ membreId: m.id, equipeId: this.equipeAId, equipeNom: this.equipeAName })),
      ...this.poolB.map(m => ({ membreId: m.id, equipeId: this.equipeBId, equipeNom: this.equipeBName }))
    ];
    // Les membres dans `excluded` ne sont volontairement pas inclus ici :
    // leur équipe actuelle n'est pas modifiée et ils n'apparaissent pas dans l'export.

    this.membreService.assignEquipesBulk(assignments).subscribe({
      next: async () => {
        try {
          if (format === 'excel') {
            this.exportExcel();
          } else {
            await this.exportPdf();
          }
          this.snackBar.open(this.translate.instant('membres.tirageSuccess'), '✕', { duration: 4000 });
          this.dialogRef.close(true);
        } catch (exportErr) {
          console.error('Erreur génération export:', exportErr);
          this.snackBar.open(this.translate.instant('membres.exportError'), '✕', { duration: 5000 });
        } finally {
          this.isSaving = false;
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Erreur assignation équipes:', err);
        this.snackBar.open(this.translate.instant('membres.tirageError'), '✕', { duration: 5000 });
      }
    });
  }

  private exportExcel(): void {
    this.exportService.exportTeamsSideBySide(
      {
        title: this.equipeAName,
        columns: ['Nom', 'Prénom'],
        rows: this.poolA.map(m => ({ Nom: m.nom, Prénom: m.prenom }))
      },
      {
        title: this.equipeBName,
        columns: ['Nom', 'Prénom'],
        rows: this.poolB.map(m => ({ Nom: m.nom, Prénom: m.prenom }))
      },
      `tirage_equipes_${new Date().toISOString().slice(0, 10)}`,
      this.currentUserName
    );
  }

  private async exportPdf(): Promise<void> {
    await this.exportService.exportTeamsSideBySide2({
      title: 'Tirage au sort — Composition des équipes',
      subtitle: `${this.equipeAName} vs ${this.equipeBName}`,
      tableA: {
        title: this.equipeAName,
        columns: [
          { header: 'Nom', dataKey: 'Nom' },
          { header: 'Prénom', dataKey: 'Prénom' }
        ],
        rows: this.poolA.map(m => ({ Nom: m.nom, Prénom: m.prenom }))
      },
      tableB: {
        title: this.equipeBName,
        columns: [
          { header: 'Nom', dataKey: 'Nom' },
          { header: 'Prénom', dataKey: 'Prénom' }
        ],
        rows: this.poolB.map(m => ({ Nom: m.nom, Prénom: m.prenom }))
      },
      fileName: `tirage_equipes_${new Date().toISOString().slice(0, 10)}`,
      logoPath: this.logoPath,
      signataire: this.currentUserName
    });
  }
}