// poster-modal.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PosterService } from '../../../../core/services/competition/poster.service';
import { DialogRef } from '@angular/cdk/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Match } from '../../../../core/models/match.model';

@Component({
  selector: 'app-poster-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './poster-modal.component.html',
  styleUrls: ['./poster-modal.component.scss']
})
export class PosterModalComponent implements OnInit {
  matchId: number;
  posterForm!: FormGroup;
  availableTypes: string[] = [];
  isLoading = false;
  previewImage: string | null = null;
  
  templates = [
    { id: 'classique', name: 'Classique', preview: 'assets/templates/classique-preview.jpg' },
    { id: 'stadium', name: 'Stade', preview: 'assets/templates/stadium-preview.jpg' },
    { id: 'street', name: 'Street', preview: 'assets/templates/street-preview.jpg' },
    { id: 'minimal', name: 'Minimal', preview: 'assets/templates/minimal-preview.jpg' },
    { id: 'elegant', name: 'Élégant', preview: 'assets/templates/elegant-preview.jpg' }
  ];
  
  formats = [
    { value: 'CARRE', label: 'Carré (Instagram)', icon: '⬛', width: 1080, height: 1080 },
    { value: 'PORTRAIT', label: 'Portrait (Story)', icon: '📱', width: 1080, height: 1350 },
    { value: 'PAYSAGE', label: 'Paysage (Facebook)', icon: '🖥️', width: 1920, height: 1080 }
  ];
  
  // Couleurs prédéfinies pour les équipes
  colorPresets = [
    { name: 'Orange My2-0', primary: '#ff6b2b', secondary: '#1a1a2e' },
    { name: 'Rouge Passion', primary: '#e53935', secondary: '#b71c1c' },
    { name: 'Bleu Royal', primary: '#1e88e5', secondary: '#0d47a1' },
    { name: 'Vert Émeraude', primary: '#43a047', secondary: '#1b5e20' },
    { name: 'Violet Mystique', primary: '#8e24aa', secondary: '#4a148c' },
    { name: 'Jaune Énergie', primary: '#fdd835', secondary: '#f57f17' },
    { name: 'Rose Chic', primary: '#ec407a', secondary: '#880e4f' },
    { name: 'Noir Élégant', primary: '#ffffff', secondary: '#212121' }
  ];

  constructor(
    private fb: FormBuilder,
    private posterService: PosterService,
    @Inject(MAT_DIALOG_DATA) public data: Match ,
    private dialogRef: DialogRef<PosterModalComponent>
  ) {
    console.log(data)
    this.matchId = data.id;
  }

  ngOnInit() {
    this.initializeForm();
    this.checkAvailability();
  }

  private initializeForm() {
    this.posterForm = this.fb.group({
      type: [{ value: '', disabled: true }, Validators.required],
      format: ['CARRE', Validators.required],
      templateId: ['classique', Validators.required],
      message: [''],
      primaryColor: ['#ff6b2b', Validators.required],
      secondaryColor: ['#1a1a2e', Validators.required],
      photoMode: ['single'],
      photo1: [null],
      photo2: [null]
    });
  }

  private checkAvailability() {
    this.posterService.checkAvailability(this.matchId).subscribe({
      next: (data: any) => {
        this.availableTypes = data.available;
        this.posterForm.get('type')?.enable();
        this.posterForm.get('type')?.setValue(data.default);
      },
      error: (err) => console.error(err)
    });
  }

  applyColorPreset(preset: any) {
    this.posterForm.patchValue({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary
    });
  }

  onPhotoSelected(event: any, position: 'photo1' | 'photo2') {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.posterForm.patchValue({ [position]: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  private getSelectedPhotos(): string[] {
    const photos = [];
    const mode = this.posterForm.get('photoMode')?.value;
    const photo1 = this.posterForm.get('photo1')?.value;
    const photo2 = this.posterForm.get('photo2')?.value;
    
    if (mode === 'single' && photo1) {
      photos.push(photo1);
    } else if (mode === 'double') {
      if (photo1) photos.push(photo1);
      if (photo2) photos.push(photo2);
    }
    return photos;
  }

  generatePoster() {
    if (this.posterForm.invalid) return;
    
    this.isLoading = true;
    
    const request = {
      matchId: this.matchId,
      type: this.posterForm.get('type')?.value,
      format: this.posterForm.get('format')?.value,
      templateId: this.posterForm.get('templateId')?.value,
      message: this.posterForm.get('message')?.value,
      primaryColor: this.posterForm.get('primaryColor')?.value,
      secondaryColor: this.posterForm.get('secondaryColor')?.value,
      photoUrls: this.getSelectedPhotos()
    };
    
    this.posterService.generatePoster(request).subscribe({
      next: (blob) => {
        this.previewImage = URL.createObjectURL(blob);
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  downloadPoster() {
    if (this.previewImage) {
      const link = document.createElement('a');
      link.href = this.previewImage;
      link.download = `poster_match_${this.matchId}_${Date.now()}.png`;
      link.click();
    }
  }

  close() {
    this.dialogRef.close();
  }
}