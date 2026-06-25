import { TestBed } from '@angular/core/testing';

import { MembreEquipeApiService } from './membre-equipe-api.service';

describe('MembreEquipeApiService', () => {
  let service: MembreEquipeApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MembreEquipeApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
