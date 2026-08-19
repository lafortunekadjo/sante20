import {
  Component, Input, inject, signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient }    from '@angular/common/http';
import { MatchDetailDTO } from '../../../../core/models/competition.models';
import { environment } from '../../../../environment';

@Component({
  selector:    'app-feuille-match',
  standalone:  true,
  imports:     [CommonModule, DatePipe],
  templateUrl: './feuille-match.component.html',
  styleUrls:   ['./feuille-match.component.scss']
})
export class FeuilleMatchComponent {
  @Input() match!: MatchDetailDTO;
  @Input() competitionNom = '';
  @Input() journeeNom = '';

  printing = signal(false);

  imprimer(): void {
    this.printing.set(true);
    window.print();
    setTimeout(() => this.printing.set(false), 1000);
  }

  telechargerPDF(): void {
    // Appel backend pour générer le PDF
    window.open(
      `${environment.apiUrl}/competitions/matchs/${this.match.id}/feuille-pdf`,
      '_blank'
    );
  }

  getCompo(side: 'domicile' | 'exterieur') {
    return side === 'domicile'
      ? (this.match.compositionDomicile ?? [])
      : (this.match.compositionExterieur ?? []);
  }

  getTitulaires(side: 'domicile' | 'exterieur') {
    return this.getCompo(side).filter(c => c.statut !== 'REMPLACANT');
  }

  getRemplacants(side: 'domicile' | 'exterieur') {
    return this.getCompo(side).filter(c => c.statut === 'REMPLACANT');
  }
}