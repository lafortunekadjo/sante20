import { TranslateModule } from '@ngx-translate/core';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environment';

interface Verification {
  code: string;
  competition?: string;
  equipeDomicile?: string;
  equipeExterieur?: string;
  butsDomicile?: number;
  butsExterieur?: number;
  dateHeure?: string;
  verrouillee: boolean;
  conforme: boolean;
  empreinte: string;
  signatures: { libelle: string; signataireNom: string; mode: string; reserve?: string; signeLe: string; valide: boolean }[];
}

/** Page publique ouverte par le QR code d'une feuille de match signée : confirme (ou non) son authenticité. */
@Component({
  selector: 'app-verifier-feuille',
  standalone: true,
  imports: [TranslateModule, CommonModule],
  template: `
  <main class="vf">
    <h1>{{ 'feuilleSignature.verifTitre' | translate }}</h1>
    @if (chargement()) {
      <p>…</p>
    } @else if (v()) {
      @let r = v()!;
      <div class="vf__statut" [class.vf__statut--ok]="r.conforme" [class.vf__statut--ko]="!r.conforme">
        {{ (r.conforme ? 'feuilleSignature.verifOk' : 'feuilleSignature.verifKo') | translate }}
      </div>
      <section class="vf__carte">
        <div class="vf__comp">{{ r.competition }}</div>
        <div class="vf__score">{{ r.equipeDomicile }} <strong>{{ r.butsDomicile }} - {{ r.butsExterieur }}</strong> {{ r.equipeExterieur }}</div>
        <small>{{ r.dateHeure }}</small>
        <small>{{ 'feuilleSignature.code' | translate }} {{ r.code }} · {{ r.empreinte.substring(0, 16) }}</small>
      </section>
      <ul class="vf__liste">
        @for (s of r.signatures; track $index) {
          <li [class.vf__obsolete]="!s.valide">
            <strong>{{ s.libelle }}</strong> — {{ s.signataireNom }}
            <small>{{ s.signeLe }} · {{ (s.mode === 'TRACE' ? 'feuilleSignature.modeTrace' : 'feuilleSignature.modeCertifie') | translate }}
              @if (!s.valide) { · {{ 'feuilleSignature.statut.OBSOLETE' | translate }} }</small>
            @if (s.reserve) { <small>{{ 'feuilleSignature.reserve' | translate }} : {{ s.reserve }}</small> }
          </li>
        }
      </ul>
    } @else {
      <div class="vf__statut vf__statut--ko">{{ 'feuilleSignature.verifInconnue' | translate }}</div>
    }
  </main>
  `,
  styles: [`
    .vf { max-width: 560px; margin: 0 auto; padding: 24px 16px; display: flex; flex-direction: column; gap: 14px; color: var(--text-primary); }
    .vf h1 { margin: 0; font-size: 20px; }
    .vf__statut { padding: 14px; border-radius: 12px; font-weight: 700; text-align: center; }
    .vf__statut--ok { background: rgba(21,128,61,.14); color: #15803d; }
    .vf__statut--ko { background: rgba(185,28,28,.12); color: #b91c1c; }
    .vf__carte { display: flex; flex-direction: column; gap: 4px; padding: 14px; border: 1px solid var(--border-color, #e2e8f0);
                 border-radius: 14px; background: var(--background-primary); }
    .vf__comp { font-size: 13px; color: var(--text-secondary); }
    .vf__score { font-size: 17px; }
    .vf__liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .vf__liste li { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px solid #15803d; border-radius: 12px; }
    .vf__liste li.vf__obsolete { border-color: #b91c1c; }
    small { color: var(--text-secondary); }
  `]
})
export class VerifierFeuilleComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  v = signal<Verification | null>(null);
  chargement = signal(true);

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    this.http.get<Verification>(`${environment.apiUrl}/public/feuilles/verifier/${encodeURIComponent(code)}`).subscribe({
      next: r => { this.v.set(r); this.chargement.set(false); },
      error: () => { this.v.set(null); this.chargement.set(false); }
    });
  }
}
