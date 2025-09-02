import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { StatsComponent } from './components/stats/stats.component';
import { BaseChartDirective } from 'ng2-charts';




const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'stats', component: StatsComponent }
];

@NgModule({
  declarations: [
    DashboardComponent,
    StatsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatTableModule,
    MatPaginatorModule,
    BaseChartDirective
  ]
})
export class MembreModule {}