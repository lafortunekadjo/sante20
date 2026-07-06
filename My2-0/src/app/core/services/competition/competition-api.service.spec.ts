import { TestBed } from '@angular/core/testing';

import { CompetitionApiService } from './competition-api.service';

describe('CompetitionApiService', () => {
  let service: CompetitionApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompetitionApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
