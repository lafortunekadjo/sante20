import { TestBed } from '@angular/core/testing';

import { PaiementSanctionService } from './paiement-sanction.service';

describe('PaiementSanctionService', () => {
  let service: PaiementSanctionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaiementSanctionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
