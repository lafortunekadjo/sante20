import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Routes, RouterModule } from '@angular/router';
import { GroupeFormComponent } from './components/groupe-form/groupe-form.component';
import { GroupeListComponent } from './components/groupe-list/groupe-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BaseChartDirective } from 'ng2-charts';



const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'groupes', component: GroupeListComponent },
  { path: 'groupes/new', component: GroupeFormComponent },
  { path: 'groupes/:id/edit', component: GroupeFormComponent },
  { path: 'users/new', component: UserFormComponent }
];


@NgModule({
  declarations: [
    DashboardComponent,
    GroupeListComponent,
    GroupeFormComponent,
    UserFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    BaseChartDirective
  ]
})
export class AdminModule {}
