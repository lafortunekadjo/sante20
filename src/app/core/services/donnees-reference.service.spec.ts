import { TestBed } from '@angular/core/testing';

import { DonneesReferenceService } from './donnees-reference.service';

describe('DonneesReferenceService', () => {
  let service: DonneesReferenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DonneesReferenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
