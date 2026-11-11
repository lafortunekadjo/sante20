import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ConnexionAnnulee, GoogleSigninService } from '../../../core/services/google-signin.service';

/**
 * Bouton « Continuer avec Google » : connecte l'utilisateur ou crée son compte (candidat) puis le redirige
 * comme le fait la page de connexion.
 */
@Component({
  selector: 'app-google-button',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './google-button.component.html',
  styleUrl: './google-button.component.scss'
})
export class GoogleButtonComponent {
  /** Place du séparateur « ou » : au-dessus du bouton (suite d'un formulaire) ou en dessous (début d'un formulaire). */
  @Input() separateur: 'avant' | 'apres' = 'avant';
  enCours = false;
  erreur = '';

  constructor(
    private google: GoogleSigninService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async cliquer(): Promise<void> {
    if (this.enCours) return;
    this.enCours = true;
    this.erreur = '';
    try {
      const idToken = await this.google.obtenirIdToken();
      let ref: string | null = null;
      try { ref = localStorage.getItem('my20_ref_code'); } catch { /* sans parrainage */ }
      this.auth.loginGoogle(idToken, ref).subscribe({
        next: () => this.auth.getMesGroupes().subscribe({
          next: () => this.rediriger(),
          error: () => this.rediriger()
        }),
        error: (err) => this.echec(err?.status === 429 ? 'auth.google.trop_tentatives' : 'auth.google.echec')
      });
    } catch (e) {
      if (e instanceof ConnexionAnnulee) { this.enCours = false; return; }
      console.error('[Google] connexion impossible', e);
      this.echec('auth.google.echec');
    }
  }

  private echec(cle: string): void {
    this.erreur = cle;
    this.enCours = false;
  }

  private rediriger(): void {
    try { localStorage.removeItem('my20_ref_code'); } catch { /* ignoré */ }
    let returnUrl = this.route.snapshot.queryParams['returnUrl'] ?? sessionStorage.getItem('concours_returnUrl');
    this.enCours = false;
    if (returnUrl) {
      sessionStorage.removeItem('concours_returnUrl');
      this.router.navigateByUrl(returnUrl);
      return;
    }
    const roles = this.auth.getRoles();
    if (roles.includes('ADMIN')) this.router.navigate(['/admin']);
    else if (roles.includes('PARTENAIRE')) this.router.navigate(['/partenaire/dashboard']);
    else if (roles.includes('CANDIDAT') && !roles.includes('MEMBRE')) this.router.navigate(['/explorer']);
    else if (this.auth.isResponsable()) this.router.navigate(['/responsable']);
    else if (roles.includes('MEMBRE')) this.router.navigate(['/membre2']);
    else this.router.navigate(['/explorer']);
  }
}
