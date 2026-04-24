import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Stade } from '../../../../core/models/stade';
import { StadeService } from '../../../../core/services/stade.service';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-stade-gestion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    MatBadgeModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './stade-gestion.component.html',
  styleUrls: ['./stade-gestion.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class StadeGestionComponent implements OnInit {
  stades: Stade[] = [];
  isLoading = true;
  showForm = false;
  isEditing = false;
  stadeForm: FormGroup;
  selectedId?: number;

  constructor(private fb: FormBuilder, private service: StadeService) {
    this.stadeForm = this.fb.group({
      nom: ['', Validators.required],
      stadiumLat: [null],
      stadiumLon: [null],
      radius: [50, [Validators.min(5)]]
    });
  }

  ngOnInit() { this.fetchStades(); }

  fetchStades() {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: (data) => { this.stades = data; this.isLoading = false; },
      error: () => this.isLoading = false
    });
  }

  getMaxRadius(): number {
    return this.stades.length > 0 ? Math.max(...this.stades.map(s => s.radius)) : 0;
  }

  getCurrentPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        this.stadeForm.patchValue({
          stadiumLat: pos.coords.latitude,
          stadiumLon: pos.coords.longitude
        });
      });
    }
  }

  toggleForm() { this.showForm = !this.showForm; if(!this.showForm) this.reset(); }

  editStade(s: Stade) {
    this.isEditing = true;
    this.selectedId = s.id;
    this.stadeForm.patchValue(s);
    this.showForm = true;
  }

  onSubmit() {

    if (this.stadeForm.invalid) return;

    
    const request = this.isEditing 
      ? this.service.update(this.selectedId!, this.stadeForm.value)
      : this.service.create(this.stadeForm.value);

    request.subscribe(() => {
      this.fetchStades();
      this.toggleForm();
    });
  }

  deleteStade(id: any) {
    if (confirm('Supprimer ce stade ?')) {
      this.service.delete(id).subscribe(() => this.fetchStades());
    }
  }

  reset() { this.stadeForm.reset({ radius: 50 }); this.isEditing = false; }
}