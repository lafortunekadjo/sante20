import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MembreService } from '../../../core/services/membre.service';
import { PasswordResetDialogComponent } from '../password-reset-dialog/password-reset-dialog.component';
import { User } from '../../../core/models/user';
import { Membre } from '../../../core/models/membre.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profil-edit',
  imports: [CommonModule,
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
      FormsModule, 
      ReactiveFormsModule
    ],
  templateUrl: './profil-edit.component.html',
  styleUrl: './profil-edit.component.scss'
})
export class ProfilEditComponent implements OnInit{
   profileForm: FormGroup;
  isLoading: boolean = true;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProfilEditComponent>,
    private authService: AuthService,
    private memberService: MembreService,
     private dialog: MatDialog,
     private snackBar: MatSnackBar,
  ) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: [''],
      nom: ['', Validators.required],
      prenom: [''],
      date_naissance: [''],
      poste: [''],
      roleCo: [''],
      sexe: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const user = this.authService.getUser();
    if (user) {
      this.profileForm.patchValue({
        username: user.username || '',
        email: user.email || ''
      });
      this.memberService.getMembreByUserId(user.userId).subscribe({
        next: (member) => {
          this.profileForm.patchValue({
            id: member.id || 0,
            nom: member.nom || '',
            prenom: member.prenom || '',
            date_naissance: member.dateNaissance ? new Date(member.dateNaissance).toISOString().split('T')[0] : '',
            poste: member.poste || '',
            roleCo: member.roleCO || '',
            sexe: member.sexe || ''
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des données du membre:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

   saveProfile() {
    if (this.profileForm.valid) {
      this.isLoading = true;
      const formData = this.profileForm.value;
      const userData: User = {
        username: formData.username, email: formData.email,
        id: 0,
        roles: '',
        active: false,
        membre: 0,
        motDePasse: '',
        groupe: 0
      };
      const memberData: any = {
        id : formData.id,
        nom: formData.nom,
        prenom: formData.prenom,
        dateNaissance: formData.date_naissance,
        poste: formData.poste,
        sexe: formData.sexe
      };

      this.authService.updateUserProfileAndMember(userData, memberData).subscribe({
        next: (result) => {
          this.isLoading = false;
          let message = 'Profil mis à jour avec succès!';
          if (!result.userUpdated && !result.memberUpdated) {
            message = 'Échec de la mise à jour des informations de l\'utilisateur et du membre.';
          } else if (!result.userUpdated) {
            message = 'Mise à jour du membre réussie, mais échec de la mise à jour de l\'utilisateur.';
          } else if (!result.memberUpdated) {
            message = 'Mise à jour de l\'utilisateur réussie, mais échec de la mise à jour du membre.';
          }
          
          this.snackBar.open(message, 'Fermer', { duration: 5000 });
          this.dialogRef.close();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur lors de la mise à jour des profils:', err);
          this.snackBar.open('Une erreur est survenue lors de la mise à jour.', 'Fermer', { duration: 5000 });
        }
      });
    }
  }

  cancelEdit() {
    this.dialogRef.close();
  }

  checkPasswordResetRequired() {
    if (this.authService.isPasswordResetRequired()) {
      this.openPasswordResetDialog();
    }
  }

  openPasswordResetDialog(): void {
    const dialogRef = this.dialog.open(PasswordResetDialogComponent, {
      width: '400px',
      disableClose: true, // Empêche la fermeture de la fenêtre
      data: { userId: localStorage.getItem('userId') }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Si l'utilisateur ferme la boîte de dialogue, vous pouvez prendre d'autres mesures
      if (!result) {
        console.log('La boîte de dialogue a été fermée sans action.');
        // Peut-être déconnecter l'utilisateur ici
      }
    });
  }


}
