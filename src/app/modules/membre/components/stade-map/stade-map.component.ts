// stade-map.component.ts
import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface StadeInfo {
  nom: string;
  latitude: number;
  longitude: number;
  ville?: string;
  quartier?: string;
  rayon?: number;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  label: string;
}

@Component({
  selector: 'app-stade-map',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule, 
    MatCardModule,
    MatSnackBarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="map-container">
      
      <!-- En-tête avec informations -->
      <div class="map-header">
        <div class="stade-info">
          <mat-icon class="location-icon">stadium</mat-icon>
          <div class="info-content">
            <h3>{{ stadeInfo().nom }}</h3>
            <p class="coordinates">
              📍 {{ stadeInfo().latitude | number:'1.6-6' }}, {{ stadeInfo().longitude | number:'1.6-6' }}
            </p>
            <p *ngIf="stadeInfo().ville" class="address">
              📍 {{ stadeInfo().ville }}{{ stadeInfo().quartier ? ', ' + stadeInfo().quartier : '' }}
            </p>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="map-actions">
          <button mat-raised-button color="primary" (click)="getCurrentLocation()" [disabled]="isGettingLocation()">
            <mat-icon>{{ isGettingLocation() ? 'hourglass_empty' : 'my_location' }}</mat-icon>
            {{ isGettingLocation() ? 'Localisation...' : 'Ma position' }}
          </button>
          
          <button mat-stroked-button (click)="openInMaps()">
            <mat-icon>open_in_new</mat-icon>
            Ouvrir dans Maps
          </button>
        </div>
      </div>

      <!-- Carte conceptuelle -->
      <div class="map-display" (click)="onMapClick($event)">
        
        <!-- Vue carte simplifiée -->
        <div class="simple-map">
          
          <!-- Stade (point central) -->
          <div class="map-marker stade-marker" 
               [style.left.%]="50" 
               [style.top.%]="50">
            <mat-icon>stadium</mat-icon>
            <span class="marker-label">{{ stadeInfo().nom }}</span>
          </div>

          <!-- Rayon de détection (si défini) -->
          <div *ngIf="stadeInfo().rayon" 
               class="detection-radius"
               [style.width.px]="radiusPixels()"
               [style.height.px]="radiusPixels()">
          </div>

          <!-- Position utilisateur -->
          <div *ngIf="userLocation()" 
               class="map-marker user-marker"
               [style.left.%]="userPositionX()"
               [style.top.%]="userPositionY()">
            <mat-icon>person_pin_circle</mat-icon>
            <span class="marker-label">Votre position</span>
          </div>

          <!-- Ligne de distance -->
          <svg *ngIf="userLocation() && showDistanceLine()" class="distance-line" width="100%" height="100%">
            <line [attr.x1]="'50%'" 
                  [attr.y1]="'50%'" 
                  [attr.x2]="userPositionX() + '%'"
                  [attr.y2]="userPositionY() + '%'"
                  stroke="#1976d2" 
                  stroke-width="2" 
                  stroke-dasharray="5,5" />
          </svg>

          <!-- Grille de fond -->
          <div class="map-grid">
            <div class="grid-line horizontal" style="top: 25%"></div>
            <div class="grid-line horizontal" style="top: 75%"></div>
            <div class="grid-line vertical" style="left: 25%"></div>
            <div class="grid-line vertical" style="left: 75%"></div>
          </div>
        </div>

        <!-- Instruction si pas de position utilisateur -->
        <div *ngIf="!userLocation()" class="map-instruction">
          <mat-icon>touch_app</mat-icon>
          <p>Cliquez sur "Ma position" pour voir la distance</p>
        </div>
      </div>

      <!-- Informations de distance -->
      <div *ngIf="userLocation()" class="distance-info">
        <mat-card class="distance-card">
          <div class="distance-content">
            <div class="distance-main">
              <mat-icon class="distance-icon">straighten</mat-icon>
              <div class="distance-details">
                <span class="distance-value">{{ formatDistance(distanceToStade()) }}</span>
                <span class="distance-label">Distance au stade</span>
              </div>
            </div>
            
            <div class="distance-status">
              <div class="status-indicator" [class.in-range]="isInRange()">
                <mat-icon>{{ isInRange() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>{{ isInRange() ? 'Dans la zone de présence' : 'Hors zone de présence' }}</span>
              </div>
              
              <div class="accuracy-info" *ngIf="locationAccuracy()">
                <mat-icon>gps_fixed</mat-icon>
                <span>Précision: ±{{ locationAccuracy() }}m</span>
              </div>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Saisie manuelle de coordonnées -->
      <div class="manual-coordinates">
        <button mat-button (click)="showManualInput = !showManualInput">
          <mat-icon>edit_location</mat-icon>
          {{ showManualInput ? 'Masquer' : 'Saisir coordonnées manuellement' }}
        </button>
        
        <div *ngIf="showManualInput" class="coordinate-inputs">
          <mat-form-field appearance="outline" class="coord-input">
            <mat-label>Latitude</mat-label>
            <input matInput type="number" step="any" [(ngModel)]="manualLat" placeholder="3.8480">
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="coord-input">
            <mat-label>Longitude</mat-label>
            <input matInput type="number" step="any" [(ngModel)]="manualLng" placeholder="11.5021">
          </mat-form-field>
          
          <button mat-raised-button (click)="setManualLocation()" [disabled]="!isValidManualCoords()">
            <mat-icon>place</mat-icon>
            Calculer distance
          </button>
        </div>
      </div>

    </div>
  `,
  styleUrls: ['./stade-map.component.scss']
})
export class StadeMapComponent implements OnInit {
  @Input() stadeData!: StadeInfo;

  // Signals pour l'état
  stadeInfo = signal<StadeInfo>({ nom: '', latitude: 0, longitude: 0 });
  userLocation = signal<LocationPoint | null>(null);
  isGettingLocation = signal(false);
  locationAccuracy = signal<number | null>(null);
  showDistanceLine = signal(true);

  // Propriétés pour saisie manuelle
  showManualInput = false;
  manualLat: number | null = null;
  manualLng: number | null = null;

  // Computed values
  distanceToStade = computed(() => {
    const user = this.userLocation();
    const stade = this.stadeInfo();
    
    if (!user || !stade) return 0;
    
    return this.calculateDistance(
      user.latitude, user.longitude,
      stade.latitude, stade.longitude
    );
  });

  isInRange = computed(() => {
    const distance = this.distanceToStade();
    const rayon = this.stadeInfo().rayon || 500;
    return distance <= rayon;
  });

  radiusPixels = computed(() => {
    const rayon = this.stadeInfo().rayon || 500;
    // Conversion approximative : 1km ≈ 100px sur la carte
    return Math.min(rayon / 10, 200);
  });

  userPositionX = computed(() => {
    const user = this.userLocation();
    const stade = this.stadeInfo();
    
    if (!user || !stade) return 50;
    
    // Calcul approximatif de position relative (simplifiée)
    const deltaLng = (user.longitude - stade.longitude) * 100000;
    return Math.max(10, Math.min(90, 50 + deltaLng * 10));
  });

  userPositionY = computed(() => {
    const user = this.userLocation();
    const stade = this.stadeInfo();
    
    if (!user || !stade) return 50;
    
    // Calcul approximatif de position relative (simplifiée)
    const deltaLat = (stade.latitude - user.latitude) * 100000;
    return Math.max(10, Math.min(90, 50 + deltaLat * 10));
  });

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    if (this.stadeData) {
      this.stadeInfo.set(this.stadeData);
    }
  }

  /**
   * Obtenir la position GPS de l'utilisateur
   */
  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.showMessage('Géolocalisation non supportée', 'error');
      return;
    }

    this.isGettingLocation.set(true);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos: LocationPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: 'Votre position'
        };
        
        this.userLocation.set(userPos);
        this.locationAccuracy.set(Math.round(position.coords.accuracy));
        
        this.showMessage(
          `Position obtenue (précision: ±${Math.round(position.coords.accuracy)}m)`,
          'success'
        );
        
        this.isGettingLocation.set(false);
      },
      (error) => {
        this.handleLocationError(error);
        this.isGettingLocation.set(false);
      },
      options
    );
  }

  /**
   * Définir une position manuelle
   */
  setManualLocation(): void {
    if (!this.isValidManualCoords()) return;

    const userPos: LocationPoint = {
      latitude: this.manualLat!,
      longitude: this.manualLng!,
      label: 'Position manuelle'
    };
    
    this.userLocation.set(userPos);
    this.locationAccuracy.set(null);
    this.showMessage('Position définie manuellement', 'success');
  }

  /**
   * Valider les coordonnées manuelles
   */
  isValidManualCoords(): boolean {
    return !!(
      this.manualLat !== null && 
      this.manualLng !== null &&
      this.manualLat >= -90 && this.manualLat <= 90 &&
      this.manualLng >= -180 && this.manualLng <= 180
    );
  }

  /**
   * Ouvrir dans Google Maps
   */
  openInMaps(): void {
    const stade = this.stadeInfo();
    const url = `https://www.google.com/maps/search/?api=1&query=${stade.latitude},${stade.longitude}`;
    window.open(url, '_blank');
  }

  /**
   * Calculer la distance entre deux points
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Formater la distance pour l'affichage
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Gérer les erreurs de géolocalisation
   */
  private handleLocationError(error: GeolocationPositionError): void {
    let message = '';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Accès à la localisation refusé';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Position indisponible';
        break;
      case error.TIMEOUT:
        message = 'Délai de localisation dépassé';
        break;
      default:
        message = 'Erreur de géolocalisation';
        break;
    }
    this.showMessage(message, 'error');
  }

  /**
   * Afficher un message
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: type === 'error' ? 6000 : 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`${type}-snackbar`]
    });
  }

  /**
   * Gestion du clic sur la carte (pour futures extensions)
   */
  onMapClick(event: MouseEvent): void {
    // Ici on pourrait ajouter la possibilité de cliquer sur la carte
    // pour définir une position
    console.log('Clic sur la carte:', event);
  }
}