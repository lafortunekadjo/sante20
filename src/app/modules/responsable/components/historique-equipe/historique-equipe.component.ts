// shared/components/historique-equipe/historique-equipe.component.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { MembreService } from '../../../../core/services/membre.service';
import { HistoriqueEquipe } from '../../../../../../My2-0/src/app/core/models/historique-equipe.model';


@Component({
  selector: 'app-historique-equipe',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './historique-equipe.component.html',
  styleUrls: ['./historique-equipe.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, height: 0, overflow: 'hidden' }),
        animate('250ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, height: 0, overflow: 'hidden' }))
      ])
    ])
  ]
})
export class HistoriqueEquipeComponent implements OnChanges {
  @Input({ required: true }) membreId!: number;

  expanded = false;
  loading = false;
  loaded = false;
  historique: HistoriqueEquipe[] = [];
  error = false;

  constructor(private membreService: MembreService) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Si le membreId change (réutilisation du composant dans une liste, changement de sélection),
    // on réinitialise pour forcer un rechargement au prochain toggle
    if (changes['membreId'] && !changes['membreId'].firstChange) {
      this.loaded = false;
      this.historique = [];
      this.expanded = false;
    }
  }

  toggle(): void {
    this.expanded = !this.expanded;
    if (this.expanded && !this.loaded) {
      this.load();
    }
  }

  private load(): void {
    this.loading = true;
    this.error = false;
    this.membreService.getHistoriqueEquipes(this.membreId).subscribe({
      next: (data) => {
        this.historique = data;
        this.loaded = true;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement historique équipes:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  formatDuree(debut: string, fin: string | null): string {
    const dateDebut = new Date(debut).toLocaleDateString('fr-FR');
    if (!fin) return dateDebut;
    const dateFin = new Date(fin).toLocaleDateString('fr-FR');
    return `${dateDebut} → ${dateFin}`;
  }
}