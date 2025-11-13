import { TestBed } from '@angular/core/testing';

import { AnnoncesService } from './annonces.service';

describe('AnnoncesService', () => {
  let service: AnnoncesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnnoncesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
