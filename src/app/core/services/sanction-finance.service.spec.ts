import { TestBed } from '@angular/core/testing';

import { SanctionFinanceService } from './sanction-finance.service';

describe('SanctionFinanceService', () => {
  let service: SanctionFinanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SanctionFinanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
