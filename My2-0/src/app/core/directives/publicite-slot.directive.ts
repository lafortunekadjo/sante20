// ============================================================
// MY2-0 - DIRECTIVE PUBLICITÉ
// Permet d'injecter facilement des publicités dans le DOM
// Usage: <div appPubliciteSlot="FEED"></div>
// ============================================================

import { 
  Directive, 
  Input, 
  ViewContainerRef, 
  OnInit, 
  OnDestroy,
  ComponentRef
} from '@angular/core';
import { PubliciteFeedComponent } from '../../modules/publicite/publicite-feed/publicite-feed.component';
import { PubliciteComponent } from '../../modules/publicite/publicite/publicite.component';
import { PubliciteBannerComponent } from '../../modules/publicite/publicite-banner/publicite-banner.component';
import { PubliciteSidebarComponent } from '../../modules/publicite/publicite-sidebar/publicite-sidebar.component';



type SlotType = 'HEADER' | 'FOOTER' | 'SIDEBAR' | 'FEED' | 'BETWEEN_SECTIONS' | 'EXPLORER_TOP';

@Directive({
  selector: '[appPubliciteSlot]',
  standalone: true
})
export class PubliciteSlotDirective implements OnInit, OnDestroy {
  @Input('appPubliciteSlot') slot!: SlotType;
  @Input() ville?: string;
  @Input() pageSource?: string;

  private componentRef?: ComponentRef<any>;

  constructor(private viewContainer: ViewContainerRef) {}

  ngOnInit(): void {
    this.createComponent();
  }

  ngOnDestroy(): void {
    this.componentRef?.destroy();
  }

  private createComponent(): void {
    this.viewContainer.clear();

    switch (this.slot) {
      case 'HEADER':
      case 'FOOTER':
      case 'EXPLORER_TOP':
        this.componentRef = this.viewContainer.createComponent(PubliciteBannerComponent);
        this.componentRef.instance.position = this.slot;
        break;

      case 'SIDEBAR':
        this.componentRef = this.viewContainer.createComponent(PubliciteSidebarComponent);
        break;

      case 'FEED':
      case 'BETWEEN_SECTIONS':
        this.componentRef = this.viewContainer.createComponent(PubliciteFeedComponent);
        break;

      default:
        this.componentRef = this.viewContainer.createComponent(PubliciteComponent);
        this.componentRef.instance.emplacement = this.slot;
    }

    // Passer les inputs communs
    if (this.componentRef) {
      if (this.ville) {
        this.componentRef.instance.ville = this.ville;
      }
      if (this.pageSource) {
        this.componentRef.instance.pageSource = this.pageSource;
      }
    }
  }
}