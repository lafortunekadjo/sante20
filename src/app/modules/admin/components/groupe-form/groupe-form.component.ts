import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GroupeService } from '../../../../core/services/groupe.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-groupe-form',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatFormFieldModule, MatSelectModule, BaseChartDirective,CommonModule,ReactiveFormsModule, RouterModule],
  templateUrl: './groupe-form.component.html',
  styleUrl: './groupe-form.component.scss'
})
export class GroupeFormComponent implements OnInit {
  groupeForm: FormGroup;
  isEdit: boolean = false;
  groupeId: number | null = null;
  villes = [{ id: 1, nom: 'Paris' }]; // À remplacer par un service
  stades = [{ id: 1, nom: 'Stade de France' }]; // À remplacer par un service

  constructor(
    private fb: FormBuilder,
    private groupeService: GroupeService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.groupeForm = this.fb.group({
      nom: ['', Validators.required],
      discipline: ['', Validators.required],
      villeId: [null, Validators.required],
      stadeId: [null, Validators.required],
      modeEquipe: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.groupeId = this.route.snapshot.params['id'];
    if (this.groupeId) {
      this.isEdit = true;
      this.groupeService.getGroupe(this.groupeId).subscribe(groupe => {
        this.groupeForm.patchValue(groupe);
      });
    }
  }

  submit() {
    if (this.groupeForm.valid) {
      const groupeData = { ...this.groupeForm.value, fraisAdhesion: 100.0 }; // Exemple
      if (this.isEdit) {
        this.groupeService.updateGroupe(this.groupeId!, groupeData)
          .subscribe(() => this.router.navigate(['/admin/groupes']));
      } else {
        this.groupeService.createGroupe(groupeData)
          .subscribe(() => this.router.navigate(['/admin/groupes']));
      }
    }
  }
}
