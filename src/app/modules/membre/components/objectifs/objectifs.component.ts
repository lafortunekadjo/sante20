import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of, forkJoin } from 'rxjs';
import { Presence } from '../../../../core/models/presence.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ObjectifsService } from '../../../../core/services/objectifs.service';
import { PresenceService } from '../../../../core/services/presence.service';
import { Objectif } from '../../../../core/models/objectifs.model';
import { MembreService } from '../../../../core/services/membre.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatBottomSheet, MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { PubliciteAffichageComponent } from '../../../publicite/publicite-affichage/publicite-affichage.component';
import { PubliciteBannerComponent } from '../../../publicite/publicite-banner/publicite-banner.component';
import { PubliciteFeedComponent } from '../../../publicite/publicite-feed/publicite-feed.component';
import { GroupeService } from '../../../../core/services/groupe.service';

@Component({
  selector: 'app-objectifs',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
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
    MatDatepickerModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatListModule,
    MatBottomSheetModule,
    MatTooltipModule,
    TranslateModule,
        PubliciteBannerComponent,
        PubliciteAffichageComponent,
        PubliciteFeedComponent
  ],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, height: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, height: 0, overflow: 'hidden' }))
      ])
    ])
  ],
  templateUrl: './objectifs.component.html',
  styleUrl: './objectifs.component.scss'
})
export class ObjectifsComponent implements OnInit {
  objectifForm: FormGroup;
  objectifs: Objectif[] = [];
  membreId!: number;
  userId: number | null = null;
  isLoading = true;
  showForm = false;
  editingObjectif: Objectif | null = null;
   userVille: string | undefined;

  constructor(
    private fb: FormBuilder,
    private objectifsService: ObjectifsService,
    private presenceService: PresenceService,
    private membreService: MembreService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    private groupeService: GroupeService,
  ) {
    this.objectifForm = this.fb.group({
      type: ['', Validators.required],
      valeurCible: [null, [Validators.required, Validators.min(0)]],
      dateDebut: [null, Validators.required],
      dateFin: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    if (!this.userId) {
      console.error('Utilisateur non connecté.');
      this.snackBar.open('Erreur: Vous devez être connecté pour voir vos objectifs.', 'Fermer', {
        duration: 3000,
      });
      return;
    }
    
    this.membreService.getMembreByUserId(this.userId).subscribe(
      membre => {
        if (membre) {
          this.membreId = membre.id;
          this.loadObjectifs();
        } else {
          console.error('Aucun membre trouvé pour cet utilisateur.');
          this.snackBar.open('Erreur: Aucun membre trouvé pour cet utilisateur.', 'Fermer', {
            duration: 3000,
          });
        }
      },
      error => {
        console.error('Erreur lors de la récupération du membre:', error);
        this.snackBar.open('Erreur lors du chargement des objectifs.', 'Fermer', {
          duration: 3000,
        });
      }
    );
  }

 loadObjectifs(): void {
  const userId = this.authService.getUserId();
  this.isLoading = true;

  // On lance les deux appels en parallèle
  forkJoin({
    objectifs: this.objectifsService.getObjectifsByMembre(this.membreId),
    groupe: this.groupeService.getGroupe(userId)
  }).subscribe({
    next: ({ objectifs, groupe }) => {
      // 1. Mise à jour des objectifs
      this.objectifs = objectifs || [];
      this.calculateProgress();

      // 2. Mise à jour de la ville depuis le groupe
      if (groupe && groupe.ville) {
        this.userVille = groupe.ville.nom;
      }

      this.isLoading = false;
    },
    error: (error) => {
      console.error('Erreur lors du chargement des objectifs ou du groupe', error);
      this.isLoading = false;
    }
  });
}
  calculateProgress(): void {
    const presenceObservables = this.objectifs.map(o =>
      this.presenceService.getPresencesByMembreId(this.membreId)
        .pipe(catchError(err => {
          console.error(`Erreur lors du calcul de la progression pour l'objectif de type ${o.type}:`, err);
          return of([]);
        }))
    );

    forkJoin(presenceObservables).subscribe(
      (results: Presence[][]) => {
        this.objectifs.forEach((o, index) => {
          const presences = results[index];
          
          // Filtrer les présences selon la période de l'objectif
          const presencesFiltrees = presences.filter(p => {
            const matchDate = new Date(p.match.dateMatch);
            const dateDebut = new Date(o.dateDebut);
            const dateFin = new Date(o.dateFin);
            return matchDate >= dateDebut && matchDate <= dateFin;
          });

          let valeurActuelle = 0;
          switch (o.type) {
            case 'BUTS':
              valeurActuelle = presencesFiltrees.reduce((sum, p) => sum + (p.buts || 0), 0);
              break;
            case 'PASSES':
              valeurActuelle = presencesFiltrees.reduce((sum, p) => sum + (p.passes || 0), 0);
              break;
            case 'PRESENCE':
              valeurActuelle = presencesFiltrees.filter(p => p.present).length;
              break;
            case 'CARTON':
              valeurActuelle = presencesFiltrees.reduce((sum, p) => sum + (p.cartonsJaunes || 0) + (p.cartonsRouges || 0), 0);
              break;
          }
          (o as any).valeurActuelle = valeurActuelle;
        });
        this.isLoading = false;
      }
    );
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.objectifForm.reset();
      this.editingObjectif = null;
    }
  }

  editObjectif(objectif: Objectif): void {
    this.editingObjectif = objectif;
    this.showForm = true;
    
    this.objectifForm.patchValue({
      type: objectif.type,
      valeurCible: objectif.valeurCible,
      dateDebut: new Date(objectif.dateDebut),
      dateFin: new Date(objectif.dateFin)
    });

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  onSubmit(): void {
    if (this.objectifForm.valid) {
      const objectifData = {
        ...this.objectifForm.value,
        membre: { id: this.membreId }
      };

      if (this.editingObjectif) {
        this.objectifsService.updateObjectif(this.editingObjectif.id, objectifData).subscribe(
          () => {
            this.snackBar.open('Objectif modifié avec succès !', 'Fermer', { duration: 3000 });
            this.objectifForm.reset();
            this.editingObjectif = null;
            this.showForm = false;
            this.loadObjectifs();
          },
          error => {
            this.snackBar.open('Erreur lors de la modification de l\'objectif.', 'Fermer', { duration: 3000 });
            console.error(error);
          }
        );
      } else {
        this.objectifsService.createObjectif(objectifData).subscribe(
          () => {
            this.snackBar.open('Objectif créé avec succès !', 'Fermer', { duration: 3000 });
            this.objectifForm.reset();
            this.showForm = false;
            this.loadObjectifs();
          },
          error => {
            this.snackBar.open('Erreur lors de la création de l\'objectif.', 'Fermer', { duration: 3000 });
            console.error(error);
          }
        );
      }
    }
  }

  deleteObjectif(objectif: Objectif): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer cet objectif ?`)) {
      this.objectifsService.deleteObjectif(objectif.id).subscribe(
        () => {
          this.snackBar.open('Objectif supprimé avec succès !', 'Fermer', { duration: 3000 });
          this.loadObjectifs();
        },
        error => {
          this.snackBar.open('Erreur lors de la suppression de l\'objectif.', 'Fermer', { duration: 3000 });
          console.error(error);
        }
      );
    }
  }

  cancelEdit(): void {
    this.objectifForm.reset();
    this.editingObjectif = null;
    this.showForm = false;
  }

  isObjectifExpired(objectif: Objectif): boolean {
    const dateFin = new Date(objectif.dateFin);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateFin.setHours(0, 0, 0, 0);
    return dateFin < today;
  }

  isObjectifCompleted(objectif: any): boolean {
    return (objectif?.valeurActuelle ?? 0) >= (objectif?.valeurCible ?? 0);
  }

  getObjectifStatus(objectif: any): 'completed' | 'expired' | 'in-progress' {
    if (this.isObjectifCompleted(objectif)) {
      return 'completed';
    }
    if (this.isObjectifExpired(objectif)) {
      return 'expired';
    }
    return 'in-progress';
  }

  getObjectifStatusLabel(objectif: any): string {
    const status = this.getObjectifStatus(objectif);
    switch (status) {
      case 'completed':
        return 'Objectif atteint !';
      case 'expired':
        return 'Expiré';
      case 'in-progress':
        return 'En cours...';
    }
  }

  getObjectifStatusIcon(objectif: any): string {
    const status = this.getObjectifStatus(objectif);
    switch (status) {
      case 'completed':
        return 'check_circle';
      case 'expired':
        return 'schedule';
      case 'in-progress':
        return 'timer';
    }
  }

  scrollToForm(): void {
    this.showForm = true;
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  getProgressBarMode(objectif: any): 'determinate' | 'indeterminate' {
    return 'determinate';
  }

  getProgressBarValue(objectif: any): number {
    if (!objectif || !objectif.valeurCible || objectif.valeurCible === 0) {
      return 0;
    }
    const valeurActuelle = objectif.valeurActuelle ?? 0;
    return Math.min(100, (valeurActuelle / objectif.valeurCible) * 100);
  }

  getProgressBarColor(objectif: any): string {
    if (!objectif) {
      return 'warn';
    }
    
    const status = this.getObjectifStatus(objectif);
    switch (status) {
      case 'completed':
        return 'primary';
      case 'expired':
        return 'accent';
      case 'in-progress':
        return 'warn';
    }
  }

  getObjectifTypeLabel(type: string): string {
    switch (type) {
      case 'BUTS':
        return 'Buts marqués';
      case 'PASSES':
        return 'Passes décisives';
      case 'PRESENCE':
        return 'Présences';
      case 'CARTON':
        return 'Cartons';
      default:
        return type;
    }
  }

  getObjectifTypeIcon(type: string): string {
    switch (type) {
      case 'BUTS':
        return 'sports_soccer';
      case 'PASSES':
        return 'arrow_forward';
      case 'PRESENCE':
        return 'check_circle';
      case 'CARTON':
        return 'warning';
      default:
        return 'flag';
    }
  }

  // Fonction principale de partage
  shareObjectif(objectif: any): void {
    const shareData = this.generateShareData(objectif);
    
    // Vérifier si l'API Web Share est disponible
    if (navigator.share) {
      navigator.share({
        title: shareData.title,
        text: shareData.text,
        url: window.location.href
      }).then(() => {
        this.snackBar.open('Objectif partagé avec succès !', 'Fermer', { duration: 3000 });
      }).catch((error) => {
        console.log('Erreur lors du partage:', error);
        // Fallback vers le bottom sheet si le partage échoue
        this.openShareBottomSheet(shareData);
      });
    } else {
      // Si Web Share API non disponible, ouvrir le bottom sheet
      this.openShareBottomSheet(shareData);
    }
  }

  private generateShareData(objectif: any): { title: string; text: string; imageUrl: string } {
    const typeLabel = this.getObjectifTypeLabel(objectif.type);
    const progress = this.getProgressBarValue(objectif);
    const status = this.getObjectifStatusLabel(objectif);
    
    const title = `Mon objectif: ${typeLabel}`;
    const text = `🎯 ${typeLabel}\n📊 Progression: ${objectif.valeurActuelle || 0}/${objectif.valeurCible} (${progress.toFixed(0)}%)\n📅 ${new Date(objectif.dateDebut).toLocaleDateString('fr-FR')} - ${new Date(objectif.dateFin).toLocaleDateString('fr-FR')}\n✨ Statut: ${status}`;
    
    return { title, text, imageUrl: '' };
  }

  private openShareBottomSheet(shareData: { title: string; text: string; imageUrl: string }): void {
    const bottomSheetRef = this.bottomSheet.open(ShareBottomSheetComponent, {
      data: shareData
    });

    bottomSheetRef.afterDismissed().subscribe((action: string) => {
      if (action) {
        this.snackBar.open(`Copié dans le presse-papier !`, 'Fermer', { duration: 3000 });
      }
    });
  }
}

// Composant Bottom Sheet pour le partage
@Component({
  selector: 'app-share-bottom-sheet',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule],
  template: `
    <div class="share-sheet">
      <h3 class="share-title">Partager cet objectif</h3>
      
      <mat-nav-list>
        <a mat-list-item (click)="copyToClipboard()">
          <mat-icon matListItemIcon>content_copy</mat-icon>
          <span matListItemTitle>Copier le texte</span>
        </a>

        <a mat-list-item (click)="shareOnWhatsApp()">
          <mat-icon matListItemIcon>chat</mat-icon>
          <span matListItemTitle>Partager sur WhatsApp</span>
        </a>

        <a mat-list-item (click)="shareOnFacebook()">
          <mat-icon matListItemIcon>thumb_up</mat-icon>
          <span matListItemTitle>Partager sur Facebook</span>
        </a>

        <a mat-list-item (click)="shareOnTwitter()">
          <mat-icon matListItemIcon>trending_up</mat-icon>
          <span matListItemTitle>Partager sur Twitter</span>
        </a>
      </mat-nav-list>

      <button mat-button (click)="close()" class="close-btn">
        Annuler
      </button>
    </div>
  `,
  styles: [`
    .share-sheet {
      padding: 16px 0;
    }

    .share-title {
      margin: 0 0 8px 0;
      padding: 0 16px 16px;
      font-size: 18px;
      font-weight: 600;
      border-bottom: 1px solid #e0e0e0;
    }

    mat-nav-list {
      padding-top: 8px;
    }

    .close-btn {
      width: 100%;
      margin-top: 8px;
    }

    mat-icon {
      color: #1976d2;
    }
  `]
})
export class ShareBottomSheetComponent {
  constructor(
    private bottomSheet: MatBottomSheet,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { title: string; text: string; imageUrl: string }
  ) {}

  copyToClipboard(): void {
    const textToCopy = `${this.data.title}\n\n${this.data.text}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.bottomSheet.dismiss('copied');
    });
  }

  shareOnWhatsApp(): void {
    const text = encodeURIComponent(`${this.data.title}\n\n${this.data.text}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    this.close();
  }

  shareOnFacebook(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    this.close();
  }

  shareOnTwitter(): void {
    const text = encodeURIComponent(`${this.data.title}\n${this.data.text}`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
    this.close();
  }

  close(): void {
    this.bottomSheet.dismiss();
  }
}
