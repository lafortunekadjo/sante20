import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ConcoursService } from '../../../core/services/concours.service';

// ── Modèles ──────────────────────────────────────────────────

export interface QuestionConcours {
  id: number;
  texte: string;
  type: 'QCM' | 'TEXTE';
  options?: string[];       // pour QCM uniquement
  ordre: number;
}

export interface LotConcours {
  label: string;            // ex: "1er prix"
  valeur: string;           // ex: "5 000 FCFA crédit"
}

export interface Concours {
  id: number;
  slug: string;
  titre: string;
  description?: string;
  imageUrl?: string;
  sponsorNom?: string;
  sponsorLogoUrl?: string;
  dateTirage: string;       // ISO date
  lots: LotConcours[];
  questions: QuestionConcours[];
  nbParticipants: number;
  actif: boolean;
}

type Step = 'questions' | 'auth' | 'success';

interface TimeLeft { days: string; hours: string; minutes: string; seconds: string; }

// ── Composant ────────────────────────────────────────────────

@Component({
  selector: 'app-concours-public',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    MatSnackBarModule
  ],
  templateUrl: './concours-public.component.html',
  styleUrls: ['./concours-public.component.scss']
})
export class ConcoursPublicComponent implements OnInit, OnDestroy {

  concours: Concours | null = null;
  isLoading = true;
  isExpired = false;
  isSubmitting = false;
  alreadyParticipated = false;
  isLoggedIn = false;

  step: Step = 'questions';
  errorMessage: string | null = null;
  reponses: (string | undefined)[] = [];
  timeLeft: TimeLeft = { days: '00', hours: '00', minutes: '00', seconds: '00' };

  private destroy$ = new Subject<void>();
  private slug = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private concoursService: ConcoursService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    this.isLoggedIn = this.authService.isAuthenticated();

    // Après login/signup, le returnUrl ramène ici → soumettre directement
    const autoSubmit = this.route.snapshot.queryParamMap.get('autoSubmit');
    const savedReponses = sessionStorage.getItem(`concours_${this.slug}_reponses`);

    this.loadConcours(() => {
      if (autoSubmit && savedReponses && this.isLoggedIn) {
        this.reponses = JSON.parse(savedReponses);
        this.step = 'auth';
        this.submit();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Chargement ───────────────────────────────────────────────

  private loadConcours(onLoaded?: () => void): void {
    this.concoursService.getConcoursPublic(this.slug).subscribe({
      next: (c) => {
        this.concours = c;
        this.reponses = new Array(c.questions.length).fill(undefined);
        this.isExpired = new Date(c.dateTirage) <= new Date();
        this.checkAlreadyParticipated();
        if (!this.isExpired) this.startCountdown();
        this.isLoading = false;
        onLoaded?.();
        console.log(c)
      },
      error: () => { this.isLoading = false; }
    });
  }

  private checkAlreadyParticipated(): void {
    if (!this.isLoggedIn || !this.concours) return;
    this.concoursService.hasParticipated(this.concours.id).subscribe({
      next: (has) => { this.alreadyParticipated = has; }
    });
  }

  // ── Compte à rebours ─────────────────────────────────────────

  private startCountdown(): void {
    if (!this.concours) return;

    const update = () => {
      const end = new Date(this.concours!.dateTirage).getTime();
      const diff = end - Date.now();

      if (diff <= 0) { this.isExpired = true; return; }

      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);

      this.timeLeft = {
        days:    String(d).padStart(2, '0'),
        hours:   String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0')
      };
    };

    update();
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(update);
  }

  // ── Navigation formulaire ─────────────────────────────────────

  selectOption(questionIndex: number, option: string): void {
    this.reponses[questionIndex] = option;
  }

  allAnswered(): boolean {
    return this.concours?.questions.every((_, i) =>
      this.reponses[i] !== undefined && (this.reponses[i] as string).trim().length > 0
    ) ?? false;
  }

  goToAuth(): void {
    // Sauvegarder les réponses en session pour après le login
    sessionStorage.setItem(`concours_${this.slug}_reponses`, JSON.stringify(this.reponses));
    this.step = 'auth';
  }

  goLogin(): void {
    const returnUrl = `/concours/${this.slug}?autoSubmit=true`;
    sessionStorage.setItem('concours_returnUrl', returnUrl);
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }

  goSignup(): void {
    const returnUrl = `/concours/${this.slug}?autoSubmit=true`;
    // Sauvegarder en sessionStorage — backup si le signup redirige vers login
    // et que le login perd le returnUrl dans la chaîne de redirections
    sessionStorage.setItem('concours_returnUrl', returnUrl);
    this.router.navigate(['/signup'], { queryParams: { returnUrl } });
  }

  // ── Soumission ────────────────────────────────────────────────

  submit(): void {
    if (!this.concours || this.isSubmitting) return;
    this.isSubmitting = true;

    const payload = {
      concoursId: this.concours.id,
      reponses: this.concours.questions.map((q, i) => ({
        questionId: q.id,
        reponse: this.reponses[i] || ''
      }))
    };

    this.concoursService.participer(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.step = 'success';
        this.alreadyParticipated = true;
        sessionStorage.removeItem(`concours_${this.slug}_reponses`);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = this.extractErrorMessage(err);

        if (err.status === 409) {
          // Déjà participé — cas géré visuellement
          this.alreadyParticipated = true;
          this.step = 'questions';
        } else {
          // Toutes les autres erreurs → snackbar rouge
          this.snackBar.open(this.errorMessage, '✕', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
        }
      }
    });
  }

  // ── Extraction message d'erreur backend ─────────────────────

  private extractErrorMessage(err: any): string {
    // Priorité 1 : message explicite du backend (Spring Boot renvoie souvent err.error.message)
    if (err?.error?.message && typeof err.error.message === 'string') {
      return err.error.message;
    }
    // Priorité 2 : champ "error" string direct
    if (err?.error?.error && typeof err.error.error === 'string') {
      return err.error.error;
    }
    // Priorité 3 : body string brut
    if (err?.error && typeof err.error === 'string') {
      return err.error;
    }
    // Fallback selon le code HTTP
    switch (err?.status) {
      case 0:   return 'Pas de connexion internet. Vérifie ta connexion et réessaie.';
      case 400: return 'Données invalides. Vérifie tes réponses et réessaie.';
      case 401: return 'Ta session a expiré. Reconnecte-toi.';
      case 403: return 'Tu nes pas autorisé à participer à ce concours.';
      case 404: return 'Ce concours est introuvable ou a été supprimé.';
      case 409: return 'Tu as déjà participé à ce concours.';
      case 422: return 'Certaines réponses sont invalides. Vérifie le formulaire.';
      case 429: return 'Trop de tentatives. Attends quelques secondes et réessaie.';
      case 500: return 'Une erreur serveur sest produite. Réessaie dans un moment.';
      default:  return 'Une erreur inattendue sest produite. Réessaie.';
    }
  }

  // ── Partage ───────────────────────────────────────────────────

  share(): void {
    const url = window.location.href.split('?')[0]; // URL propre sans params
    const text = `🏆 Participe au concours "${this.concours?.titre}" sur My2-0 et tente de gagner !`;

    if (navigator.share) {
      navigator.share({ title: this.concours?.titre, text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        // Snackbar non disponible ici — on pourrait ajouter un @Output ou MatSnackBar
        alert('Lien copié !');
      });
    }
  }

  // ── Helpers template ─────────────────────────────────────────

  getBgStyle(): string {
    return this.concours?.imageUrl ? `url(${this.concours.imageUrl})` : '';
  }
}