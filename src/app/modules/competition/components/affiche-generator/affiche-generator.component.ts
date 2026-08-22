import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-affiche-generator',
   standalone:  true,
    imports:     [CommonModule, FormsModule],
  templateUrl: './affiche-generator.component.html',
  styleUrls: ['./affiche-generator.component.scss']
})
export class AfficheGeneratorComponent {
  @ViewChild('afficheCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  selectedFile: File | null = null;
  selectedStyle: string = 'AUTO';
  isGenerated: boolean = false;

  matchData = {
    homeTeam: 'PSG',
    awayTeam: 'ARSENAL',
    score: '3 - 1',
    type: 'AFTER', // 'BEFORE' ou 'AFTER'
    homeLogoUrl: 'assets/logos/psg.png',
    awayLogoUrl: 'assets/logos/arsenal.png'
  };

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  generateAffiche() {
    if (!this.selectedFile) {
      alert('Veuillez sélectionner une photo pour le match.');
      return;
    }

    const formData = new FormData();
    formData.append('homeTeam', this.matchData.homeTeam);
    formData.append('awayTeam', this.matchData.awayTeam);
    formData.append('score', this.matchData.score);
    formData.append('type', this.matchData.type);
    formData.append('playerImage', this.selectedFile);

    this.http.post<any>('http://localhost:8000/api/v1/affiches/prepare', formData)
      .subscribe({
        next: (res) => {
          const themeToUse = this.selectedStyle === 'AUTO' ? res.styleTheme : this.selectedStyle;
          this.renderCanvas(
            res.caption,
            res.primaryColor,
            res.secondaryColor,
            res.processedPlayerImageBase64,
            themeToUse
          );
          this.isGenerated = true;
        },
        error: (err) => {
          console.error('Erreur lors de la préparation de l\'affiche', err);
        }
      });
  }

  private async renderCanvas(
    caption: string,
    primaryColor: string,
    secondaryColor: string,
    playerImageBase64: string,
    styleTheme: string
  ) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Fond selon le thème
    this.applyThemeBackground(ctx, canvas, styleTheme, primaryColor);

    // 2. Dessiner la photo principale du joueur (centrée)
    if (playerImageBase64) {
      try {
        const playerImg = await this.loadImage(playerImageBase64);
        // Ajustement selon le ratio du joueur
        ctx.drawImage(playerImg, (canvas.width - 750) / 2, 220, 750, 750);
      } catch (e) {
        console.warn('Impossible de charger l\'image du joueur', e);
      }
    }

    // 3. Masque / Ombrage inférieur pour faire ressortir les textes
    const overlayGradient = ctx.createLinearGradient(0, canvas.height - 500, 0, canvas.height);
    overlayGradient.addColorStop(0, 'rgba(0,0,0,0)');
    overlayGradient.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, canvas.height - 500, canvas.width, 500);

    // 4. Titre / Accroche (Générée par Gemini)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 40px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(caption.toUpperCase(), canvas.width / 2, 120);

    // 5. Logos des équipes
    try {
      const homeLogo = await this.loadImage(this.matchData.homeLogoUrl);
      const awayLogo = await this.loadImage(this.matchData.awayLogoUrl);
      ctx.drawImage(homeLogo, 180, 1020, 120, 120);
      ctx.drawImage(awayLogo, 780, 1020, 120, 120);
    } catch (e) {
      console.warn('Un ou plusieurs logos n\'ont pas pu être chargés.');
    }

    // 6. Score & Équipes
    if (this.matchData.type === 'AFTER') {
      ctx.fillStyle = secondaryColor;
      ctx.font = '900 110px Montserrat, sans-serif';
      ctx.fillText(this.matchData.score, canvas.width / 2, 1120);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 80px Montserrat, sans-serif';
      ctx.fillText('VS', canvas.width / 2, 1110);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 32px Montserrat, sans-serif';
    ctx.fillText(`${this.matchData.homeTeam}   -   ${this.matchData.awayTeam}`, canvas.width / 2, 1220);
  }

  private applyThemeBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, theme: string, primaryColor: string) {
    if (theme === 'NEON') {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const radial = ctx.createRadialGradient(canvas.width / 2, 450, 50, canvas.width / 2, 450, 500);
      radial.addColorStop(0, primaryColor);
      radial.addColorStop(1, '#050505');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme === 'MINIMALIST') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      // Style GRUNGE / Standard
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(0.5, primaryColor);
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }

  downloadAffiche() {
    const canvas = this.canvasRef.nativeElement;
    const link = document.createElement('a');
    link.download = `affiche-${this.matchData.homeTeam}-vs-${this.matchData.awayTeam}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}