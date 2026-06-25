import { Component } from '@angular/core';

@Component({
  selector: 'app-match-share',
  imports: [],
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
      this.snackBar.open('Affiche prête ! ⚽', 'OK', { duration: 3000 });
    },
    error: () => {
      this.loading = false;
      this.snackBar.open('Erreur lors de la génération', 'Fermer');
    }
  });
}

}
