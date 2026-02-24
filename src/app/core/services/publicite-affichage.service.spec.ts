import { TestBed } from '@angular/core/testing';

import { PubliciteAffichageService } from './publicite-affichage.service';

describe('PubliciteAffichageService', () => {
  let service: PubliciteAffichageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PubliciteAffichageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
