import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-profile-image-edit-dialog',
  imports: [MatIconModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './profile-image-edit-dialog.component.html',
  styleUrl: './profile-image-edit-dialog.component.scss'
})
export class ProfileImageEditDialogComponent {
   selectedFile: File | null = null;
  imagePreviewUrl: SafeUrl | null = null;

  constructor(
    public dialogRef: MatDialogRef<ProfileImageEditDialogComponent>,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  /**
   * Gère le fichier sélectionné par l'utilisateur.
   * @param event L'événement de changement du champ de saisie de fichier.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target && e.target.result) {
          const fileUrl = e.target.result as string;
          this.imagePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(fileUrl);
        }
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  /**
   * Enregistre le fichier sélectionné et ferme la pop-up.
   */
  onSave(): void {
    this.dialogRef.close(this.selectedFile);
  }

  /**
   * Annule l'opération et ferme la pop-up sans renvoyer de données.
   */
  onCancel(): void {
    this.dialogRef.close();
  }

}
