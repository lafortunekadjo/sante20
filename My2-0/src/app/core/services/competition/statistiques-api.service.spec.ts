import { TestBed } from '@angular/core/testing';

import { StatistiquesApiService } from './statistiques-api.service';

describe('StatistiquesApiService', () => {
  let service: StatistiquesApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatistiquesApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
