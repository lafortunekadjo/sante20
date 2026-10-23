import { t } from '../../../../core/i18n/traduire';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { GroupeService } from '../../../../core/services/groupe.service';
import { GroupeProfil } from '../../../../core/models/groupe-explorer.model';

/** Page de détail d'un groupe, ouverte depuis Explorer. Données publiques uniquement. */
@Component({
  selector: 'app-groupe-profil',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './groupe-profil.component.html',
  styleUrl: './groupe-profil.component.scss'
})
export class GroupeProfilComponent implements OnInit {
  profil: GroupeProfil | null = null;
  chargement = true;
  introuvable = false;
  erreur = false;
  idCourant = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupeService: GroupeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => this.charger(Number(p.get('id'))));
  }

  charger(id: number): void {
    this.idCourant = id;
    this.chargement = true;
    this.introuvable = false;
    this.erreur = false;
    this.profil = null;
    if (!id) { this.introuvable = true; this.chargement = false; return; }
    this.groupeService.getProfilPublic(id).subscribe({
      next: p => { this.profil = p; this.chargement = false; },
      error: err => {
        this.introuvable = err?.status === 404;
        this.erreur = err?.status !== 404;
        this.chargement = false;
      }
    });
  }

  retour(): void {
    this.router.navigate(['/explorer']);
  }

  /** La demande d'adhésion (questions, confirmation) est gérée par Explorer : on y retourne avec le groupe ciblé. */
  rejoindre(): void {
    if (!this.profil) return;
    this.router.navigate(['/explorer'], { queryParams: { adhesion: this.profil.id } });
  }

  async partager(): Promise<void> {
    if (!this.profil) return;
    const url = `${window.location.origin}/explorer/${this.profil.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: this.profil.nom, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.snackBar.open(t('invitation.linkCopied'), 'OK', { duration: 2000 });
    } catch { /* partage annulé par l'utilisateur */ }
  }

  get remplissage(): number {
    const p = this.profil;
    if (!p?.capaciteMax) return 0;
    return Math.min(100, Math.round(100 * p.nombreMembres / p.capaciteMax));
  }

  get placesRestantes(): number | null {
    const p = this.profil;
    return p?.capaciteMax ? Math.max(0, p.capaciteMax - p.nombreMembres) : null;
  }

  get tauxVictoire(): number {
    const a = this.profil?.activite;
    return a && a.matchsExternes ? Math.round(100 * a.victoires / a.matchsExternes) : 0;
  }

  get icone(): string {
    switch ((this.profil?.discipline || '').toLowerCase()) {
      case 'football': case 'foot': return 'sports_soccer';
      case 'basketball': case 'basket': return 'sports_basketball';
      case 'volleyball': case 'volley': return 'sports_volleyball';
      case 'handball': case 'hand': return 'sports_handball';
      default: return 'sports';
    }
  }

  couleurDe(nom: string): string {
    let h = 0;
    for (const c of nom || '') h = (h * 31 + c.charCodeAt(0)) % 360;
    return `hsl(${h}, 55%, 42%)`;
  }
}
