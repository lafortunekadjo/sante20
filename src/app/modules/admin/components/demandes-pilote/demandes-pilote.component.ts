import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environment';

type Statut = 'NOUVEAU' | 'CONTACTE' | 'RETENU' | 'LISTE_ATTENTE' | 'REFUSE';
interface Demande {
  id: number; nom: string; email: string; telephone?: string; organisation?: string; ville?: string; pays?: string;
  typeEvenement?: string; nombreEquipes?: number; dateSouhaitee?: string; message?: string; source?: string; langue?: string;
  statut: Statut; noteAdmin?: string; createdAt: string;
}

/** Administrateur : trier les organisateurs qui ont demandé à tester My2-0 (page publique /pilote). */
@Component({
  selector: 'app-demandes-pilote',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TranslateModule],
  templateUrl: './demandes-pilote.component.html',
  styleUrl: './demandes-pilote.component.scss'
})
export class DemandesPiloteComponent implements OnInit {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/pilote`;

  statuts: Statut[] = ['NOUVEAU', 'CONTACTE', 'RETENU', 'LISTE_ATTENTE', 'REFUSE'];
  toutes = signal<Demande[]>([]);
  filtre = signal<Statut | 'TOUS'>('TOUS');
  recherche = signal('');
  chargement = signal(true);
  notes: Record<number, string> = {};

  liste = computed(() => {
    const q = this.recherche().trim().toLowerCase();
    return this.toutes().filter(d => (this.filtre() === 'TOUS' || d.statut === this.filtre())
      && (!q || [d.nom, d.email, d.organisation, d.ville, d.telephone].some(x => (x ?? '').toLowerCase().includes(q))));
  });
  compte = (s: Statut | 'TOUS') => s === 'TOUS' ? this.toutes().length : this.toutes().filter(d => d.statut === s).length;

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.chargement.set(true);
    this.http.get<Demande[]>(this.base).subscribe({
      next: l => { this.toutes.set(l); l.forEach(d => this.notes[d.id] = d.noteAdmin ?? ''); this.chargement.set(false); },
      error: () => { this.toutes.set([]); this.chargement.set(false); }
    });
  }

  statut(d: Demande, s: Statut): void {
    this.http.patch<Demande>(`${this.base}/${d.id}`, { statut: s }).subscribe(m => this.maj(m));
  }

  noter(d: Demande): void {
    this.http.patch<Demande>(`${this.base}/${d.id}`, { noteAdmin: this.notes[d.id] ?? '' }).subscribe(m => this.maj(m));
  }

  private maj(m: Demande): void { this.toutes.update(l => l.map(x => x.id === m.id ? m : x)); }

  /** Numéro international sans signes, pour wa.me (le 6… camerounais est complété par 237). */
  whatsapp(d: Demande): string | null {
    let n = (d.telephone ?? '').replace(/[^\d+]/g, '');
    if (!n) return null;
    if (n.startsWith('+')) n = n.slice(1);
    else if (n.startsWith('00')) n = n.slice(2);
    else if (n.length === 9 && n.startsWith('6')) n = '237' + n;
    return 'https://wa.me/' + n;
  }

  exporter(): void {
    const q = this.filtre() === 'TOUS' ? '' : `?statut=${this.filtre()}`;
    this.http.get(`${this.base}/export${q}`, { responseType: 'blob' }).subscribe(b => {
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url; a.download = 'demandes-pilote.csv'; a.click(); URL.revokeObjectURL(url);
    });
  }
}
