import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MembreService } from '../../../core/services/membre.service';
import { PasswordResetDialogComponent } from '../password-reset-dialog/password-reset-dialog.component';
import { User } from '../../../core/models/user';
import { Membre } from '../../../core/models/membre.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ZoneGeographique, Ethnie } from '../../../core/models/zonegeographique.model';
import { DonneesReferenceService } from '../../../core/services/donnees-reference.service';
import { PropertyDescriptorParsingType } from 'html2canvas/dist/types/css/IPropertyDescriptor';
import { ProfileImageEditDialogComponent } from '../profile-image-edit-dialog/profile-image-edit-dialog.component';
import { Observable, of, delay, switchMap, map, catchError } from 'rxjs';
import { VideoUploadDialogComponent } from '../../../modules/membre/components/video-upload-dialog/video-upload-dialog.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-profil-edit',
  templateUrl: './profil-edit.component.html',
  styleUrls: ['./profil-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatTooltipModule,
    TranslateModule,
    MatSlideToggleModule
  ]
})
export class ProfilEditComponent implements OnInit {
 profileForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  memberId!: number;
  initialFormValues: any;
profilePhotoUrl: string | null = null;
  // Listes dynamiques provenant de l'API
  villesList: ZoneGeographique[] = [];
  zonesOrigineList: ZoneGeographique[] = [];
  ethniesList: any[] = [];
  filteredEthniesList: Ethnie[] = [];
  postesList: string[] = [];
  piedFort: String | null = null;


  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProfilEditComponent>,
    private authService: AuthService,
    private memberService: MembreService,
    private metadataService: DonneesReferenceService, // Injection ici
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMetadataAndUserData();
    this.listenToZoneOrigineChanges();
  }

listenToZoneOrigineChanges(): void {
  this.profileForm.get('zoneOrigineId')?.valueChanges.subscribe((zoneId: number | null) => {
    
    // 1. On effectue le filtrage de la liste
    if (zoneId) {
      this.filteredEthniesList = this.ethniesList.filter(
        (ethnie: any) => ethnie.zoneOrigine?.id === zoneId || ethnie.zoneOrigineId === zoneId
      );
    } else {
      this.filteredEthniesList = this.ethniesList;
    }

    // 2. Sécurité : On ne réinitialise l'ethnie QUE si la nouvelle région choisie 
    // ne correspond pas à la région d'origine de l'ethnie actuellement sélectionnée.
    const currentEthnieId = this.profileForm.get('ethnieId')?.value;
    if (currentEthnieId) {
      const currentEthnie = this.ethniesList.find(e => e.id === currentEthnieId);
      const ethnieZoneId = currentEthnie?.zoneOrigine?.id || currentEthnie?.zoneOrigineId;

      // Si la région choisie est différente de la région de l'ethnie courante, on efface.
      if (ethnieZoneId !== zoneId) {
        this.profileForm.get('ethnieId')?.setValue(null, { emitEvent: false });
      }
    }
  });
}

// 3. Ajoutez la méthode pour ouvrir la boîte de dialogue d'édition de la photo :
// openPhotoEditionDialog(): void {
//   const dialogRef = this.dialog.open(ProfileImageEditDialogComponent, { // Remplacez par le nom exact de votre composant de recadrage/upload
//     width: '450px',
//     disableClose: false,
//     data: { currentImageUrl: this.profilePhotoUrl, userId: this.authService.getUser().userId }
//   });

//   dialogRef.afterClosed().subscribe((newPhotoUrl: string | null) => {
//     if (newPhotoUrl) {
//       // Mettre à jour l'image à l'écran instantanément si l'utilisateur l'a changée
//       this.profilePhotoUrl = newPhotoUrl;
//       // Optionnel : sauvegarder dans la session locale de l'authService
//       this.authService.setCurrentUser({ profilePhotoUrl: newPhotoUrl });
//     }
//   });
// }

// Ajoute la méthode pour ouvrir le modal de téléchargement de vidéos
openUploadDialog(): void {
  const currentUser = this.authService.getUser();
  if (!currentUser || !currentUser.username) return;

  const dialogRef = this.dialog.open(VideoUploadDialogComponent, {
    width: '550px',
    panelClass: 'modern-video-dialog', // Optionnel : pour styliser le modal
    data: { username: currentUser.username }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Optionnel : Tu peux lever un toast ou rafraîchir un indicateur si nécessaire
      this.snackBar.open('Vidéo ajoutée avec succès à votre galerie !', 'OK', { duration: 3000 });
    }
  });
}

openPhotoEditionDialog(): void {
  const dialogRef = this.dialog.open(ProfileImageEditDialogComponent, {
    width: '450px',
    disableClose: false,
    data: { currentImageUrl: this.profilePhotoUrl, userId: this.authService.getUser()?.userId }
  });

  dialogRef.afterClosed().subscribe((result: any) => {
    // Le dialogue renvoie un objet { file: File, previewUrl: string }
    if (result && result.file) {
      
      // 1. Mise à jour visuelle instantanée à l'écran
      this.profilePhotoUrl = result.previewUrl;
      
      // 2. Envoi du fichier réel au serveur
      const userId = this.authService.getUser()?.userId;
      if (userId) {
        this.authService.uploadProfilePhoto(userId, result.file).subscribe({
          next: (response: any) => {
            // Extraction de l'URL finale renvoyée par le serveur
            let serverUrl = null;
            if (response?.url) serverUrl = response.url;
            else if (typeof response === 'string' && response.startsWith('http')) serverUrl = response;
            
            if (serverUrl) {
              this.profilePhotoUrl = serverUrl;
              localStorage.setItem('profilUrl', serverUrl);
              this.authService.setCurrentUser({ profilePhotoUrl: serverUrl });
            }
            
            this.snackBar.open('Photo de profil enregistrée avec succès !', 'Fermer', { 
              duration: 3000,
              panelClass: ['snackbar-success'] 
            });
          },
          error: (err) => {
            console.error("Échec du téléversement de l'image", err);
            this.snackBar.open("Erreur lors de l'enregistrement de l'image sur le serveur.", 'Fermer', { 
              panelClass: ['snackbar-error'] 
            });
          }
        });
      }
    }
  });
}



  initForm(): void {
   const userId = this.authService.getUser().userId
    this.profileForm = this.fb.group({
      username: [
      '', 
      [Validators.required, Validators.minLength(3)],
      [this.usernameUniqueValidator(userId)] // 🌟 Validateur asynchrone Username
    ],
      email: [ '', 
      [Validators.minLength(3)],
      [this.emailUniqueValidator(userId)] 
    ],
      
      // Configuration des champs (Quartier, Origine et Ethnie sont désormais OPTIONNELS)
      villeHabitationId: [null], // Seule la ville reste requise pour la localisation globale
      quartierHabitation: [''], 
      zoneOrigineId: [null],
      ethnieId: [null],

      // Informations du membre
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.minLength(2)]],
      date_naissance: [''],
      poste: [''],
      roleCo: [{ value: '', disabled: true }],
      sexe: ['', Validators.required],
      cni: [''],
      adresse: [''],
      tel: ['', [Validators.pattern('^[0-9]{9,15}$')]],
      assurance: [false],
      piedFort: [''],
      isPublic: ['']
    });
  }

  loadMetadataAndUserData(): void {
    this.isLoading = true;

    // Chargement parallèle des métadonnées de l'API
    this.metadataService.getVilles().subscribe(villes => this.villesList = villes);
    this.metadataService.getZonesOrigine().subscribe(zones => this.zonesOrigineList = zones);
    this.metadataService.getEthnies().subscribe(ethnies => {
    this.ethniesList = ethnies;
  
  // Initialisation de la liste filtrée au démarrage selon la valeur courante de la zone
  const currentZoneId = this.profileForm.get('zoneOrigineId')?.value;
  if (currentZoneId) {
    this.filteredEthniesList = this.ethniesList.filter(
      (e: any) => e.zoneOrigine?.id === currentZoneId || e.zoneOrigineId === currentZoneId
    );
  } else {
    this.filteredEthniesList = ethnies;
  }
});

    // Chargement de l'utilisateur connecté
    const currentUser = this.authService.getUser();
    
    if (currentUser) {
      // On extrait le sport. S'adapte à ta structure de l'objet User (ex: currentUser.groupe.discipline)
    const disciplineSportive = currentUser.groupe?.discipline || 'FOOTBALL'; 

    this.metadataService.getPostesParDiscipline(disciplineSportive).subscribe({
      next: (postes) => {
        this.postesList = postes;
      },
      error: () => {
        // Fallback local si l'API échoue
        this.postesList = ['Gardien de but', 'Défenseur Central', 'Arrière Latéral', 'Milieu Défensif', 'Milieu Offensif', 'Ailier', 'Avant-centre'];
      }
    });
      this.profilePhotoUrl = currentUser.profilePhotoUrl || localStorage.getItem('PROFIL_URL_KEY') || null;
      this.memberId = currentUser.userId;
      console.log(currentUser)
      this.profileForm.patchValue({
        username: currentUser.username || '',
        email: currentUser.email || '',
        villeHabitationId: currentUser.villeHabitation?.id || null,
        quartierHabitation: currentUser.quartierHabitation || '',
        zoneOrigineId: currentUser.zoneOrigine?.id || null,
        ethnieId: currentUser.ethnie?.id || null,
        piedFort: currentUser.piedFort || '',
        isPublic: currentUser.public ,
      
      });
      console.log(this.profileForm)
      this.memberService.getMembreByUserId(this.memberId).subscribe({
  next: (membre: Membre) => {
    if (membre) {
      this.profileForm.patchValue({
        nom: membre.nom || '',
        prenom: membre.prenom || '',
        date_naissance: membre.dateNaissance || '',
        poste: membre.poste || '',
        roleCo: membre.roleCustom?.nom || '',
        sexe: membre.sexe || '',
        cni: membre.cni || '',
        adresse: membre.adresse || '',
        tel: membre.tel || '',
        assurance: membre.assurance || false,
      
      });
      this.initialFormValues = this.profileForm.getRawValue();
    }
    this.isLoading = false;
  },
  error: (err: any) => { // <-- Correction ici : flèche double "=>" et typage de "err"
    this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', { duration: 3000 });
    this.isLoading = false;
  }
});
    }
  }

// 1. Ajoute les validateurs asynchrones en bas de ton composant ou à l'intérieur
usernameUniqueValidator(userId: number): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.value.length < 3) return of(null);
    
    return of(control.value).pipe(
      delay(500),
      switchMap(username => this.authService.checkUsernameAvailability2(username, userId)),
      map((res: any) => {
        // 💡 Ajuste 'res.available' selon la propriété exacte renvoyée par ton API
        return res.available ? null : { usernamePris: true };
      }),
      catchError(() => of(null))
    );
  };
}

// 2. Validateur pour l'Email (Si un jour tu le réactives)
emailUniqueValidator(currentUserId: number): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) return of(null);
    
    return of(control.value).pipe(
      delay(500),
      switchMap(email => this.authService.checkEmailAvailability2(email,currentUserId)),
      map((res: any) => (res.available ? null : { emailPris: true })),
      catchError(() => of(null))
    );
  };
}


  hasChanges(): boolean {
    if (!this.initialFormValues) return false;
    const currentValues = this.profileForm.getRawValue();
    return JSON.stringify(this.initialFormValues) !== JSON.stringify(currentValues);
  }

  resetForm(): void {
    if (this.initialFormValues) {
      this.profileForm.reset(this.initialFormValues);
    }
  }

  cancelEdit(): void {
    this.dialogRef.close(false);
  }

  openPasswordReset(): void {
    this.dialog.open(PasswordResetDialogComponent, {
      width: '400px',
      disableClose: true
    });
  }

 saveProfile(): void {
  if (this.profileForm.valid) {
    this.isSaving = true;
    const formData = this.profileForm.getRawValue();

    // Récupérer l'ID de l'utilisateur connecté de façon sûre
    const currentUserId = this.authService.getUser()?.id || 0;

    // 1. On construit l'objet User en forçant le type et en s'assurant que l'ID est présent
    const userData: any = {
      ...(this.authService.getUser() as User), // On propage l'utilisateur existant si nécessaire
      id: currentUserId, // L'ID obligatoire résout l'erreur ts(2345)
      username: formData.username,
      email:formData.email,
      piedFort: formData.piedFort,
      villeHabitation: formData.villeHabitationId ? { id: formData.villeHabitationId } as any : null,
      quartierHabitation: formData.quartierHabitation,
      zoneOrigine: formData.zoneOrigineId ? { id: formData.zoneOrigineId } as any : null,
      ethnie: formData.ethnieId ? { id: formData.ethnieId } as any : null,
      isPublic: formData.isPublic ?? true
    };

    // 2. Données du membre (Reste inchangé)
   const memberData: Membre = {
     id: this.memberId, // Garanti comme un 'number', l'erreur disparaît
     nom: formData.nom,
     prenom: formData.prenom,
     date_naissance: formData.date_naissance,
     poste: formData.poste,
     roleCo: formData.roleCo,
     sexe: formData.sexe,
     cni: formData.cni,
     adresse: formData.adresse,
     tel: formData.tel,
     assurance: formData.assurance
   } as unknown as Membre;
    // 3. Envoi au backend (L'erreur disparaît car userData est maintenant un type 'User' valide)
    this.authService.updateUserProfileAndMember(userData, memberData).subscribe({
      next: (response) => {
        this.snackBar.open('Profil mis à jour avec succès !', 'OK', { duration: 3000 });
        this.isSaving = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open('Erreur lors de la sauvegarde du profil', 'Fermer', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }
}

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
      return 'Format invalide (chiffres uniquement)';
    }
    return '';
  }

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

  getInitials(): string {
    const nom = this.profileForm.get('nom')?.value || '';
    const prenom = this.profileForm.get('prenom')?.value || '';
    if (nom || prenom) {
      return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    }
    return '';
  }
}