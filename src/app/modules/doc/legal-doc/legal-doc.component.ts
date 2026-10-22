import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

interface Bloc { p?: string; h3?: string; ul?: string[]; }
interface Section { h: string; blocks: Bloc[]; }
interface Document { icon: string; title: string; updated: string; intro: string; sections: Section[]; }

/**
 * Page légale (confidentialité, conditions, sécurité, suppression de compte) rendue à partir des textes de
 * assets/i18n/{fr,en}.json (clé « legal.<doc> ») : un seul gabarit, deux langues, mise à jour à un seul endroit.
 */
@Component({
  selector: 'app-legal-doc',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './legal-doc.component.html',
  styleUrl: './legal-doc.component.scss'
})
export class LegalDocComponent implements OnInit, OnDestroy {
  @Input() doc: 'privacy' | 'terms' | 'security' | 'deletion' = 'privacy';

  private translate = inject(TranslateService);
  private abonnements = new Subscription();
  document: Document | null = null;

  ngOnInit(): void {
    this.charger();
    this.abonnements.add(this.translate.onLangChange.subscribe(() => this.charger()));
    this.abonnements.add(this.translate.onTranslationChange.subscribe(() => this.charger()));
  }

  ngOnDestroy(): void { this.abonnements.unsubscribe(); }

  private charger(): void {
    const d = this.translate.instant('legal.' + this.doc);
    this.document = d && typeof d === 'object' ? (d as Document) : null;
  }
}
