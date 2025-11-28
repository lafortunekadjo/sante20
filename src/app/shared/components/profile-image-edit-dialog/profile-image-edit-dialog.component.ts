// profile-image-edit-dialog.component.ts
import { Component, Inject, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

export interface ProfileImageDialogData {
  currentImageUrl: string | null;
  userId: number;
}

export interface ProfileImageDialogResult {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-profile-image-edit-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    MatSliderModule,
    FormsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './profile-image-edit-dialog.component.html',
  styleUrl: './profile-image-edit-dialog.component.scss'
})
export class ProfileImageEditDialogComponent {
  @ViewChild('canvas', { static: false }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  imagePreviewUrl: SafeUrl | null = null;
  originalImage: HTMLImageElement | null = null;
  
  // Contrôles d'image
  scale: number = 1;
  rotation: number = 0;
  brightness: number = 100;
  contrast: number = 100;
  
  // État
  isProcessing: boolean = false;
  isDragging: boolean = false;
  dragStart = { x: 0, y: 0 };
  imagePosition = { x: 0, y: 0 };
  
  // Pour savoir si une image existante a été chargée
  hasExistingImage: boolean = false;
  
  // Limites
  maxFileSize = 5 * 1024 * 1024; // 5MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  constructor(
    public dialogRef: MatDialogRef<ProfileImageEditDialogComponent>,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: ProfileImageDialogData
  ) {
    // Si une image existe déjà, la charger automatiquement
    if (data?.currentImageUrl) {
      this.loadExistingImage(data.currentImageUrl);
    }
  }

  /**
   * Charge une image existante
   */
  loadExistingImage(url: string): void {
    this.isProcessing = true;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      this.originalImage = img;
      this.imagePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(url);
      this.hasExistingImage = true;
      this.isProcessing = false;
      
      // Attendre que le canvas soit disponible
      setTimeout(() => this.drawImage(), 100);
    };
    
    img.onerror = () => {
      console.error('Impossible de charger l\'image existante');
      this.isProcessing = false;
      this.hasExistingImage = false;
    };
    
    img.src = url;
  }

  /**
   * Gère le fichier sélectionné par l'utilisateur
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validation du type de fichier
      if (!this.allowedTypes.includes(file.type)) {
        this.snackBar.open('Format de fichier non supporté. Utilisez JPG, PNG ou WEBP.', 'Fermer', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
        return;
      }
      
      // Validation de la taille
      if (file.size > this.maxFileSize) {
        this.snackBar.open('Le fichier est trop volumineux. Taille maximale : 5MB.', 'Fermer', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
        return;
      }
      
      this.selectedFile = file;
      this.hasExistingImage = false;
      this.loadImage(file);
    }
  }

  /**
   * Charge et affiche l'image sélectionnée
   */
  loadImage(file: File): void {
    this.isProcessing = true;
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        const img = new Image();
        img.onload = () => {
          this.originalImage = img;
          this.imagePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(e.target!.result as string);
          this.resetControls();
          this.drawImage();
          this.isProcessing = false;
        };
        img.src = e.target.result as string;
      }
    };
    
    reader.onerror = () => {
      this.snackBar.open('Erreur lors du chargement de l\'image.', 'Fermer', { 
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      this.isProcessing = false;
    };
    
    reader.readAsDataURL(file);
  }

  /**
   * Dessine l'image sur le canvas avec les transformations appliquées
   */
  drawImage(): void {
    if (!this.canvas || !this.originalImage) return;
    
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Dimensions du canvas
    const canvasSize = 400;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    
    // Appliquer les filtres
    ctx.filter = `brightness(${this.brightness}%) contrast(${this.contrast}%)`;
    
    // Sauvegarder l'état
    ctx.save();
    
    // Centrer le canvas
    ctx.translate(canvasSize / 2, canvasSize / 2);
    
    // Appliquer la rotation
    ctx.rotate((this.rotation * Math.PI) / 180);
    
    // Appliquer l'échelle
    ctx.scale(this.scale, this.scale);
    
    // Calculer les dimensions de l'image
    const imgRatio = this.originalImage.width / this.originalImage.height;
    let drawWidth = canvasSize;
    let drawHeight = canvasSize;
    
    if (imgRatio > 1) {
      drawHeight = canvasSize / imgRatio;
    } else {
      drawWidth = canvasSize * imgRatio;
    }
    
    // Dessiner l'image avec position
    ctx.drawImage(
      this.originalImage,
      -drawWidth / 2 + this.imagePosition.x,
      -drawHeight / 2 + this.imagePosition.y,
      drawWidth,
      drawHeight
    );
    
    // Restaurer l'état
    ctx.restore();
  }

  /**
   * Réinitialise tous les contrôles
   */
  resetControls(): void {
    this.scale = 1;
    this.rotation = 0;
    this.brightness = 100;
    this.contrast = 100;
    this.imagePosition = { x: 0, y: 0 };
    this.drawImage();
  }

  /**
   * Gestion du zoom
   */
  onScaleChange(): void {
    this.drawImage();
  }

  /**
   * Rotation de l'image
   */
  rotateLeft(): void {
    this.rotation = (this.rotation - 90) % 360;
    this.drawImage();
  }

  rotateRight(): void {
    this.rotation = (this.rotation + 90) % 360;
    this.drawImage();
  }

  /**
   * Retourner l'image
   */
  flipHorizontal(): void {
    if (!this.canvas || !this.originalImage) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.originalImage.width;
    tempCanvas.height = this.originalImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      tempCtx.translate(tempCanvas.width, 0);
      tempCtx.scale(-1, 1);
      tempCtx.drawImage(this.originalImage, 0, 0);
      
      const newImg = new Image();
      newImg.onload = () => {
        this.originalImage = newImg;
        this.drawImage();
      };
      newImg.src = tempCanvas.toDataURL();
    }
  }

  /**
   * Gestion du filtrage
   */
  onBrightnessChange(): void {
    this.drawImage();
  }

  onContrastChange(): void {
    this.drawImage();
  }

  /**
   * Gestion du drag pour déplacer l'image
   */
  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStart = {
      x: event.clientX - this.imagePosition.x,
      y: event.clientY - this.imagePosition.y
    };
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.imagePosition = {
        x: event.clientX - this.dragStart.x,
        y: event.clientY - this.dragStart.y
      };
      this.drawImage();
    }
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  /**
   * Télécharger l'image depuis une URL
   */
  loadFromUrl(): void {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) {
      this.hasExistingImage = false;
      this.loadExistingImage(url);
    }
  }

  /**
   * Supprime l'image sélectionnée
   */
  removeImage(): void {
    if (confirm('Voulez-vous vraiment supprimer cette image ?')) {
      this.selectedFile = null;
      this.imagePreviewUrl = null;
      this.originalImage = null;
      this.hasExistingImage = false;
      this.resetControls();
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }

  /**
   * Enregistre le fichier final
   */
  async onSave(): Promise<void> {
    if (!this.canvas || !this.originalImage) {
      this.snackBar.open('Aucune image à enregistrer.', 'Fermer', { 
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Convertir le canvas en blob
      const canvas = this.canvas.nativeElement;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erreur lors de la conversion de l\'image'));
          }
        }, 'image/jpeg', 0.95);
      });
      
      // Créer un fichier à partir du blob
      const fileName = this.selectedFile?.name || `profile_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      // Créer une URL de prévisualisation pour mise à jour immédiate
      const previewUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      // Retourner le fichier ET l'URL de prévisualisation
      const result: ProfileImageDialogResult = {
        file: file,
        previewUrl: previewUrl
      };
      
      this.dialogRef.close(result);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      this.snackBar.open('Erreur lors de la sauvegarde de l\'image.', 'Fermer', { 
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      this.isProcessing = false;
    }
  }

  /**
   * Annule l'opération
   */
  onCancel(): void {
    if ((this.selectedFile || this.hasExistingImage) && 
        !confirm('Voulez-vous vraiment annuler ? Les modifications seront perdues.')) {
      return;
    }
    this.dialogRef.close();
  }

  /**
   * Ouvre le sélecteur de fichiers
   */
  openFileSelector(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  /**
   * Obtient les informations du fichier
   */
  getFileInfo(): string {
    if (!this.selectedFile) return '';
    const sizeMB = (this.selectedFile.size / (1024 * 1024)).toFixed(2);
    return `${this.selectedFile.name} (${sizeMB} MB)`;
  }
  
  /**
   * Vérifie si on peut sauvegarder
   */
  canSave(): boolean {
    return !!(this.selectedFile || this.hasExistingImage) && !this.isProcessing;
  }
}