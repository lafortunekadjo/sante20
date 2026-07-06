import { Component, OnInit, Inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PubliciteAffichageService } from '../../../core/services/publicite-affichage.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-publicite-splash',
   standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './publicite-splash.component.html',
  styleUrls: ['./publicite-splash.component.scss']
})

  export class PubliciteSplashComponent implements OnInit, OnDestroy {
  publicite: any;
  countdown = 3;
  canSkip = false;
  imageLoaded = false;
  private timerInterval: any;

  constructor(
    private dialogRef: MatDialogRef<PubliciteSplashComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private publiciteService: PubliciteAffichageService,
    private cdr: ChangeDetectorRef
  ) {
    this.publicite = data.publicite;
  }

  ngOnInit(): void {
    this.startTimer();
  }

  isVideo(url?: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}
startTimer(): void {
  // On force une détection immédiate au lancement
  this.cdr.detectChanges(); 

  this.timerInterval = setInterval(() => {
    if (this.countdown > 0) {
      this.countdown--;
      // Utiliser detectChanges au lieu de markForCheck pour une mise à jour instantanée
      this.cdr.detectChanges(); 
    } else {
      this.canSkip = true;
      this.cdr.detectChanges();
      clearInterval(this.timerInterval);
    }
  }, 1000);
}

  onImageLoad(): void {
    this.imageLoaded = true;
    this.cdr.markForCheck();
  }

  onImageError(): void {
    this.close(); // Fermer si l'image ne charge pas pour ne pas bloquer l'user
  }

  onAdClick(event: Event): void {
    if (this.publicite) {
      this.publiciteService.onPubliciteClick(this.publicite);
    }
  }

  close(): void {
    if (this.canSkip) {
      this.dialogRef.close();
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}