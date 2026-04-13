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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profil-edit',
  standalone: true,
  imports: [
    CommonModule,
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
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatTooltipModule,
    MatStepperModule,
    TranslateModule
  ],
  templateUrl: './profil-edit.component.html',
  styleUrl: './profil-edit.component.scss'
})
export class ProfilEditComponent implements OnInit {
  profileForm: FormGroup;
  isLoading: boolean = true;
  isSaving: boolean = false;
  memberId: number = 0;
  hidePassword: boolean = true;
  maxDate: Date = new Date(); // Pour la date de naissance

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProfilEditComponent>,
    private authService: AuthService,
    private memberService: MembreService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.profileForm = this.fb.group({
      // Informations utilisateur
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: [''],
      
      // Informations membre
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      date_naissance: ['', Validators.required],
      poste: [''],
      roleCo: [''],
      sexe: ['', Validators.required],
      cni: [''],
      adresse: [''],
      tel: ['', [Validators.pattern('^[0-9]{9,15}$')]],
      assurance: [false]
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
          console.log(member)
          this.memberId = member.id;
          this.profileForm.patchValue({
            nom: member.nom || '',
            prenom: member.prenom || '',
            date_naissance: member.dateNaissance ? new Date(member.dateNaissance) : null,
            poste: member.poste || '',
            roleCo: member.roleCO || '',
            sexe: member.sexe || '',
            cni: member.cni || '',
            adresse: member.adresse || '',
            tel: member.tel || '',
            assurance: member.assurance || false
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des données du membre:', err);
          this.snackBar.open('Erreur lors du chargement des données', 'Fermer', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
      this.snackBar.open('Utilisateur non connecté', 'Fermer', { duration: 3000 });
    }
  }

  saveProfile() {
    if (this.profileForm.valid) {
      this.isSaving = true;
      const formData = this.profileForm.value;
      
      const userData: User = {
        id: this.authService.getUser()?.userId || 0,
        username: formData.username,
        email: formData.email,
        roles: '',
        active: true,
        membre: this.memberId,
        motDePasse: '',
        groupe: 0,
        profilePhotoUrl: ''
      };

      const memberData: any = {
        id: this.memberId,
        nom: formData.nom,
        prenom: formData.prenom,
        dateNaissance: formData.date_naissance,
        poste: formData.poste,
        roleCO: formData.roleCo,
        sexe: formData.sexe,
        cni: formData.cni,
        adresse: formData.adresse,
        tel: formData.tel,
        assurance: formData.assurance
      };

      this.authService.updateUserProfileAndMember(userData, memberData).subscribe({
        next: (result) => {
          this.isSaving = false;
          let message = 'Profil mis à jour avec succès!';
          
          if (!result.userUpdated && !result.memberUpdated) {
            message = 'Échec de la mise à jour du profil.';
            this.snackBar.open(message, 'Fermer', { duration: 5000 });
          } else if (!result.userUpdated) {
            message = 'Informations du membre mises à jour. Échec de la mise à jour de l\'utilisateur.';
            this.snackBar.open(message, 'Fermer', { duration: 5000 });
            this.dialogRef.close(true);
          } else if (!result.memberUpdated) {
            message = 'Informations de l\'utilisateur mises à jour. Échec de la mise à jour du membre.';
            this.snackBar.open(message, 'Fermer', { duration: 5000 });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(message, 'Fermer', { duration: 3000 });
            this.dialogRef.close(true);
          }
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Erreur lors de la mise à jour des profils:', err);
          this.snackBar.open('Une erreur est survenue lors de la mise à jour.', 'Fermer', { duration: 5000 });
        }
      });
    } else {
      this.markFormGroupTouched(this.profileForm);
      this.snackBar.open('Veuillez corriger les erreurs dans le formulaire', 'Fermer', { duration: 3000 });
    }
  }

  // Marquer tous les champs comme touchés pour afficher les erreurs
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  cancelEdit() {
    if (this.profileForm.dirty) {
      if (confirm('Voulez-vous vraiment annuler ? Les modifications non enregistrées seront perdues.')) {
        this.dialogRef.close(false);
      }
    } else {
      this.dialogRef.close(false);
    }
  }

  checkPasswordResetRequired() {
    if (this.authService.isPasswordResetRequired()) {
      this.openPasswordResetDialog();
    }
  }

  openPasswordResetDialog(): void {
    const dialogRef = this.dialog.open(PasswordResetDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { userId: localStorage.getItem('userId') }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        console.log('La boîte de dialogue a été fermée sans action.');
      }
    });
  }

  // Getters pour faciliter l'accès aux contrôles dans le template
  get username() { return this.profileForm.get('username'); }
  get email() { return this.profileForm.get('email'); }
  get nom() { return this.profileForm.get('nom'); }
  get prenom() { return this.profileForm.get('prenom'); }
  get date_naissance() { return this.profileForm.get('date_naissance'); }
  get sexe() { return this.profileForm.get('sexe'); }
  get cni() { return this.profileForm.get('cni'); }
  get tel() { return this.profileForm.get('tel'); }

  // Méthode pour obtenir le message d'erreur
  getErrorMessage(controlName: string): string {
    const control = this.profileForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (control?.hasError('email')) {
      return 'Email invalide';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    if (control?.hasError('pattern')) {
      if (controlName === 'tel' || controlName === 'cni') {
        return 'Format invalide (chiffres uniquement)';
      }
      return 'Format invalide';
    }
    return '';
  }

  // Calculer l'âge à partir de la date de naissance
  calculateAge(): number | null {
    const birthDate = this.profileForm.get('date_naissance')?.value;
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }
    return null;
  }

  // Obtenir les initiales pour l'avatar
  getInitials(): string {
    const nom = this.profileForm.get('nom')?.value || '';
    const prenom = this.profileForm.get('prenom')?.value || '';
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }

  // Vérifier si le formulaire a des modifications
  hasChanges(): boolean {
    return this.profileForm.dirty;
  }

  // Réinitialiser le formulaire
  resetForm() {
    this.loadUserData();
    this.profileForm.markAsPristine();
  }
}