import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';


import { AuditDiffDialogComponent } from '../audit-diff-dialog/audit-diff-dialog.component';
import { AuditDto, AuditService } from '../../../../core/services/audit.service';

@Component({
  selector: 'app-audit-list',
  standalone: true, // Ajoutez ceci
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './audit-list.component.html',
  styleUrls: ['./audit-list.component.scss']
})
export class AuditListComponent implements OnInit {
  // Le reste du code reste identique...
  dataSource = new MatTableDataSource<AuditDto>([]);
  displayedColumns: string[] = ['date', 'utilisateur', 'action', 'details', 'compare'];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private auditService: AuditService, private dialog: MatDialog) {}

  ngOnInit(): void { this.loadAuditLogs(); }

  loadAuditLogs(): void {
    this.auditService.getMouvementsAudit().subscribe(data => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  compareChanges(log: AuditDto): void {
    this.auditService.getPreviousVersion(log.entiteId, log.revisionId).subscribe(previous => {
      this.dialog.open(AuditDiffDialogComponent, {
        width: '700px',
        data: {
          current: log.details,
          previous: previous,
          action: log.action,
          user: log.utilisateur,
          date: log.date
        }
      });
    });
  }
}