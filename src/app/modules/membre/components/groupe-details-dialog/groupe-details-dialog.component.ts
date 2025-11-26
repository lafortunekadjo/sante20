// groupe-details-dialog.component.ts - Mise à jour avec intégration carte
import { Component, Inject } from '@angular/core';
import { MatTabsModule } from "@angular/material/tabs";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { GroupePublic } from '../../../../core/models/groupe-explorer.model';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatchRequestService } from '../../../../core/services/match-request.service';
import { MatchRequestDialogComponent } from '../../../responsable/components/match-request-dialog/match-request-dialog.component';
import { Groupe } from '../../../../core/models/groupe.model';
import { StadeMapComponent, StadeInfo } from '../stade-map/stade-map.component';


@Component({
  selector: 'app-groupe-details-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTabsModule,
    MatCardModule, // ✅ Ajouté pour les cards
    TranslateModule,
    StadeMapComponent // ✅ Ajouté pour la carte
  ],
  templateUrl: './groupe-details-dialog.component.html',
  styleUrl: './groupe-details-dialog.component.scss'
})
export class GroupeDetailsDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<GroupeDetailsDialogComponent>,
    private router: Router, 
    private dialog: MatDialog,
    private matchRequestService: MatchRequestService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { groupe: any }
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  demanderAdhesion(): void {
    this.dialogRef.close('adhesion');
  }

  demanderMatchAmical(): void {
    const dialogRef = this.dialog.open(MatchRequestDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        groupeId: this.data.groupe.id,
        groupeNom: this.data.groupe.nom
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.envoyerDemandeMatch(result);
      }
    });
  }

  private envoyerDemandeMatch(requestData: any): void {
    this.matchRequestService.createMatchRequest(requestData).subscribe({
      next: (response) => {
        this.snackBar.open(
          'Demande de match envoyée avec succès !',
          'OK',
          { duration: 3000 }
        );
      },
      error: (error) => {
        console.error('Error sending match request:', error);
        this.snackBar.open(
          'Erreur lors de l\'envoi de la demande',
          'OK',
          { duration: 3000 }
        );
      }
    });
  }

  // ===== NOUVELLES MÉTHODES POUR LA CARTE =====

  /**
   * Vérifier si le stade a des coordonnées GPS
   */
  hasStadeCoordinates(): boolean {
    const groupe = this.data.groupe;
    console.log(groupe)
    return !!(
      groupe.stade.stadiumLat && 
      groupe.stade.stadiumLon &&
      groupe.stade.stadiumLat !== 0 && 
      groupe.stade.stadiumLon !== 0
    );
  }

  /**
   * Obtenir les données formatées pour le composant de carte
   */
  getStadeMapData(): StadeInfo {
    const groupe = this.data.groupe;
    
    return {
      nom: groupe.stade.nom || 'Stade non spécifié',
      latitude: groupe.stade.stadiumLat || 0,
      longitude: groupe.stade.stadiumLon || 0,
      ville: groupe.ville.nom,
      // quartier: groupe.,
      rayon: groupe.stade.radius || 500 // Rayon par défaut de 500m
    };
  }

  /**
   * Rechercher le stade dans Google Maps
   */
  searchInMaps(): void {
    const query = encodeURIComponent(`${this.data.groupe.stade} ${this.data.groupe.ville} `);
    const url = `https://www.google.com/maps/search/${query}`;
    
    window.open(url, '_blank');
    
    this.snackBar.open(
      'Ouverture de Google Maps...',
      '',
      { duration: 2000 }
    );
  }

  /**
   * Obtenir l'itinéraire vers le stade
   */
  getDirections(): void {
    if (this.hasStadeCoordinates()) {
      // Avec coordonnées GPS précises
      const lat = this.data.groupe.stade.stadiumLat;
      const lng = this.data.groupe.stade.stadiumLon;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    } else {
      // Recherche par nom + ville
      const destination = encodeURIComponent(`${this.data.groupe.stade}, ${this.data.groupe.ville}`);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
      window.open(url, '_blank');
    }
    
    this.snackBar.open(
      'Ouverture de l\'itinéraire...',
      '',
      { duration: 2000 }
    );
  }

  /**
   * Partager la localisation du stade
   */
  shareLocation(): void {
    if (this.hasStadeCoordinates()) {
      // Partage avec coordonnées précises
      const lat = this.data.groupe.stade.stadiumLat;
      const lng = this.data.groupe.stade.stadiumLon;
      const shareUrl = `https://maps.google.com/?q=${lat},${lng}`;
      const shareText = `📍 ${this.data.groupe.stade} (${this.data.groupe.nom})\n${shareUrl}`;
      
      this.copyToClipboardAndNotify(shareText);
    } else {
      // Partage avec informations textuelles
      const shareText = `📍 ${this.data.groupe.stade}\n📧 ${this.data.groupe.ville} ? ', ' ''}\n🏟️ Groupe: ${this.data.groupe.nom}`;
      
      this.copyToClipboardAndNotify(shareText);
    }
  }

  /**
   * Copier dans le presse-papier et notifier
   */
  private copyToClipboardAndNotify(text: string): void {
    if (navigator.clipboard && window.isSecureContext) {
      // Méthode moderne pour HTTPS
      navigator.clipboard.writeText(text).then(() => {
        this.snackBar.open(
          'Localisation copiée dans le presse-papier !',
          '',
          { duration: 3000 }
        );
      }).catch(err => {
        console.error('Erreur lors de la copie:', err);
        this.fallbackCopy(text);
      });
    } else {
      // Fallback pour HTTP ou navigateurs plus anciens
      this.fallbackCopy(text);
    }
  }

  /**
   * Méthode de fallback pour la copie
   */
  private fallbackCopy(text: string): void {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        this.snackBar.open(
          'Localisation copiée !',
          '',
          { duration: 3000 }
        );
      } else {
        this.showManualCopyDialog(text);
      }
    } catch (err) {
      console.error('Erreur lors de la copie fallback:', err);
      this.showManualCopyDialog(text);
    }
  }

 /**
 * Afficher un dialog pour copie manuelle - VERSION SIMPLE
 */
private showManualCopyDialog(text: string): void {
  const snackBarRef = this.snackBar.open(
    'Impossible de copier automatiquement',
    'Voir le texte',
    { 
      duration: 10000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    }
  );

  snackBarRef.onAction().subscribe(() => {
    // Solution simple : alert avec le texte
    alert(`📍 INFORMATIONS DE LOCALISATION\n\n${text}\n\n⚠️ Copiez ce texte manuellement`);
  });
}
  /**
   * Calculer la distance approximative (si vous avez les coordonnées utilisateur)
   * Méthode utilitaire pour de futures fonctionnalités
   */
  calculateDistanceToStade(userLat: number, userLng: number): number {
    if (!this.hasStadeCoordinates()) return 0;
    
    const stadeLat = this.data.groupe.stade.stadiumLat!;
    const stadeLng = this.data.groupe.stade.stadiumLon!;
    
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = userLat * Math.PI / 180;
    const φ2 = stadeLat * Math.PI / 180;
    const Δφ = (stadeLat - userLat) * Math.PI / 180;
    const Δλ = (stadeLng - userLng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance en mètres
  }
}