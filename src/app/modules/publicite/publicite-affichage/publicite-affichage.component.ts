import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PubliciteBannerComponent } from '../publicite-banner/publicite-banner.component';
import { PubliciteFeedComponent } from '../publicite-feed/publicite-feed.component';
import { PubliciteSidebarComponent } from '../publicite-sidebar/publicite-sidebar.component';

type AdFormat = 'banner' | 'feed' | 'sidebar';
type BannerPosition = 'HEADER' | 'FOOTER' | 'EXPLORER_TOP';

/**
 * Composant façade — utilise le bon composant pub selon le format.
 *
 * Usage :
 *   <app-publicite-affichage format="banner" position="HEADER"></app-publicite-affichage>
 *   <app-publicite-affichage format="feed" [compact]="true"></app-publicite-affichage>
 *   <app-publicite-affichage format="sidebar"></app-publicite-affichage>
 */
@Component({
  selector: 'app-publicite-affichage',
  standalone: true,
  imports: [CommonModule, PubliciteBannerComponent, PubliciteFeedComponent, PubliciteSidebarComponent],
  templateUrl: './publicite-affichage.component.html',
  styleUrls: ['./publicite-affichage.component.scss']
})
export class PubliciteAffichageComponent {
  @Input() format: AdFormat = 'feed';
  @Input() position: BannerPosition = 'HEADER';
  @Input() ville?: string;
  @Input() closable = false;
  @Input() compact = false;
  @Input() sticky = true;
  @Input() pageSource?: string;
  @Output() adsLoaded = new EventEmitter<boolean>();
}