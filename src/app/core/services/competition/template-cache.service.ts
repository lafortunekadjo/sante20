// template-cache.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, tap, map } from 'rxjs';
import { PosterService, Template } from './poster.service';

@Injectable({
  providedIn: 'root'
})
export class TemplateCacheService {
  private templatesCache = new BehaviorSubject<Template[] | null>(null);
  private lastFetchTime: number | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private posterService: PosterService) {}

  /**
   * Récupère les templates (avec cache)
   */
  getTemplates(forceRefresh: boolean = false): Observable<Template[]> {
    const now = Date.now();
    const isCacheValid = this.templatesCache.value !== null && 
                         this.lastFetchTime !== null &&
                         (now - this.lastFetchTime) < this.CACHE_DURATION;
    
    if (!forceRefresh && isCacheValid) {
      return of(this.templatesCache.value!);
    }
    
    return this.posterService.getTemplates().pipe(
      tap(templates => {
        this.templatesCache.next(templates);
        this.lastFetchTime = Date.now();
      })
    );
  }

  /**
   * Récupère un template par son ID
   */
  getTemplateById(templateId: string): Observable<Template | undefined> {
    return this.getTemplates().pipe(
      map(templates => templates.find(t => t.id === templateId))
    );
  }

  /**
   * Récupère les templates compatibles avec un type d'affiche
   */
  getTemplatesByType(type: string): Observable<Template[]> {
    return this.getTemplates().pipe(
      map(templates => templates.filter(t => t.compatibleTypes.includes(type)))
    );
  }

  /**
   * Invalide le cache
   */
  invalidateCache(): void {
    this.templatesCache.next(null);
    this.lastFetchTime = null;
  }
}