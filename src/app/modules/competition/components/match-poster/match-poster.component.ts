// match-poster.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subject, takeUntil } from 'rxjs';
import { Match } from '../../../../core/models/match.model';
import { PosterPollingService } from '../../../../core/services/competition/poster-polling.service';
import { PosterAvailability, Template, PosterService, PosterRequest } from '../../../../core/services/competition/poster.service';
import { TemplateCacheService } from '../../../../core/services/competition/template-cache.service';

@Component({
  selector: 'app-match-poster',
  templateUrl: './match-poster.component.html'
})
export class MatchPosterComponent implements OnInit, OnDestroy {
  @Input() match!: Match;
  
  posterForm!: FormGroup;
  availability!: PosterAvailability;
  templates: Template[] = [];
  availableTypes: string[] = [];
  isLoading = false;
  previewImage: string | null = null;
  private destroy$ = new Subject<void>();
  
  formats = [
    { value: 'PORTRAIT', label: 'Portrait (1080×1350)', icon: '📱' },
    { value: 'CARRE', label: 'Carré (1080×1080)', icon: '⬛' },
    { value: 'PAYSAGE', label: 'Paysage (1920×1080)', icon: '🖥️' }
  ];
  
  photoModes = [
    { value: 'SINGLE', label: 'Une photo globale' },
    { value: 'DOUBLE', label: 'Une photo par équipe' }
  ];

  constructor(
    private fb: FormBuilder,
    private posterService: PosterService,
    private pollingService: PosterPollingService,
    private templateCache: TemplateCacheService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadAvailability();
    this.loadTemplates();
  }
  
  private initForm() {
    this.posterForm = this.fb.group({
      type: ['', Validators.required],
      format: ['CARRE', Validators.required],
      templateId: ['classique', Validators.required],
      photoMode: ['SINGLE'],
      photo1: [null],
      photo2: [null],
      showWatermark: [true],
      customTitle: [''],
      language: ['fr']
    });
  }
  
  private loadAvailability() {
    this.posterService.checkAvailability(this.match.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.availability = data;
          this.availableTypes = data.availableTypes;
          this.posterForm.patchValue({ type: data.defaultType });
          this.posterForm.get('type')?.enable();
        },
        error: (err) => console.error('Erreur chargement disponibilité:', err)
      });
  }
  
  private loadTemplates() {
    this.templateCache.getTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (templates) => this.templates = templates,
        error: (err) => console.error('Erreur chargement templates:', err)
      });
  }
  
  onPhotoSelected(event: any, position: 'photo1' | 'photo2') {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.posterForm.patchValue({ [position]: e.target.result });
      };
      reader.readAsDataURL(file);
      
      // Upload vers le serveur
      const teamSide = position === 'photo1' ? 'home' : 'away';
      this.posterService.uploadPhoto(file, this.match.id, teamSide)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => console.log('Photo uploadée:', response.photoUrl),
          error: (err) => console.error('Erreur upload:', err)
        });
    }
  }
  
  generatePoster() {
    if (this.posterForm.invalid) return;
    
    this.isLoading = true;
    
    const request: PosterRequest = {
      matchId: this.match.id,
      type: this.posterForm.get('type')?.value,
      format: this.posterForm.get('format')?.value,
      templateId: this.posterForm.get('templateId')?.value,
      photoMode: this.posterForm.get('photoMode')?.value,
      photoUrls: this.getSelectedPhotos(),
      options: {
        showWatermark: this.posterForm.get('showWatermark')?.value,
        customTitle: this.posterForm.get('customTitle')?.value,
        language: this.posterForm.get('language')?.value
      }
    };
    
    // Utilisation asynchrone avec polling
    this.posterService.generatePosterAsync(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (asyncResponse) => {
          if (asyncResponse.jobId) {
            this.pollingService.startPolling(asyncResponse.jobId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (status) => {
                  console.log('Progression:', status.progress, '%');
                  if (status.status === 'COMPLETED' && status.posterUrl) {
                    this.loadPreviewImage(status.posterUrl);
                    this.isLoading = false;
                  }
                },
                error: (err) => {
                  console.error('Erreur polling:', err);
                  this.isLoading = false;
                }
              });
          }
        },
        error: (err) => {
          console.error('Erreur génération:', err);
          this.isLoading = false;
        }
      });
  }
  
  private getSelectedPhotos(): string[] {
    const photos = [];
    const mode = this.posterForm.get('photoMode')?.value;
    const photo1 = this.posterForm.get('photo1')?.value;
    const photo2 = this.posterForm.get('photo2')?.value;
    
    if (mode === 'SINGLE' && photo1) {
      photos.push(photo1);
    } else if (mode === 'DOUBLE') {
      if (photo1) photos.push(photo1);
      if (photo2) photos.push(photo2);
    }
    
    return photos;
  }
  
  private loadPreviewImage(url: string) {
    this.previewImage = url;
  }
  
  downloadPoster() {
    if (this.previewImage) {
      const link = document.createElement('a');
      link.href = this.previewImage;
      link.download = `poster_match_${this.match.id}_${Date.now()}.png`;
      link.click();
    }
  }
  
  sharePoster() {
    if (this.previewImage) {
      // Logique de partage (Web Share API)
      fetch(this.previewImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'poster.png', { type: 'image/png' });
          if (navigator.share) {
            navigator.share({
              title: 'Affiche My2-0',
              text: `Affiche du match ${this.match.equipe1?.nom} vs ${this.match.equipe2?.nom}`,
              files: [file]
            });
          } else {
            this.downloadPoster();
          }
        });
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.pollingService.stopAllPolling();
  }
}