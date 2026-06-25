import { Component, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Membre } from '../../../../core/models/membre.model';
import { Presence } from '../../../../core/models/presence.model';
import { AuthService } from '../../../../core/services/auth.service';
import { MembreService } from '../../../../core/services/membre.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule, RouterModule, BaseChartDirective, MatCardModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent {

  membre: Membre | null = null;
  presences = new MatTableDataSource<Presence>();
  displayedColumns: string[] = ['dateMatch', 'typeMatch', 'lieu', 'buts', 'passes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private membreService: MembreService,
    private presenceService: PresenceService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const membreId = this.authService.getUserId();
    if (membreId) {
      this.membreService.getMembreWithStats(membreId).subscribe(membre => {
        this.membre = membre;
      });
      this.presenceService.getPresencesByMatch(1, 0).subscribe(presences => {
        this.presences.data = presences.filter(p => p.membre.id === membreId);
        this.presences.paginator = this.paginator;
      });
    }
  }
}
