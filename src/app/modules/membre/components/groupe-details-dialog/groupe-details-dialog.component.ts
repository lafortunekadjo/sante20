import { Component, Inject, OnInit } from '@angular/core';
import { MatTabsModule } from "@angular/material/tabs";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { GroupePublic } from '../../../../core/models/groupe-explorer.model';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatchRequestService } from '../../../../core/services/match-request.service';
import { MatchRequestDialogComponent } from '../../../responsable/components/match-request-dialog/match-request-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-groupe-details-dialog',
  imports: [CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTabsModule,
  TranslateModule],
  templateUrl: './groupe-details-dialog.component.html',
  styleUrl: './groupe-details-dialog.component.scss'
})
export class GroupeDetailsDialogComponent implements OnInit {
 isResponsable: boolean = false;
 isCandidat: boolean = false;
  constructor(
    public dialogRef: MatDialogRef<GroupeDetailsDialogComponent>,
    private router: Router, 
     private dialog: MatDialog,
     private authService: AuthService,
     private matchRequestService: MatchRequestService,
     private snackBar: MatSnackBar,
     private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: { groupe: GroupePublic }
  ) {}

  close(): void {
    this.dialogRef.close();
  }
  

  demanderAdhesion(): void {
    this.dialogRef.close('adhesion');
  }

   ngOnInit(): void {
    this.isResponsable = this.authService.isResponsable();
    this.isCandidat = this.authService.isCandidat();
  }

   /**
   * Génère l'URL sécurisée pour l'iframe Google Maps
   */
  getMapUrl(): SafeResourceUrl {
   
    const lat = this.data.groupe?.stade?.stadiumLat;
    const lng = this.data.groupe?.stade?.stadiumLon;
    const label = encodeURIComponent(this.data.groupe?.stade?.nom);
    
    // URL Google Maps Embed (gratuit, sans API key)
    const url = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Ouvre la localisation dans Google Maps (nouvelle fenêtre)
   */
  openInGoogleMaps(): void {
    const lat = this.data.groupe.stade.stadiumLat;
    const lng = this.data.groupe.stade.stadiumLon;
    const label = encodeURIComponent(this.data.groupe?.stade?.nom);
    
    // URL pour ouvrir Google Maps avec un marqueur
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    
    window.open(url, '_blank');
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
      // Optionnel : fermer le dialog ou rafraîchir
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



}
