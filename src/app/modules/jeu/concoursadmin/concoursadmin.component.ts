import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment';

interface ConcoursDTO {
  id: number; slug: string; titre: string;
  description?: string; imageUrl?: string;
  partenaireNom?: string;
  dateFin: string; dateTirage: string;
  statut: string; nombreParticipants: number;
  nombreQuestions: number; nombreLots: number;
  tirageEffectue: boolean;
}

interface TirageResultatDTO {
  concoursId: number; concoursTitre: string;
  nombreParticipants: number;
  gagnants: { rang: number; lotDescription: string; lotValeur?: number; username: string }[];
}

interface LotForm { description: string; valeur?: number; }
interface QuestionForm { texte: string; type: 'QCM' | 'TEXTE'; options: string[]; bonneReponseIndex?: number; }

interface ConcoursForm {
  titre: string; description: string; imageUrl: string;
  partenaireNom: string; partenaireLogoUrl: string; partenaireLien: string;
  dateFin: string; dateTirage: string;
  lots: LotForm[]; questions: QuestionForm[];
}

@Component({
  selector: 'app-concours-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatTooltipModule, MatSnackBarModule
  ],
  templateUrl: './concoursadmin.component.html',
  styleUrls: ['./concoursadmin.component.scss']
})
export class ConcoursAdminComponent implements OnInit {

  private api = `${environment.apiUrl}/concours`;

  concours: ConcoursDTO[] = [];
  isLoading = true;
  isSaving = false;
  isTirage = false;

  showCreatePanel = false;
  concoursATraiter: ConcoursDTO | null = null;
  tirageResultat: TirageResultatDTO | null = null;

  form: ConcoursForm = this.emptyForm();

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.charger(); }

  // ── Chargement ───────────────────────────────────────────────

  charger(): void {
    this.isLoading = true;
    this.http.get<ConcoursDTO[]>(`${this.api}/admin`).subscribe({
      next: (data) => { this.concours = data; this.isLoading = false; },
      error: () => { this.snackBar.open('Erreur chargement', '✕', { duration: 3000 }); this.isLoading = false; }
    });
  }

  // ── Création ─────────────────────────────────────────────────

  openCreatePanel(): void { this.form = this.emptyForm(); this.showCreatePanel = true; }
  closeCreatePanel(): void { this.showCreatePanel = false; }

  creerConcours(): void {
    if (!this.isFormValid() || this.isSaving) return;
    this.isSaving = true;
    this.http.post<ConcoursDTO>(`${this.api}/admin`, this.form).subscribe({
      next: (c) => {
        this.concours.unshift(c);
        this.isSaving = false;
        this.closeCreatePanel();
        this.snackBar.open('Concours créé en brouillon ✓', '✕', { duration: 3000, panelClass: ['snackbar-success'] });
      },
      error: () => { this.snackBar.open('Erreur création', '✕', { duration: 3000 }); this.isSaving = false; }
    });
  }

  isFormValid(): boolean {
    return !!this.form.titre && !!this.form.dateFin && !!this.form.dateTirage
      && this.form.lots.length > 0 && this.form.lots.every(l => !!l.description)
      && this.form.questions.length > 0 && this.form.questions.every(q => !!q.texte);
  }

  // ── Lots ─────────────────────────────────────────────────────

  ajouterLot(): void { this.form.lots.push({ description: '', valeur: undefined }); }
  retirerLot(i: number): void { this.form.lots.splice(i, 1); }

  // ── Questions ────────────────────────────────────────────────

  ajouterQuestion(): void {
    this.form.questions.push({ texte: '', type: 'QCM', options: ['', ''], bonneReponseIndex: undefined });
  }
  retirerQuestion(i: number): void { this.form.questions.splice(i, 1); }
  ajouterOption(q: QuestionForm): void { q.options.push(''); }
  retirerOption(q: QuestionForm, i: number): void { q.options.splice(i, 1); }
  onQuestionTypeChange(q: QuestionForm): void {
    if (q.type === 'QCM' && q.options.length === 0) q.options = ['', ''];
  }

  // ── Actions concours ─────────────────────────────────────────

  publier(id: number): void {
    this.http.patch<ConcoursDTO>(`${this.api}/admin/${id}/publier`, {}).subscribe({
      next: (updated) => {
        this.updateLocal(updated);
        this.snackBar.open('Concours publié ✓', '✕', { duration: 3000, panelClass: ['snackbar-success'] });
      },
      error: () => this.snackBar.open('Erreur publication', '✕', { duration: 3000 })
    });
  }

  archiver(id: number): void {
    this.http.patch<ConcoursDTO>(`${this.api}/admin/${id}/archiver`, {}).subscribe({
      next: (updated) => { this.updateLocal(updated); this.snackBar.open('Archivé', '✕', { duration: 2000 }); },
      error: () => this.snackBar.open('Erreur archivage', '✕', { duration: 3000 })
    });
  }

  confirmerTirage(c: ConcoursDTO): void { this.concoursATraiter = c; }

  lancerTirage(): void {
    if (!this.concoursATraiter || this.isTirage) return;
    this.isTirage = true;
    this.http.post<TirageResultatDTO>(`${this.api}/admin/${this.concoursATraiter.id}/tirage`, {}).subscribe({
      next: (res) => {
        this.isTirage = false;
        this.concoursATraiter = null;
        this.tirageResultat = res;
        this.charger();
        this.snackBar.open('Tirage effectué ! 🎉', '✕', { duration: 4000, panelClass: ['snackbar-success'] });
      },
      error: (err) => {
        this.isTirage = false;
        this.snackBar.open(err.error?.message || 'Erreur tirage', '✕', { duration: 4000 });
      }
    });
  }

  voirResultats(id: number): void {
    this.http.get<TirageResultatDTO>(`${this.api}/admin/${id}/stats`).subscribe({
      next: (res) => this.tirageResultat = res,
      error: () => this.snackBar.open('Erreur chargement résultats', '✕', { duration: 3000 })
    });
  }

  voirStats(id: number): void { this.voirResultats(id); }

  // ── Partage ──────────────────────────────────────────────────

  copyLink(slug: string): void {
    const url = `${window.location.origin}/concours/${slug}`;
    navigator.clipboard.writeText(url).then(() =>
      this.snackBar.open('Lien copié !', '✓', { duration: 2000 }));
  }

  shareLink(c: ConcoursDTO): void {
    const url = `${window.location.origin}/concours/${c.slug}`;
    const text = `🏆 Participe au concours "${c.titre}" sur My2-0 ! 👉 ${url}`;
    if (navigator.share) navigator.share({ title: c.titre, text, url });
    else this.copyLink(c.slug);
  }

  // ── Helpers ──────────────────────────────────────────────────

  getActiveCount(): number { return this.concours.filter(c => c.statut === 'ACTIF').length; }
  getFinishedCount(): number { return this.concours.filter(c => c.statut === 'TERMINE').length; }
  getTotalParticipants(): number { return this.concours.reduce((s, c) => s + c.nombreParticipants, 0); }

  getStatutLabel(s: string): string {
    return { BROUILLON: 'Brouillon', ACTIF: 'En cours', TERMINE: 'Terminé', ANNULE: 'Annulé' }[s] ?? s;
  }
  getStatutIcon(s: string): string {
    return { BROUILLON: 'edit_note', ACTIF: 'play_circle', TERMINE: 'check_circle', ANNULE: 'cancel' }[s] ?? 'help';
  }
  getRankEmoji(i: number): string { return ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`; }

  private updateLocal(updated: ConcoursDTO): void {
    const idx = this.concours.findIndex(c => c.id === updated.id);
    if (idx >= 0) this.concours[idx] = updated;
  }

  private emptyForm(): ConcoursForm {
    return {
      titre: '', description: '', imageUrl: '',
      partenaireNom: '', partenaireLogoUrl: '', partenaireLien: '',
      dateFin: '', dateTirage: '',
      lots: [{ description: 'Crédit téléphonique', valeur: 5000 }],
      questions: [{ texte: '', type: 'QCM', options: ['', ''], bonneReponseIndex: undefined }]
    };
  }
}