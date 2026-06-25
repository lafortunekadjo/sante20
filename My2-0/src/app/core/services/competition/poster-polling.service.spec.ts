import { TestBed } from '@angular/core/testing';

import { PosterPollingService } from './poster-polling.service';

describe('PosterPollingService', () => {
  let service: PosterPollingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PosterPollingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
