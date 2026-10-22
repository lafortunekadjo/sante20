import { TranslateModule } from '@ngx-translate/core';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { toPng } from 'html-to-image';
import { removeBackground } from '@imgly/background-removal';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

export interface PosterFormat {
  label: string;
  value: 'SQUARE' | 'STORY';
  icon: string;
}

export interface PosterTemplate {
  id: string;
  name: string;
  preview: string;
}

export interface ColorPreset {
  name: string;
  primary: string;
  secondary: string;
}

@Component({
  selector: 'app-poster-modal',
    standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './poster-modal.component.html',
  styleUrls: ['./poster-modal.component.scss']
})
export class PosterModalComponent implements OnInit {
  @Input() matchData: any;
  @Input() availableTypes: string[] = ['AVANT_MATCH', 'MI_TEMPS', 'APRES_MATCH'];
  
  @Output() closed = new EventEmitter<void>();

  @ViewChild('posterContainer') posterContainer!: ElementRef<HTMLElement>;

  posterForm!: FormGroup;
  isGenerating = false;
  isProcessingAiPhoto = false;
  generatedPosterUrl: string | null = null;

  mainImagePreview: string | null = null;
  secondaryImagePreview: string | null = null;

  formats: PosterFormat[] = [
    { label: 'Carré (Post)', value: 'SQUARE', icon: '📱' },
    { label: 'Vertical (Story)', value: 'STORY', icon: '📲' }
  ];

  templates: PosterTemplate[] = [
    { id: 'street', name: 'Street 2-0', preview: 'https://placehold.co/100x100/16213e/ffffff?text=Street' },
    { id: 'neon', name: 'Néon Sport', preview: 'https://placehold.co/100x100/00f2fe/ffffff?text=Neon' },
    { id: 'classic', name: 'Classique', preview: 'https://placehold.co/100x100/ff6b2b/ffffff?text=Classic' }
  ];

  colorPresets: ColorPreset[] = [
    { name: 'Feu & Or', primary: '#ff6b2b', secondary: '#f1c40f' },
    { name: 'Nuit Cyber', primary: '#00f2fe', secondary: '#4facfe' },
    { name: 'Vert Terrain', primary: '#11998e', secondary: '#38ef7d' },
    { name: 'Rouge Choc', primary: '#ff416c', secondary: '#ff4b2b' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.posterForm = this.fb.group({
      type: [this.availableTypes[0] || 'AVANT_MATCH', Validators.required],
      format: ['SQUARE', Validators.required],
      templateId: ['street', Validators.required],
      primaryColor: ['#ff6b2b', Validators.required],
      secondaryColor: ['#16213e', Validators.required],
      message: ['', [Validators.maxLength(60)]],
      photoMode: ['single'],
      enableAiCutout: [true] // Option pour activer/désactiver le détourage
    });
  }

  applyColorPreset(preset: ColorPreset): void {
    this.posterForm.patchValue({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary
    });
  }

  /**
   * Gestion de l'import photo avec détourage IA automatique côté client
   */
async onPhotoSelected(event: Event, target: 'photo1' | 'photo2'): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const useAiCutout = this.posterForm.get('enableAiCutout')?.value;

  if (useAiCutout) {
    this.isProcessingAiPhoto = true;
    try {
      // ✅ Utilisation de removeBackground()
      const blob = await removeBackground(file);
      const imageUrl = URL.createObjectURL(blob);

      if (target === 'photo1') {
        this.mainImagePreview = imageUrl;
      } else {
        this.secondaryImagePreview = imageUrl;
      }
    } catch (error) {
      console.error('Erreur détourage IA, fallback sur image brute:', error);
      this.loadRawImage(file, target);
    } finally {
      this.isProcessingAiPhoto = false;
    }
  } else {
    this.loadRawImage(file, target);
  }
}
  private loadRawImage(file: File, target: 'photo1' | 'photo2'): void {
    const reader = new FileReader();
    reader.onload = () => {
      if (target === 'photo1') {
        this.mainImagePreview = reader.result as string;
      } else {
        this.secondaryImagePreview = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  onImageError(event: Event, defaultText: string = 'LOGO'): void {
    const imgElement = event.target as HTMLImageElement | null;
    if (imgElement) {
      imgElement.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${defaultText}`;
    }
  }

  /**
   * Génération de l'image PNG haute définition
   */
  async generatePoster(): Promise<void> {
    if (this.posterForm.invalid) return;

    this.isGenerating = true;

    try {
      if (this.posterContainer) {
        const dataUrl = await toPng(this.posterContainer.nativeElement, {
          quality: 0.98,
          pixelRatio: 2,
          skipFonts: true,
          cacheBust: true
        });
        this.generatedPosterUrl = dataUrl;
      }
    } catch (error) {
      console.error('Erreur lors de la génération de l affiche:', error);
    } finally {
      this.isGenerating = false;
    }
  }

  downloadPoster(): void {
    if (!this.generatedPosterUrl) return;

    const link = document.createElement('a');
    link.download = `my20-poster-${Date.now()}.png`;
    link.href = this.generatedPosterUrl;
    link.click();
  }

  close(): void {
    this.closed.emit();
  }
}