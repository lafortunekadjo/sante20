import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface MatchPosterConfig {
  title: string;
  caption: string;
  homeTeamName: string;
  homeTeamLogoUrl: string;
  awayTeamName: string;
  awayTeamLogoUrl: string;
  score: string;
  matchType: string;
  primaryImage: string;
  secondaryImage: string;
  matchDetails: string;
}

@Component({
  selector: 'app-match-poster',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './match-poster.component.html',
  styleUrls: ['./match-poster.component.scss']
})
export class MatchPosterComponent {
  // Modèle de données du formulaire
  matchType: 'BEFORE' | 'AFTER' = 'BEFORE';
  homeTeamName: string = '';
  awayTeamName: string = '';
  score: string = '';
  matchDateOrVenue: string = '';
  customCaption: string = '';

  // Stockage des fichiers
  homeTeamLogoFile: File | null = null;
  awayTeamLogoFile: File | null = null;
  mainImageFile: File | null = null;
  secondaryImageFile: File | null = null;

  // Prévisualisations locales pour l'interface
  homeLogoPreview: string | null = null;
  awayLogoPreview: string | null = null;
  mainImagePreview: string | null = null;
  secondaryImagePreview: string | null = null;

  // État de chargement et résultat
  isLoading: boolean = false;
  posterConfig: MatchPosterConfig | null = null;

  private apiUrl = 'http://localhost:8000/api/posters/generate';

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        switch (field) {
          case 'homeLogo':
            this.homeTeamLogoFile = file;
            this.homeLogoPreview = result;
            break;
          case 'awayLogo':
            this.awayTeamLogoFile = file;
            this.awayLogoPreview = result;
            break;
          case 'mainImage':
            this.mainImageFile = file;
            this.mainImagePreview = result;
            break;
          case 'secondaryImage':
            this.secondaryImageFile = file;
            this.secondaryImagePreview = result;
            break;
        }
      };

      reader.readAsDataURL(file);
    }
  }

  removeSecondaryImage(): void {
    this.secondaryImageFile = null;
    this.secondaryImagePreview = null;
  }

  onSubmit(): void {
    if (!this.homeTeamName || !this.awayTeamName) {
      alert('Veuillez saisir au moins les noms des deux équipes.');
      return;
    }

    this.isLoading = true;
    const formData = new FormData();

    formData.append('homeTeamName', this.homeTeamName);
    formData.append('awayTeamName', this.awayTeamName);
    formData.append('matchType', this.matchType);
    formData.append('score', this.score || '');
    formData.append('matchDateOrVenue', this.matchDateOrVenue || '');
    formData.append('customCaption', this.customCaption || '');

    if (this.homeTeamLogoFile) formData.append('homeTeamLogo', this.homeTeamLogoFile);
    if (this.awayTeamLogoFile) formData.append('awayTeamLogo', this.awayTeamLogoFile);
    if (this.mainImageFile) formData.append('mainImage', this.mainImageFile);
    if (this.secondaryImageFile) formData.append('secondaryImage', this.secondaryImageFile);

    this.http.post<MatchPosterConfig>(this.apiUrl, formData).subscribe({
      next: (response) => {
        this.posterConfig = response;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de génération:', err);
        alert('Une erreur est survenue lors de la génération.');
        this.isLoading = false;
      }
    });
  }
}