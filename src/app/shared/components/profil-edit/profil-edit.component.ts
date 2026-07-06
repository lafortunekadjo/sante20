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
import { Observable, of, delay, switchMap, map, catchError, forkJoin } from 'rxjs';
import { VideoUploadDialogComponent } from '../../../modules/membre/components/video-upload-dialog/video-upload-dialog.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserProfileService } from '../../../core/services/user-profile.service';

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
  pste: String | null = null;



  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProfilEditComponent>,
    private authService: AuthService,
    private memberService: MembreService,
    private metadataService: DonneesReferenceService, // Injection ici
    private userProfileService: UserProfileService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMetadataAndUserData();
    this.loadProfileData()
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

private loadProfileData(): void {
  this.isLoading = true;
 
  // Charger en parallèle : UserProfile + Membre (infos sportives) + User (déjà dans cache)
  forkJoin({
    profil:  this.userProfileService.getMyProfile().pipe(catchError(() => of(null))),
    membre:  this.memberService.getMembreByUserId(this.authService.getUserId()!).pipe(catchError(() => of(null)))
  }).subscribe({
    next: ({ profil, membre }) => {

         if (membre?.id) {
      this.memberId = membre.id;  // ← ex: 15, pas 42
    }
 
      // ── 1. Données User (depuis cache authService) ──────────
      const currentUser = this.authService.getUser();
      const userPatch: any = {
        username:           currentUser?.username          || '',
        email:              currentUser?.email             || '',
        villeHabitationId:  currentUser?.villeHabitation?.id || null,
        quartierHabitation: currentUser?.quartierHabitation  || '',
        zoneOrigineId:      currentUser?.zoneOrigine?.id   || null,
        ethnieId:           currentUser?.ethnie?.id        || null,
        piedFort:           currentUser?.piedFort          || '',
        poste:           currentUser?.poste          || '',
        isPublic:           currentUser?.public            ?? true,
      };
 
      // ── 2. Données personnelles depuis UserProfile (source de vérité) ──
      //    Fallback vers Membre si UserProfile pas encore créé (avant migration)
      const personnelPatch: any = profil ? {
        nom:            profil.nom            || '',
        prenom:         profil.prenom         || '',
        date_naissance: profil.dateNaissance  || '',
        sexe:           profil.sexe           || '',
        cni:            profil.cni            || '',
        adresse:        profil.adresse        || '',
        tel:            profil.tel            || '',
        assurance:      profil.assurance      ?? false,
        profession:     profil.profession     || '',
      } : {
        // Fallback depuis Membre (users créés avant migration UserProfile)
        nom:            membre?.nom            || '',
        prenom:         membre?.prenom         || '',
        date_naissance: membre?.dateNaissance  || '',
        sexe:           membre?.sexe           || '',
        cni:            membre?.cni            || '',
        adresse:        membre?.adresse        || '',
        tel:            membre?.tel            || '',
        assurance:      membre?.assurance      ?? false,
        profession:     '',
      };
 
      // ── 3. Données sportives par groupe depuis Membre ───────
      const sportPatch: any = membre ? {
        poste:  membre.poste             || '',
        roleCo: membre.roleCustom?.nom   || membre.roleCO || '',
      } : {};
 
      // ── UNE SEULE patchValue avec toutes les données ────────
      // → initialFormValues capturé APRÈS l'état final du form
      this.profileForm.patchValue({
        ...userPatch,
        ...personnelPatch,
        ...sportPatch,
      });
 
      // FIX CRITIQUE : capturer MAINTENANT, quand le form est complet
      this.initialFormValues = this.profileForm.getRawValue();
      this.profilePhotoUrl   = currentUser?.profilePhotoUrl
                             || localStorage.getItem('profilUrl')
                             || null;
      this.isLoading = false;
    },
    error: () => {
      this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', { duration: 3000 });
      this.isLoading = false;
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
        poste: currentUser.piedFort || '',
        isPublic: currentUser.public ,
      
      });
  
this.userProfileService.getMyProfile().subscribe({
  next: (profil) => {
    this.profileForm.patchValue({
      nom:            profil.nom          || '',
      prenom:         profil.prenom       || '',
      date_naissance: profil.dateNaissance || '',
      sexe:           profil.sexe         || '',
      cni:            profil.cni          || '',
      adresse:        profil.adresse      || '',
      tel:            profil.tel          || '',
      assurance:      profil.assurance    ?? false,
      profession:     profil.profession   || '',
    });
 
    // 2. ENSUITE charger les infos sportives depuis Membre
    //    (poste, roleCO, maillot — liées au groupe actif)
    this.memberService.getMembreByUserId(this.memberId).subscribe({
      next: (membre) => {
        this.profileForm.patchValue({
          poste:  membre.poste  || '',
          roleCo: membre.roleCustom?.nom || membre.roleCO || '',
          // NE PAS écraser nom/prenom/tel depuis Membre —
          // UserProfile est la source de vérité désormais
        });
        this.initialFormValues = this.profileForm.getRawValue();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  },
  error: () => {
    // Fallback : si UserProfile n'existe pas encore (user créé avant migration)
    // → utiliser l'ancienne logique depuis Membre
    this.memberService.getMembreByUserId(this.memberId).subscribe({
      next: (membre) => {
        this.profileForm.patchValue({
          nom:            membre.nom           || '',
          prenom:         membre.prenom        || '',
          date_naissance: membre.dateNaissance || '',
          sexe:           membre.sexe          || '',
          cni:            membre.cni           || '',
          adresse:        membre.adresse       || '',
          tel:            membre.tel           || '',
          assurance:      membre.assurance     ?? false,
          poste:          membre.poste         || '',
          roleCo:         membre.roleCustom?.nom || '',
        });
        this.isLoading = false;
      }
    });
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

//   onSave(): void {
//   if (this.profileForm.invalid) return;
//   this.isSaving = true;
//   const formData = this.profileForm.getRawValue();
 
//   // 1. Infos personnelles → UserProfile (propagées sur toutes les fiches)
//   const profileUpdates = {
//     nom:            formData.nom,
//     prenom:         formData.prenom,
//     dateNaissance:  formData.date_naissance,
//     sexe:           formData.sexe,
//     cni:            formData.cni,
//     adresse:        formData.adresse,
//     tel:            formData.tel,
//     assurance:      formData.assurance,
//     profession:     formData.profession,
//   };
 
//   // 2. Infos compte → User (username, email, photo, piedFort, isPublic...)
//   const userData: any = {
//     username:           formData.username,
//     email:              formData.email,
//     villeHabitation:    formData.villeHabitationId ? { id: formData.villeHabitationId } : null,
//     quartierHabitation: formData.quartierHabitation,
//     zoneOrigine:        formData.zoneOrigineId ? { id: formData.zoneOrigineId } : null,
//     ethnie:             formData.ethnieId ? { id: formData.ethnieId } : null,
//     piedFort:           formData.piedFort,
//     isPublic:           formData.isPublic ?? true,
//   };
 
//   // 3. Infos sportives par groupe → Membre (poste, maillot...)
//   const memberData: any = {
//     id:    this.memberId,
//     poste: formData.poste,
//     // roleCO géré séparément via gestion-roles
//   };
 
//   // Appels parallèles : UserProfile + User
//   forkJoin({
//     profil: this.userProfileService.updateMyProfile(profileUpdates),
//     user:   this.authService.updateUserProfile(userData),
//     membre: this.memberService.updateMembre(memberData.id, memberData)  // poste seulement
//   }).subscribe({
//     next: () => {
//       this.snackBar.open('Profil mis à jour avec succès !', 'OK', { duration: 3000 });
//       this.isSaving = false;
//       this.dialogRef.close(true);
//     },
//     error: () => {
//       this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
//       this.isSaving = false;
//     }
//   });
// }

saveProfile(): void {
  if (this.profileForm.invalid || this.isSaving) return;
  this.isSaving = true;
 
  const f = this.profileForm.getRawValue();
 
  // ── 1. Payload User ──────────────────────────────────────
  const userData: Record<string, any> = {
    username:           f.username,
    email:              f.email,
    piedFort:           f.piedFort           || null,
    isPublic:           f.isPublic           ?? true,
    quartierHabitation: f.quartierHabitation || null,
    villeHabitation:    f.villeHabitationId  ? { id: f.villeHabitationId } : null,
    zoneOrigine:        f.zoneOrigineId      ? { id: f.zoneOrigineId }     : null,
    ethnie:             f.ethnieId           ? { id: f.ethnieId }          : null,
  };
 
  // ── 2. Payload UserProfile ───────────────────────────────
  const profileData: Record<string, any> = {
    nom:           f.nom           || null,
    prenom:        f.prenom        || null,
    dateNaissance: f.date_naissance || null,
    sexe:          f.sexe          || null,
    tel:           f.tel           || null,
    adresse:       f.adresse       || null,
    cni:           f.cni           || null,
    profession:    f.profession    || null,
    assurance:     f.assurance     ?? null,
  };
 
  // ── 3. Payload Membre — structure attendue par updateMembre ──
  // FIX : respecter la signature updateMembre(id, membre)
  // et la structure du payload existant
  const membrePayload: Record<string, any> = {
    poste:  f.poste  || null,
    roleCO: f.roleCo || null,
    // Les autres champs requis par updateMembre
    nom:             f.nom    || null,
    prenom:          f.prenom || null,
    sexe:            f.sexe   || null,
    active:          true,
  };
 
  forkJoin({
    user:   this.authService.updateUserProfile(userData),
    profil: this.userProfileService.updateMyProfile(profileData),
    // FIX : deux arguments séparés — id en premier, payload en second
    membre: this.memberService.updateMembre(this.memberId, membrePayload)
  }).subscribe({
    next: () => {
      // Mettre à jour le cache
      this.authService.setCurrentUser({
        ...this.authService.getUser(),
        username:           f.username,
        piedFort:           f.piedFort,
        isPublic:           f.isPublic,
        quartierHabitation: f.quartierHabitation,
      });
 
      // Réinitialiser initialFormValues → hasChanges() = false
      this.initialFormValues = this.profileForm.getRawValue();
 
      this.snackBar.open('Profil mis à jour avec succès !', 'OK', { duration: 3000 });
      this.isSaving = false;
      this.dialogRef.close(true);
    },
    error: (err) => {
      const message = err.error?.message || 'Erreur lors de la sauvegarde';
      this.snackBar.open(message, 'Fermer', { duration: 4000 });
      this.isSaving = false;
    }
  });
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