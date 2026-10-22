import { t } from '../../../core/i18n/traduire';
import { TranslateModule } from '@ngx-translate/core';
import { Component } from '@angular/core';

@Component({
  selector: 'app-match-share',
  imports: [TranslateModule, ],
  templateUrl: './match-share.component.html',
  styleUrl: './match-share.component.scss'
})
export class MatchShareComponent {
  loading: boolean = false;
  matchImageService: any;
  match: any;
  snackBar: any;

  downloadMatchPoster() {
  this.loading = true;
  this.matchImageService.generatePoster(this.match.id).subscribe({
    next: (blob: Blob | MediaSource) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Match_${this.match.adversaire}_Score.png`;
      link.click();
      this.loading = false;
      this.snackBar.open(t('ui.ts_affiche_prete_9ce2'), 'OK', { duration: 3000 });
    },
    error: () => {
      this.loading = false;
      this.snackBar.open(t('ui.ts_erreur_lors_de_la_generation_b4d1'), 'Fermer');
    }
  });
}

}
